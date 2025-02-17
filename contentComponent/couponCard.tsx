import { Coupon } from '@/types'
import React from 'react'
import { MdOutlineLocalOffer } from 'react-icons/md'

export default function CouponCard({ coupon }: { coupon: Coupon }) {
    let show_benefit;
    const { offer_benefit, offer_benefit_type } = coupon
    if (offer_benefit && offer_benefit_type === "AMOUNT") {
        show_benefit = `$${offer_benefit} off`
    }
    else if (offer_benefit && offer_benefit_type === "PERCENTAGE") {
        show_benefit = `${offer_benefit} % off`;
    }
    else if (offer_benefit && offer_benefit_type === "TEXT") {
        show_benefit = `${offer_benefit}`;
    } else {
        show_benefit = `Best Discount`;
    }
    return (
        <div className="relative max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 ">
            <div className='flex items-center gap-2'>
                <div className='p-2 flex items-center justify-center'>
                    <MdOutlineLocalOffer color='#f5210a' className="w-7 h-7 text-gray-500 dark:text-gray-400" />
                </div>
                <p className='text-white'>{show_benefit}</p>
            </div>

            <a href="#">
                <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{coupon.offer_title}</h5>
            </a>
            <p className="mb-3 font-normal text-gray-500 dark:text-gray-400">{coupon.offer_description}</p>
            <a href="#" className="inline-flex font-medium items-center text-blue-600 hover:underline">
                See our guideline
                <svg className="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778" />
                </svg>
            </a>
        </div>

    )
}
