import { memo } from "react";
import SectionTitle from "../components/SectionTitle";
import {UploadZoneProps} from "../types/index"
import { Upload } from "lucide-react";
import UploadZone from "../components/UploadZone";
import { useState } from "react";
const Generate = ({label,file,onClear,onChange}: UploadZoneProps) => {
  const [name, setName] = useState('')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [productImage, setProductImage] = useState<File | null>(null)
  const [modelImage, setModelImage] = useState<File | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

 const handleFileChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  type: "product" | "model"
) => {
  if (e.target.files && e.target.files[0]) {
    if (type === "product") {
      setProductImage(e.target.files[0]);
    } else {
      setModelImage(e.target.files[0]);
    }
  }
};

const handleGenerate = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();
};
 
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 mt-28">
      <form onSubmit={handleGenerate} className="max-w-4xl mx-auto mb-40">
        <SectionTitle 
              text1="AI Powered Generator"
              text2="Create In-Context Image"
              text3="Upload your model and product images to generate stunning UGC, short-form videos and social media posts"
            /> 

        <div className="flex gap-20 max-sm:flex-col items-start justify-between">
          {/*left col*/}
          <div className="flex flex-col w-full sm:max-w-60 gap-8 mt-8 mb- 12">
            <UploadZone label="Product Image" file={productImage} 
            onClear={()=>setProductImage(null)} onChange={(e)=>handleFileChange(e,'product')} />
            
            <UploadZone label="Model Image" file={modelImage} 
            onClear={()=>setModelImage(null)} onChange={(e)=>handleFileChange(e,'model')} />          </div>
          
          <div className="w-full">
            <div>
              
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default memo(Generate);