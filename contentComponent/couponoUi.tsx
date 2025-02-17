import { useState, useEffect } from "react";
import { Coupon } from "@/types";
import CouponCard from "./couponCard";
import Header from "./header";
import HomePage from "./homePage";
import { RxCross1 } from "react-icons/rx";
import logo from "../assets/logo.png";

export default function CouponoUi() {
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState<string>("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState<string>("");
  const [isShowMainPopup, setIsShowMainPopup] = useState(false);
  const [mouseHovering, setMouseHovering] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const response = await new Promise<{ domain: string; coupons: Coupon[] }>((resolve) => {
          chrome.runtime.sendMessage({ type: "GET_COUPONS" }, (response) => {
            resolve(response);
          });
        });

        if (response) {
          setDomain(response.domain);
          setCoupons(response.coupons);
        }
      } catch (err) {
        setError("Failed to fetch coupons");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  if (loading) {
    return <div className="p-4">Loading coupons...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <>
      {isShowMainPopup ? (
        <div className="fixed w-[400px] block z-[9999] h-[90%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden">
          <Header setIsShowMainPopup={setIsShowMainPopup} setMouseHovering={setMouseHovering} />
          <div className="bg-slate-800 p-4 flex flex-col" style={{ height: "calc(100vh - 150px)" }}>
            <div className="flex-1 h-full overflow-auto p-2 space-y-4 scrollbar-none">
              {coupons?.map((coupon, index) => (
                <CouponCard key={index} coupon={coupon} />
              ))}
            </div>
            <HomePage />
          </div>
        </div>
      ) : (
        <div
          className="fixed z-[999999] cursor-pointer p-5 pr-1 flex gap-2 items-center right-0 top-[15%] bg-gray-800 text-slate-300 rounded-tl-xl rounded-bl-xl"
          onClick={() => setIsShowMainPopup(true)}
          onMouseOver={() => setMouseHovering(true)}
          onMouseLeave={() => setMouseHovering(false)}
        >
          <div className="border-r-[1px] pr-2">
            <img src={logo} alt="coupono-logo" width={50} />
          </div>
          {mouseHovering && (
            <>
              <div className="text-xl font-bold">
                5 Coupons Found!
              </div>
              <div className="ring-1 rounded-full hover:ring-2 ring-red-500 hover:ring-indigo-50 hover:bg-red-600 p-2">
                <RxCross1 className="text-[20px]" />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
