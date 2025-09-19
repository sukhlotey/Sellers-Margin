import { useContext } from "react";
import { SubscriptionContext } from "../../context/SubscriptionContext";

const SubscriptionStatus = () => {
  const { subscription } = useContext(SubscriptionContext);

  if (!subscription || subscription.plan === "free") {
    return <p>Free Plan (5 calculations available)</p>;
  }

  return (
    <div className="subscription-status">
      <p>
        Plan: <strong>{subscription.planName}</strong>
      </p>
      <p>Expires on: {new Date(subscription.expiry).toLocaleDateString()}</p>
    </div>
  );
};

export default SubscriptionStatus;
