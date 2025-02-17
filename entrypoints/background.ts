import { cleanDomain, isValidUrl } from '@/helperUtils/domainUtils';
import type { AuthResponseData, Coupon } from '../types';
import { fetchCoupons } from '@/helperUtils/external-api-handler/fetchOffers';

export default defineBackground(async () => {
  let processingDomain = false;

  // Fetch active tab domain
  const getActiveTabDomain = async (): Promise<string | null> => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || !isValidUrl(tab.url)) return null;
      return cleanDomain(new URL(tab.url).hostname);
    } catch {
      return null;
    }
  };

  // Fetch coupons from external API based on domain
  const fetchCouponsForDomain = async (domain: string): Promise<Coupon[]> => {
    if (processingDomain) return []; // Prevent multiple fetch requests at once

    try {
      processingDomain = true;

      // Fetch coupons from external API
      const newCoupons = await fetchCoupons(domain);
      if (newCoupons) {
        return newCoupons;
      }

      return [];
    } finally {
      processingDomain = false;
    }
  };

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === "GET_COUPONS") {
      getActiveTabDomain().then(async (domain) => {
        if (!domain) {
          sendResponse({ domain: "", coupons: [] });
          return;
        }

        const coupons = await fetchCouponsForDomain(domain);
        sendResponse({ domain, coupons });
      });
      return true; // Keep message channel open for async response
    }
  });


  //cookie managment function 

  interface Cookie {
    name: string;
    value: string;
    domain: string;
  }

  interface RequestOptions extends RequestInit {
    headers?: HeadersInit;
    responseType?: 'json' | 'text' | 'html';
  }

  async function makeCookieRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const getCookies = (): Promise<Cookie[]> => {
      return new Promise((resolve) => {
        chrome.cookies.getAll({ domain: "localhost" }, (cookies) => {
          resolve(cookies);
        });
      });
    };

    try {
      const cookies = await getCookies();
      if (!cookies.length) {
        console.log("No cookies found.");
        return null as T;
      }

      const cookieHeader = cookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join("; ");


      const defaultHeaders = {
        "Content-Type": "application/json",
        "Cookie": cookieHeader
      };

      const mergedHeaders = {
        ...defaultHeaders,
        ...(options.headers as Record<string, string> || {}),
        "Cookie": cookieHeader
      };

      const fetchOptions: RequestInit = {
        method: "GET",
        credentials: "include",
        ...options,
        headers: mergedHeaders
      };

      // Make the request
      const response = await fetch(url, fetchOptions);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type from response headers
      const contentType = response.headers.get("content-type");
      let data: any;

      // Handle different response types
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else if (contentType?.includes("text/html")) {
        data = await response.text();
        console.warn("Received HTML response instead of JSON");
      } else {
        // Default to text
        data = await response.text();
        console.warn(`Unexpected content type: ${contentType}`);
      }

      return data as T;

    } catch (error) {
      if (error instanceof Error) {
        console.error("Request failed:", error.message);
      } else {
        console.error("An unknown error occurred:", error);
      }
      throw error;
    }
  }

  // Example usage with error handling
 

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_AUTH") {
      makeCookieRequest<AuthResponseData>("http://localhost:2000/api/test", {
        headers: {
          "Accept": "application/json"
        }
      })
        .then(response => {
          if (response.status !== 200) {
            sendResponse(null)
          } else {
            sendResponse(response);
          }
        })
        .catch(error => {
          console.error("Background error:", error);
          sendResponse(null);
        });

      // Return true to indicate we want to send a response asynchronously
      return true;
    }
  });

  // Basic usage with error handling



  // // Example with HTML handling
  // try {
  //   const htmlResponse = await makeCookieRequest<string>("http://localhost:2000/api/test", {
  //     responseType: 'html',
  //     headers: {
  //       "Accept": "text/html"
  //     }
  //   });
  //   console.log("HTML response:", htmlResponse);
  // } catch (error) {
  //   if (error instanceof Error) {
  //     console.error("Request failed:", error.message);
  //   }
  // }
});



