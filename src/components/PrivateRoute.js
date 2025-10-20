import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuthBootstrap } from "../lib/api";

const PrivateRoute = () => {
  useAuthBootstrap();
  return (
    <div>
        <Navbar />
        <Outlet />
    </div>
  );
};

export default PrivateRoute;