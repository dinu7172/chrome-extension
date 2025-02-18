import { FaUserCircle, } from "react-icons/fa";
import { RxCross1, } from "react-icons/rx";
import logo from "../assets/logo.png"
import { Link } from "react-router-dom";

interface Props {
    setIsShowMainPopup :(val :boolean)=>void;
    setMouseHovering :(val :boolean)=>void
}

export default function Header({setIsShowMainPopup ,setMouseHovering}:Props) {
    return (
        <div className="w-full h-20 bg-slate-950">
            <div className="px-4 py-1 flex justify-between items-center">
                <Link to="/" className="cursor-pointer">
                    <img src={logo} alt="logo" width={80} />
                </Link>

                <div className="flex gap-2 items-center justify-between">
                    <Link to={"/profile"}>
                    <FaUserCircle  className="cursor-pointer" color="gray" size={40} />
                    </Link>
                    <div className="border cursor-pointer p-1 flex justify-center items-center rounded-full bg-slate-800 text-white hover:bg-black" onClick={()=>[setIsShowMainPopup(false) , setMouseHovering(false)]}>
                        <RxCross1 size={25} />
                    </div>
                </div>

            </div>

        </div>
    )
}
