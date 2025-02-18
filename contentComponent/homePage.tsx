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


  return (
    <div className="flex-1 h-full overflow-auto p-4 scrollbar-none">
      {!loading ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-semibold text-white">
              Available Coupons
            </h1>
            <span className="text-sm text-slate-400">
              {coupons.length} found
            </span>
          </div>
          <div className="space-y-3">
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




