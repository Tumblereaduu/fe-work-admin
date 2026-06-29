import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiImage,
  FiX,
  FiLock,
  FiSearch,
  FiEye,
  FiUsers,
  FiPaperclip,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../api/axios";

const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["pending", "in_progress", "completed"];
const baseUrl = "http://localhost:5001";
// const baseUrl = "https://api.brandpilotmediahouse.com/api";

const emptyForm = {
  title: "",
  description: "",
  priority: "medium",
  assigned_to: "",
  assigned_ids: [],
  deadline: "",
};

const Tasks = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin =
    user?.role === "admin" || user?.role === "super_admin";

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragActiveCreate, setDragActiveCreate] = useState(false);
  const [dragActiveUpdate, setDragActiveUpdate] = useState(false);
  const createFileInputRef = useRef(null);
  const updateFileInputRef = useRef(null);
  const [assignMode, setAssignMode] = useState("single");
  const [createFiles, setCreateFiles] = useState([]);
  const [updateFiles, setUpdateFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [taskMessages, setTaskMessages] = useState([]);
  const [taskMessagesLoading, setTaskMessagesLoading] = useState(false);
  const [taskMessageText, setTaskMessageText] = useState("");
  const messagesEndRef = useRef(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    user_id: "",
  });

  const [formData, setFormData] = useState(emptyForm);
  const [detailStatus, setDetailStatus] = useState("pending");

  const canCreate =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "staff";

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (isAdmin && filters.user_id) params.user_id = filters.user_id;

      const response = await api.get("/tasks", { params });
      setTasks(response.data.data || []);
    } catch (error) {
      console.log(error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/admin/users");
      setEmployees(
        (response.data.data || []).filter(
          (employee) =>
            employee.role === "staff" ||
            employee.role === "admin" ||
            employee.role === "super_admin"
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatStatusLabel = (status) =>
    (status || "pending").replaceAll("_", " ");

  const getPriorityBadgeClass = (priority) => {
    if (priority === "low") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (priority === "high") return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  };

  const getStatusBadgeClass = (status) => {
    if (status === "completed") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (status === "in_progress") return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  };

  const getTaskAttachments = (task) => {
    if (task?.attachments?.length) return task.attachments;
    if (task?.attachment_url) {
      return [
        {
          file_url: task.attachment_url,
          file_name: task.attachment_name,
          file_mime: task.attachment_mime,
          legacy: true,
        },
      ];
    }
    return [];
  };

  const isImageAttachment = (file) => {
    const url = (file?.file_url || "").toLowerCase();
    const mime = (file?.file_mime || "").toLowerCase();
    return mime.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(url);
  };

  const isUserAssigned = (task) => {
    if (!task || !user?.id) return false;
    if (task.assignees?.some((assignee) => assignee.id === user.id)) return true;
    return task.assigned_to === user.id;
  };

  const canEditTask = (task) => {
    if (task?.status === "completed") return false;
    if (isAdmin) return true;
    return isUserAssigned(task);
  };

  const canViewTaskMessages = (task) => {
    if (isAdmin) return true;
    return isUserAssigned(task);
  };

  const canAddTaskMessage = (task) => {
    if (isAdmin) return true;
    return isUserAssigned(task);
  };

  const fetchTaskMessages = async (taskId) => {
    try {
      if (!taskId) return;
      setTaskMessagesLoading(true);
      const res = await api.get(`/tasks/${taskId}/messages`);
      console.log("TASK MESSAGES RESPONSE:", res.data);
      const messages =
        res.data.messages ||
        res.data.data ||
        res.data.taskMessages ||
        [];
      setTaskMessages(Array.isArray(messages) ? messages : []);
    } catch (error) {
      console.log("FETCH TASK MESSAGES ERROR:", error);
      setTaskMessages([]);
    } finally {
      setTaskMessagesLoading(false);
    }
  };

  const handleSendTaskMessage = async () => {
    try {
      if (!selectedTask?.id || !taskMessageText.trim()) return;
      const res = await api.post(`/tasks/${selectedTask.id}/messages`, {
        message: taskMessageText.trim(),
      });
      console.log("SEND TASK MESSAGE RESPONSE:", res.data);
      if (res.data.success || res.data.data) {
        const newMsg = res.data.data || res.data.messageData;
        if (newMsg) {
          setTaskMessages((prev) => [...prev, newMsg]);
        } else {
          fetchTaskMessages(selectedTask.id);
        }
        setTaskMessageText("");
        toast.success("Message sent successfully");
      }
    } catch (error) {
      console.log("SEND TASK MESSAGE ERROR:", error);
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTask || !newMessage.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!canAddTaskMessage(selectedTask)) {
      toast.error("You do not have permission to add messages to this task");
      return;
    }

    try {
      setSendingMessage(true);
      const response = await api.post(`/tasks/${selectedTask.id}/messages`, {
        message: newMessage.trim(),
      });

      toast.success(response.data.message || "Message added successfully");
      setNewMessage("");
      fetchTaskMessages(selectedTask.id);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "—";
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const resetCreateForm = () => {
    setFormData(emptyForm);
    setAssignMode("single");
    setCreateFiles([]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSingleAssignee = (e) => {
    setFormData({
      ...formData,
      assigned_to: e.target.value,
      assigned_ids: e.target.value ? [Number(e.target.value)] : [],
    });
  };

  const toggleMultiAssignee = (employeeId) => {
    setFormData((prev) => {
      const exists = prev.assigned_ids.includes(employeeId);
      const assigned_ids = exists
        ? prev.assigned_ids.filter((id) => id !== employeeId)
        : [...prev.assigned_ids, employeeId];
      return { ...prev, assigned_ids, assigned_to: "" };
    });
  };

  const getSelectedAssigneeIds = () => {
    if (assignMode === "single") {
      const id = Number(formData.assigned_to);
      return Number.isInteger(id) && id > 0 ? [id] : [];
    }
    return formData.assigned_ids;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const assigneeIds = getSelectedAssigneeIds();
    if (!assigneeIds.length) {
      toast.error("Please assign at least one staff member");
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("priority", formData.priority);
      payload.append("assigned_to", JSON.stringify(assigneeIds));
      payload.append("deadline", formData.deadline);
      createFiles.forEach((file) => payload.append("attachments", file));

      const response = await api.post("/tasks/create", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(response.data.message || "Task created successfully");
      setShowCreateModal(false);
      resetCreateForm();
      fetchTasks();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Task creation failed");
    } finally {
      setSaving(false);
    }
  };

  const openDetailModal = async (task) => {
    try {
      const response = await api.get(`/tasks/${task.id}`);
      const fullTask = response.data.data;
      setSelectedTask(fullTask);
      setDetailStatus(fullTask.status || "pending");
      setUpdateFiles([]);
      setTaskMessages([]);
      setTaskMessageText("");
      setShowDetailModal(true);
      if (canViewTaskMessages(fullTask)) {
        await fetchTaskMessages(fullTask.id);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load task details");
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTask(null);
    setUpdateFiles([]);
    setTaskMessages([]);
    setTaskMessageText("");
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    if (selectedTask.status === "completed") {
      toast.error("Completed tasks cannot be modified");
      return;
    }

    if (!canEditTask(selectedTask)) {
      toast.error("You do not have permission to update this task");
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("status", detailStatus);
      updateFiles.forEach((file) => payload.append("attachments", file));

      await api.put(`/tasks/update/${selectedTask.id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Task updated successfully");
      closeDetailModal();
      fetchTasks();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 300);
    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.priority, filters.user_id]);

  const taskCountLabel = useMemo(() => {
    if (!tasks.length) return "No tasks";
    return `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
  }, [tasks.length]);

  const renderAttachmentItem = (file, key) => {
    const url = `${baseUrl}${file.file_url}`;
    const name = file.file_name || "Attachment";

    return (
      <a
        key={key}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 hover:bg-slate-800/50 transition-colors"
      >
        {isImageAttachment(file) ? (
          <img
            src={url}
            alt={name}
            className="h-12 w-12 rounded-lg object-cover border border-slate-700/60"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-black/20 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <FiFileText />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-white text-sm font-semibold truncate">{name}</div>
          <div className="text-slate-400 text-xs">Open file</div>
        </div>
      </a>
    );
  };

  const isCompleted = selectedTask?.status === "completed";
  const editable = selectedTask && canEditTask(selectedTask);

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Task Management</h1>
          <p className="text-slate-400 mt-2">
            Track assignments, priorities, attachments, and updates
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20"
          >
            <FiPlus />
            Create Task
          </button>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-5">
        <div className={`grid grid-cols-1 gap-3 ${isAdmin ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full bg-slate-800/80 text-white border border-slate-700 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-blue-500/50"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="w-full bg-slate-800/80 text-white border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50"
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, priority: e.target.value }))
            }
            className="w-full bg-slate-800/80 text-white border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>

          {isAdmin && (
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filters.user_id}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, user_id: e.target.value }))
                }
                className="w-full bg-slate-800/80 text-white border border-slate-700 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-blue-500/50"
              >
                <option value="">All staff</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="text-slate-400 text-sm mt-3">{taskCountLabel}</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-14 rounded-xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-10 text-center">
            <FiAlertCircle className="mx-auto text-3xl text-slate-400 mb-3" />
            <h3 className="text-xl font-semibold text-white">No tasks found</h3>
            <p className="text-slate-400 mt-2">Adjust filters or create a new task.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-800">
                  <th className="px-5 py-4 font-semibold">Task</th>
                  <th className="px-5 py-4 font-semibold">Assigned Staff</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Deadline</th>
                  <th className="px-5 py-4 font-semibold">Completed</th>
                  <th className="px-5 py-4 font-semibold">Updated By</th>
                  <th className="px-5 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-slate-800/80 hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{task.title}</div>
                      <div className="text-slate-400 text-xs mt-1 line-clamp-1 max-w-xs">
                        {task.description}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-200">
                      {task.staff_names || task.staff_name || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getPriorityBadgeClass(task.priority || "medium")}`}
                      >
                        {task.priority || "medium"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusBadgeClass(task.status)}`}
                      >
                        {task.status === "completed" && <FiLock className="text-xs" />}
                        {formatStatusLabel(task.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-200 whitespace-nowrap">
                      {formatDate(task.deadline)}
                    </td>
                    <td className="px-5 py-4 text-slate-200 whitespace-nowrap">
                      {formatDateTime(task.completed_at)}
                    </td>
                    <td className="px-5 py-4 text-slate-300 whitespace-nowrap">
                      {task.updated_by_name || "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openDetailModal(task)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-white text-xs font-semibold"
                      >
                        <FiEye />
                        View/Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Create Task</h2>
                <p className="text-slate-400 text-sm mt-1">Assign staff, set priority, upload files</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Task title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500/50"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500/50"
              />
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p} priority</option>
                ))}
              </select>

              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
                {/* Attachment input with drag-and-drop and paste support */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <FiPaperclip /> Attachments (up to 10)
                  </span>
                </div>
                <div
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActiveCreate ? 'border-blue-500 bg-slate-800/50' : 'border-slate-700/50'}`}
                  onDragEnter={(e) => { e.preventDefault(); setDragActiveCreate(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActiveCreate(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveCreate(false);
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length) setCreateFiles((prev) => [...prev, ...files]);
                  }}
                  onPaste={(e) => {
                    const items = Array.from(e.clipboardData.items);
                    const imageFiles = items
                      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
                      .map((item) => item.getAsFile())
                      .filter(Boolean);
                    if (imageFiles.length) setCreateFiles((prev) => [...prev, ...imageFiles]);
                  }}
                >
                  <p className="text-center text-slate-400 mb-2">Drag & drop files here, paste screenshots (Ctrl + V), or click to browse</p>
                  <button
                    type="button"
                    onClick={() => createFileInputRef.current && createFileInputRef.current.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >Browse Files</button>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    ref={createFileInputRef}
                    onChange={(e) => setCreateFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </div>
                {/* Preview selected files */}
                {createFiles.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {createFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded bg-slate-700/30">
                        <div className="flex-1 overflow-hidden">
                          <p className="text-white text-sm truncate">{file.name}</p>
                          <p className="text-slate-400 text-xs">{formatBytes(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCreateFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="ml-2 text-red-500 hover:text-red-300"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-white">
                  <FiUsers /> Staff
                </span>
                <div className="flex rounded-lg overflow-hidden border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setAssignMode("single")}
                    className={`px-3 py-1.5 text-xs font-semibold ${assignMode === "single" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode("multiple")}
                    className={`px-3 py-1.5 text-xs font-semibold ${assignMode === "multiple" ? "bg-blue-600 text-white" : "text-slate-400"}`}
                  >
                    Multiple
                  </button>
                </div>
              </div>
              {assignMode === "single" ? (
                <select
                  value={formData.assigned_to}
                  onChange={handleSingleAssignee}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                >
                  <option value="">Select staff</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {employees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-700/50 px-3 py-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assigned_ids.includes(emp.id)}
                        onChange={() => toggleMultiAssignee(emp.id)}
                        className="accent-blue-500"
                      />
                      <span className="text-white text-sm">{emp.name}</span>
                    </label>
                  ))}
                </div>
              )}


              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-700 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-white">Update Task</h2>
                <p className="text-slate-400 text-sm mt-1">View details and manage status & files</p>
              </div>
              <button
                type="button"
                onClick={closeDetailModal}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4">
                <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
                <p className="text-slate-300 mt-2 whitespace-pre-wrap text-sm">
                  {selectedTask.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3">
                  <p className="text-slate-500 text-xs uppercase font-semibold">Assigned Staff</p>
                  <p className="text-white mt-1">
                    {selectedTask.staff_names ||
                      selectedTask.assignees?.map((a) => a.name).join(", ") ||
                      "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3">
                  <p className="text-slate-500 text-xs uppercase font-semibold">Priority</p>
                  <span
                    className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getPriorityBadgeClass(selectedTask.priority)}`}
                  >
                    {selectedTask.priority || "medium"}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3">
                  <p className="text-slate-500 text-xs uppercase font-semibold">Deadline</p>
                  <p className="text-white mt-1">{formatDate(selectedTask.deadline)}</p>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3">
                  <p className="text-slate-500 text-xs uppercase font-semibold">Completed At</p>
                  <p className="text-white mt-1">{formatDateTime(selectedTask.completed_at)}</p>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3">
                  <p className="text-slate-500 text-xs uppercase font-semibold">Updated By</p>
                  <p className="text-white mt-1">{selectedTask.updated_by_name || "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3">
                  <p className="text-slate-500 text-xs uppercase font-semibold">Updated At</p>
                  <p className="text-white mt-1">{formatDateTime(selectedTask.updated_at)}</p>
                </div>
              </div>

              {getTaskAttachments(selectedTask).length > 0 && (
                <div>
                  <p className="text-slate-500 text-xs uppercase font-semibold mb-2">Attachments</p>
                  <div className="space-y-2">
                    {getTaskAttachments(selectedTask).map((file, idx) =>
                      renderAttachmentItem(file, file.id || `legacy-${idx}`)
                    )}
                  </div>
                </div>
              )}

              {/* {canViewTaskMessages(selectedTask) && (
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4 flex flex-col max-h-96">
                  <div className="mb-3">
                    <p className="text-white font-bold text-base">Task Discussion</p>
                    <p className="text-slate-400 text-xs mt-0.5">Updates and replies for this task</p>
                  </div>

                  // Messages Container 
                  <div className="flex-1 min-h-0 overflow-y-auto mb-3 space-y-3 pr-2">
                    {taskMessagesLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="h-16 rounded-xl bg-slate-700/40 animate-pulse" />
                        ))}
                      </div>
                    ) : taskMessages.length > 0 ? (
                      taskMessages.map((msg) => {
                        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                        const isOwn = Number(msg.user_id) === Number(currentUser.id);
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                                isOwn
                                  ? "bg-blue-600 text-white rounded-br-md"
                                  : "bg-slate-800 text-white border border-slate-700 rounded-bl-md"
                              }`}
                            >
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-xs font-semibold">{msg.user_name || msg.name || "Unknown"}</span>
                                <span className="rounded-full bg-white/10 px-2 py-[2px] text-[10px]">
                                  {msg.user_role || msg.role || "user"}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                              <p className="mt-1 text-right text-[10px] text-white/60">
                                {msg.created_at
                                  ? new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-4">No messages yet</p>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  // Message Input 
                  {canAddTaskMessage(selectedTask) && (
                    <div className="space-y-2 pt-3 border-t border-slate-700/50">
                      <textarea
                        value={taskMessageText}
                        onChange={(e) => setTaskMessageText(e.target.value)}
                        placeholder="Type task update message..."
                        rows={2}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50 resize-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendTaskMessage}
                        disabled={!taskMessageText.trim()}
                        className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              )} */}

              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4">
                <p className="text-white font-semibold mb-3">Status</p>

                {isCompleted ? (
                  <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-300 text-sm">
                    <FiLock className="mt-0.5 shrink-0" />
                    <span>Completed tasks cannot be modified</span>
                  </div>
                ) : !editable ? (
                  <p className="text-slate-400 text-sm">
                    Only assigned staff or admins can update this task.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <select
                      value={detailStatus}
                      onChange={(e) => setDetailStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white capitalize"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatStatusLabel(status)}
                        </option>
                      ))}
                    </select>

                    <div>
                      <p className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                        <FiPaperclip /> Add more attachments
                      </p>
                      {/* Enhanced attachment input for update modal */}
                      <div
                        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActiveUpdate ? 'border-blue-500 bg-slate-800/50' : 'border-slate-700/50'} `}
                        onDragEnter={(e) => { e.preventDefault(); setDragActiveUpdate(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragActiveUpdate(false); }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragActiveUpdate(false);
                          const files = Array.from(e.dataTransfer.files);
                          if (files.length) setUpdateFiles((prev) => [...prev, ...files]);
                        }}
                        onPaste={(e) => {
                          const items = Array.from(e.clipboardData.items);
                          const imageFiles = items
                            .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
                            .map((item) => item.getAsFile())
                            .filter(Boolean);
                          if (imageFiles.length) setUpdateFiles((prev) => [...prev, ...imageFiles]);
                        }}
                      >
                        <p className="text-center text-slate-400 mb-2">Drag & drop files here, paste screenshots (Ctrl + V), or click to browse</p>
                        <button
                          type="button"
                          onClick={() => updateFileInputRef.current && updateFileInputRef.current.click()}
                          className="px-4 py-2 bg-blue-600 text-white rounded"
                        >Browse Files</button>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          ref={updateFileInputRef}
                          onChange={(e) => setUpdateFiles(Array.from(e.target.files || []))}
                          className="hidden"
                        />
                      </div>
                      {/* Preview selected update files */}
                      {updateFiles.length > 0 && (
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                          {updateFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded bg-slate-700/30">
                              <div className="flex-1 overflow-hidden">
                                <p className="text-white text-sm truncate">{file.name}</p>
                                <p className="text-slate-400 text-xs">{formatBytes(file.size)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setUpdateFiles((prev) => prev.filter((_, i) => i !== idx))}
                                className="ml-2 text-red-500 hover:text-red-300"
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleUpdateTask}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-60"
                    >
                      <FiCheckCircle />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
