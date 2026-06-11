/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Rss, 
  ExternalLink, 
  Calendar, 
  ShieldAlert, 
  Server, 
  TrendingUp, 
  CheckCircle, 
  Search,
  Globe,
  Binary,
  Cpu,
  Bookmark,
  AlertTriangle,
  X
} from 'lucide-react';
import { ThreatIntelligenceFeed, SecurityAlert, SecurityVulnerability } from '../types';

interface ThreatIntelligenceViewProps {
  threatFeeds: ThreatIntelligenceFeed[];
  activeAlert: SecurityAlert | undefined;
  vulnerabilities: SecurityVulnerability[];
}

export default function ThreatIntelligenceView({ 
  threatFeeds, 
  activeAlert,
  vulnerabilities
}: ThreatIntelligenceViewProps) {
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedFeed = threatFeeds.find(f => f.id === selectedFeedId);
  const matchedVulnerability = selectedFeed 
    ? vulnerabilities.find(v => v.cve === selectedFeed.cve) 
    : undefined;

  // Compute impact severity rating for each feed
  const getImpactColor = (confidence: number) => {
    if (confidence >= 95) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (confidence >= 80) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    return 'text-yellow-450 bg-yellow-400/10 border-yellow-400/25';
  };

  const getImpactLabel = (confidence: number) => {
    if (confidence >= 95) return 'Critical (High Threat)';
    if (confidence >= 80) return 'High Contextual Risk';
    return 'Medium Relevance';
  };

  // Filter feeds by search queries
  const filteredFeeds = threatFeeds.filter(feed => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      feed.id.toLowerCase().includes(q) ||
      feed.source.toLowerCase().includes(q) ||
      feed.indicator.toLowerCase().includes(q) ||
      feed.type.toLowerCase().includes(q) ||
      feed.malwareFamily.toLowerCase().includes(q) ||
      feed.cve.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-cyber-dark border border-cyber-border rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header section with icon and pulse */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-cyber-border gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Rss className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-white tracking-wider uppercase flex items-center gap-1.5">
              Live Threat Intelligence Feeds
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Contextualize active security events with updated CVE indicators and APT activity parameters.
            </p>
          </div>
        </div>

        {/* Search Input inline */}
        <div className="relative flex items-center bg-[#00040f] border border-cyber-border rounded-lg h-8 w-full sm:w-64">
          <Search className="w-3 h-3 text-slate-500 absolute left-2" />
          <input
            type="text"
            placeholder="Search feed source or CVE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full bg-transparent pl-7 pr-3 text-[11px] font-mono text-white placeholder-slate-500 outline-none focus:outline-none"
          />
        </div>
      </div>

      {/* Grid containing Feed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredFeeds.map((feed) => {
          const isRelatedToActive = activeAlert && (feed.cve === activeAlert.cve || activeAlert.logs.some(line => line.includes(feed.indicator)));
          
          return (
            <div 
              key={feed.id} 
              className={`bg-cyber-black p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
                isRelatedToActive 
                  ? 'border-rose-500/40 bg-rose-950/5 shadow-[0_0_12px_rgba(239,68,68,0.05)]' 
                  : 'border-cyber-border/80 hover:border-cyber-border hover:bg-cyber-gray/30'
              }`}
            >
              {/* Contextualize Ribbon banner */}
              {isRelatedToActive && (
                <div className="absolute top-0 right-0 bg-rose-500/15 border-l border-b border-rose-500/30 px-2 py-0.5 rounded-bl text-[8.5px] font-mono text-rose-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
                  <ShieldAlert className="w-2.5 h-2.5 animate-bounce" /> Match
                </div>
              )}

              {/* Feed Meta Row */}
              <div className="space-y-2.5 flex-1">
                <div className="flex justify-between items-center pr-14">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tight">{feed.source}</span>
                  <span className="text-[9px] text-[#cbd5e1] font-mono">{feed.observedDate}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5 group-hover:text-rose-400 transition-colors">
                    {feed.type}
                  </h4>
                  {/* Indicator preview block */}
                  <div className="bg-[#00040f] border border-cyber-border/40 p-2 rounded-md flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-500">Indicator:</span>
                    <span className="text-cyber-blue font-bold tracking-tight bg-cyber-blue/5 px-1.5 py-0.5 rounded border border-cyber-blue/10">
                      {feed.indicator}
                    </span>
                  </div>
                </div>

                {/* Impact Level indicator */}
                <div className="flex items-center justify-between text-[10px] pt-1.5">
                  <span className="text-slate-400 font-sans">Malware Group:</span>
                  <span className="font-mono text-white text-[10px] font-medium max-w-[150px] truncate">{feed.malwareFamily}</span>
                </div>

                {/* Impact classification badge */}
                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-slate-400 font-sans">Impact Degree:</span>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${getImpactColor(feed.confidence)}`}>
                    {getImpactLabel(feed.confidence)} ({feed.confidence}%)
                  </span>
                </div>
              </div>

              {/* Card CTA: Link to view full details (Opens local drawer/modal dynamically below) */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase">CVE Relation: <strong className="text-slate-350">{feed.cve}</strong></span>
                <button
                  onClick={() => setSelectedFeedId(feed.id)}
                  className="text-[10.5px] font-mono font-bold text-[#6366f1] group-hover:text-indigo-400 flex items-center gap-1 focus:outline-none transition-colors duration-150 py-1 px-2 rounded hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 active:scale-95"
                >
                  <span>Analyze details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Embedded Deep Analysis Modal Overlay */}
      {selectedFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-cyber-dark border border-cyber-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-left">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#6366f1]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-cyber-border">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#6366f1]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono text-white tracking-wider uppercase">Threat Feed Analysis</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedFeed.id} &bull; Received {selectedFeed.observedDate}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFeedId(null)}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white focus:outline-none transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content list */}
            <div className="space-y-3 font-sans text-xs max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              
              {/* Alert Matching Alert context warning */}
              {activeAlert && (selectedFeed.cve === activeAlert.cve || activeAlert.logs.some(line => line.includes(selectedFeed.indicator))) && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-rose-300">Active Incident Context Correlated!</span>
                    <span className="text-[11px] text-slate-350 leading-relaxed">
                      This threat intelligence feed matches critical indicators of the active incident <strong>{activeAlert.id} ({activeAlert.cve})</strong>. Perimeter defense adjustments are mandatory.
                    </span>
                  </div>
                </div>
              )}

              {/* Key Indicators Sheet */}
              <div className="space-y-1.5 bg-cyber-black p-3.5 rounded-xl border border-cyber-border/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-black uppercase tracking-wider">Feed Key Metrics</span>
                
                <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-sans">Source Node</span>
                    <strong className="text-white block mt-0.5">{selectedFeed.source}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Threat Category</span>
                    <strong className="text-white block mt-0.5">{selectedFeed.type}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-400 block font-sans">Observed Target IP / CVE</span>
                    <strong className="text-cyber-blue block mt-0.5 font-mono">{selectedFeed.indicator}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-400 block font-sans">Confidence Level</span>
                    <strong className="text-cyber-green block mt-0.5 font-mono">{selectedFeed.confidence}% Match</strong>
                  </div>
                </div>
              </div>

              {/* Affected CVE details */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Contextualized CVE Details</span>
                {matchedVulnerability ? (
                  <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-850 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <strong className="text-white">{matchedVulnerability.cve}</strong>
                      <span className="text-orange-400 font-mono font-bold">Severity: {matchedVulnerability.baseSeverity}</span>
                    </div>
                    <p className="text-[11px] text-slate-330 leading-relaxed font-sans">{matchedVulnerability.title}</p>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">{matchedVulnerability.description}</p>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic font-mono p-2.5 bg-[#00040f] border border-slate-905 rounded">
                    No matching global CVE entry registered for {selectedFeed.cve || "this feed"}.
                  </div>
                )}
              </div>

              {/* Malware group & Campaign notes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Malware & Host Vector Synopsis</span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  The host associated with the indicator <strong>{selectedFeed.indicator}</strong> correlates directly with campaign activities attributed to <strong>{selectedFeed.malwareFamily}</strong>. Highly recommended to configure ingress rules to drop telemetry traffic originating from or targeting this endpoint.
                </p>
              </div>

            </div>

            {/* Footer buttons row */}
            <div className="border-t border-cyber-border pt-4 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setSelectedFeedId(null)}
                className="px-4 py-2 text-xs font-semibold font-mono rounded-lg bg-cyber-black text-slate-350 border border-cyber-border hover:bg-slate-900 transition-all duration-150 cursor-pointer active:scale-95"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
