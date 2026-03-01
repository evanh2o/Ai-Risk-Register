import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl
                 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1]
                 border border-slate-200/60 dark:border-white/[0.06]
                 transition-all duration-200"
      aria-label="Toggle theme"
    >
      <motion.div
        key={dark ? "dark" : "light"}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.2 }}
      >
        {dark ? (
          <Sun size={15} className="text-amber-400" />
        ) : (
          <Moon size={15} className="text-slate-600" />
        )}
      </motion.div>
    </button>
  );
}
