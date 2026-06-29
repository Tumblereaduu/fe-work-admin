import { useRef, useState } from "react";
import { FiFileText } from "react-icons/fi";

const formatMessageTime = (time) => {
  if (!time) return "";
  return new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const VoiceMessage = ({ id, fileUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  return (
    <div className="w-[250px] flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) return;
          if (audio.paused) {
            audio.play();
            setIsPlaying(true);
          } else {
            audio.pause();
            setIsPlaying(false);
          }
        }}
        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"
      >
        <span className="text-lg">{isPlaying ? "⏸" : "▶"}</span>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[3px] h-8 overflow-hidden">
          {[...Array(34)].map((_, index) => (
            <span
              key={index}
              className="w-[3px] rounded-full bg-emerald-300/80"
              style={{
                height: `${8 + ((index * 7) % 22)}px`,
              }}
            />
          ))}
        </div>
      </div>

      <span className="text-[11px] text-white/70 flex-shrink-0">
        {duration || "0:28"}
      </span>

      <audio
        id={id ? `audio-${id}` : undefined}
        ref={audioRef}
        src={fileUrl || ""}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};

const MessageBubble = ({ message, isOwn, userMap, currentUserId, currentUserName }) => {

  const messageType = message?.message_type || "text";
  const fileUrl = message?.file_url ? `http://localhost:5001${message.file_url}` : null;
  const isImage = messageType === "image";
  const isVoice = messageType === "voice";

  const getSenderName = (msg) => {
    return (
      msg?.sender_name ||
      msg?.name ||
      msg?.username ||
      msg?.user_name ||
      userMap?.[msg?.sender_id] ||
      (msg?.sender_id === currentUserId ? currentUserName : undefined) ||
      "Unknown"
    );
  };

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

  // If no content, don't render
  if (!hasMessageContent(message)) {
    return null;
  }

  return (
    <div
      className={`
        relative px-3 py-2 shadow-md
        ${isImage ? "max-w-[280px]" : "max-w-[75%]"}
        ${isVoice ? "w-[280px]" : ""}
        ${
          isOwn
            ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
            : "bg-[#075E54] text-white rounded-2xl rounded-bl-md"
        }
      `}
    >
      {!isOwn && (
        <p className="text-xs font-semibold mb-1 text-blue-200">
          {getSenderName(message)}
        </p>
      )}

      {isImage && fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={fileUrl}
            alt="attachment"
            className="w-full max-w-[260px] rounded-xl object-cover block"
          />
        </a>
      )}

      {messageType === "document" && fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="flex items-center gap-3 bg-black/20 rounded-xl p-3 mb-2"
        >
          <FiFileText />
          <span className="text-sm truncate">
            {message?.file_name || "Document"}
          </span>
        </a>
      )}

      {isVoice && fileUrl && (
        <VoiceMessage
          id={message?.id}
          fileUrl={fileUrl}
          duration={message?.duration}
        />
      )}

      {message?.message?.trim() && (
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-1 mt-1">
        <span className="text-[10px] text-white/70">
          {formatMessageTime(message?.created_at)}
        </span>
        {isOwn && <span className="text-[10px] text-white/70">✓</span>}
      </div>
    </div>
  );
};

export default MessageBubble;
