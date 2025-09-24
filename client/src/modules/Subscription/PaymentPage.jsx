import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { useAlert } from "../../context/AlertContext";
import axios from "axios";
import Loading from "../../components/Loading";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { setSubscription } = useContext(SubscriptionContext);
  const { showAlert } = useAlert();
  const paymentData = location.state?.paymentData;

  useEffect(() => {
    if (!paymentData || !paymentData.order || !paymentData.plan) {
      console.error("Missing payment data, order, or plan:", paymentData);
      showAlert("error", "Invalid payment data. Please try again.");
      navigate("/subscription");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RJSJUBsZz678SC",
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
          showAlert("success", "Payment Successful! Subscription activated.");
          navigate("/subscription");
        } catch (err) {
          console.error("Payment verification error:", err.response?.data || err.message);
          showAlert("error", err.response?.data?.message || "Payment verification failed. Please try again.");
          navigate("/subscription");
        }
      },
      prefill: {
        name: paymentData.user?.name || "",
        email: paymentData.user?.email || "",
      },
      theme: { color: "#3399cc" },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      console.error("Payment failed event:", response.error);
      // Ignore SVG rendering and preferences API errors
      if (
        response.error.code === "BAD_REQUEST_ERROR" &&
        (response.error.description.includes("svg") ||
         response.error.description.includes("width") ||
         response.error.description.includes("height") ||
         response.error.description.includes("Invalid request payload"))
      ) {
        console.log("Ignoring non-critical error (SVG or preferences); checking backend verification");
        // Rely on handler for success confirmation
        return;
      }
      showAlert("error", `Payment failed: ${response.error.description}`);
      navigate("/subscription");
    });
    rzp.open();
  }, [paymentData, navigate, token, setSubscription, showAlert]);

  return <Loading />;
};

export default PaymentPage;