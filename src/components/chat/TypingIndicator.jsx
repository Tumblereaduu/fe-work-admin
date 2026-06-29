import { motion } from "framer-motion";

const TypingIndicator = ({ typingUsers }) => {
  const userNames = Object.values(typingUsers);
  const displayText =
    userNames.length === 1
      ? `${userNames[0]} is typing`
      : userNames.length === 2
        ? `${userNames[0]} and ${userNames[1]} are typing`
        : `${userNames.slice(0, 2).join(", ")} and ${userNames.length - 2} more are typing`;

  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-4 py-3 bg-slate-800/40 border border-slate-700/30 rounded-lg w-fit"
    >
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            variants={dotVariants}
            animate="animate"
            transition={{ delay: i * 0.1 }}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
          />
        ))}
      </div>
      <span className="text-sm text-slate-300 font-medium">{displayText}</span>
    </motion.div>
  );
};

export default TypingIndicator;
