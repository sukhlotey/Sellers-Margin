import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Loading from "./Loading";

const PrivateAdminRoute = ({ children }) => {
  const { adminToken, loading } = useContext(AuthContext);

  if (loading) return <Loading />;
  return adminToken ? children : <Navigate to="/admin/login" />;
};

export default PrivateAdminRoute;