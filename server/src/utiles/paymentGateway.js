import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RLpLY1JPS163q5",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "6r0JDgxTlsuuridNkG62LuHy"
});

export default razorpay;
