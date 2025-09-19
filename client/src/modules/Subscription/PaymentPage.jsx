import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import axios from "axios";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { setSubscription } = useContext(SubscriptionContext);
  const paymentData = location.state?.paymentData;

  useEffect(() => {
    if (!paymentData || !paymentData.order || !paymentData.plan) {
      console.error("Missing payment data, order, or plan:", paymentData);
      alert("Invalid payment data. Please try again.");
      navigate("/subscription");
      return;
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: paymentData.order.amount,
      currency: "INR",
      name: "Seller Sense",
      description: `Subscription for ${paymentData.plan}`,
      order_id: paymentData.order.id,
      handler: async function (response) {
        console.log("Payment response:", response);
        try {
          const verifyResponse = await axios.post(
            "http://localhost:5000/api/subscription/verify",
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: paymentData.plan,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Verification response:", verifyResponse.data);
          setSubscription({
            isSubscribed: true,
            plan: paymentData.plan,
            planName:
              paymentData.plan === "basic_monthly"
                ? "Basic Monthly"
                : paymentData.plan === "all_monthly"
                ? "All Modules Monthly"
                : "Annual",
            expiry: verifyResponse.data.subscription.endDate,
          });
          alert("Payment Successful! Subscription activated.");
          navigate("/subscription");
        } catch (err) {
          console.error("Payment verification error:", err.response?.data || err.message);
          alert(`Payment verification failed: ${err.response?.data?.message || "Please try again."}`);
          navigate("/subscription");
        }
      },
      prefill: {
        name: paymentData.user?.name || "",
        email: paymentData.user?.email || "",
      },
      theme: { color: "#3399cc" },
      modal: {
        ondismiss: () => {
          console.log("Razorpay modal dismissed");
          navigate("/subscription");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      console.error("Payment failed:", response.error);
      alert(`Payment failed: ${response.error.description}`);
      navigate("/subscription");
    });
    rzp.open();
  }, [paymentData, navigate, token, setSubscription]);

  return <h3>Processing Payment...</h3>;
};

export default PaymentPage;