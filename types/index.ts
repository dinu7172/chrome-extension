export interface Coupon {
  _id: string;
  code: string;
  description: string;
  expires_at?: string;
  // Add other coupon properties

  isNewOffer: boolean;
  offer_benefit: number;
  offer_benefit_type: "AMOUNT" | "PERCENTAGE" | "TEXT";
  offer_category_id: string;
  offer_code: string;
  offer_currency_code: string;
  offer_description: string;
  offer_end_date: string;
  offer_isVerified: 1 | 0;
  offer_last_used_date: string;
  offer_link: string;
  offer_status: string
  offer_tags: string[]
  offer_title: string;
  offer_type: "COUPON" | "DEAL" | "CASHBACK"
  offer_user_id: string;
  offer_user_image: string
  offer_username: string;
  score: number
  staticScore: number
}

export interface CouponResponse {
  status: number;
  data: {
    offers: Coupon[];
  };
}

export interface AuthResponseData {
  isAuth: boolean,
  status: number,
  message: string,
  data: {
    userName: string,
    email: string,
    identity: string,
    role: string
  } | null
}

export type AuthResponse = AuthResponseData | null