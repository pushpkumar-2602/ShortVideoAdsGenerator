import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import axios from "axios";
import ai from "../configs/ai";


export const createProject = async (req: Request, res: Response) => {
  let tempProjectId: string | undefined;
  let isCreditDeducted = false;

  try {
    const { userId } = req.auth();
    const {
      name = "New Project",
      aspectRatio,
      userPrompt,
      productName,
      productDescription,
      targetLength = 5,
    } = req.body;

    const images = req.files as Express.Multer.File[];

    if (!images || images.length < 2 || !productName) {
      return res.status(400).json({
        message: "Please upload at least 2 images and provide product name",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.credits < 5) {
      return res.status(401).json({ message: "Insufficient Credits" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 5 } },
    });

    isCreditDeducted = true;

    const uploadedImages = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const project = await prisma.project.create({
      data: {
        name,
        userId,
        productName,
        productDescription,
        userPrompt,
        aspectRatio,
        targetLength: parseInt(targetLength),
        uploadedImages,
        isGenerating: true,
      },
    });

    tempProjectId = project.id;

    const prompt = `
Combine the person and product into a realistic ecommerce photo.
Make the person naturally hold or use the product.
Match lighting, shadows, scale and perspective.
Professional studio lighting.
Product: ${productName}
Description: ${productDescription || ""}
User intent: ${userPrompt}
`;

    const sdResponse = await axios.post(
  "http://127.0.0.1:7860/sdapi/v1/txt2img",
  {
    prompt,
    steps: 12,
    width: 512,
    height: 768,
    cfg_scale: 7,
    sampler_name: "Euler a",
    override_settings: {
      sd_model_checkpoint: "v1-5-pruned-emaonly-fp16.safetensors"
    }
  },
  { timeout: 300000 }
);

    const base64Image = sdResponse.data.images?.[0];

    if (!base64Image) {
      throw new Error("Stable Diffusion generation failed");
    }

    const uploadResult = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Image}`,
      { resource_type: "image" }
    );

    await prisma.project.update({
      where: { id: project.id },
      data: {
        generatedImage: uploadResult.secure_url,
        isGenerating: false,
      },
    });

    return res.json({ projectId: project.id });
  } catch (error: any) {
    console.error("🔥 ERROR:", error.message);

    if (tempProjectId) {
      await prisma.project.update({
        where: { id: tempProjectId },
        data: {
          isGenerating: false,
          error: error.message,
        },
      });
    }

    if (isCreditDeducted) {
      await prisma.user.update({
        where: { id: req.auth().userId },
        data: { credits: { increment: 5 } },
      });
    }

    return res.status(500).json({ message: error.message });
  }
};

export const createVideo = async (req: Request, res: Response) => {
  const { userId } = req.auth();
  const { projectId } = req.body;
  let isCreditDeducted = false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.credits < 10) {
      return res.status(401).json({ message: "Insufficient credits" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 10 } },
    });

    isCreditDeducted = true;

    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project || project.isGenerating) {
      return res.status(404).json({ message: "Generation in Progress" });
    }

    if (project.generatedVideo) {
      return res.status(404).json({ message: "Video Already Generated" });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { isGenerating: true },
    });

    const prompt = `Make the person showcase the product which is ${
      project.productName
    }${
      project.productDescription
        ? ` and Product Description: ${project.productDescription}`
        : ""
    }`;

    if (!project.generatedImage) {
      throw new Error("Generated Image Not Found");
    }

    const image = await axios.get(project.generatedImage, {
      responseType: "arraybuffer",
    });

    const imageBytes = Buffer.from(image.data);

    let operation: any = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt,
      image: {
        imageBytes: imageBytes.toString("base64"),
        mimeType: "image/png",
      },
      config: {
        aspectRatio: project.aspectRatio || "9:16",
        numberOfVideos: 1,
        resolution: "720p",
      },
    });

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 7000));
      operation = await ai.operations.getVideosOperation({
        operation,
      });
    }

    const filename = `${userId}-${Date.now()}.mp4`;
    const filepath = path.join("videos", filename);

    fs.mkdirSync("videos", { recursive: true });

    await ai.files.download({
      file: operation.response.generatedVideos[0],
      downloadPath: filepath,
    });

    const uploadResult = await cloudinary.uploader.upload(filepath, {
      resource_type: "video",
    });

    await prisma.project.update({
      where: { id: project.id },
      data: {
        generatedVideo: uploadResult.secure_url,
        isGenerating: false,
      },
    });

    fs.unlinkSync(filepath);

    return res.json({
      message: "Video Generation Completed",
      videoUrl: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error("🔥 VIDEO ERROR:", error);

    if (isCreditDeducted) {
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 10 } },
      });
    }

    Sentry.captureException(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllPublishedProjects = async (
  req: Request,
  res: Response
) => {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
    });

    res.json({ projects });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};
export const deleteProject = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.auth();
    const rawProjectId = req.params.projectId;

if (!rawProjectId || Array.isArray(rawProjectId)) {
  return res.status(400).json({ message: "Invalid project id" });
}

const projectId: string = rawProjectId;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project Not Found" });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};