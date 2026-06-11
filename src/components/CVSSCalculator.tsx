/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Terminal, 
  Sliders, 
  Info, 
  Check, 
  AlertTriangle,
  Zap,
  Activity,
  Award
} from 'lucide-react';

interface CVSSCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (score: number, vectorStr: string) => void;
  initialScore?: number;
}

// Numerical mappings from CVSS v3.1 Specification Handbook
const AV_VALS: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.20 };
const AC_VALS: Record<string, number> = { L: 0.77, H: 0.44 };
const PR_VALS: Record<string, Record<string, number>> = {
  U: { N: 0.85, L: 0.62, H: 0.27 },
  C: { N: 0.85, L: 0.68, H: 0.50 }
};
const UI_VALS: Record<string, number> = { N: 0.85, R: 0.62 };
const C_VALS: Record<string, number> = { H: 0.56, L: 0.22, N: 0 };
const I_VALS: Record<string, number> = { H: 0.56, L: 0.22, N: 0 };
const A_VALS: Record<string, number> = { H: 0.56, L: 0.22, N: 0 };

export function calculateCVSS31(metrics: {
  av: string;
  ac: string;
  pr: string;
  ui: string;
  scope: string;
  c: string;
  i: string;
  a: string;
}): { score: number; exploitability: number; impact: number } {
  const av = AV_VALS[metrics.av] ?? 0.85;
  const ac = AC_VALS[metrics.ac] ?? 0.77;
  const scope = metrics.scope ?? 'U';
  const pr = PR_VALS[scope]?.[metrics.pr] ?? 0.85;
  const ui = UI_VALS[metrics.ui] ?? 0.85;
  const c = C_VALS[metrics.c] ?? 0.56;
  const i = I_VALS[metrics.i] ?? 0.56;
  const a = A_VALS[metrics.a] ?? 0.56;

  const exploitability = 8.22 * av * ac * pr * ui;
  const iscBase = 1 - (1 - c) * (1 - i) * (1 - a);
  
  let impact: number;
  if (scope === 'U') {
    impact = 6.42 * iscBase;
  } else {
    impact = 7.52 * (iscBase - 0.029) - 3.25 * Math.pow(Math.abs(iscBase - 0.02), 15);
  }

  if (impact <= 0) {
    return { score: 0, exploitability, impact: 0 };
  }

  let finalScore: number;
  if (scope === 'U') {
    finalScore = Math.min(impact + exploitability, 10);
  } else {
    finalScore = Math.min(1.08 * (impact + exploitability), 10);
  }

  // Round Up to 1 decimal place per CVSS 3.1 guidelines (exact float representation math)
  const rounded = Math.ceil(Math.round(finalScore * 1000) / 100) / 10;
  return {
    score: rounded,
    exploitability: Math.round(exploitability * 10) / 10,
    impact: Math.round(impact * 10) / 10
  };
}

interface CVSSMetricOption {
  code: string;
  label: string;
  desc: string;
  color: string;
}

interface CVSSMetricDefinition {
  key: 'av' | 'ac' | 'pr' | 'ui' | 'scope' | 'c' | 'i' | 'a';
  name: string;
  prefix: string;
  description: string;
  options: CVSSMetricOption[];
}

