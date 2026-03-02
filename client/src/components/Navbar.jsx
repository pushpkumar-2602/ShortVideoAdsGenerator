import { DollarSignIcon, FolderEditIcon, GalleryHorizontalEndIcon, MenuIcon, SparkleIcon, XIcon } from "lucide-react";
import { useEffect, useState,useCallback } from "react";
import { useThemeContext } from "../context/ThemeContext";
import { navLinks } from "../data/navLinks";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useClerk, useUser, UserButton, useAuth } from "@clerk/clerk-react";
import { GhostButton } from "./Buttons";
import api from "../configs/axios";
import toast from "react-hot-toast";


export default function Navbar() {

const navigate = useNavigate()
const {user} = useUser()
const{openSignIn, openSignUp} = useClerk()
const [openMobileMenu, setOpenMobileMenu] = useState(false);
const { theme } = useThemeContext();
const [credits,setCredits] = useState(0);
const {pathname} = useLocation();
const {getToken} = useAuth();

const getUserCredits = useCallback(async () => {
try {
const token = await getToken();
const { data } = await api.get('/api/user/credits', {
headers: {
Authorization: `Bearer ${token}`
}
});
setCredits(data.credits);

} catch (error) {
toast.error(error?.response?.data?.message || error.message);
console.log(error);
}
}, [getToken]);
useEffect(() => {
if (user) {
getUserCredits();
}
}, [user, pathname, getUserCredits]);

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
<GhostButton
onClick={() => navigate('/plans')}
className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full flex items-center gap-2 text-white"
>
Credits:
<span className="font-bold">
{credits}

</span>
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


