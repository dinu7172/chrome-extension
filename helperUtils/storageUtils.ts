import { Coupon } from "@/types";

export const storageUtils = {
    async getCoupons(domain: string): Promise<Coupon[]> {
      const { [domain]: coupons } = await chrome.storage.local.get(domain);
      return coupons || [];
    },
  
    async setCoupons(domain: string, coupons: Coupon[]): Promise<void> {
      await chrome.storage.local.set({ [domain]: coupons });
    },
  
    async getLastDomain(): Promise<string | null> {
      const { lastVisitedDomain } = await chrome.storage.local.get('lastVisitedDomain');
      return lastVisitedDomain || null;
    },
  
    async setLastDomain(domain: string): Promise<void> {
      await chrome.storage.local.set({ lastVisitedDomain: domain });
    }
  };