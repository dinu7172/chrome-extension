import { Coupon, CouponResponse } from "@/types";

export const fetchCoupons = async (domain: string): Promise<Coupon[] | null> => {
    try {
        console.log("domain ",domain)
      const response = await fetch(
        `https://staging.coupons.fit//api/public/offers?store_website=${domain}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result: CouponResponse = await response.json();
      console.log("result ",result)
      return result.data?.offers || null;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return null;
    }
  };