const METRIC_DEFS: CVSSMetricDefinition[] = [
  {
    key: 'av',
    name: 'Attack Vector (AV)',
    prefix: 'AV',
    description: 'Reflects the context by which vulnerability exploitation is possible.',
    options: [
      { code: 'N', label: 'Network', desc: 'Exploitable remotely over public network assets (e.g. general internet API).', color: 'bg-rose-500/15 text-rose-450 border-rose-550/30' },
      { code: 'A', label: 'Adjacent', desc: 'Exploitable over localized peer routing or shared physical/logical network subnets.', color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
      { code: 'L', label: 'Local', desc: 'Requires local server CLI console access or persistent operator shell interaction.', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
      { code: 'P', label: 'Physical', desc: 'Requires direct physical hardware tampering, USB port implants, or console wires.', color: 'bg-slate-800 text-slate-400 border-slate-700/60' },
    ]
  },
  {
    key: 'ac',
    name: 'Attack Complexity (AC)',
    prefix: 'AC',
    description: 'Describes the conditions beyond the attacker\'s control that must exist to exploit.',
    options: [
      { code: 'L', label: 'Low', desc: 'No special setup or race-conditions required. Highly reproducible results.', color: 'bg-rose-500/15 text-rose-450 border-rose-550/30' },
      { code: 'H', label: 'High', desc: 'Requires strict Timing Windows (race conditions), bypass of customized sandboxes, or user collusion.', color: 'bg-slate-800 text-slate-400 border-slate-700/60' },
    ]
  },
  {
    key: 'pr',
    name: 'Privileges Required (PR)',
    prefix: 'PR',
    description: 'The level of privileges an attacker must possess before triggering the vulnerability.',
    options: [
      { code: 'N', label: 'None', desc: 'Anonymous threat actors can exploit; zero authentication required.', color: 'bg-rose-500/15 text-rose-450 border-rose-550/30' },
      { code: 'L', label: 'Low', desc: 'Requires standard system user configurations (non-admin active tokens).', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
      { code: 'H', label: 'High', desc: 'Requires administrative privileges (root context, system credentials).', color: 'bg-slate-800 text-slate-400 border-slate-700/60' },
    ]
  },
  {
    key: 'ui',
    name: 'User Interaction (UI)',
    prefix: 'UI',
    description: 'Captures the requirement for a human operator to take some action.',
    options: [
      { code: 'N', label: 'None', desc: 'Fully automated shell triggered silently without any user action.', color: 'bg-rose-500/15 text-rose-450 border-rose-550/30' },
      { code: 'R', label: 'Required', desc: 'Victim must explicitly click triggers, authorize dialogs, or execute local scripts.', color: 'bg-slate-800 text-slate-400 border-slate-700/60' },
    ]
  },
  {
    key: 'scope',
    name: 'Scope (S)',
    prefix: 'S',
    description: 'Determines if the vulnerability results in changes to security authorities of other components.',
    options: [
      { code: 'U', label: 'Unchanged', desc: 'Vulnerability is strictly contained within the same sandbox environment context.', color: 'bg-slate-800 text-slate-400 border-slate-700/60' },
      { code: 'C', label: 'Changed', desc: 'Escalation possible that affects peer networks or adjacent microservice components.', color: 'bg-rose-500/15 text-rose-450 border-rose-550/30' },
    ]
  },
  {
    key: 'c',
    name: 'Confidentiality Impact (C)',
    prefix: 'C',
    description: 'Measures the impact on confidentiality of data processed by the affected component.',
    options: [
      { code: 'H', label: 'High', desc: 'Total info leak. Attacker can read all database files, memory states, or key files.', color: 'bg-rose-500/15 text-rose-450 border-rose-550/30' },
      { code: 'L', label: 'Low', desc: 'Partial read access allowed. Sensitive metadata or transient logs are exposed.', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
      { code: 'N', label: 'None', desc: 'Zero leak. No data reading capabilities achieved.', color: 'bg-slate-800 text-slate-400 border-slate-700/60' },
    ]
  },
  {
    key: 'i',
    name: 'Integrity Impact (I)',
    prefix: 'I',
    description: 'Measures the impact on integrity of data processed by the affected component.',
    options: [
      { code: 'H', label: 'High', desc: 'Total modification control. Overwrite any scripts, alter records, destroy data, or modify system logic.', color: 'bg-rose-500/15 text-rose-450 border-rose-550/30' },
      { code: 'L', label: 'Low', desc: 'Minor modifications permitted. Parameter tampering works but key databases stay intact.', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
      { code: 'N', label: 'None', desc: 'Immutable setup. Attacker cannot write or alter any server variables.', color: 'bg-slate-800 text-slate-400 border-slate-700/60' },
    ]
  },
  {
    key: 'a',
    name: 'Availability Impact (A)',
    prefix: 'A',
    description: 'Measures the impact on availability of the affected component (resource exhaustion, denial of service).',
    options: [
      { code: 'H', label: 'High', desc: 'Complete service shutdown. Causes memory exhaust crash or stops routing entirely.', color: 'bg-rose-500/15 text-rose-450 border-rose-550/30' },
      { code: 'L', label: 'Low', desc: 'Minor performance choking. Slow down of requests, but microservices remain active.', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
      { code: 'N', label: 'None', desc: 'Unimpacted channels. Operations stay active without performance changes.', color: 'bg-slate-800 text-slate-400 border-slate-700/60' },
    ]
  }
];

export default function CVSSCalculator({ isOpen, onClose, onApply }: CVSSCalculatorProps) {
  // Setup initial default metrics (loaded from localStorage if present, or using standard defaults)
  const [metrics, setMetrics] = useState(() => {
    const defaultMetrics = {
      av: 'N',
      ac: 'L',
      pr: 'N',
      ui: 'N',
      scope: 'U',
      c: 'H',
      i: 'H',
      a: 'H'
    };
    try {
      const stored = localStorage.getItem('vapt_soar_cvss_calculator_metrics');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate keys exist to prevent corruption errors
        if (parsed && typeof parsed === 'object') {
          return {
            av: parsed.av ?? 'N',
            ac: parsed.ac ?? 'L',
            pr: parsed.pr ?? 'N',
            ui: parsed.ui ?? 'N',
            scope: parsed.scope ?? 'U',
            c: parsed.c ?? 'H',
            i: parsed.i ?? 'H',
            a: parsed.a ?? 'H'
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load CVSS metrics from localStorage:', e);
    }
    return defaultMetrics;
  });

  // Persists chosen metrics in localStorage whenever they undergo modification
  useEffect(() => {
    try {
      localStorage.setItem('vapt_soar_cvss_calculator_metrics', JSON.stringify(metrics));
    } catch (e) {
      console.warn('Failed to save CVSS metrics to localStorage:', e);
    }
  }, [metrics]);

  const { score, exploitability, impact } = calculateCVSS31(metrics);

  const getSeverityStyle = (s: number) => {
    if (s >= 9.0) return { label: 'CRITICAL', text: 'text-rose-450', bg: 'bg-rose-500/10 border-rose-500/30', hex: '#f43f5e' };
    if (s >= 7.0) return { label: 'HIGH', text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', hex: '#fb923c' };
    if (s >= 4.0) return { label: 'MEDIUM', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', hex: '#fbbf24' };
    return { label: 'LOW', text: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', hex: '#818cf8' };
  };

  const sevInfo = getSeverityStyle(score);
  const vectorStr = `CVSS:3.1/AV:${metrics.av}/AC:${metrics.ac}/PR:${metrics.pr}/UI:${metrics.ui}/S:${metrics.scope}/C:${metrics.c}/I:${metrics.i}/A:${metrics.a}`;

  const setMetricValue = (key: keyof typeof metrics, value: string) => {
    setMetrics(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyPreset = (type: 'rce' | 'xss' | 'dos' | 'privesc') => {
    switch (type) {
      case 'rce':
        setMetrics({ av: 'N', ac: 'L', pr: 'N', ui: 'N', scope: 'C', c: 'H', i: 'H', a: 'H' }); // 10.0 Critical
        break;
      case 'xss':
        setMetrics({ av: 'N', ac: 'L', pr: 'N', ui: 'R', scope: 'C', c: 'L', i: 'L', a: 'N' }); // 6.1 Medium
        break;
      case 'dos':
        setMetrics({ av: 'N', ac: 'L', pr: 'N', ui: 'N', scope: 'U', c: 'N', i: 'N', a: 'H' }); // 7.5 High
        break;
      case 'privesc':
        setMetrics({ av: 'L', ac: 'L', pr: 'L', ui: 'N', scope: 'U', c: 'H', i: 'H', a: 'H' }); // 7.8 High
        break;
    }
  };

  // Close on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            id="cvss-calculator-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-cyber-dark/95 border border-cyber-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            id="cvss-calculator-modal"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyber-border/80 bg-cyber-black">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-md font-mono font-bold text-white uppercase tracking-tight flex items-center gap-2">
                    CVSS v3.1 Interactive Calculator
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">
                    Align vulnerability severity parameters according to FIRST.org standard metrics.
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 px-2 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-mono"
              >
                <span>Close</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Interactive Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Middle Column (Metric Controls) */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* Threat Presets Quick Bar */}
                <div className="bg-slate-900/30 border border-slate-800 p-3 rounded-xl flex flex-wrap gap-2 items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-indigo-400" /> Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => applyPreset('rce')}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer transition active:scale-95"
                    >
                      Remote Code Execution (10.0)
                    </button>
                    <button
                      onClick={() => applyPreset('dos')}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 cursor-pointer transition active:scale-95"
                    >
                      Denial of Service (7.5)
                    </button>
                    <button
                      onClick={() => applyPreset('privesc')}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 cursor-pointer transition active:scale-95"
                    >
                      Privilege Escalation (7.8)
                    </button>
                    <button
                      onClick={() => applyPreset('xss')}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 cursor-pointer transition active:scale-95"
                    >
                      Stored XSS Exploit (6.1)
                    </button>
                  </div>
                </div>

                {/* Metric Selectors definitions list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {METRIC_DEFS.map((met) => {
                    const selectedVal = metrics[met.key];
                    return (
                      <div 
                        key={met.key} 
                        className="bg-slate-900/20 border border-slate-900 rounded-xl p-3 flex flex-col gap-2.5 hover:border-slate-850 transition"
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 group relative">
                              <h4 className="text-[11px] font-bold text-slate-300 font-sans tracking-wide">
                                {met.name}
                              </h4>
                              <Info className="w-3 h-3 text-slate-500 hover:text-indigo-400 transition cursor-help" />
                              
                              {/* General Metric Tooltip Card popup on hover */}
                              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-40 w-72 p-3 bg-slate-950 border border-indigo-500/30 rounded-xl shadow-2xl text-left pointer-events-none">
                                <div className="text-[10px] font-mono font-bold text-indigo-400 mb-1 border-b border-indigo-950 pb-1 flex items-center gap-1">
                                  <Sliders className="w-3 h-3 text-indigo-400" /> {met.name} ({met.prefix})
                                </div>
                                <div className="text-[10px] font-sans text-slate-300 leading-normal mb-2 whitespace-normal font-normal">
                                  {met.description}
                                </div>
                                <div className="text-[9px] font-mono text-indigo-450 uppercase tracking-wider mb-1.5 font-bold">Metrics Level Definition Matrix:</div>
                                <div className="space-y-1.5">
                                  {met.options.map(opt => (
                                    <div key={opt.code} className="text-[9px] font-sans leading-relaxed whitespace-normal border-l border-slate-800 pl-1.5">
                                      <span className="font-mono text-indigo-400 font-extrabold">{opt.code} – {opt.label}: </span>
                                      <span className="text-slate-400">{opt.desc}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-950" />
                              </div>
                            </div>
                            
                            <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.25 rounded font-black">
                              {met.prefix}:{selectedVal}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans italic mt-0.5 line-clamp-1 truncate">
                            {met.description}
                          </p>
                        </div>

                        {/* Choice Segment block with individual option tooltips */}
                        <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-900">
                          {met.options.map((opt) => {
                            const isChosen = selectedVal === opt.code;
                            return (
                              <button
                                key={opt.code}
                                onClick={() => setMetricValue(met.key, opt.code)}
                                className={`group relative flex-1 text-center font-mono py-1 rounded-md text-[10px] font-medium border cursor-pointer select-none transition-all duration-150 active:scale-95 ${
                                  isChosen 
                                    ? `${opt.color} font-extrabold shadow-inner scale-[1.01] z-10` 
                                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-300 hover:bg-slate-900/35'
                                }`}
                              >
                                <span>{opt.code}</span>
                                
                                {/* Micro Tooltip for each specific level code */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-45 w-52 p-2 bg-slate-950 border border-slate-800 rounded-lg shadow-xl text-left pointer-events-none">
                                  <div className="text-[9.5px] font-mono font-black text-indigo-400 mb-0.5">
                                    {met.prefix}:{opt.code} – {opt.label}
                                  </div>
                                  <div className="text-[9px] font-sans text-slate-300 leading-normal whitespace-normal font-normal">
                                    {opt.desc}
                                  </div>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950" />
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation description of selected code */}
                        <div className="text-[9.5px] leading-relaxed text-slate-400/90 pl-2 border-l border-indigo-500/30 h-6 line-clamp-2 truncate">
                          {met.options.find(opt => opt.code === selectedVal)?.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Right Column (Dynamic Readout panel) */}
              <div className="lg:col-span-1 flex flex-col gap-4 bg-cyber-black p-4 rounded-xl border border-cyber-border/70 h-fit">
                
                <h4 className="text-[11.5px] font-bold font-mono text-indigo-300 uppercase tracking-widest border-b border-cyber-border pb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-400" /> Scoring Analytics
                </h4>

                {/* Giant Live Score Box */}
                <div className="flex flex-col items-center justify-center py-6 bg-slate-950 rounded-xl border border-slate-900 relative">
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>
                  
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Computed CVSS v3.1</span>
                  <span className={`text-4xl font-extrabold font-mono mt-2 flex items-baseline gap-1 animate-scaleUp ${sevInfo.text}`}>
                    {score.toFixed(1)}
                    <span className="text-xs text-slate-500 font-normal">/ 10</span>
                  </span>
                  
                  <span className={`text-[10px] font-mono px-3 py-1 rounded-full font-black border uppercase mt-3 tracking-wider ${sevInfo.bg}`}>
                    {sevInfo.label}
                  </span>
                </div>

                {/* Sub-computations */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-900 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Impact Score:</span>
                    <span className="text-white font-bold">{impact.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exploitability Score:</span>
                    <span className="text-white font-bold">{exploitability.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2 text-[11px]">
                    <span className="text-slate-400">Scope Escalation:</span>
                    <span className={metrics.scope === 'C' ? 'text-rose-400' : 'text-slate-500'}>
                      {metrics.scope === 'C' ? 'CHANGED (C)' : 'UNCHANGED (U)'}
                    </span>
                  </div>
                </div>

                {/* Vector string representation */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-indigo-400" /> Computed Vector String:
                  </span>
                  <div className="bg-slate-950 p-2 rounded border border-slate-900">
                    <code className="text-[9.5px] text-indigo-300 select-all font-mono tracking-wider break-all block">
                      {vectorStr}
                    </code>
                  </div>
                </div>

                {/* Call to Actions */}
                <div className="pt-2 flex flex-col gap-2">
                  {onApply && (
                    <button
                      onClick={() => {
                        onApply(score, vectorStr);
                        onClose();
                      }}
                      className="w-full text-xs font-mono bg-indigo-500 hover:bg-indigo-600 text-white font-bold uppercase tracking-wider py-2.5 rounded-lg transition-transform duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 border border-indigo-400/30"
                    >
                      <Zap className="w-3.5 h-3.5 text-yellow-300" /> Apply Base Severity
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full text-xs font-mono bg-transparent border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 py-2.5 rounded-lg transition"
                  >
                    Cancel Selection
                  </button>
                </div>

                {/* Explanatory note */}
                <p className="text-[9.5px] leading-relaxed text-slate-500 font-sans italic pt-1 border-t border-slate-900 mt-1">
                  * Applying this base severity score directly updates the risk scoring modulator equation in your live operations dashboard cockpit.
                </p>

              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
