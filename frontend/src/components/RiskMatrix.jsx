import { useMemo } from "react";
import { motion } from "framer-motion";
import { assessUseCase, riskLevel } from "../utils/rules";

const LEVEL_NEON = {
  Low: "#39ff14",
  Medium: "#ffb800",
  High: "#ff6b2b",
  Critical: "#ff2d55",
};

function cellGradient(l, i) {
  const v = l * i;
  if (v <= 4) return "rgba(57,255,20,0.06)";
  if (v <= 10) return "rgba(255,184,0,0.06)";
  if (v <= 16) return "rgba(255,107,43,0.06)";
  return "rgba(255,45,85,0.06)";
}

export default function RiskMatrix({ useCases, risks }) {
  const matrix = useMemo(() => {
    const cells = {};
    for (let i = 1; i <= 5; i++)
      for (let l = 1; l <= 5; l++)
        cells[`${l}-${i}`] = { likelihood: l, impact: i, items: [] };

    useCases.forEach((uc) => {
      assessUseCase(uc, risks).forEach((a) => {
        const key = `${a.likelihood}-${a.impact}`;
        if (cells[key]) cells[key].items.push(a);
      });
    });
    return Object.values(cells);
  }, [useCases, risks]);

  const cellSize = 64;
  const pad = 48;
  const gridW = cellSize * 5;
  const gridH = cellSize * 5;
  const svgW = gridW + pad + 16;
  const svgH = gridH + pad + 16;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06]
                 bg-white/70 dark:bg-surface-2/60 backdrop-blur-xl p-5"
    >
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 tracking-tight">
        Matrice de Risques
      </h3>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full max-w-[480px] mx-auto"
          role="img"
          aria-label="Risk matrix"
        >
          <text
            x={12} y={pad + gridH / 2} textAnchor="middle"
            fill="#64748b" fontSize="10" fontWeight="600"
            transform={`rotate(-90 12 ${pad + gridH / 2})`}
          >
            Impact
          </text>
          <text
            x={pad + gridW / 2} y={svgH - 2} textAnchor="middle"
            fill="#64748b" fontSize="10" fontWeight="600"
          >
            Probabilite
          </text>

          {[1, 2, 3, 4, 5].map((v) => (
            <text key={`y${v}`} x={pad - 8} y={pad + (5 - v) * cellSize + cellSize / 2 + 4}
              textAnchor="end" fill="#64748b" fontSize="10">{v}</text>
          ))}
          {[1, 2, 3, 4, 5].map((v) => (
            <text key={`x${v}`} x={pad + (v - 1) * cellSize + cellSize / 2} y={pad + gridH + 16}
              textAnchor="middle" fill="#64748b" fontSize="10">{v}</text>
          ))}

          {matrix.map(({ likelihood: l, impact: i, items }) => {
            const x = pad + (l - 1) * cellSize;
            const y = pad + (5 - i) * cellSize;
            const count = items.length;
            const maxScore = count ? Math.max(...items.map((a) => a.score)) : 0;
            const level = riskLevel(maxScore);
            const neon = LEVEL_NEON[level] || "#64748b";

            return (
              <g key={`${l}-${i}`}>
                <rect
                  x={x} y={y} width={cellSize} height={cellSize}
                  fill={cellGradient(l, i)}
                  stroke="rgba(148,163,184,0.12)"
                  strokeWidth="0.5" rx="6"
                />
                {count > 0 && (
                  <>
                    <circle
                      cx={x + cellSize / 2} cy={y + cellSize / 2}
                      r={Math.min(8 + count * 5, cellSize / 2 - 4)}
                      fill={neon} opacity={0.8}
                    />
                    <circle
                      cx={x + cellSize / 2} cy={y + cellSize / 2}
                      r={Math.min(8 + count * 5, cellSize / 2 - 4) + 4}
                      fill="none" stroke={neon} strokeWidth="1" opacity={0.3}
                    />
                    <text
                      x={x + cellSize / 2} y={y + cellSize / 2 + 4}
                      textAnchor="middle" fill="white" fontSize="11" fontWeight="700"
                    >
                      {count}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </motion.div>
  );
}
