import { SparklesIcon } from "lucide-react";
import { useThemeContext } from "../context/ThemeContext";
import SectionTitle from "../components/SectionTitle";
import { PricingTable } from "@clerk/clerk-react";

export default function Pricing() {
    const { theme } = useThemeContext();
    return (
        <div className="relative">
            <img className="absolute -mt-20 md:-mt-100 md:left-20 pointer-events-none" src={theme === "dark" ? "/assets/color-splash.svg" : "/assets/color-splash-light.svg"} alt="color-splash" width={1000} height={1000}  />
            <SectionTitle text1="PRICING" text2="Our Pricing Plans" text3="Flexible pricing options designed to meet your needs — whether you're just getting started or scaling up." />

            <div className="flex flex-wrap items-center justify-center max-w-5xl mx-auto">
                <PricingTable appearance={{
                    variables:{
                        colorBackground : 'none'
                    },
                    elements:{
                        pricingTableCardBody : 'bg-white/6',
                        pricingTableCardHeader : 'bg-white/10',
                        switchThumb : 'bg-white'
                    }
                }}/>
            </div>
        </div>
    );
}