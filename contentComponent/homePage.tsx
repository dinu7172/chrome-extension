import { useState, useEffect } from "react";
import { Coupon } from "@/types";
import CouponCard from "./couponCard";
import Header from "./header";
import OfferCardSkeleton from "./skeletons/offerCardSkeleton";
import { BiLoaderAlt } from "react-icons/bi";


interface Props {
  setIsShowMainPopup?: (val: boolean) => void;
  setMouseHovering?: (val: boolean) => void;
}

export default function HomePage({ setIsShowMainPopup, setMouseHovering }: Props) {
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState<string>("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const response = await new Promise<{ domain: string; coupons: Coupon[] }>((resolve) => {
          chrome.runtime.sendMessage({ type: "GET_COUPONS" }, (response) => {
            resolve(response);
          });
        });
        // await new Promise((res) => setTimeout(res, 100000))
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


  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  } 

  return (
        <>
          <CouponList loading={loading} coupons={coupons} />
        </>
  );
}


const CouponList = ({ loading, coupons }:any) => {
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-4 py-8">
      <BiLoaderAlt className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="text-slate-400 text-sm font-medium">Finding the best deals...</p>
    </div>
  );
  // Check if first coupon is cashback
  const showCashbackCard = coupons?.length > 0 && coupons[0].offer_type === "CASHBACK";

  return (
    <div className="flex-1 h-full overflow-auto p-4 scrollbar-none">
      {!loading ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-semibold text-black">
              Available Coupons
            </h1>
            <span className="text-sm text-slate-800">
              {coupons.length} found
            </span>
          </div>
          <div className="space-y-3">
          {showCashbackCard && <CashbackCard coupon={coupons[0]} />}
            {coupons?.map((coupon:any, index:number) => (
              <CouponCard key={index} coupon={coupon} />
            ))}
          </div>
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};


const CashbackCard = ({ coupon }:{coupon: Coupon}) => (
  <div className="flex flex-col items-center py-5">
    <div>
      <div className="cursor-pointer">
        <div className="flex min-h-[180px] w-[338px] flex-grow flex-col justify-start rounded-lg bg-white pt-[24px] pr-[20px] pl-[20px] shadow-[3px_6px_20px_0px_rgba(171,171,184,0.4)]">
          <div className="flex flex-row pb-[20px]">
            <img 
              className="size-[80px] flex-none rounded-full border border-[#ECECEC]"
              src={coupon.offer_user_image}
              alt="Merchant Logo"
            />
            <div className="flex flex-col gap-[2px] pl-[8px] text-left">
              <h4 className="text-overline-1 line-clamp-1 flex-none">{coupon.offer_username}</h4>
              <h2 className="flex flex-row">
                <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="-mx-1.5 h-[33px] w-[33px]">
                  <path d="M8.099 14.586L19.06 1.257l-1.684 13.388 4.76-.25-.796 12.113-5.627 4.524-.5-9.522-7.115-6.924z" fill="#A8EDF1"/>
                  <path d="M9.18 12.503l12.112-6.748-5.191 9.517 3.633 1.21-4.152 8.825-5.537 1.73 2.423-7.267-3.288-7.267z" fill="#39C3CD" stroke="#000" strokeWidth="0.692" strokeLinejoin="round"/>
                </svg>
                <div className="text-header-3 line-clamp-2 w-[200px] pt-[3px]">
                  Earn {coupon.offer_benefit}% Back
                </div>
              </h2>
              <h3 className="text-body-2 line-clamp-3 flex-none pr-[39px]">
                {coupon.offer_description}
              </h3>
            </div>
          </div>
          <hr />
          <div className="flex min-h-[56px] flex-grow flex-col items-center justify-center">
            <button className="text-button-1 mt-[20px] mb-[22px] w-full flex-none rounded-full bg-black px-[30px] py-[13px] text-center text-nowrap text-white">
              Get Cash Back
            </button>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-5"></div>
  </div>
);

