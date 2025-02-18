import { Coupon } from '@/types'
import React from 'react'
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';
import { MdOutlineLocalOffer } from 'react-icons/md'

const CouponCard = ({ coupon }:{coupon: Coupon }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getBenefitText = () => {
    const { offer_benefit, offer_benefit_type } = coupon;
    if (offer_benefit && offer_benefit_type === "AMOUNT") {
      return `$${offer_benefit} off`;
    } else if (offer_benefit && offer_benefit_type === "PERCENTAGE") {
      return `${offer_benefit}% off`;
    } else if (offer_benefit && offer_benefit_type === "TEXT") {
      return offer_benefit;
    }
    return "Best Discount";
  };

  const truncateText = (text:string, maxLength:number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Benefit Badge */}
      <div className="flex items-center gap-2 mb-3 justify-between">
        <div className='flex items-center gap-2'>
        <div className="flex items-center justify-center">
          <MdOutlineLocalOffer className="w-5 h-5 text-red-500" />
        </div>
        <span className="text-sm font-medium px-2 pb-1 bg-slate-700 rounded-full text-white">
          {getBenefitText()}
        </span>
        </div>
        <button className="px-4 pb-1 flex items-center bg-gradient-to-tr from-blue-400 to-white hover:bg-blue-700 text-black text-sm font-bold rounded-md">
          {coupon.offer_type === "DEAL" ? "DEAL" : "Show Coupon"}
        </button>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-white mb-2 line-clamp-2">
        {truncateText(coupon.offer_title, 60)}
      </h3>

      {/* Description */}
      <div className="mb-3">
        {isExpanded ? <p className={`text-sm text-slate-300`}>
          {coupon.offer_description}
        </p> : ""}
        {coupon.offer_description.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 mt-1"
          >
            {isExpanded ? (
              <>
                Show Less <BiChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show More <BiChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Apply Button */}
      <div className="flex justify-end items-end">
        
        {/* <button className="text-slate-400 hover:text-slate-300 text-sm">
          View Details
        </button> */}
      </div>
    </div>
  );
};

export default CouponCard;
