import { motion } from "framer-motion";

export default function KPICard({ icon: Icon, label, value, sub, neonColor, delay = 0 }) {
  const glowStyle = neonColor
    ? { boxShadow: `0 0 30px ${neonColor}12, 0 0 60px ${neonColor}06` }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl border border-slate-200/60 dark:border-white/[0.06]
                 bg-white/70 dark:bg-surface-2/60 backdrop-blur-xl
                 p-5 flex flex-col gap-3
                 hover:border-slate-300/60 dark:hover:border-white/[0.1]
                 transition-all duration-300"
      style={glowStyle}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center
                     bg-slate-100 dark:bg-white/[0.06]"
          style={neonColor ? { backgroundColor: `${neonColor}14` } : {}}
        >
          <Icon
            size={18}
            style={neonColor ? { color: neonColor } : {}}
            className={neonColor ? "" : "text-slate-500 dark:text-slate-400"}
          />
        </div>
        {sub && (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wide uppercase">
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          {value}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</p>
      </div>

      {neonColor && (
        <div
          className="absolute inset-x-0 bottom-0 h-px opacity-40"
          style={{ background: `linear-gradient(90deg, transparent, ${neonColor}, transparent)` }}
        />
      )}
    </motion.div>
  );
}
