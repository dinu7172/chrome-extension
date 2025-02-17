import { useState, useEffect } from "react";
import { Coupon } from "@/types";
import CouponCard from "./couponCard";
import Header from "./header";
import OfferCardSkeleton from "./skeletons/offerCardSkeleton";


interface Props {
  setIsShowMainPopup: (val: boolean) => void;
  setMouseHovering: (val: boolean) => void;
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
        <div className="flex-1 h-full overflow-auto p-2 space-y-4 scrollbar-none">
          {coupons?.map((coupon, index) => (
            <CouponCard key={index} coupon={coupon} />
            // <OfferCardSkeleton/>
          ))}
        </div>
  );
}



