import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import LenisScroll from "./components/Lenis"
import Generate from "./pages/Generate"
import Result from "./pages/Result"
import MyGenerations from "./pages/MyGenerations"
import Community from "./pages/Community"
import Plans from "./pages/Plans"
import Loading from "./pages/Loading"

export default function App() {
    return (
        <>
            <Navbar />
            <LenisScroll />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/generate" element={<Generate />} />
                <Route path="/result/:projectId" element={<Result />} />
                <Route path="/my-generations" element={<MyGenerations />} />
                <Route path="/community" element={<Community />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/loading" element={<Loading />} />
            </Routes>
            <Footer />
        </>
    )
}