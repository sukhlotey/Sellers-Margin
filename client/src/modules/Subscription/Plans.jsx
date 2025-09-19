import { useEffect, useState, useContext } from "react";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { AuthContext } from "../../context/AuthContext";
import { getPlans, createPayment } from "../../api/subscriptionApi";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import "./Plans.css";

const Plans = () => {
  const { subscription } = useContext(SubscriptionContext);
  const { token } = useContext(AuthContext);
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getPlans().then((res) => {
      const enrichedPlans = res.data.map((plan) => ({
        ...plan,
        features:
          plan.id === "free"
            ? ["5 calculations", "Ad free"]
            : plan.id === "basic_monthly"
            ? ["Unlimited calculations and savings", "Unlimited bulk calculations", "Ad free"]
            : plan.id === "all_monthly"
            ? [
                "Access all modules unlimited",
                "Ad free",
              ]
            : plan.id === "annual"
            ? [
                "Discount 60%",
                "Access all modules unlimited",
                "Ad free",
              ]
            : [],
      }));
      setPlans(enrichedPlans);
    });
  }, []);

  const handleBuy = async (plan) => {
  if (!token) {
    alert("Please login first!");
    return;
  }
  try {
    const res = await createPayment(token, plan);
    console.log("Create order response:", res.data);
    navigate("/payment", { state: { paymentData: { order: res.data.order, plan } } });
  } catch (err) {
    console.error("Error creating payment:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Error creating payment");
  }
};

  return (
    <DashboardLayout>
      <div className="plans-container">
        <h2 className="plans-title">Choose Your Subscription Plan</h2>
        {subscription ? (
          <p className="current-plan">
            Current Plan: <strong>{subscription.planName || "Free"}</strong> (till{" "}
            {subscription.expiry
              ? new Date(subscription.expiry).toLocaleDateString()
              : "N/A"})
          </p>
        ) : (
          <p className="current-plan">Current Plan: <strong>Free</strong> (N/A)</p>
        )}
        <div className="plans-flex">
          {plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-price">₹{plan.price}</p>
              <p className="plan-duration">{plan.duration}</p>
              <div className="plan-features">
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              {plan.id !== "free" && (
                <button className="plan-button" onClick={() => handleBuy(plan.id)}>
                  Buy Now
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Plans;