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
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: paymentData.order.amount,
      currency: "INR",
      name: "Seller Sense",
      description: `Subscription for ${paymentData.plan}`,
      order_id: paymentData.order.id,
      handler: async function (response) {
        console.log("Payment response:", response);
        try {
          const verifyResponse = await axios.post(
            "https://sellers-sense.onrender.com/api/subscription/verify",
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
          navigate("/subscription");
          window.location.reload();
          showAlert("success", "Payment Successful! Subscription activated.");
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
      // Ignore non-critical errors (SVG, preferences, account validation, UPI)
      if (
        response.error.code === "BAD_REQUEST_ERROR" &&
        (response.error.description.includes("svg") ||
         response.error.description.includes("width") ||
         response.error.description.includes("height") ||
         response.error.description.includes("Invalid request payload"))
      ) {
        console.log("Ignoring non-critical error (SVG or preferences); checking backend verification");
        return;
      }
      if (
        response.error.code === "SERVER_ERROR" &&
        response.error.description.includes("validate/account")
      ) {
        console.log("Ignoring account validation error; checking backend verification");
        return;
      }
      if (
        response.error.description.includes("gpay://upi/pay") ||
        response.error.description.includes("scheme does not have a registered handler")
      ) {
        console.log("Ignoring UPI handler error; checking backend verification");
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