import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";
import { adminRoutes } from "../routes/AppRoutes";
import api from "../api/axios";

const Login = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await api.post("/auth/login", formData);

      console.log(response.data);

      // SAVE TOKEN
      localStorage.setItem("token", response.data.token);

      // SAVE USER
      localStorage.setItem("user", JSON.stringify(response.data.user));

      toast.success("Login successful!");

      // REDIRECT
      navigate(`${adminRoutes}/dashboard`);
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl p-8">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Work Admin
          </h1>
          <p className="text-gray-400 text-sm">
            Login to continue
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          {/* EMAIL */}
          <div className="mb-5">
            <label className="block text-sm text-gray-300 mb-2">
              Email Address
            </label>
            <div className="flex items-center bg-[#1f2937] border border-gray-700 rounded-xl px-4">
              <FiMail className="text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-transparent p-3 outline-none text-white"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">
              Password
            </label>
            <div className="flex items-center bg-[#1f2937] border border-gray-700 rounded-xl px-4">
              <FiLock className="text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-transparent p-3 outline-none text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;