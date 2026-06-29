import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiSearch } from "react-icons/fi";
import api from "../../api/axios";
import toast from "react-hot-toast";

const AddMembersModal = ({ isOpen, onClose, groupId, currentMembers = [], onMembersAdded, allUsers = [] }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter out already added members
  const availableUsers = allUsers.filter(
    (user) => !currentMembers.some((member) => member?.id === user?.id)
  );

  const filteredUsers = availableUsers.filter((user) =>
    (user?.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Select at least one member");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/chat/add-members", {
        group_id: groupId,
        members: selectedUsers,
      });

      console.log("Add members response:", response.data);

      if (response.data?.success) {
        toast.success("Members added successfully!");
        onMembersAdded();
        handleClose();
      } else {
        toast.error(response.data?.message || "Failed to add members");
      }
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error(error.response?.data?.message || "Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* HEADER */}
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-slate-800/30">
                <h2 className="text-xl font-bold text-white">Add Members</h2>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              {/* CONTENT */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* SEARCH USERS */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Select Members * ({selectedUsers.length} selected)
                  </label>
                  <div className="relative mb-3">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>

                  {/* USERS LIST */}
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <motion.label
                          key={user?.id}
                          whileHover={{ x: 4 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors border border-slate-700/30 hover:border-slate-600/50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user?.id)}
                            onChange={() => handleUserToggle(user?.id)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer accent-blue-500"
                          />
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {(user?.name || "U")?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-200 truncate">
                              {user?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {user?.email || ""}
                            </p>
                          </div>
                        </motion.label>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">
                          {availableUsers.length === 0
                            ? "All users are already members"
                            : "No users found"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* SELECTED USERS CHIPS */}
                {selectedUsers.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-400 mb-2">
                      Selected Members:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((userId) => {
                        const user = allUsers.find((u) => u?.id === userId);
                        return (
                          <motion.div
                            key={userId}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-xs font-medium"
                          >
                            {user?.name || "User"}
                            <button
                              onClick={() => handleUserToggle(userId)}
                              className="hover:text-blue-200 transition-colors"
                            >
                              <FiX className="text-sm" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="p-6 border-t border-slate-800/50 bg-slate-900/50 flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddMembers}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-800 text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FiPlus className="text-lg" />
                      Add Members
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddMembersModal;
