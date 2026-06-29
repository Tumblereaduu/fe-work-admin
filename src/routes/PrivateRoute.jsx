import { Navigate } from "react-router-dom";
import { adminRoutes } from "./AppRoutes";

const PrivateRoute = ({ children }) => {

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to={`${adminRoutes}/`} />;
  }

  return children;
};

export default PrivateRoute;