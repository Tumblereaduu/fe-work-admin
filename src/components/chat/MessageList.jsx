import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { FiMessageSquare } from "react-icons/fi";

const MessageList = ({ messages, currentUserId, currentUserName, userMap, typingUsers }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Helper: Check if message has content
  const hasMessageContent = (msg) => {
    return (
      msg?.message?.trim() ||
      msg?.file_url ||
      ((msg?.message_type === "image" ||
        msg?.message_type === "document" ||
        msg?.message_type === "voice") &&
        msg?.file_url)
    );
  };

  // Filter out empty messages
  const validMessages = messages.filter(hasMessageContent);

  // Group messages by date
  const groupedMessages = validMessages.reduce((acc, msg) => {
    const date = msg?.created_at 
      ? new Date(msg.created_at).toLocaleDateString()
      : "Unknown Date";
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-1 bg-[#0b1220] custom-scrollbar">
      {validMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
          <div className="w-20 h-20 bg-slate-800/40 rounded-full flex items-center justify-center shadow-inner">
            <FiMessageSquare className="text-4xl text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-400">
            No messages yet
          </h3>
          <p className="text-sm text-slate-500">
            Be the first to break the ice in this group!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* DATE SEPARATOR */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                <span className="text-xs font-semibold text-slate-500 px-3 py-1 bg-slate-800/50 rounded-full">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
              </div>

              {/* MESSAGES */}
              <div className="space-y-1">
                {msgs.map((msg, index) => {
                  const isOwn = msg?.sender_id === currentUserId;

                  return (
                    <div
                      key={msg?.id || index}
                      className={`w-full flex mb-3 ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <MessageBubble
                        message={msg}
                        isOwn={isOwn}
                        userMap={userMap}
                        currentUserId={currentUserId}
                        currentUserName={currentUserName}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* TYPING INDICATOR */}
          {Object.keys(typingUsers || {}).length > 0 && (
            <TypingIndicator typingUsers={typingUsers} />
          )}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
