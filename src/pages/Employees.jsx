import { useEffect, useState } from "react";

import {
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../api/axios";

const Employees = () => {

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });

  // FETCH USERS
  const fetchEmployees = async () => {

    try {

      const response = await api.get(
        "/admin/users"
      );

      setEmployees(response.data.data);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };

  // INPUT CHANGE
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // CREATE USER
  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/admin/create-user",
        formData
      );

      toast.success(response.data.message);

      setShowModal(false);

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "staff",
      });

      fetchEmployees();
    } catch (error) {
      console.log(error);

      toast.error(
        error?.response?.data?.message ||
        "Failed to create employee"
      );
    }
  };

  // DELETE USER
  const handleDeleteUser = async (id) => {
    const confirmDelete =
      window.confirm(
        "Delete this employee?"
      );

    if (!confirmDelete) return;

    try {
      const response = await api.delete(
        `/admin/delete-user/${id}`
      );

      toast.success(response.data.message);

      fetchEmployees();
    } catch (error) {
      console.log(error);

      toast.error(
        error?.response?.data?.message ||
        "Delete failed"
      );
    }
  };

  // FILTER USERS
  const filteredEmployees = employees.filter((employee) =>
    (employee?.name || "")
      .toLowerCase()
      .includes((search || "").toLowerCase())
  );

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="p-4">

      {/* TOP */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Employee Management
          </h1>

          <p className="text-gray-400 mt-2">
            Manage all admins and staff
          </p>

        </div>

        <div className="flex items-center gap-4">

          {/* SEARCH */}
          <div className="relative">

            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="bg-[#111827] border border-gray-700 rounded-xl pl-12 pr-4 py-3 outline-none w-[280px]"
            />

          </div>

          {/* ADD BUTTON */}
          {
            currentUser?.role !== "staff" && (
              <button
                onClick={() =>
                  setShowModal(true)
                }
                className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 px-5 py-3 rounded-xl flex items-center gap-2 font-medium"
              >

                <FiPlus />

                Add Employee

              </button>
            )
          }

        </div>

      </div>

      {/* TABLE */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-[#1f2937]">

              <tr>

                <th className="px-6 py-4 text-left">
                  Employee
                </th>

                <th className="px-6 py-4 text-left">
                  Email
                </th>

                <th className="px-6 py-4 text-left">
                  Role
                </th>

                <th className="px-6 py-4 text-left">
                  Status
                </th>

                <th className="px-6 py-4 text-left">
                  Created
                </th>

                <th className="px-6 py-4 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {
                loading ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="text-center py-10 text-gray-400"
                    >
                      Loading employees...
                    </td>

                  </tr>

                ) : filteredEmployees.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="text-center py-10 text-gray-400"
                    >
                      No employees found
                    </td>

                  </tr>

                ) : (

                  filteredEmployees.map((employee) => (

                    <tr
                      key={employee.id}
                      className="border-t border-gray-800 hover:bg-[#182234] transition-all duration-200"
                    >

                      {/* USER */}
                      <td className="px-6 py-5">

                        <div className="flex items-center gap-4">

                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                            {
                              employee.name
                                ?.charAt(0)
                                ?.toUpperCase()
                            }
                          </div>

                          <div>

                            <h3 className="font-semibold">
                              {employee.name}
                            </h3>

                            <p className="text-sm text-gray-400">
                              ID: {employee.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-5 text-gray-300">
                        {employee.email}
                      </td>

                      {/* ROLE */}
                      <td className="px-6 py-5">

                        <span
                          className={`
                            px-4 py-2 rounded-full text-sm font-medium
                            ${
                              employee.role ===
                              "super_admin"
                                ? "bg-red-500/20 text-red-400"

                              : employee.role ===
                                "admin"
                                ? "bg-blue-500/20 text-blue-400"

                                : "bg-green-500/20 text-green-400"
                            }
                          `}
                        >
                          {employee.role}
                        </span>

                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-5">

                        <span
                          className={`
                            px-4 py-2 rounded-full text-sm font-medium
                            ${
                              employee.status ===
                              "active"
                                ? "bg-green-500/20 text-green-400"

                                : "bg-red-500/20 text-red-400"
                            }
                          `}
                        >
                          {employee.status}
                        </span>

                      </td>

                      {/* CREATED */}
                      <td className="px-6 py-5 text-gray-400">

                        {
                          new Date(
                            employee.created_at
                          ).toLocaleDateString()
                        }

                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-5">

                        <div className="flex items-center justify-center gap-3">

                          <button
                            className="w-10 h-10 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center hover:bg-yellow-500/30"
                          >

                            <FiEdit2 />

                          </button>

                          {
                            currentUser?.role ===
                            "super_admin" && (
                              <button
                                onClick={() =>
                                  handleDeleteUser(
                                    employee.id
                                  )
                                }
                                className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30"
                              >

                                <FiTrash2 />

                              </button>
                            )
                          }

                        </div>

                      </td>

                    </tr>
                  ))
                )
              }

            </tbody>

          </table>

        </div>

      </div>

      {/* MODAL */}
      {
        showModal && (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="w-full max-w-lg bg-[#111827] border border-gray-800 rounded-2xl p-8">

              {/* HEADER */}
              <div className="flex items-center gap-4 mb-6">

                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl">
                  <FiUsers />
                </div>

                <div>

                  <h2 className="text-2xl font-bold">
                    Add Employee
                  </h2>

                  <p className="text-gray-400 text-sm mt-1">
                    Create new admin or staff
                  </p>

                </div>

              </div>

              {/* FORM */}
              <form
                onSubmit={handleCreateUser}
                className="space-y-5"
              >

                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-4 outline-none"
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-4 outline-none"
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-4 outline-none"
                />

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-4 outline-none"
                >

                  {
                    currentUser?.role ===
                    "super_admin" && (
                      <option value="admin">
                        Admin
                      </option>
                    )
                  }

                  <option value="staff">
                    Staff
                  </option>

                </select>

                {/* BUTTONS */}
                <div className="flex justify-end gap-4 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setShowModal(false)
                    }
                    className="px-5 py-3 rounded-xl bg-gray-700 hover:bg-gray-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700"
                  >
                    Create Employee
                  </button>

                </div>

              </form>

            </div>

          </div>
        )
      }

    </div>
  );
};

export default Employees;