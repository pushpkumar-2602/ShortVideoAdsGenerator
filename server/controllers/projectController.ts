import {Request,Response} from 'express'
import * as Sentry from "@sentry/node"
import { prisma } from '../configs/prisma';
import {v2 as cloudinary} from 'cloudinary';
import {GenerateContentConfig,HarmBlockThreshold,HarmCategory} from '@google/genai'
import fs, { unlinkSync } from 'fs';
import path from 'path';
import ai from '../configs/ai';
import { error } from 'console';
import axios from 'axios';

const loadImage = (path:string,mimeType:string)=>{
    return{
        inlineData:{
            data: fs.readFileSync(path).toString('base64'),
            mimeType
        }
    }
}

export const createProject = async(req:Request,res:Response)=>{
    
        let tempProjectId : string;
        const {userId} = req.auth();
        let isCreditDeducted = false;
        const {name = ' New Project',aspectRatio,userPrompt,productName,
            productDescription,targetLength=5} = req.body;
        const images : any = req.file;

        if(images.length < 2 || !productName){
            res.status(400).json({message:'Please Upload Atleast 2 images'})
        }

        const user = await prisma.user.findUnique({
            where: {id:userId} 
        })

        if(!user || user.credits<5){
            return res.status(401).json({message:'Insufficient Credits'})
        }else{
             //Deduct credits for image generation
             await prisma .user.update({
                where: {id:userId},
                data : {credits:{decrement:5}}
             }).then(()=>{isCreditDeducted=true})
        }

        try {
            let uploadedImages= await Promise.all(
                images.map(async(item:any)=>{
                    let result = await cloudinary.uploader.upload(item.path, {
                        resource_type: 'image'});
                        return result.secure_url
                })
            )
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
                        isGenerating: true
                    }
            })
            tempProjectId = project.id;
            const model = "gemini-3-pro-image-preview";
            const generationConfig: GenerateContentConfig = {
                maxOutputTokens: 32768,
                temperature: 1,
                topP: 0.95,
                responseModalities: ['IMAGE'],
                imageConfig: {
                    aspectRatio: aspectRatio || '9:16',
                    imageSize: '1K'
                },
                safetySettings: [
                                        {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold:HarmBlockThreshold.OFF,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold:HarmBlockThreshold.OFF,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT,
                        threshold:HarmBlockThreshold.OFF,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_IMAGE_HARASSMENT,
                        threshold:HarmBlockThreshold.OFF,
                    }
                 ]
            };

            //IMG TO BASE64 model
         const img1base64 = loadImage(images[0].path, images[0].mimeType);
         const img2base64 = loadImage(images[1].path, images[1].mimeType);
         
         const prompt = { text:`Combine the person and product into a realistic photo.
                        Make the person naturally hold or use the product.
                        Match lighting, shadows, scale and perspective.
                        Make the person stand in professional studio lighting.
                        Output ecommerce-quality photo realistic imagery.
                        ${userPrompt}`}

        //Generate img using model
            const response:any= await ai.models.generateContent({
                model,
                contents: [ img1base64,img2base64,prompt],
                config: generationConfig,
            })
            
        //Check if Valid Response
            if(!response?.candidates?.[0]?.content?.parts){
                throw new Error('Unexpected Response')
            }
            const parts = response.candidates[0].content.parts;
            let finalBuffer: Buffer | null = null;

            for (const part of parts) {
                if (part.inlineData) {
                finalBuffer = Buffer.from(part.inlineData.data, "base64");
                }
            }
            if(!finalBuffer){
                throw new Error('Failed to Generate Image')
            }
            const base64Image = `data:image/png;base64,${finalBuffer.toString("base64")}`;
            const uploadResult = await cloudinary.uploader.upload(base64Image, {resource_type: "image",});
            
            await prisma.project.update({
                where: { id: project.id },
                data: {
                    generatedImage: uploadResult.secure_url,
                    isGenerating: false,
                },
            });
            res.json({projectId: project.id})

    } catch (error:any) {
        if (tempProjectId!) {
            //update project status and error message
            await prisma.project.update({
                where: { id: tempProjectId },
                data: {
                isGenerating: false,
                error: error.message 
                },
            });
            }

            if (isCreditDeducted) {
                //Add crecit back
            await prisma.user.update({
                where: { id: userId },
                data: {
                credits: { increment: 5 },
                },
            });
            }
        Sentry.captureException(error);
        res.status(500).json({message: error.message})
    }
}

