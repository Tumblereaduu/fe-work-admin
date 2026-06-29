import { useEffect, useState } from "react";
import {
  FiUsers,
  FiCheckCircle,
  FiClipboard,
  FiActivity,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
} from "react-icons/fi";
import api from "../api/axios";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin =
    user?.role === "admin" || user?.role === "super_admin";

  const [loading, setLoading] = useState(true);
  const [taskStatsLoading, setTaskStatsLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAttendance: 0,
    totalTasks: 0,
    activeStaff: 0,
  });

  const [taskStats, setTaskStats] = useState({
    user: {
      pending: 0,
      completed: 0,
      priority: { high: 0, medium: 0, low: 0 },
    },
    all: null,
  });

  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);

  const fetchDashboard = async () => {
    try {
      setError("");
      const response = await api.get("/dashboard/stats");
      const data = response.data?.stats || {};
      setStats({
        totalUsers: data.totalUsers || 0,
        totalAttendance: data.totalAttendance || 0,
        totalTasks: data.totalTasks || 0,
        activeStaff: data.activeStaff || 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      setTaskStatsLoading(true);
      const response = await api.get("/dashboard/task-stats");
      setTaskStats(response.data.stats || taskStats);
    } catch (err) {
      console.error(err);
    } finally {
      setTaskStatsLoading(false);
    }
  };

  const fetchDashboardTasks = async (filter) => {
    try {
      setTasksLoading(true);
      setActiveFilter(filter);

      const params = {};
      if (filter?.status) params.status = filter.status;
      if (filter?.priority) params.priority = filter.priority;

      const response = await api.get("/dashboard/tasks", { params });
      setDashboardTasks(response.data.data || []);
    } catch (err) {
      console.error(err);
      setDashboardTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const isFilterActive = (card) => {
    if (!activeFilter) return false;
    if (card.key === "pending") return activeFilter.status === "pending";
    if (card.key === "completed") return activeFilter.status === "completed";
    return activeFilter.priority === card.key;
  };

  useEffect(() => {
    fetchDashboard();
    fetchTaskStats();
  }, []);

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  const formatStatusLabel = (status) =>
    (status || "pending").replaceAll("_", " ");

  const getPriorityBadge = (priority) => {
    if (priority === "low") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (priority === "high") return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  };

  const getStatusBadge = (status) => {
    if (status === "completed") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (status === "in_progress") return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  };

  const overviewCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <FiUsers className="w-7 h-7" />,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Attendance",
      value: stats.totalAttendance,
      icon: <FiCheckCircle className="w-7 h-7" />,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "All Tasks",
      value: stats.totalTasks,
      icon: <FiClipboard className="w-7 h-7" />,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      title: "Active Staff",
      value: stats.activeStaff,
      icon: <FiActivity className="w-7 h-7" />,
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  const myStats = taskStats.user;
  const displayStats = isAdmin && taskStats.all ? taskStats.all : myStats;

  const analyticsCards = [
    {
      key: "pending",
      title: isAdmin ? "Pending (All)" : "My Pending",
      value: displayStats.pending,
      subtitle: isAdmin ? `${myStats.pending} assigned to you` : "Active work items",
      icon: <FiClock className="w-6 h-6" />,
      gradient: "from-slate-500 to-slate-600",
      onClick: () =>
        fetchDashboardTasks({
          status: "pending",
          label: isAdmin ? "All Pending Tasks" : "My Pending Tasks",
        }),
    },
    {
      key: "completed",
      title: isAdmin ? "Completed (All)" : "My Completed",
      value: displayStats.completed,
      subtitle: isAdmin ? `${myStats.completed} completed by you` : "Finished tasks",
      icon: <FiCheckCircle className="w-6 h-6" />,
      gradient: "from-emerald-500 to-emerald-600",
      onClick: () =>
        fetchDashboardTasks({
          status: "completed",
          label: isAdmin ? "All Completed Tasks" : "My Completed Tasks",
        }),
    },
    {
      key: "high",
      title: "High Priority",
      value: displayStats.priority.high,
      icon: <FiAlertCircle className="w-6 h-6" />,
      gradient: "from-rose-500 to-rose-600",
      onClick: () => fetchDashboardTasks({ priority: "high", label: "High Priority Tasks" }),
    },
    {
      key: "medium",
      title: "Medium Priority",
      value: displayStats.priority.medium,
      icon: <FiTrendingUp className="w-6 h-6" />,
      gradient: "from-amber-500 to-amber-600",
      onClick: () => fetchDashboardTasks({ priority: "medium", label: "Medium Priority Tasks" }),
    },
    {
      key: "low",
      title: "Low Priority",
      value: displayStats.priority.low,
      icon: <FiClipboard className="w-6 h-6" />,
      gradient: "from-emerald-500 to-emerald-600",
      onClick: () => fetchDashboardTasks({ priority: "low", label: "Low Priority Tasks" }),
    },
  ];

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome back, {user?.name || "User"} · {currentDate}</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-800/50 animate-pulse" />
              ))
            : overviewCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-slate-400 text-sm">{card.title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg`}
                  >
                    {card.icon}
                  </div>
                </div>
              ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">My Task Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {taskStatsLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-800/50 animate-pulse" />
              ))
            : analyticsCards.map((card) => {
                const filterMatch = isFilterActive(card);

                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={card.onClick}
                    className={`text-left rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                      filterMatch
                        ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/30"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} items-center justify-center text-white mb-3`}
                    >
                      {card.icon}
                    </div>
                    <p className="text-slate-400 text-sm">{card.title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-slate-500 text-xs mt-1">{card.subtitle}</p>
                    )}
                  </button>
                );
              })}
        </div>
      </section>

      {(activeFilter || dashboardTasks.length > 0) && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {activeFilter?.label || "Task List"}
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Click a card above to filter tasks
              </p>
            </div>
            {activeFilter && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter(null);
                  setDashboardTasks([]);
                }}
                className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
            {tasksLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            ) : dashboardTasks.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                No tasks match this filter.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="text-left text-slate-400 border-b border-slate-800">
                    <th className="px-5 py-3 font-semibold">Title</th>
                    <th className="px-5 py-3 font-semibold">Assigned</th>
                    <th className="px-5 py-3 font-semibold">Priority</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Deadline</th>
                    <th className="px-5 py-3 font-semibold">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-800/80 hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3 font-medium text-white">{task.title}</td>
                      <td className="px-5 py-3 text-slate-300">
                        {task.staff_names || task.staff_name || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getPriorityBadge(task.priority)}`}
                        >
                          {task.priority || "medium"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStatusBadge(task.status)}`}
                        >
                          {formatStatusLabel(task.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-300 whitespace-nowrap">
                        {formatDate(task.deadline)}
                      </td>
                      <td className="px-5 py-3 text-slate-300 whitespace-nowrap">
                        {formatDateTime(task.completed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
