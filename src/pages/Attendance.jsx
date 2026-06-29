import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FiLogIn,
  FiLogOut,
  FiClock,
  FiCoffee,
  FiSun,
  FiShield,
  FiDownload,
  FiEdit2,
  FiX,
  FiRefreshCw,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../api/axios";

const STATUS_STYLES = {
  present: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  late: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "half-day": "bg-orange-500/15 text-orange-300 border-orange-500/30",
  absent: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  leave: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  permission: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

const STATUSES = ["present", "late", "half-day", "absent", "leave", "permission"];

const toDateInput = (d) => d.toISOString().slice(0, 10);

const defaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { from: toDateInput(start), to: toDateInput(end) };
};

const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString();
};

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

const secondsToLabel = (seconds) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  return `${h}h ${m}m`;
};

const computePreview = (login, logout, breakSec, lunchSec, permSec) => {
  if (!login || !logout) return null;
  const gross = Math.max(
    0,
    Math.floor((new Date(logout) - new Date(login)) / 1000)
  );
  const net = Math.max(0, gross - breakSec - lunchSec - permSec);
  return { gross, net, grossLabel: secondsToLabel(gross), netLabel: secondsToLabel(net) };
};

const Attendance = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isSuperAdmin = user?.role === "super_admin";

  const [range, setRange] = useState("day");
  const [dates, setDates] = useState(defaultRange);
  const [userFilter, setUserFilter] = useState("");
  const [employees, setEmployees] = useState([]);

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [today, setToday] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [timerTick, setTimerTick] = useState(Date.now());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [reportUser, setReportUser] = useState("");
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportFormat, setReportFormat] = useState("csv");

  const fetchEmployees = async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await api.get("/admin/users");
      setEmployees(res.data.data || []);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchActive = async () => {
    try {
      const res = await api.get("/attendance/active");
      setToday(res.data.attendance);
      setActiveSession(res.data.active);
    } catch (e) {
      console.log(e);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        from_date: dates.from,
        to_date: dates.to,
        range,
      };
      if (isSuperAdmin && userFilter) params.user_id = userFilter;

      const listUrl = isSuperAdmin ? "/attendance/all" : "/attendance/my";
      const [listRes, summaryRes] = await Promise.all([
        api.get(listUrl, { params }),
        api.get("/attendance/summary", { params }),
      ]);

      setRecords(listRes.data.data || []);
      setSummary(summaryRes.data.summary || listRes.data.summary);
      setTrends(summaryRes.data.trends || []);
      if (!isSuperAdmin) {
        setToday(listRes.data.today);
        setActiveSession(listRes.data.activeSession);
      }
    } catch (e) {
      console.log(e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [dates, range, userFilter, isSuperAdmin]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    loadData();
    fetchActive();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(Date.now());
      if (activeSession) fetchActive();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.id]);

  const activeDuration = useMemo(() => {
    if (!activeSession?.start_time) return null;
    const sec = Math.floor(
      (timerTick - new Date(activeSession.start_time).getTime()) / 1000
    );
    return secondsToLabel(sec);
  }, [activeSession, timerTick]);

  const markLogin = async () => {
    try {
      const res = await api.post("/attendance/login");
      toast.success(res.data.message);
      loadData();
      fetchActive();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Login failed");
    }
  };

  const markLogout = async () => {
    try {
      const res = await api.post("/attendance/logout");
      toast.success(res.data.message);
      loadData();
      fetchActive();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Logout failed");
    }
  };

  const sessionAction = async (action) => {
    try {
      await api.post(`/attendance/${action}`);
      toast.success("Action completed!");
      loadData();
      fetchActive();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditForm({
      login_time: row.login_time
        ? new Date(row.login_time).toISOString().slice(0, 16)
        : "",
      logout_time: row.logout_time
        ? new Date(row.logout_time).toISOString().slice(0, 16)
        : "",
      break_seconds: row.break_seconds || 0,
      lunch_seconds: row.lunch_seconds || 0,
      permission_seconds: row.permission_seconds || 0,
      status: row.status || "present",
    });
    setShowEdit(true);
  };

  const editPreview = useMemo(
    () =>
      computePreview(
        editForm.login_time,
        editForm.logout_time,
        Number(editForm.break_seconds),
        Number(editForm.lunch_seconds),
        Number(editForm.permission_seconds)
      ),
    [editForm]
  );

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      setSaving(true);
      await api.put(`/attendance/${editRow.id}`, {
        login_time: editForm.login_time || null,
        logout_time: editForm.logout_time || null,
        break_seconds: Number(editForm.break_seconds) || 0,
        lunch_seconds: Number(editForm.lunch_seconds) || 0,
        permission_seconds: Number(editForm.permission_seconds) || 0,
        status: editForm.status,
      });
      toast.success("Attendance updated successfully!");
      setShowEdit(false);
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = async () => {
    const uid = isSuperAdmin ? reportUser || user?.id : user?.id;
    if (!uid) {
      toast.error("Select a user for the report");
      return;
    }

    try {
      const url = isSuperAdmin
        ? "/attendance/report/download"
        : "/attendance/report";

      const params = {
        user_id: uid,
        month: reportMonth,
        year: reportYear,
        format: reportFormat,
      };

      const res = await api.get(url, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: reportFormat === "pdf" ? "application/pdf" : "text/csv",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `attendance-${reportYear}-${reportMonth}.${reportFormat}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Report downloaded successfully!");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Download failed");
    }
  };

  const analyticsCards = [
    {
      label: "Gross Hours",
      value: summary?.total_working_hours || "0h 0m",
      sub: "Login → Logout",
      color: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    },
    {
      label: "Net Hours",
      value: summary?.net_working_hours || "0h 0m",
      sub: "After deductions",
      color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    },
    {
      label: "Late",
      value: summary?.late_count ?? 0,
      sub: "Days",
      color: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    },
    {
      label: "Half-day",
      value: summary?.half_day_count ?? 0,
      sub: "Days",
      color: "from-orange-500/20 to-orange-600/5 border-orange-500/20",
    },
    {
      label: "Leave",
      value: summary?.leave_count ?? 0,
      sub: "Days",
      color: "from-blue-500/20 to-indigo-600/5 border-blue-500/20",
    },
    {
      label: "Permission",
      value: summary?.permission_total || "0h 0m",
      sub: "Total time",
      color: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
    },
    {
      label: "Break",
      value: summary?.break_total || "0h 0m",
      sub: "Total time",
      color: "from-slate-500/20 to-slate-600/5 border-slate-500/20",
    },
    {
      label: "Lunch",
      value: summary?.lunch_total || "0h 0m",
      sub: "Total time",
      color: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20",
    },
    {
      label: "Working Days",
      value: summary?.working_days ?? 0,
      sub: `${summary?.completed_days ?? 0} completed`,
      color: "from-teal-500/20 to-teal-600/5 border-teal-500/20",
    },
  ];

  const maxTrendNet = Math.max(...trends.map((t) => t.net_seconds || 0), 1);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Attendance Hub
          </h1>
          <p className="text-slate-400 mt-1">
            Login/logout, breaks, analytics & reports
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={markLogin}
            disabled={!!today?.login_time}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-40"
          >
            <FiLogIn /> Mark Login
          </button>
          <button
            onClick={markLogout}
            disabled={!today?.login_time || today?.logout_time}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold disabled:opacity-40"
          >
            <FiLogOut /> Mark Logout
          </button>
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-200 text-sm"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Session controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm">Today&apos;s session</p>
            <p className="text-white font-semibold mt-1">
              {today?.login_time
                ? `Logged in ${formatTime(today.login_time)}`
                : "Not checked in"}
              {today?.logout_time && ` · Out ${formatTime(today.logout_time)}`}
            </p>
            {activeSession && (
              <p className="text-amber-300 text-sm mt-2 flex items-center gap-2">
                <FiClock className="animate-pulse" />
                Active {activeSession.type}: {activeDuration}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!activeSession && (
              <>
                <button
                  onClick={() => sessionAction("break/start")}
                  disabled={!today?.login_time || today?.logout_time}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white disabled:opacity-40"
                >
                  <FiCoffee /> Start Break
                </button>
                <button
                  onClick={() => sessionAction("lunch/start")}
                  disabled={!today?.login_time || today?.logout_time}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white disabled:opacity-40"
                >
                  <FiSun /> Start Lunch
                </button>
                <button
                  onClick={() => sessionAction("permission/start")}
                  disabled={!today?.login_time || today?.logout_time}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white disabled:opacity-40"
                >
                  <FiShield /> Permission
                </button>
              </>
            )}
            {activeSession?.type === "break" && (
              <button
                onClick={() => sessionAction("break/end")}
                className="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold"
              >
                End Break
              </button>
            )}
            {activeSession?.type === "lunch" && (
              <button
                onClick={() => sessionAction("lunch/end")}
                className="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold"
              >
                End Lunch
              </button>
            )}
            {activeSession?.type === "permission" && (
              <button
                onClick={() => sessionAction("permission/end")}
                className="px-3 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold"
              >
                End Permission
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-xl p-4 shadow-lg shadow-black/20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-3">
            <FiCalendar className="text-slate-400 shrink-0" />
            <input
              type="date"
              value={dates.from}
              onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))}
              className="w-full bg-transparent py-2.5 text-white text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-3">
            <FiCalendar className="text-slate-400 shrink-0" />
            <input
              type="date"
              value={dates.to}
              onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))}
              className="w-full bg-transparent py-2.5 text-white text-sm outline-none"
            />
          </div>
          <div className="flex rounded-xl border border-slate-700 overflow-hidden xl:col-span-2">
            {["day", "week", "month"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`flex-1 py-2.5 text-sm font-semibold capitalize ${
                  range === r
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800/50 text-slate-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {isSuperAdmin && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-3">
              <FiUser className="text-slate-400" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full bg-transparent py-2.5 text-white text-sm outline-none"
              >
                <option className="text-white bg-slate-800/80 hover:bg-slate-800/90" value="">All users</option>
                {employees.map((emp) => (
                  <option className="text-white bg-slate-800/80 hover:bg-slate-800/90" key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={downloadReport}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5"
          >
            <FiDownload /> Report
          </button>
        </div>

        {isSuperAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-800">
            <select
              value={reportUser}
              onChange={(e) => setReportUser(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-white text-sm"
            >
              <option value="">Report user</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="12"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-white text-sm"
              placeholder="Month"
            />
            <input
              type="number"
              value={reportYear}
              onChange={(e) => setReportYear(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-white text-sm"
              placeholder="Year"
            />
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-white text-sm"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        )}
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {analyticsCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border bg-gradient-to-br p-4 ${card.color}`}
          >
            <p className="text-slate-400 text-xs font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
            <p className="text-slate-500 text-xs mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h3 className="text-white font-semibold mb-4">
            {range === "day" ? "Daily" : range === "week" ? "Weekly" : "Monthly"} net hours
          </h3>
          {trends.length === 0 ? (
            <p className="text-slate-500 text-sm">No trend data for this range.</p>
          ) : (
            <div className="space-y-3">
              {trends.map((t) => (
                <div key={t.label}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{t.label}</span>
                    <span>{t.net_hours}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{
                        width: `${Math.max(4, (t.net_seconds / maxTrendNet) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h3 className="text-white font-semibold mb-4">Status summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-amber-300">{summary?.late_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Late</p>
            </div>
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-orange-300">
                {summary?.half_day_count ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">Half-day</p>
            </div>
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-blue-300">{summary?.leave_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Leave</p>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-4">
            Absent days: {summary?.absent_days ?? 0} · Completed:{" "}
            {summary?.completed_days ?? 0}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="px-4 py-3 font-semibold">Date</th>
                {isSuperAdmin && <th className="px-4 py-3 font-semibold">User</th>}
                <th className="px-4 py-3 font-semibold">Login</th>
                <th className="px-4 py-3 font-semibold">Logout</th>
                <th className="px-4 py-3 font-semibold">Gross</th>
                <th className="px-4 py-3 font-semibold">Break</th>
                <th className="px-4 py-3 font-semibold">Lunch</th>
                <th className="px-4 py-3 font-semibold">Permission</th>
                <th className="px-4 py-3 font-semibold">Net</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={isSuperAdmin ? 12 : 11} className="px-4 py-4">
                      <div className="h-10 rounded-lg bg-slate-800/50 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 12 : 11}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No attendance records in this range.
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 text-slate-200 whitespace-nowrap">
                      {formatDate(row.attendance_date || row.login_time || row.created_at)}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-white">{row.name}</td>
                    )}
                    <td className="px-4 py-3 text-emerald-400">{formatTime(row.login_time)}</td>
                    <td className="px-4 py-3 text-rose-400">{formatTime(row.logout_time)}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {row.gross_hours || row.total_hours || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      {row.break_count || 0} · {row.break_time || "0h 0m"}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      {row.lunch_count || 0} · {row.lunch_time || "0h 0m"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.permission_time || "0h 0m"}
                    </td>
                    <td className="px-4 py-3 text-blue-300 font-medium">
                      {row.net_hours || row.net_work_hours || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                          STATUS_STYLES[row.status] || STATUS_STYLES.present
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {row.updated_by_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSuperAdmin && (
                        <button
                          onClick={() => openEdit(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs hover:bg-slate-700"
                        >
                          <FiEdit2 /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Attendance</h2>
                <p className="text-slate-400 text-sm">
                  {editRow.name} · {formatDate(editRow.attendance_date)}
                </p>
              </div>
              <button
                onClick={() => setShowEdit(false)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs uppercase font-semibold">
                  Login
                </label>
                <input
                  type="datetime-local"
                  value={editForm.login_time}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, login_time: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase font-semibold">
                  Logout
                </label>
                <input
                  type="datetime-local"
                  value={editForm.logout_time}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, logout_time: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["break_seconds", "Break (sec)"],
                  ["lunch_seconds", "Lunch (sec)"],
                  ["permission_seconds", "Permission (sec)"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-slate-400 text-xs">{label}</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm[key]}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase font-semibold">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {editPreview && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
                  <p className="text-blue-200 font-semibold mb-2">Recalculation preview</p>
                  <p className="text-slate-300">
                    Gross: <span className="text-white">{editPreview.grossLabel}</span>
                  </p>
                  <p className="text-slate-300">
                    Net: <span className="text-emerald-300">{editPreview.netLabel}</span>
                  </p>
                </div>
              )}

              <button
                onClick={saveEdit}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
