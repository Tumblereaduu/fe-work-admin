import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Attendance from "../pages/Attendance";
import Chat from "../pages/Chat";
import MainLayout from "../layouts/MainLayout";
import Employees from "../pages/Employees";




import PrivateRoute from "./PrivateRoute";
import Tasks from "../pages/Tasks";

export const adminRoutes = '/w8GF6YXJhdgU3lZCBLRomzaEy8w'

const AppRoutes = () => {
  return (
    <BrowserRouter>

      <Routes>

        <Route path={`${adminRoutes}/`} element={<Login />} />

        {/* ADMIN LAYOUT */}
        <Route element={<PrivateRoute> <MainLayout /> </PrivateRoute> } >

            <Route path={`${adminRoutes}/dashboard`} element={<PrivateRoute><Dashboard /></PrivateRoute>} />

            <Route path={`${adminRoutes}/attendance`} element={<PrivateRoute><Attendance /></PrivateRoute>} />

            <Route path={`${adminRoutes}/chat`} element={<PrivateRoute><Chat /></PrivateRoute>} />

            <Route path={`${adminRoutes}/employees`} element={<PrivateRoute><Employees /></PrivateRoute>} />

            <Route path={`${adminRoutes}/tasks`} element={<PrivateRoute><Tasks /></PrivateRoute>} />

        </Route>

      </Routes>

    </BrowserRouter>
  );
};

export default AppRoutes;