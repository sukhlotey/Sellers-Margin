import logo from "../assets/loading.gif";
const Loading = () => {
  return (
   <>
   <img
   style={{
    width: "80px",
    cursor: "pointer",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)"
   }}
   src={logo} alt="profex"/>
   </>
  );
};

export default Loading;
