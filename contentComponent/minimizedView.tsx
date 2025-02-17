import { RxCross1 } from "react-icons/rx";
import logo from "../assets/logo.png";

interface Props{
    onOpen: ()=>void;
    onMouseHover :(val:boolean)=>void;
    isHovering : boolean;
    couponCount : number;
}

const MinimizedView = ({ onOpen, onMouseHover, isHovering, couponCount }:Props) => (
    <div
      className="fixed z-[999999] cursor-pointer p-5 pr-1 flex gap-2 items-center right-0 top-[15%] bg-gray-800 text-slate-300 rounded-tl-xl rounded-bl-xl"
      onClick={onOpen}
      onMouseOver={() => onMouseHover(true)}
      onMouseLeave={() => onMouseHover(false)}
    >
      <div className="border-r-[1px] pr-2">
        <img src={logo} alt="coupono-logo" width={50} />
      </div>
      {isHovering && (
        <>
          <div className="text-xl font-bold">
            {couponCount} Coupons Found!
          </div>
          <div className="ring-1 rounded-full hover:ring-2 ring-red-500 hover:ring-indigo-50 hover:bg-red-600 p-2">
            <RxCross1 className="text-[20px]" />
          </div>
        </>
      )}
    </div>
  );

  export default MinimizedView