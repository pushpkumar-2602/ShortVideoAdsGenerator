import { DollarSignIcon, FolderEditIcon, GalleryHorizontalEndIcon, MenuIcon, SparkleIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useThemeContext } from "../context/ThemeContext";
import { navLinks } from "../data/navLinks";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useClerk, useUser, UserButton } from "@clerk/clerk-react";
import { GhostButton, PrimaryButton } from "./Buttons";


export default function Navbar() {
  
    const navigate = useNavigate()
    const {user} = useUser()
    const{openSignIn, openSignUp} = useClerk()
    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const { theme } = useThemeContext();
   

    useEffect(() => {
        if (openMobileMenu) {
            document.body.classList.add("max-md:overflow-hidden");
        } else {
            document.body.classList.remove("max-md:overflow-hidden");
        }
    }, [openMobileMenu]);

    return (
        <nav className={`flex items-center justify-between fixed z-50 top-0 w-full px-6 md:px-16 lg:px-24 xl:px-32 py-4 ${openMobileMenu ? '' : 'backdrop-blur'}`}>
            <Link to='/' onClick={()=> scrollTo(0,0)}>
                <img className="h-9 md:h-9.5 w-auto shrink-0" src={theme === "dark" ? "/assets/logo-light.svg" : "/assets/logo-dark.svg"} alt="Logo" width={140} height={40} />
            </Link>
            <div className="hidden items-center md:gap-8 lg:gap-9 md:flex lg:pl-20">
                {navLinks.map((link) => (
                    <Link onClick={()=> scrollTo(0,0)} key={link.name} to={link.href} className="hover:text-slate-600 dark:hover:text-slate-300">
                        {link.name}
                    </Link>
                ))}
            </div>
            {/* Mobile menu */}
            {user && (
                    <button
                        onClick={() => setOpenMobileMenu(!openMobileMenu)}
                        className="md:hidden"
                    >
                        <MenuIcon className="size-6" />
                    </button>
                    )}

            {!user ? (
                <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 text-lg font-medium 
                    bg-white/60 dark:bg-black/40 backdrop-blur-md md:hidden transition duration-300
                    ${openMobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
                                    {navLinks.map((link) => (
                    <Link onClick={()=> scrollTo(0,0)}  to={link.href} key={link.name} className="hover:text-white transition">
                        {link.name}
                    </Link>
                ))} 
                <button onClick={()=>{setOpenMobileMenu(false)(false); openSignIn()}} className="absolute top-6 right-6 z-[60] p-2 bg-purple-600 hover:bg-purple-700 
                        text-white rounded-md flex items-center justify-center pointer-events-auto">
                    Sign in
                </button>
                <PrimaryButton onClick={()=>{setOpenMobileMenu(false)(false); openSignUp()}} className="max-sm:text-xs hidden sm:inline-block">Get Started</PrimaryButton>
                <button className="aspect-square size-10 p-1 items-center justify-center 
                bg-purple-600 hover:bg-purple-700 transition text-white rounded-md flex" onClick={() => setOpenMobileMenu(false)}>
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>
            ) : (
                <div className="flex gap-2">
                    <GhostButton onClick={()=>navigate('/plans')} className="border-none text-gray-300 sm:py-1.5">
                        Credits:
                    </GhostButton>
                    <UserButton>
                        <UserButton.MenuItems>
                            <UserButton.Action label="Generate" labelIcon={<SparkleIcon size={14}/>}
                             onClick={()=>navigate('/generate')}/>

                             <UserButton.Action label="My Generations" labelIcon={<FolderEditIcon size={14}/>}
                             onClick={()=>navigate('/my-generations')}/>

                             <UserButton.Action label="Community" labelIcon={<GalleryHorizontalEndIcon size={14}/>}
                             onClick={()=>navigate('/community')}/>

                             <UserButton.Action label="Plans" labelIcon={<DollarSignIcon size={14}/>}
                             onClick={()=>navigate('/plans')}/>
                        </UserButton.MenuItems>
                    </UserButton> 
                </div>
            ) }
            
             {!user ? (
                <div className="flex items-center gap-4">
                <ThemeToggle />
                    <button
                        onClick={() => openSignIn()}
                        className="hidden md:block hover:bg-slate-100 dark:hover:bg-purple-950 transition px-4 py-2 border border-purple-600 rounded-md"
                        >
                        Sign in
                        </button>

                        <button
                        onClick={() => openSignUp()}
                        className="hidden md:block px-4 py-2 bg-purple-600 hover:bg-purple-700 transition text-white rounded-md"
                        >
                        Get started
                        </button>
                        <button onClick={() => setOpenMobileMenu(!openMobileMenu)} className="md:hidden">
                    <MenuIcon size={26} className="active:scale-90 transition" />
                </button>
            </div>

             ) : (
                <div className="flex gap-2">
                    <GhostButton onClick={()=>navigate('/plans')} className="border-none text-gray-300 sm:py-1.5">
                        Credits:
                    </GhostButton>
                    <UserButton>
                        <UserButton.MenuItems>
                            <UserButton.Action label="Generate" labelIcon={<SparkleIcon size={14}/>}
                             onClick={()=>navigate('/generate')}/>

                             <UserButton.Action label="My Generations" labelIcon={<FolderEditIcon size={14}/>}
                             onClick={()=>navigate('/my-generations')}/>

                             <UserButton.Action label="Community" labelIcon={<GalleryHorizontalEndIcon size={14}/>}
                             onClick={()=>navigate('/community')}/>

                             <UserButton.Action label="Plans" labelIcon={<DollarSignIcon size={14}/>}
                             onClick={()=>navigate('/plans')}/>
                        </UserButton.MenuItems>
                    </UserButton>
                </div>
                 ) }
            
        </nav>
    );
}