import { FiSearch, FiUsers, FiPlus } from "react-icons/fi";
import { motion } from "framer-motion";

const Sidebar = ({
  groups,
  selectedGroup,
  onSelectGroup,
  loading,
  searchQuery,
  onSearchChange,
  unreadCounts,
  onCreateGroupClick,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="w-[320px] bg-slate-900/80 border border-slate-800/50 rounded-2xl overflow-hidden flex flex-col shadow-xl backdrop-blur-xl">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-slate-800/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xl text-white shadow-lg">
            <FiUsers />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Group Chats</h2>
            <p className="text-xs text-slate-400">Team conversations</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreateGroupClick}
          className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transition-all shadow-lg"
          title="Create new group"
        >
          <FiPlus className="text-lg" />
        </motion.button>
      </div>

      {/* SEARCH */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* GROUP LIST */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {loading ? (
          <div className="text-slate-400 flex flex-col items-center justify-center mt-10 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-slate-400 text-center mt-10 space-y-2">
            <p className="text-sm">No groups found</p>
            {searchQuery && (
              <p className="text-xs text-slate-500">
                Try adjusting your search
              </p>
            )}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {groups.map((group) => {
              const unreadCount = unreadCounts[group.id] || 0;
              const isSelected = selectedGroup?.id === group.id;

              return (
                <motion.div
                  key={group.id}
                  variants={itemVariants}
                  onClick={() => onSelectGroup(group)}
                  className={`
                    p-4 rounded-xl cursor-pointer transition-all duration-200 border relative group
                    ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-600/30 to-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10"
                        : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/50"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50"
                          : "bg-gradient-to-br from-slate-600 to-slate-700 group-hover:from-slate-500 group-hover:to-slate-600"
                      }`}
                    >
                      {(group?.group_name || "G")?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold truncate transition-colors ${
                          isSelected ? "text-blue-300" : "text-slate-200"
                        }`}
                      >
                        {group?.group_name || "Unnamed Group"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {group?.last_message || "No messages yet"}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
