import { useState, useRef, useEffect } from "react";
import { FiSend, FiPaperclip, FiSmile, FiMic, FiX, FiFileText } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

const MessageInput = ({ onSendMessage, onTyping, onSendAttachment, onSendVoice, selectedGroup }) => {
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [previewIsPlaying, setPreviewIsPlaying] = useState(false);
  
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const discardRecordingRef = useRef(false);
  const previewAudioRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        120
      );
    }

    // Emit typing event
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping();
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 1000);
  };

  // FILE HANDLING
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Selected file:", file);

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    // Generate preview
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setAttachmentPreview({
        type: "image",
        url: url,
        name: file.name,
      });
    } else {
      setAttachmentPreview({
        type: "document",
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
      });
    }

    e.target.value = "";
  };

  const handleSendAttachment = async () => {
    try {
      if (!selectedGroup?.id || !selectedFile) return;

      setUploading(true);
      const result = await onSendAttachment?.(selectedFile, message || "");
      if (result?.success) {
        setSelectedFile(null);
        setAttachmentPreview(null);
        setMessage("");

        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      } else {
        toast.error(result?.message || "Attachment upload failed");
      }
    } catch (error) {
      console.log("Attachment upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  // VOICE RECORDING
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          audioChunksRef.current = [];
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const audioUrl = URL.createObjectURL(audioBlob);

        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
        setPreviewIsPlaying(false);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();

      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.log("Microphone error:", error);
      toast.error("Microphone permission denied");
    }
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorder) return;

    discardRecordingRef.current = false;
    mediaRecorder.stop();

    setIsRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      discardRecordingRef.current = true;
      mediaRecorder.stop();
    }

    setIsRecording(false);
    setRecordingTime(0);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl("");
    setPreviewIsPlaying(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendVoiceNote = async () => {
    try {
      if (!selectedGroup?.id || !recordedAudioBlob) return;

      setVoiceUploading(true);
      const result = await onSendVoice?.(recordedAudioBlob);
      if (result?.success) {
        setRecordedAudioBlob(null);
        setRecordedAudioUrl("");
        setRecordingTime(0);
        setPreviewIsPlaying(false);
      } else {
        toast.error(result?.message || "Voice upload failed");
      }
    } catch (error) {
      console.log("Voice upload error:", error);
    } finally {
      setVoiceUploading(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // UNIFIED SEND FUNCTION
  const handleSend = async () => {
    if (uploading || voiceUploading) return;

    if (selectedFile) {
      await handleSendAttachment();
      return;
    }

    if (recordedAudioBlob) {
      await handleSendVoiceNote();
      return;
    }

    if (message.trim()) {
      handleSendMessage();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled =
    uploading ||
    voiceUploading ||
    (!message.trim() && !selectedFile && !recordedAudioBlob);

  return (
    <div className="p-5 border-t border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-slate-800/30 backdrop-blur-md sticky bottom-0">
      {/* FILE PREVIEW */}
      <AnimatePresence>
        {attachmentPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              {attachmentPreview.type === "image" ? (
                <img
                  src={attachmentPreview.url}
                  alt="preview"
                  className="w-14 h-14 rounded-lg object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <FiFileText className="text-2xl text-blue-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {attachmentPreview.name}
                </p>
                {attachmentPreview.size && (
                  <p className="text-xs text-slate-400">
                    {attachmentPreview.size} MB
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setAttachmentPreview(null);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
            >
              <FiX className="text-lg" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECORDING INDICATOR - WhatsApp Style */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3"
          >
            <button
              type="button"
              onClick={cancelVoiceRecording}
              className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
            >
              <FiX className="text-lg" />
            </button>

            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"
            />

            <span className="text-red-400 font-medium text-sm">
              Recording <span className="text-red-400 font-medium">{formatRecordingTime(recordingTime)}</span>
            </span>

            {/* Animated waveform */}
            <div className="flex items-end gap-1 flex-1 h-8">
              {[...Array(24)].map((_, index) => (
                <motion.span
                  key={index}
                  animate={{ height: [8, 16, 8] }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: index * 0.05,
                  }}
                  className="w-1 bg-red-400 rounded-full flex-shrink-0"
                  style={{
                    height: `${8 + (index % 6) * 4}px`,
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={stopVoiceRecording}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors flex-shrink-0"
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VOICE PREVIEW - After recording stopped */}
      <AnimatePresence>
        {recordedAudioUrl && !isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3"
          >
            <button
              type="button"
              onClick={cancelVoiceRecording}
              className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
            >
              <FiX className="text-lg" />
            </button>

            <button
              type="button"
              onClick={() => {
                const audio = previewAudioRef.current;
                if (!audio) return;
                if (audio.paused) {
                  audio.play();
                  setPreviewIsPlaying(true);
                } else {
                  audio.pause();
                  setPreviewIsPlaying(false);
                }
              }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
            >
              <span className="text-lg text-white">
                {previewIsPlaying ? "⏸" : "▶"}
              </span>
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

              <div className="flex justify-between text-[11px] text-gray-300 mt-1">
                <span>{formatRecordingTime(recordingTime)}</span>
                <span>Preview</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendVoiceNote}
              disabled={voiceUploading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors flex-shrink-0"
            >
              Send
            </button>

            <audio
              ref={previewAudioRef}
              src={recordedAudioUrl}
              onEnded={() => setPreviewIsPlaying(false)}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3 max-w-5xl mx-auto relative">
        {/* ATTACHMENT BUTTON */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording || uploading || recordedAudioUrl}
          className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 text-slate-400 hover:text-slate-300 transition-all duration-200 flex-shrink-0"
        >
          <FiPaperclip className="text-lg" />
        </motion.button>

        {/* VOICE BUTTON */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
          disabled={uploading || selectedFile || recordedAudioUrl}
          className={`p-3 rounded-lg flex-shrink-0 transition-all duration-200 ${
            isRecording
              ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300"
              : "bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 text-slate-400 hover:text-slate-300"
          }`}
        >
          <FiMic className="text-lg" />
        </motion.button>

        {/* INPUT AREA */}
        <div className="flex-1 bg-slate-800/50 border border-slate-700/50 focus-within:border-blue-500/50 rounded-xl overflow-hidden transition-colors shadow-inner flex items-end gap-2 px-4 py-2">
          <textarea
            ref={textareaRef}
            placeholder="Type your message here... (Shift+Enter for new line)"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            rows={1}
            disabled={isRecording || uploading || voiceUploading || recordedAudioUrl}
            className="w-full bg-transparent py-3 outline-none text-white placeholder-slate-500 resize-none max-h-[120px] font-medium disabled:opacity-50"
          />

          {/* EMOJI BUTTON */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={isRecording || uploading || voiceUploading}
            className="p-2 rounded-lg bg-slate-700/30 hover:bg-slate-600/50 disabled:opacity-50 text-slate-400 hover:text-slate-300 transition-all duration-200 flex-shrink-0"
          >
            <FiSmile className="text-lg" />
          </motion.button>
        </div>

        {/* SEND BUTTON */}
        <motion.button
          type="button"
          whileHover={!isDisabled ? { scale: 1.05 } : {}}
          whileTap={!isDisabled ? { scale: 0.95 } : {}}
          onClick={handleSend}
          disabled={isDisabled}
          className={`
            h-12 w-12 rounded-lg flex items-center justify-center text-xl transition-all duration-300 flex-shrink-0 font-bold
            ${
              isDisabled
                ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/50"
            }
          `}
        >
          <motion.div
            animate={!isDisabled ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            {uploading || voiceUploading ? "..." : <FiSend />}
          </motion.div>
        </motion.button>

        {/* EMOJI PICKER */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-20 left-0 z-50"
            >
              <EmojiPicker
                theme="dark"
                onEmojiClick={(emojiData) => {
                  setMessage((prev) => prev + emojiData.emoji);
                  setShowEmojiPicker(false);
                }}
                height={350}
                width={320}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HELPER TEXT */}
      <p className="text-xs text-slate-500 mt-2 text-center">
        Press <span className="font-semibold text-slate-400">Enter</span> to send,{" "}
        <span className="font-semibold text-slate-400">Shift+Enter</span> for new line
      </p>

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx"
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;