export const createVideo = async(req:Request,res:Response)=>{
    const {userId} = req.auth()
    const{projectId} = req.body;
    let isCreditDeducted = false;
     
    const user = await prisma.user.findUnique({
            where: { id: userId }
            });

    if (!user || user.credits < 10) {
        return res.status(401).json({message: "Insufficient credits"});
    }
    //Deduct Credits fir Video Generation
    await prisma.user.update({
        where: {id:userId},
        data:{credits: {decrement:10}}
    }).then(()=>{isCreditDeducted=true});

    try {
        const project=await prisma.project.findUnique({
            where:{id:projectId,userId},
            include:{user:true}
        }) 
        if(!project || project.isGenerating){
            return res.status(404).json({message: 'Generation in Progress'})
        }
        if(project.generatedVideo){
            return res.status(404).json({message: 'Video Already Generated'})
        }

        await prisma.project.update({
            where:{id:projectId},
            data:{isGenerating:true}
        })
        const prompt = `Make the person showcase the product which is ${
                project.productName
                }${
                project.productDescription
                    ? ` and Product Description: ${project.productDescription}`
                    : ""
                }`;
        const model='veo-3.1-generate-preview'
        if(!project.generatedImage){
            throw new Error("Generated Image Not Found")
        }
        const image = await axios.get(project.generatedImage,{responseType:'arraybuffer'})
        const imageBytes: any=Buffer.from(image.data)
        let operation: any = await ai.models.generateVideos({
                model,
                prompt,
                image: {
                    imageBytes: imageBytes.toString("base64"),
                    mimeType: "image/png",
                },
                config: {
                    aspectRatio: project?.aspectRatio || "9:16",
                    numberOfVideos: 1,
                    resolution: "720p",
                },
        });
        while (!operation.done){
            console.log("Waiting for Video Generation to Complete...")
            await new Promise((resolve)=>setTimeout(resolve,7000));
            operation = await ai.operations.getVideosOperation({
                operation:operation,
            })
        }
        const filename = `${userId}-${Date.now()}.mp4`;
        const filepath = path.join('videos',filename)
        //Create the image directory if didn't exist

        fs.mkdirSync("videos", { recursive: true });
        if (!operation.response.generatedVideos) {
                throw new Error(
                    operation.response.raiMediaFilteredReasons[0].video,
                    
                );
        }
        //Download the Video
        await ai.files.download({
            file :operation.response.generaatedVideos[0],
            downloadPath: filepath,
        })

        const uploadResult= await cloudinary.uploader.upload(filepath, {
            resource_type:'video'
        })

        await prisma.project.update({
            where: { id: project.id },
            data: {
                generatedVideo: uploadResult.secure_url,
                isGenerating: false,
            },
        });

        //Remove video from disk after upload

        fs.unlinkSync(filepath)
        res.json({message:'Video Generation Completed',videoUrl:uploadResult.secure_url})

    } catch (error:any) {
        // update project status and error message
        await prisma.project.update({
            where: { id: projectId, userId },
            data: {
                isGenerating: false,
                error: error.message 
            },
        });

        if (isCreditDeducted) {
        // add credits back
            await prisma.user.update({
                where: { id: userId },
                data: {
                credits: { increment: 10 },
                },
            });
        }

        Sentry.captureException(error);
        res.status(500).json({message: error.message})
    }
}

export const getAllPublishedProjects = async(req:Request,res:Response)=>{
    try {
        const projects = await prisma.project.findMany({
            where: { isPublished: true }
            });

        res.json({ projects });
    } catch (error:any) {
        Sentry.captureException(error);
        res.status(500).json({message: error.message})
    }
}

export const deleteProject = async(req:Request,res:Response)=>{
    try {
        const { userId } = req.auth();

const rawProjectId = req.params.projectId;

if (!rawProjectId || Array.isArray(rawProjectId)) {
  return res.status(400).json({ message: "Invalid project id" });
}

const projectId = rawProjectId;

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
    } catch (error:any) {
        Sentry.captureException(error);
        res.status(500).json({message: error.message})
    }
}