import { Coupon } from "@/types";
import { useEffect, useState } from "react";

export default function App() {
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
    <div className="max-w-[1304px] w-[600px] h-[400px] bg-red-600 p-4 bg-red">
      <h1 className="text-lg font-bold mb-2">Available Coupons</h1>
      <p className="text-sm text-gray-600 mb-4">Domain: {domain || "Unknown"}</p>
      {coupons.length > 0 ? (
        <ul className="space-y-2">
          {coupons.map((coupon) => (
            <li 
              key={coupon._id} 
              className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="font-medium">{coupon.offer_code}</div>
              <div className="text-sm text-gray-600">{coupon.offer_description}</div>
              {coupon.expires_at && (
                <div className="text-xs text-gray-500 mt-1">
                  Expires: {new Date(coupon.offer_end_date).toLocaleDateString()}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No coupons available for this domain.</p>
      )}
    </div>
  );
}