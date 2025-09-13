import logo from "../assets/sellersense1.png";
import { useNavigate } from "react-router-dom";
const Logo = () => {
  const Navigate = useNavigate();
  return (
   <>
   <img
   onClick={() =>Navigate("/dashboard")}
   style={{
    width: "80px",
    cursor: "pointer",
   }}
   src={logo} alt="profex"/>
   </>
  );
};

export default Logo;
