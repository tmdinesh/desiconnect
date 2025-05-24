import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// This is a temporary component to debug the order data
export default function DebugOrders() {
  const { user, token } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (token && user) {
      fetch("/api/admin/orders/status/ready", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setOrderData(data);
        setIsLoading(false);
        console.log("Order data:", data);
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
        setIsLoading(false);
      });
    }
  }, [token, user]);
  
  if (isLoading) {
    return <div>Loading order data...</div>;
  }
  
  if (!orderData) {
    return <div>No order data available</div>;
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Order Data Debug</h1>
      
      {orderData.map(order => (
        <div key={order.id} className="mb-8 p-4 border rounded-md">
          <h2 className="text-xl font-semibold">Order #{order.id}</h2>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto text-xs">
            {JSON.stringify(order, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}