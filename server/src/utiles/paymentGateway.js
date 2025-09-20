import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RJSJUBsZz678SC",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "3wMWSfpyi36fmEif8bfqB873"
});

export default razorpay;
