import { CheckIcon } from "lucide-react";

export const pricingData = [
    {
        title: "Starter Plan",
        price: 10,
        features: [
            {
                name: "50 AI Image Generations / month",
                icon: CheckIcon,
            },
            {
                name: "10 AI Short-Form Videos / month",
                icon: CheckIcon,
            },
            {
                name: "Standard Resolution Exports",
                icon: CheckIcon,
            },
            {
                name: "Basic Style & Background Options",
                icon: CheckIcon,
            },
            {
                name: "Community Support",
                icon: CheckIcon,
            },
        ],
        buttonText: "Upgrade Now",
    },
    {
        title: "Pro Plan",
        price: 60,
        mostPopular: true,
        features: [
            {
                name: "300 AI Image Generations / month",
                icon: CheckIcon,
            },
            {
                name: "75 AI Short-Form Videos / month",
                icon: CheckIcon,
            },
            {
                name: "HD & Commercial-Ready Exports",
                icon: CheckIcon,
            },
            {
                name: "Advanced Model & Scene Customization",
                icon: CheckIcon,
            },
            {
                name: "Ad & Reel Format Optimization",
                icon: CheckIcon,
            },
            {
                name: "Priority Rendering Queue",
                icon: CheckIcon,
            },
        ],
        buttonText: "Upgrade Now",
    },
    {
        title: "Enterprise Plan",
        price: 110,
        features: [
            {
                name: "Unlimited Image Generations",
                icon: CheckIcon,
            },
            {
                name: "Unlimited AI Video Rendering",
                icon: CheckIcon,
            },
            {
                name: "4K & Cinematic Exports",
                icon: CheckIcon,
            },
            {
                name: "Custom Brand & Campaign Styling",
                icon: CheckIcon,
            },
            {
                name: "API & Workflow Integrations",
                icon: CheckIcon,
            },
            {
                name: "24/7 Dedicated Support",
                icon: CheckIcon,
            }
        ],
        buttonText: "Upgrade Now",
    }
];