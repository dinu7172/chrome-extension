import { FaUserCircle, } from "react-icons/fa";
import { RxCross1, } from "react-icons/rx";
import logo from "../assets/logo.svg"
import { Link } from "react-router-dom";

interface Props {
    setIsShowMainPopup :(val :boolean)=>void;
    setMouseHovering :(val :boolean)=>void;
    authData: any;
}

export default function Header({setIsShowMainPopup ,setMouseHovering, authData}:Props) {
    return (
        <div className="w-full bg-slate-950">
            <div className="px-4 py-4 h-full flex justify-between items-center my-auto">
                <Link to="/" className="cursor-pointer rounded-full">
                    <img src={logo} alt="logo" width={120} />
                </Link>

                <div className="flex gap-2 items-center justify-between">
                    <Link to={"/profile"}>
                    {authData?.isAuth && authData?.data.image ? (
              <img 
                src={authData.data.image}
                alt={authData.data.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) :<FaUserCircle  className="cursor-pointer" color="gray" size={40} />}
                    </Link>
                    <div className="cursor-pointer p-1 flex justify-center items-center rounded-full text-white hover:bg-black" onClick={()=>[setIsShowMainPopup(false) , setMouseHovering(false)]}>
                        <RxCross1 size={25} />
                    </div>
                </div>

            </div>

        </div>
    )
}
