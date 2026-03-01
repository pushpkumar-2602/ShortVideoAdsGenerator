import { APIKey } from "@clerk/express";
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
    apiKey:process.env.GOOGLE_CLOUD_API_KEY
})
export default ai;