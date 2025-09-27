import { useContext } from "react";
import { SubscriptionContext } from "../../context/SubscriptionContext";

const SubscriptionStatus = () => {
  const { subscription } = useContext(SubscriptionContext);

  if (!subscription || subscription.plan === "free") {
    return <p>Free Plan (5 calculations available)</p>;
  }

  return (
    <div className="subscription-status">
      <p style={{marginBottom:"0",marginTop:"5px"}} className="status-plan">
        Plan: <strong>{subscription.planName}</strong>
      </p>
      <p className="status-plan">Expires on: {new Date(subscription.expiry).toLocaleDateString()}</p>
    </div>
  );
};

export default SubscriptionStatus;
