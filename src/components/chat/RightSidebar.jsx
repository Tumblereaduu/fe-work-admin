import { FiX, FiUsers, FiInfo, FiPlus, FiTrash2 } from "react-icons/fi";
import { useState } from "react";
import { motion } from "framer-motion";
import ConfirmationModal from "./ConfirmationModal";

const RightSidebar = ({ 
  group, 
  onlineUsers, 
  members = [], 
  membersLoading = false, 
  onAddMembersClick,
  currentUserId,
  onRemoveMember
}) => {
  const [activeTab, setActiveTab] = useState("members");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    memberId: null,
    memberName: null,
    isLoading: false,
  });

  const handleRemoveClick = (memberId, memberName) => {
    setConfirmModal({
      isOpen: true,
      memberId,
      memberName,
      isLoading: false,
    });
  };

  const handleConfirmRemove = async () => {
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await onRemoveMember(confirmModal.memberId);
      setConfirmModal({
        isOpen: false,
        memberId: null,
        memberName: null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error removing member:", error);
      setConfirmModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelRemove = () => {
    setConfirmModal({
      isOpen: false,
      memberId: null,
      memberName: null,
      isLoading: false,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="w-[300px] bg-slate-900/80 border border-slate-800/50 rounded-2xl overflow-hidden flex flex-col shadow-xl backdrop-blur-xl"
      >
      {/* HEADER */}
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-slate-800/30">
        <h3 className="font-bold text-white text-sm">Group Details</h3>
        <button className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-300 transition-colors">
          <FiX className="text-lg" />
        </button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-800/50 bg-slate-900/30">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "members"
              ? "text-blue-400 border-b-2 border-blue-500"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <FiUsers className="text-base" />
          Members
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "info"
              ? "text-blue-400 border-b-2 border-blue-500"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <FiInfo className="text-base" />
          Info
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "members" ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-400 px-2 py-1">
                {Object.keys(onlineUsers || {}).length} ONLINE
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddMembersClick}
                className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors"
                title="Add members"
              >
                <FiPlus className="text-sm" />
              </motion.button>
            </div>

            {/* LOADING STATE */}
            {membersLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">Loading members...</p>
              </div>
            ) : members?.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {members.map((member) => {
                  const isOnline = onlineUsers?.[member?.id];
                  const isCreator = member?.id === group?.created_by;
                  const isCurrentUser = member?.id === currentUserId;
                  
                  return (
                    <motion.div
                      key={member?.id}
                      whileHover={{ x: 4 }}
                      className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-slate-700/30 hover:border-slate-600/50 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* AVATAR */}
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                            {(member?.name || "M")?.charAt(0)?.toUpperCase()}
                          </div>
                          {/* ONLINE INDICATOR */}
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900 shadow-lg animate-pulse"></div>
                          )}
                        </div>

                        {/* MEMBER INFO */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-200 truncate">
                              {member?.name || "Unknown"}
                            </p>
                            {isCreator && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium flex-shrink-0">
                                Creator
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                              {member?.role || "Member"}
                            </span>
                            {isOnline && (
                              <span className="text-xs text-green-400 font-semibold">Online</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* REMOVE BUTTON */}
                      {!isCreator && !isCurrentUser && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRemoveClick(member?.id, member?.name)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
                          title="Remove member"
                        >
                          <FiTrash2 className="text-sm" />
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FiUsers className="text-3xl text-slate-600 mb-2" />
                <p className="text-sm text-slate-400">No members found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">
                GROUP NAME
              </p>
              <p className="text-sm text-slate-200 font-medium">
                {group?.group_name || "Unnamed Group"}
              </p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">
                CREATED
              </p>
              <p className="text-sm text-slate-200">
                {group?.created_at 
                  ? new Date(group.created_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">
                MEMBERS
              </p>
              <p className="text-sm text-slate-200">{members?.length || 0} members</p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">
                DESCRIPTION
              </p>
              <p className="text-sm text-slate-400">
                {group?.description || "No description provided"}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>

    {/* CONFIRMATION MODAL */}
    <ConfirmationModal
      isOpen={confirmModal.isOpen}
      title="Remove Member"
      message={`Are you sure you want to remove ${confirmModal.memberName} from this group? This action cannot be undone.`}
      confirmText="Remove"
      cancelText="Cancel"
      isDangerous={true}
      isLoading={confirmModal.isLoading}
      onConfirm={handleConfirmRemove}
      onCancel={handleCancelRemove}
    />
  </>
  );
};

export default RightSidebar;
