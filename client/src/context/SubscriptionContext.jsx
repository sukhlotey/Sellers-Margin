import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { getUserSubscription } from "../api/subscriptionApi";

export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [subscription, setSubscription] = useState(null);

useEffect(() => {
  if (token) {
    getUserSubscription(token)
      .then((res) => {
        console.log("Subscription API response:", res.data);
        setSubscription(res.data);
      })
      .catch((err) => {
        console.error("Subscription API error:", err);
        setSubscription(null);
      });
  } else {
    setSubscription(null);
  }
}, [token]);

  return (
    <SubscriptionContext.Provider value={{ subscription, setSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
