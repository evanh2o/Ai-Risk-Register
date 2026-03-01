import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Server,
  AlertTriangle,
  Gauge,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import {
  assessUseCase,
  RISK_LEVEL_CONFIG,
  AI_ACT_CLASSES,
} from "../utils/rules";
import KPICard from "./KPICard";
import RiskMatrix from "./RiskMatrix";

const NEON = {
  green: "#39ff14",
  cyan: "#00f0ff",
  red: "#ff2d55",
  orange: "#ff6b2b",
  amber: "#ffb800",
  violet: "#8b5cf6",
};

const LEVEL_NEON = {
  Low: "#39ff14",
  Medium: "#ffb800",
  High: "#ff6b2b",
  Critical: "#ff2d55",
};

const ACT_NEON = {
  PROHIBITED: "#ff2d55",
  HIGH_RISK: "#ff6b2b",
  LIMITED_RISK: "#ffb800",
  MINIMAL_RISK: "#39ff14",
  NOT_CLASSIFIED: "#64748b",
};

function ChartCard({ title, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border border-slate-200/60 dark:border-white/[0.06]
                  bg-white/70 dark:bg-surface-2/60 backdrop-blur-xl p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 tracking-tight">
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-surface-1/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Dashboard({
  useCases,
  risks,
  controls,
  controlMap,
  riskMap,
  onViewSystem,
}) {
  const stats = useMemo(() => {
    const allAssessments = useCases.flatMap((uc) => assessUseCase(uc, risks));
    const highRiskCount = useCases.filter(
      (uc) => uc.ai_act_class === "HIGH_RISK" || uc.ai_act_class === "PROHIBITED",
    ).length;
    const pctHighRisk = useCases.length
      ? Math.round((highRiskCount / useCases.length) * 100)
      : 0;
    const avgScore = allAssessments.length
      ? Math.round(allAssessments.reduce((s, a) => s + a.score, 0) / allAssessments.length)
      : 0;
    const criticalCount = allAssessments.filter(
      (a) => a.level === "Critical" || a.level === "High",
    ).length;

    const levelDist = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    allAssessments.forEach((a) => { levelDist[a.level] = (levelDist[a.level] || 0) + 1; });

    const actDist = {};
    useCases.forEach((uc) => {
      const cls = uc.ai_act_class || "NOT_CLASSIFIED";
      actDist[cls] = (actDist[cls] || 0) + 1;
    });

    const categoryDist = {};
    allAssessments.forEach((a) => {
      const risk = riskMap[a.risk_id];
      if (risk) {
        categoryDist[risk.category] = (categoryDist[risk.category] || 0) + 1;
      }
    });

    return { total: useCases.length, pctHighRisk, avgScore, criticalCount, levelDist, actDist, categoryDist, allAssessments };
  }, [useCases, risks, riskMap]);

  const barData = useMemo(
    () => ["Critical", "High", "Medium", "Low"].map((level) => ({
      name: level,
      count: stats.levelDist[level] || 0,
      fill: LEVEL_NEON[level],
    })),
    [stats.levelDist],
  );

  const pieData = useMemo(
    () => Object.entries(stats.actDist).map(([key, value]) => ({
      name: AI_ACT_CLASSES[key]?.label ?? "Non classifie",
      value,
      color: ACT_NEON[key] || "#64748b",
    })),
    [stats.actDist],
  );

  const radarData = useMemo(
    () => Object.entries(stats.categoryDist).map(([key, value]) => ({
      category: key.charAt(0).toUpperCase() + key.slice(1),
      count: value,
    })),
    [stats.categoryDist],
  );

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard icon={Server} label="Total Systemes IA" value={stats.total} sub="registres" neonColor={NEON.cyan} delay={0} />
        <KPICard icon={AlertTriangle} label="% Haut Risque" value={`${stats.pctHighRisk}%`} sub="AI Act" neonColor={NEON.orange} delay={0.05} />
        <KPICard icon={Gauge} label="Score Moyen" value={stats.avgScore} sub="/ 125" neonColor={NEON.amber} delay={0.1} />
        <KPICard icon={ClipboardCheck} label="Actions Requises" value={stats.criticalCount} sub="Haut + Critique" neonColor={NEON.red} delay={0.15} />
      </div>

      {/* Charts Row: Matrix + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskMatrix useCases={useCases} risks={risks} />

        <ChartCard title="Distribution par Severite">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
              <Bar dataKey="count" name="Evaluations" radius={[0, 6, 6, 0]} barSize={20}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row: Pie + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Classification AI Act">
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Risques par Categorie">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="rgba(148,163,184,0.12)" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Radar
                  name="Evaluations"
                  dataKey="count"
                  stroke={NEON.violet}
                  fill={NEON.violet}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
              Aucune donnee
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top Risks Table */}
      <ChartCard title="Top Risques Critiques">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.04]">
                <th className="pb-3">Systeme</th>
                <th className="pb-3">Risque</th>
                <th className="pb-3">Categorie</th>
                <th className="pb-3 text-right">Score</th>
                <th className="pb-3 text-center">Niveau</th>
              </tr>
            </thead>
            <tbody>
              {stats.allAssessments
                .sort((a, b) => b.score - a.score)
                .slice(0, 8)
                .map((a, idx) => {
                  const risk = riskMap[a.risk_id];
                  const uc = useCases.find((u) => u.id === a.usecase_id);
                  return (
                    <motion.tr
                      key={`${a.usecase_id}-${a.risk_id}-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => uc && onViewSystem(uc)}
                    >
                      <td className="py-3 font-medium text-slate-700 dark:text-slate-200">
                        {uc?.name ?? a.usecase_id}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {risk?.name ?? a.risk_id}
                      </td>
                      <td className="py-3 capitalize text-slate-400">
                        {risk?.category}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-800 dark:text-white">
                        {a.score}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide"
                          style={{
                            backgroundColor: `${LEVEL_NEON[a.level]}14`,
                            color: LEVEL_NEON[a.level],
                            boxShadow: `0 0 12px ${LEVEL_NEON[a.level]}15`,
                          }}
                        >
                          {a.level}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
