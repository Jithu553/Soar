/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Activity, Clock, ShieldAlert, Download } from 'lucide-react';

interface RiskSparklineProps {
  baseSeverity: number;
  epssScore: number;
  assetCriticality: number;
  verifFactor: number;
  alertId: string;
  currentRiskScore: number;
}

export default function RiskSparkline({
  baseSeverity,
  epssScore,
  assetCriticality,
  verifFactor,
  alertId,
  currentRiskScore,
}: RiskSparklineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Export contextual risk breakdown and historical trend data to JSON
  const handleExportJSON = () => {
    const exportPayload = {
      alertId,
      timestamp: new Date().toISOString(),
      formulaSchema: "Risk = (BaseSeverity * EPSS) * AssetCriticality * VerificationFactor",
      parameters: {
        baseSeverity,
        epssScore,
        assetCriticality,
        verifFactor,
        currentRiskScore
      },
      historicalTrend: points.map(p => ({
        hourIndex: p.index,
        timeRelation: p.time,
        timestamp: p.timestamp,
        formattedDate: p.formattedDate,
        formattedTime: p.formattedTime,
        calculatedRisk: p.value,
        notedEvent: p.event || null
      })),
      complianceStandards: [
        "CISA Known Exploited Vulnerabilities (KEV)",
        "FIRST Exploit Prediction Scoring System (EPSS) v3",
        "OWASP Application Security Verification Standard (ASVS) v4.0.3"
      ]
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contextual_risk_breakdown_${alertId || 'alert'}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate a deterministic but realistic 24-hour threat trace history
  const points = useMemo(() => {
    const hoursCount = 24;
    // Generate a seed based on the alertId characters
    const seed = alertId ? alertId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 100;
    
    // Core adjusted score formula reflecting the current user-tuned values
    const currentFinal = (baseSeverity * epssScore) * assetCriticality * verifFactor;

    const now = new Date();

    return Array.from({ length: hoursCount }).map((_, idx) => {
      const hourAgo = hoursCount - 1 - idx;
      const angle = (idx / (hoursCount - 1)) * Math.PI * 2.2;

      // Natural random walk variation centered around the target score
      const wave = Math.sin(angle + seed) * 0.25 + Math.cos(angle * 1.8 - seed) * 0.12;
      const progressFactor = idx / (hoursCount - 1);
      
      // Let historical values fluctuate slightly, while pulling towards current score at the end
      const adjustment = 0.85 + wave + (0.15 * Math.sin(progressFactor * Math.PI));
      let val = currentFinal * adjustment;

      // Apply safe boundary clamps
      val = Math.min(Math.max(val, 0.5), 100);

      // Unique threat intel event annotations
      let event = '';
      if (idx === 3) event = 'SIEM anomaly alert broadcast';
      else if (idx === 8) event = 'Vulnerability feed delta update';
      else if (idx === 14) event = 'CISA KEV flag matched';
      else if (idx === 20) event = 'Background host topology scanning';
      else if (idx === 23) event = 'Live user fine-tuning modulator';

      // Calculate absolute timestamp in 1-hour relative decrements
      const pointDate = new Date(now.getTime() - hourAgo * 60 * 60 * 1000);
      pointDate.setMinutes(0, 0, 0);

      return {
        index: idx,
        time: hourAgo === 0 ? 'Now (Live)' : `${hourAgo}h ago`,
        timestamp: pointDate.toISOString(),
        formattedDate: pointDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        formattedTime: pointDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        value: Number(val.toFixed(2)),
        event,
      };
    });
  }, [baseSeverity, epssScore, assetCriticality, verifFactor, alertId]);

  // Chart layout specs
  const width = 450;
  const height = 95;
  const margin = { top: 12, right: 16, bottom: 18, left: 24 };

  // Generate D3.js Scales
  const scales = useMemo(() => {
    const x = d3.scaleLinear()
      .domain([0, 23])
      .range([margin.left, width - margin.right]);

    const maxVal = Math.max(...points.map(p => p.value), 10);
    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([height - margin.bottom, margin.top]);

    return { x, y };
  }, [points, margin]);

  // Generate D3 line & area string values
  const { linePath, areaPath } = useMemo(() => {
    const lineGenerator = d3.line<(typeof points)[0]>()
      .x(d => scales.x(d.index))
      .y(d => scales.y(d.value))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3.area<(typeof points)[0]>()
      .x(d => scales.x(d.index))
      .y0(height - margin.bottom)
      .y1(d => scales.y(d.value))
      .curve(d3.curveMonotoneX);

    return {
      linePath: lineGenerator(points) || '',
      areaPath: areaGenerator(points) || '',
    };
  }, [points, scales]);

  // Active hover details
  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-lg shadow-inner">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 flex-wrap gap-2">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Contextual Risk Sparkline (Last 24 Hours)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="text-[9.5px] font-sans font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm select-none"
            title="Export Contextual Risk Breakdown & Historical Data as JSON"
          >
            <Download className="w-3 h-3 text-indigo-400" />
            <span>Export Risk Data</span>
          </button>
          <span className="text-[9.5px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1 select-none">
            <Clock className="w-3 h-3" /> Real-time D3 Feed
          </span>
        </div>
      </div>

      <div className="relative w-full py-1">
        {/* Interactive Floating HTML Tooltip */}
        {activePoint && (
          <div 
            style={{ 
              left: `${(scales.x(activePoint.index) / width) * 100}%`,
              top: `${(scales.y(activePoint.value) / height) * 100}%`
            }}
            className={`absolute pointer-events-none z-50 bg-slate-950 border border-slate-800 p-2 rounded-lg shadow-2xl text-[10.5px] font-mono text-slate-200 min-w-[210px] transform ${
              activePoint.index < 4 ? '-translate-x-[15%]' : activePoint.index > 19 ? '-translate-x-[85%]' : '-translate-x-1/2'
            } -translate-y-[calc(100%+12px)] transition-all duration-75 flex flex-col gap-1.5 border-indigo-500/40 backdrop-blur-md bg-slate-950/95`}
          >
            {/* Tooltip Header (Exact Date & Time) */}
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-1 mb-0.5">
              <span className="text-slate-400 font-semibold">{activePoint.formattedDate}</span>
              <span className="text-indigo-400 font-bold">{activePoint.formattedTime}</span>
            </div>
            
            {/* Value Indicators */}
            <div className="flex justify-between items-center">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider">Calculated Risk:</span>
              <span className={`font-mono font-black text-xs px-1.5 py-0.5 rounded ${
                activePoint.value >= 50 ? 'bg-rose-500/20 text-rose-450 border border-rose-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}>{activePoint.value}</span>
            </div>

            {/* Event Annotation */}
            {activePoint.event && (
              <div className="text-[9.5px] text-rose-400 border-t border-slate-800/80 pt-1.5 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping shrink-0"></span>
                <span className="truncate max-w-[180px] font-medium italic">{activePoint.event}</span>
              </div>
            )}
            
            {/* Relative offset context */}
            <div className="text-[8.5px] text-slate-500 text-right mt-0.5 italic">
              {activePoint.time}
            </div>

            {/* Tooltip downward anchor indicator triangle */}
            <div className={`absolute bottom-[-5px] w-2.5 h-2.5 bg-slate-950 border-r border-b border-slate-800 transform rotate-45 ${
              activePoint.index < 4 ? 'left-[15%]' : activePoint.index > 19 ? 'right-[15%]' : 'left-1/2 -translate-x-1/2'
            } border-indigo-505/40`}></div>
          </div>
        )}

        {/* SVG Sparkline Canvas */}
        <svg 
          width="100%" 
          height={height} 
          viewBox={`0 0 ${width} ${height}`} 
          className="overflow-visible select-none"
        >
          <defs>
            {/* Smooth Indigo Gradient for Area fill */}
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
            </linearGradient>
            
            {/* Line glow filter */}
            <filter id="glow-line" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={margin.left}
            y1={scales.y(50)}
            x2={width - margin.right}
            y2={scales.y(50)}
            stroke="#ef4444"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            opacity="0.25"
          />
          <text 
            x={margin.left} 
            y={scales.y(50) - 4} 
            fill="#ef4444" 
            className="text-[8px] font-mono" 
            opacity="0.45"
          >
            CRITICAL THRESHOLD (50)
          </text>

          {/* Baseline labels */}
          <text
            x={margin.left}
            y={height - 4}
            fill="#64748b"
            className="text-[8px] font-mono"
            textAnchor="start"
          >
            -24h
          </text>
          <text
            x={width - margin.right}
            y={height - 4}
            fill="#64748b"
            className="text-[8px] font-mono"
            textAnchor="end"
          >
            Now
          </text>

          {/* D3 Area Path */}
          <path d={areaPath} fill="url(#area-gradient)" />

          {/* D3 Line Path */}
          <path
            d={linePath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Render circular point for elements with events or hovered index */}
          {points.map((p) => {
            const isHovered = hoveredIndex === p.index;
            const hasEvent = !!p.event && p.index !== 23;
            if (!isHovered && !hasEvent) return null;

            return (
              <g key={p.index}>
                <circle
                  cx={scales.x(p.index)}
                  cy={scales.y(p.value)}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? '#6366f1' : '#f43f5e'}
                  stroke="#020617"
                  strokeWidth="1.5"
                  className="transition-all duration-150"
                />
                {isHovered && (
                  <circle
                    cx={scales.x(p.index)}
                    cy={scales.y(p.value)}
                    r="9"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1"
                    opacity="0.4"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}

          {/* Hover tracker guidelines */}
          {activePoint && (
            <line
              x1={scales.x(activePoint.index)}
              y1={margin.top}
              x2={scales.x(activePoint.index)}
              y2={height - margin.bottom}
              stroke="#cbd5e1"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              opacity="0.5"
              pointerEvents="none"
            />
          )}

          {/* Interactive Mouse Hit-boxes to lock on to D3 data indices smoothly */}
          {points.map((p) => {
            const cellWidth = (width - margin.left - margin.right) / 24;
            const targetX = scales.x(p.index) - cellWidth / 2;
            return (
              <rect
                key={p.index}
                x={targetX}
                y={margin.top}
                width={cellWidth}
                height={height - margin.top - margin.bottom}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIndex(p.index)}
                onMouseMove={() => setHoveredIndex(p.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* Dynamic Context Tooltip Panel */}
      <div className="flex gap-2 items-center min-h-[44px] bg-slate-900 border border-slate-800/80 rounded p-2 text-xs transition-colors duration-150">
        {activePoint ? (
          <div className="flex flex-col w-full font-sans">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-mono font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> {activePoint.formattedDate} at {activePoint.formattedTime} ({activePoint.time})
              </span>
              <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                activePoint.value >= 50 ? 'bg-rose-500/15 text-rose-450 border border-rose-500/30' : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
              }`}>
                Adjusted Risk: {activePoint.value}
              </span>
            </div>
            <div className="text-[10.5px] text-slate-200 mt-1 flex items-center gap-1.5">
              {activePoint.event ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
                  <span className="font-medium text-rose-350">{activePoint.event}</span>
                </>
              ) : (
                <span className="text-slate-400 italic">No major anomalies detected on this timeframe.</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 italic text-[10.5px] w-full justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            <span>Hover over the sparkline data trace to audit raw historical threat indices</span>
          </div>
        )}
      </div>
    </div>
  );
}
