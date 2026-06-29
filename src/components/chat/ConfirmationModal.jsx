import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX } from "react-icons/fi";

const ConfirmationModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
          >
            {/* HEADER */}
            <div className="p-6 border-b border-slate-700/50 flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {isDangerous && (
                  <div className="p-2 rounded-lg bg-red-500/20 flex-shrink-0 mt-0.5">
                    <FiAlertTriangle className="text-red-400 text-lg" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                </div>
              </div>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6">
              <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
            </div>

            {/* ACTIONS */}
            <div className="p-6 border-t border-slate-700/50 flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                disabled={isLoading}
                className={`
                  px-4 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    isDangerous
                      ? "bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-red-500/30"
                      : "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/30"
                  }
                `}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  confirmText
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
