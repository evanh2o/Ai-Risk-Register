import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useLocalStorage from "./hooks/useLocalStorage";
import { SEED_USE_CASES, SEED_RISKS, SEED_CONTROLS } from "./data/seed";
import { buildControlMap, buildRiskMap } from "./utils/rules";

import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";
import Dashboard from "./components/Dashboard";
import RiskTable from "./components/RiskTable";
import RiskForm from "./components/RiskForm";
import RiskDetailDrawer from "./components/RiskDetailDrawer";
import AIActClassification from "./components/AIActClassification";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  registry: "Registre des Systemes IA",
  add: "Nouveau Systeme IA",
  classification: "Classification AI Act",
};

const pageTransition = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export default function App() {
  const [dark, setDark] = useLocalStorage("theme-dark", true);
  const toggleTheme = useCallback(() => setDark((d) => !d), [setDark]);

  if (dark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");

  const [collapsed, setCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const [page, setPage] = useState("dashboard");

  const [useCases, setUseCases] = useLocalStorage("data-usecases", SEED_USE_CASES);
  const [risks, setRisks] = useLocalStorage("data-risks", SEED_RISKS);
  const [controls] = useLocalStorage("data-controls", SEED_CONTROLS);

  const controlMap = useMemo(() => buildControlMap(controls), [controls]);
  const riskMap = useMemo(() => buildRiskMap(risks), [risks]);

  const [drawerSystem, setDrawerSystem] = useState(null);
  const [editingSystem, setEditingSystem] = useState(null);

  const handleOpenDetail = useCallback((uc) => setDrawerSystem(uc), []);
  const handleCloseDrawer = useCallback(() => setDrawerSystem(null), []);

  const handleEdit = useCallback((uc) => {
    setEditingSystem(uc);
    setPage("add");
  }, []);

  const handleAddOrUpdate = useCallback(
    (system) => {
      setUseCases((prev) => {
        const idx = prev.findIndex((u) => u.id === system.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = system;
          return next;
        }
        return [...prev, system];
      });
      setEditingSystem(null);
      setPage("registry");
    },
    [setUseCases],
  );

  const handleDelete = useCallback(
    (id) => setUseCases((prev) => prev.filter((u) => u.id !== id)),
    [setUseCases],
  );

  const handleAddRisk = useCallback(
    (risk) => setRisks((prev) => [...prev, risk]),
    [setRisks],
  );

  const handleUpdateClassification = useCallback(
    (ucId, classification) => {
      setUseCases((prev) =>
        prev.map((u) => (u.id === ucId ? { ...u, ai_act_class: classification } : u)),
      );
    },
    [setUseCases],
  );

  const title = page === "add" && editingSystem
    ? `Modifier ${editingSystem.id}`
    : PAGE_TITLES[page];

  return (
    <div className="min-h-screen bg-mesh text-slate-900 dark:text-slate-100">
      <Sidebar
        page={page}
        onNavigate={(p) => { setPage(p); if (p !== "add") setEditingSystem(null); }}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <div className={`transition-all duration-300 ease-out ${collapsed ? "ml-[68px]" : "ml-[260px]"}`}>
        <header className="sticky top-0 z-30 glass border-b border-slate-200/60 dark:border-white/[0.06]">
          <div className="flex items-center justify-between px-8 h-16">
            <motion.h1
              key={title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg font-semibold tracking-tight text-slate-800 dark:text-white"
            >
              {title}
            </motion.h1>
            <ThemeToggle dark={dark} onToggle={toggleTheme} />
          </div>
        </header>

        <main className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={page} {...pageTransition}>
              {page === "dashboard" && (
                <Dashboard
                  useCases={useCases}
                  risks={risks}
                  controls={controls}
                  controlMap={controlMap}
                  riskMap={riskMap}
                  onViewSystem={handleOpenDetail}
                />
              )}

              {page === "registry" && (
                <RiskTable
                  useCases={useCases}
                  risks={risks}
                  riskMap={riskMap}
                  controlMap={controlMap}
                  onView={handleOpenDetail}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {page === "add" && (
                <RiskForm
                  useCases={useCases}
                  risks={risks}
                  controls={controls}
                  editing={editingSystem}
                  onSave={handleAddOrUpdate}
                  onCancel={() => { setEditingSystem(null); setPage("registry"); }}
                />
              )}

              {page === "classification" && (
                <AIActClassification
                  useCases={useCases}
                  risks={risks}
                  controlMap={controlMap}
                  onClassify={handleUpdateClassification}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {drawerSystem && (
          <RiskDetailDrawer
            system={drawerSystem}
            risks={risks}
            controlMap={controlMap}
            riskMap={riskMap}
            onClose={handleCloseDrawer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
