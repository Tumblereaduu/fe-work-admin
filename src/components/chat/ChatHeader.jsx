const ChatHeader = ({ group, onlineCount }) => {
  return (
    <div className="h-[80px] border-b border-slate-800/50 px-6 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-slate-800/30 z-10 backdrop-blur-sm sticky top-0">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-lg text-white shadow-lg">
          {(group?.group_name || "G")?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{group?.group_name || "Group Chat"}</h2>
          <p className="text-xs text-slate-400">
            {onlineCount || 0} members
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
