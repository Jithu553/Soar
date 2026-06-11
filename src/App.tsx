/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Shield, 
  AlertTriangle, 
  Layers, 
  Terminal, 
  Sliders, 
  Play, 
  Bug, 
  RefreshCw, 
  Compass, 
  Database, 
  Cpu, 
  MessageSquare, 
  TrendingUp,
  Server,
  Zap,
  CheckCircle2,
  ListRestart,
  FileSpreadsheet,
  FileDown,
  Search,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  Move,
  Maximize
} from 'lucide-react';
import { SecurityAlert, SecurityAsset, SecurityVulnerability, ThreatIntelligenceFeed, AuditLog, SecurityRole, SecurityUser } from './types';
import DocumentationHub from './components/DocumentationHub';
import RiskSparkline from './components/RiskSparkline';
import AuditLogsView from './components/AuditLogsView';
import VulnerabilityDetailsDrawer from './components/VulnerabilityDetailsDrawer';
import CVSSCalculator, { calculateCVSS31 } from './components/CVSSCalculator';
import { exportAlertToPDF } from './utils/pdfExport';
import VulnerabilityComparisonView from './components/VulnerabilityComparisonView';
import ThreatIntelligenceView from './components/ThreatIntelligenceView';
import LoginPage from './components/LoginPage';
import { LogOut, Lock, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ops' | 'graph' | 'logs' | 'blueprints'>('ops');
  const [opsSubTab, setOpsSubTab] = useState<'modulator' | 'vulnerabilities' | 'intel'>('modulator');
  
  // RBAC User Session State
  const [currentUser, setCurrentUser] = useState<SecurityUser | null>(() => {
    try {
      const stored = localStorage.getItem('vapt_soar_user_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Access Control block popup explanation feedback state
  const [rbacBlockade, setRbacBlockade] = useState<{
    action: string;
    requiredClearance: string;
    currentRole: string;
  } | null>(null);
  
  // Data State
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [assets, setAssets] = useState<SecurityAsset[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [threatFeeds, setThreatFeeds] = useState<ThreatIntelligenceFeed[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Interaction State
  const [selectedAlertId, setSelectedAlertId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isExecutingPlaybook, setIsExecutingPlaybook] = useState<boolean>(false);
  const [isVulnDrawerOpen, setIsVulnDrawerOpen] = useState<boolean>(false);
  const [isCVSSCalcOpen, setIsCVSSCalcOpen] = useState<boolean>(false);
  const [alertsSearchQuery, setAlertsSearchQuery] = useState<string>('');
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // Manual Risk Modulator States (loads calculated CVSS score from localStorage if present)
  const [baseSeverity, setBaseSeverity] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('vapt_soar_cvss_calculator_metrics');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          const metrics = {
            av: parsed.av ?? 'N',
            ac: parsed.ac ?? 'L',
            pr: parsed.pr ?? 'N',
            ui: parsed.ui ?? 'N',
            scope: parsed.scope ?? 'U',
            c: parsed.c ?? 'H',
            i: parsed.i ?? 'H',
            a: parsed.a ?? 'H'
          };
          const calc = calculateCVSS31(metrics);
          return calc.score;
        }
      }
    } catch (e) {
      console.warn('Failed to compute initial baseSeverity from stored CVSS metrics:', e);
    }
    return 7.5;
  });
  const [epssScore, setEpssScore] = useState<number>(0.5);
  const [assetCriticality, setAssetCriticality] = useState<number>(2.5);
  const [verifFactor, setVerifFactor] = useState<number>(1.0); // 0.1, 1.0, 2.0
  const [modRiskResult, setModRiskResult] = useState<number>(9.38);

  // Copilot Chat States
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Operational environment loaded. Select an active SIEM alert on the left dashboard to generate a custom context-aware security remediation plan, or ask me specific defensive architectural questions!' }
  ]);
  const [isCopilotTyping, setIsCopilotTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Draggable Node Positions state for Topological Graph
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({
    "ASSET-001": { x: 220, y: 200 },
    "ASSET-002": { x: 540, y: 180 },
    "ASSET-003": { x: 380, y: 80 },
    "ASSET-004": { x: 580, y: 320 },
    "ASSET-005": { x: 380, y: 320 }
  });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, any> | null>(null);

  // Detailed Interactive Graph Framework States
  const [selectedGraphAssetId, setSelectedGraphAssetId] = useState<string | null>("ASSET-001");
  const [graphEnvFilter, setGraphEnvFilter] = useState<'All' | 'Production' | 'Development'>('All');
  const [graphMitigationMode, setGraphMitigationMode] = useState<'standard' | 'threat-path' | 'attack-simulation'>('attack-simulation');
  
  // Tactical simulator overrides
  const [isolatedAssets, setIsolatedAssets] = useState<Record<string, boolean>>({});
  const [shieldedAssets, setShieldedAssets] = useState<Record<string, boolean>>({});
  const [patchedAssets, setPatchedAssets] = useState<Record<string, boolean>>({});

  // Bind D3 Drag and Zoom Behaviors to SVG and node elements
  useEffect(() => {
    if (activeTab !== 'graph' || !svgRef.current) return;

    const svgElement = d3.select<SVGSVGElement, any>(svgRef.current);

    // Instantiate and bind Zoom/Pan Behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, any>()
      .scaleExtent([0.3, 4.0]) // clamp zoom level between 30% and 400%
      .on('zoom', (event) => {
        svgElement.select('.zoom-content-container').attr('transform', event.transform.toString());
      });

    svgElement.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    // Instantiate and bind Drag Behavior
    const dragBehavior = d3.drag<SVGGElement, any>()
      .on('start', function() {
        d3.select(this).raise(); // Bring node to front of other elements
      })
      .on('drag', function(event) {
        const nodeId = d3.select(this).attr('data-node-id');
        if (nodeId) {
          // Keep node positions gracefully bound inside the 800 x 400 SVG landscape with boundaries
          const newX = Math.max(35, Math.min(765, event.x));
          const newY = Math.max(35, Math.min(365, event.y));
          setNodePositions(prev => ({
            ...prev,
            [nodeId]: { x: newX, y: newY }
          }));
        }
      });

    svgElement.selectAll<SVGGElement, any>('g.node-group').call(dragBehavior);

    // Disable default double-click zoom to avoid conflicting with double clicking element actions
    svgElement.on('dblclick.zoom', null);

  }, [activeTab, alerts, vulnerabilities]); // Depend on alerts/vulnerabilities to capture freshly rendered SVG groups upon state polling

  // Programmatic Zoom & Pan Control actions
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select<SVGSVGElement, any>(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select<SVGSVGElement, any>(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleZoomReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select<SVGSVGElement, any>(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const handleCenterGraph = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const positions = Object.values(nodePositions) as { x: number; y: number }[];
    if (positions.length === 0) return;

    let xMin = Math.min(...positions.map(p => p.x));
    let xMax = Math.max(...positions.map(p => p.x));
    let yMin = Math.min(...positions.map(p => p.y));
    let yMax = Math.max(...positions.map(p => p.y));

    // Pad constraints to avoid node parts from being clipped
    const padding = 65;
    xMin -= padding;
    xMax += padding;
    yMin -= padding;
    yMax += padding;

    const bWidth = xMax - xMin;
    const bHeight = yMax - yMin;

    const bCenterX = (xMin + xMax) / 2;
    const bCenterY = (yMin + yMax) / 2;

    const width = 800;
    const height = 400;

    let scale = Math.min(width / bWidth, height / bHeight);
    scale = Math.max(0.35, Math.min(2.5, scale));

    const tx = (width / 2) - bCenterX * scale;
    const ty = (height / 2) - bCenterY * scale;

    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

    d3.select<SVGSVGElement, any>(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomBehaviorRef.current.transform, transform);
  };

  // Interval polling to simulate dynamic server-side background state modifications
  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      fetchAlertsProgress();
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Sync manual calculator result when slide values change
  useEffect(() => {
    const score = (baseSeverity * epssScore) * assetCriticality * verifFactor;
    setModRiskResult(Math.round(score * 100) / 100);
  }, [baseSeverity, epssScore, assetCriticality, verifFactor]);

  // Load selected alert properties into the physical calculator on clicking it
  const activeAlert = alerts.find(a => a.id === selectedAlertId) || alerts[0];
  useEffect(() => {
    if (activeAlert) {
      setBaseSeverity(activeAlert.baseScore);
      // find vulnerability
      const matchedVuln = vulnerabilities.find(v => v.cve === activeAlert.cve);
      if (matchedVuln) {
        setEpssScore(matchedVuln.epssScore);
      }
      // find asset
      const matchedAsset = assets.find(a => a.id === activeAlert.targetAssetId);
      if (matchedAsset) {
        setAssetCriticality(matchedAsset.criticality);
      }
      // find factor
      const factorMap: Record<string, number> = {
        'Unverified': 1.0,
        'Vulnerable': 2.0,
        'Mitigated': 0.1,
        'Not Vulnerable': 0.1
      };
      setVerifFactor(factorMap[activeAlert.verificationStatus] || 1.0);
    }
  }, [selectedAlertId, alerts, vulnerabilities, assets]);

  // Render helper for the inline mini trend sparkline indicator on asset nodes (over the last hour)
  const renderAssetNodeSparkline = (assetId: string, sparklineY = 62) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return null;

    // Calculate current risk score
    const assetAlerts = alerts.filter(a => a.targetAssetId === asset.id);
    const hasAlerts = assetAlerts.length > 0;
    
    // Calculate current risk metrics
    let maxBaseScore = 2.0;
    let epss = 0.2;
    let vf = 1.0;

    if (hasAlerts) {
      const maxAlert = assetAlerts.reduce((prev, curr) => (curr.baseScore > prev.baseScore) ? curr : prev, assetAlerts[0]);
      maxBaseScore = maxAlert.baseScore;
      const matchedVuln = vulnerabilities.find(v => v.cve === maxAlert.cve);
      epss = matchedVuln ? matchedVuln.epssScore : 0.2;
      
      if (maxAlert.verificationStatus === 'Vulnerable') vf = 2.0;
      else if (maxAlert.verificationStatus === 'Mitigated' || maxAlert.verificationStatus === 'Not Vulnerable') vf = 0.1;
      else if (maxAlert.status === 'Remediated') vf = 0.05;
    }

    // Dynamic slider state binding if active
    if (activeAlert && activeAlert.targetAssetId === asset.id) {
      maxBaseScore = baseSeverity;
      epss = epssScore;
      vf = verifFactor;
    }

    const currentRisk = Number(Math.min(Math.max((maxBaseScore * epss) * asset.criticality * vf, 0.1), 100).toFixed(1));

    // Generate deterministic trend values over 1 hour (7 points) reflecting recent hourly walk
    const pointsCount = 7;
    const seed = asset.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const trend = Array.from({ length: pointsCount }).map((_, idx) => {
      if (idx === pointsCount - 1) return currentRisk;
      const factor = idx / (pointsCount - 1);
      const angle = factor * Math.PI * 4;
      const wave = Math.sin(angle + seed) * 0.15 + Math.cos(angle * 1.5 - seed) * 0.08;
      const adjustment = 0.95 + wave;
      return Number(Math.min(Math.max(currentRisk * adjustment, 0.1), 100).toFixed(1));
    });

    // percentage change calculations
    const firstVal = trend[0];
    const lastVal = trend[trend.length - 1];
    const diff = lastVal - firstVal;
    const pct = firstVal > 0 ? (diff / firstVal) * 100 : 0;
    
    const changeStr = pct > 0.5 
      ? `+${pct.toFixed(0)}%` 
      : pct < -0.5 
        ? `${pct.toFixed(0)}%` 
        : '0%';
    
    const trendColor = pct > 0.5 
      ? '#f43f5e' // red (increasing risk)
      : pct < -0.5 
        ? '#10b981' // green (decreasing risk)
        : '#94a3b8'; // gray

    // Map trend points to local SVG coordinates
    const w = 60;
    const h = 14;
    const maxVal = Math.max(...trend, 5);
    const minVal = Math.min(...trend, 0);
    const r = (maxVal - minVal) || 1;

    const pathPoints = trend.map((v, idx) => {
      const xPos = idx * (w / (trend.length - 1));
      const yPos = h - ((v - minVal) / r) * h;
      return `${xPos.toFixed(1)},${yPos.toFixed(1)}`;
    });

    const pathD = `M ${pathPoints.join(' L ')}`;

    return (
      <g transform={`translate(-30, ${sparklineY})`}>
        {/* Sparkline Container Box with background */}
        <rect 
          width="60" 
          height="14" 
          rx="3" 
          fill="#020617" 
          stroke="#1e293b" 
          strokeWidth="0.5" 
          opacity="0.9" 
        />
        
        {/* Trend Area light shading */}
        <path
          d={`${pathD} L 60,14 L 0,14 Z`}
          fill={trendColor}
          opacity="0.06"
        />

        {/* Dynamic Trend Line */}
        <path
          d={pathD}
          fill="none"
          stroke={trendColor}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start dot marker */}
        <circle cx="0" cy={h - ((trend[0] - minVal) / r) * h} r="1.5" fill={trendColor} />
        {/* End dot marker */}
        <circle cx="60" cy={h - ((trend[trend.length - 1] - minVal) / r) * h} r="1.5" fill={trendColor} />

        {/* Real-time Indicator label overlay */}
        <text x="3" y="10" fill="#475569" className="text-[6px] font-mono select-none" pointerEvents="none">1h</text>
        <text 
          x="57" 
          y="10" 
          fill={trendColor} 
          className="text-[6.5px] font-mono font-bold select-none" 
          textAnchor="end"
          pointerEvents="none"
        >
          {changeStr}
        </text>

        {/* Hover status text on node group wrapper */}
        <title>{`Risk: ${currentRisk} (1h change: ${changeStr})`}</title>
      </g>
    );
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isCopilotTyping]);

  const fetchData = async () => {
    try {
      const [alertsRes, assetsRes, vulnsRes, feedsRes, logsRes] = await Promise.all([
        fetch('/api/alerts'),
        fetch('/api/assets'),
        fetch('/api/vulnerabilities'),
        fetch('/api/threat-intel'),
        fetch('/api/audit-logs')
      ]);

      const alertsData = await alertsRes.json();
      const assetsData = await assetsRes.json();
      const vulnsData = await vulnsRes.json();
      const feedsData = await feedsRes.json();
      const logsData = await logsRes.json();

      setAlerts(alertsData);
      setAssets(assetsData);
      setVulnerabilities(vulnsData);
      setThreatFeeds(feedsData);
      setAuditLogs(logsData);

      if (alertsData.length > 0 && !selectedAlertId) {
        setSelectedAlertId(alertsData[0].id);
      }
    } catch (e) {
      console.error("Failed to load initial data feeds from Express API:", e);
    }
  };

  const fetchAlertsProgress = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data);
      
      // Update local loading states based on current server-side simulation progress
      const active = data.find((a: SecurityAlert) => a.id === selectedAlertId);
      if (active) {
        setIsScanning(active.status === "Scanning");
        setIsExecutingPlaybook(active.playbookState?.status === "running");
      }

      // Also grab latest audit logs updating
      const logsRes = await fetch('/api/audit-logs');
      const logsData = await logsRes.json();
      setAuditLogs(logsData);
    } catch (e) {
      // Background silent error tolerated during active modifications
    }
  };

  // Helper to ensure role permission is met. Returns false if blocked, showing the roadblock popup
  const checkPermission = (actionName: string, allowedRoles: SecurityRole[]): boolean => {
    if (!currentUser) return false;
    if (allowedRoles.includes(currentUser.role)) {
      return true;
    }
    
    // Set blockade popup details
    let reqLevel = 'LEVEL 5 (Lead Security Analyst)';
    if (allowedRoles.includes(SecurityRole.Operator)) {
      reqLevel = 'LEVEL 3 (Security Operator)';
    }

    setRbacBlockade({
      action: actionName,
      requiredClearance: reqLevel,
      currentRole: currentUser.role
    });
    return false;
  };

  // Launch Active verification scan (OWASP ZAP trigger) (PART 7)
  const handleTriggerVerification = async () => {
    if (!activeAlert) return;
    if (!checkPermission('OWASP Active Verification Scan', [SecurityRole.LeadAnalyst, SecurityRole.Operator])) {
      return;
    }
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: activeAlert.id })
      });
      const data = await res.json();
      if (data.success) {
        setAlerts(prev => prev.map(a => a.id === activeAlert.id ? { ...a, status: 'Scanning' } : a));
      }
    } catch (e) {
      setIsScanning(false);
    }
  };

  // Launch manual override remediation playbook (PART 9)
  const handleTriggerPlaybook = async () => {
    if (!activeAlert) return;
    if (!checkPermission('Remediation Playbook Enforcement', [SecurityRole.LeadAnalyst, SecurityRole.Operator])) {
      return;
    }
    setIsExecutingPlaybook(true);
    try {
      const res = await fetch('/api/playbook/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: activeAlert.id })
      });
      const data = await res.json();
      if (data.success) {
        fetchAlertsProgress();
      }
    } catch (e) {
      setIsExecutingPlaybook(false);
    }
  };

  // Trigger on-demand PDF report export of active alert (Part 10)
  const handleDownloadPDFReport = () => {
    if (!activeAlert) return;
    
    // Check if Auditor or any logged in user can build the customized PDF clearance report
    if (!checkPermission('Custom PDF Report Generation', [SecurityRole.LeadAnalyst, SecurityRole.Operator, SecurityRole.Auditor])) {
      return;
    }

    const vuln = vulnerabilities.find(v => v.cve === activeAlert.cve);
    const asset = assets.find(a => a.id === activeAlert.targetAssetId);
    
    let activeVectorStr: string | undefined = undefined;
    try {
      const stored = localStorage.getItem('vapt_soar_cvss_calculator_metrics');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          activeVectorStr = `CVSS:3.1/AV:${parsed.av ?? 'N'}/AC:${parsed.ac ?? 'L'}/PR:${parsed.pr ?? 'N'}/UI:${parsed.ui ?? 'N'}/S:${parsed.scope ?? 'U'}/C:${parsed.c ?? 'H'}/I:${parsed.i ?? 'H'}/A:${parsed.a ?? 'H'}`;
        }
      }
    } catch (e) {
      console.warn('Failed to recover CVSS vector for PDF report', e);
    }

    exportAlertToPDF(
      activeAlert,
      vuln,
      asset,
      {
        baseSeverity,
        epssScore,
        assetCriticality,
        verifFactor,
        modRiskResult
      },
      activeVectorStr
    );

    // Log the PDF audit action
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.username : 'sec-ops-analyst',
      action: 'PDF Export',
      details: `${currentUser?.role} generated customized PDF context risk report for alert ${activeAlert.id} (CVE: ${activeAlert.cve}) with modulated score ${modRiskResult}`
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Apply success micro-interaction state for Download feedback
    setPdfSuccess(true);
    setTimeout(() => {
      setPdfSuccess(false);
    }, 2500);
  };

  // Reset core DB pipeline variables
  const handleResetPipeline = async () => {
    if (!checkPermission('State Database Deconstruction & Pipeline Reset', [SecurityRole.LeadAnalyst])) {
      return;
    }
    try {
      const res = await fetch('/api/alerts/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts);
        if (data.alerts.length > 0) {
          setSelectedAlertId(data.alerts[0].id);
        }
        addSystemChatMessage("State restored. All mock alerts, scanning databases, and playbook actions cleaned successfully.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper chat appender
  const addSystemChatMessage = (text: string) => {
    setChatMessages(prev => [...prev, { role: 'assistant', text }]);
  };

  // Inbound Gemini Copilot chat processor
  const handleSendCopilotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsCopilotTyping(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          selectedAlertId: activeAlert?.id,
          history: chatMessages.slice(-6) // include brief context bounds
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to AI Copilot. Please check your console logs or process environment variables configuration." }]);
    } finally {
      setIsCopilotTyping(false);
    }
  };

  // Asset Graph layout sizing parameters
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-cyber-magenta bg-cyber-magenta/10 border-cyber-magenta/40';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/40';
      case 'Medium': return 'text-cyber-blue bg-cyber-blue/10 border-cyber-blue/40';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/40';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Remediated': return 'bg-cyber-green/20 text-cyber-green border-cyber-green/50';
      case 'Scanning': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50 animate-pulse';
      case 'Verified': return 'bg-cyber-magenta/20 text-cyber-magenta border-cyber-magenta/50';
      case 'Mitigated': return 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/50';
      default: return 'bg-slate-700/35 text-slate-300 border-slate-600/45';
    }
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => {
      setCurrentUser(user);
      const loginLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.username,
        action: 'Auth Session Established',
        details: `Established secure cryptographic terminal session. Loaded access policy bounds for: ${user.role} (Badge: ${user.id}).`
      };
      setAuditLogs(prev => [loginLog, ...prev]);
    }} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-cyber-black text-slate-200">
      
      {/* 1. Header & KPI Statistics Deck */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 py-2.5">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Subdetails */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-[0_0_12px_rgba(99,102,241,0.25)] shrink-0">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-md font-bold tracking-tight text-white font-mono flex flex-wrap items-center gap-2">
                  VAPT SOAR <span className="text-indigo-400 font-light text-[10px] border border-indigo-500/30 px-1.5 py-0.5 bg-indigo-950/40 rounded uppercase tracking-wider">Context-Aware Core</span>
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Bridging threat modeling, real-time intelligence feeds, and automated OWASP VAPT analytics.
                </p>
              </div>
            </div>
          </div>

          {/* Action Header controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status indicators consistent with Sentinel design */}
            <div className="hidden xl:flex items-center gap-4 border-r border-slate-800 pr-4 mr-1 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"></div> SIEM: CONNECTED
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"></div> KAFKA: HEALTHY
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_6px_rgba(99,102,241,0.4)]"></div> AI: READY
              </div>
            </div>

            <button
              onClick={handleDownloadPDFReport}
              disabled={!activeAlert}
              className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-300 active:scale-95 cursor-pointer font-medium border shadow-[0_0_8px_rgba(99,102,241,0.05)] ${
                pdfSuccess
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'text-slate-300 hover:text-white bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20'
              }`}
            >
              {pdfSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyber-green animate-pulse" />
                  <span className="text-cyber-green">PDF Ready!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <div className="h-5 w-px bg-slate-800 hidden md:block"></div>

            <button 
              onClick={handleResetPipeline}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-700 transition-all duration-150 active:scale-95 cursor-pointer font-medium"
            >
              <ListRestart className="w-3.5 h-3.5 text-indigo-400" />
              Reset Lab Database
            </button>
            <div className="h-5 w-px bg-slate-800 hidden md:block"></div>

            {/* Cryptographic Session Identity Badge & Secure Decrypter Connection Dismisser */}
            {currentUser && (
              <div className="flex items-center gap-2 bg-[#02050f] border border-slate-800 rounded-lg p-1.5 pl-2 select-none shadow-sm">
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.username} 
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded object-cover border border-slate-800 shrink-0 select-none pointer-events-none" 
                />
                <div className="flex flex-col text-left max-w-[130px] leading-none">
                  <span className="text-[10px] font-mono leading-normal text-[#f1f5f9] font-bold truncate" title={currentUser.username}>{currentUser.username}</span>
                  <span className="text-[8px] font-mono leading-normal text-indigo-400 font-extrabold tracking-wide uppercase" title={currentUser.role}>
                    {currentUser.role === 'Lead Analyst' ? 'SOC Commander' : currentUser.role === 'Security Operating Engineer' ? 'Operator' : 'Read-Only Auditor'}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-800 mx-1"></div>
                <button
                  onClick={() => {
                    localStorage.removeItem('vapt_soar_user_session');
                    setCurrentUser(null);
                  }}
                  title="Dismount Authenticated Terminal"
                  className="p-1 hover:bg-rose-950/20 rounded text-slate-500 hover:text-rose-450 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="h-5 w-px bg-slate-800 hidden md:block"></div>

            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
              <button
                onClick={() => setActiveTab('ops')}
                className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                  activeTab === 'ops' ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30 shadow-inner' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" /> SOC Cockpit
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                  activeTab === 'graph' ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Topological Graph
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                  activeTab === 'logs' ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" /> Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('blueprints')}
                className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                  activeTab === 'blueprints' ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> Core Blueprints [19]
              </button>
            </div>
          </div>

        </div>

        {/* Operational Intelligence KPIs Dashboard - Compacted for Zero-Scroll Landscape */}
        <div className="max-w-[1500px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mt-2.5 pt-2.5 border-t border-slate-800/85">
          <div className="px-3 py-1.5 bg-slate-900/50 border border-slate-800/80 rounded-lg flex items-center justify-between hover:border-slate-700/60 transition-colors">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-bold font-sans">MTTR (VAPT)</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-white">3.4 Mins</span>
              <span className="text-[10px] text-emerald-400 flex items-center font-mono font-medium">
                <TrendingUp className="w-3 h-3 mr-0.5" /> -85.2%
              </span>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-slate-900/50 border border-slate-800/80 rounded-lg flex items-center justify-between hover:border-slate-700/60 transition-colors">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-bold font-sans">Suppression</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-white">91.2%</span>
              <span className="text-[9px] text-indigo-400 font-mono">1.2k suppressed</span>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-slate-900/50 border border-slate-800/80 rounded-lg flex items-center justify-between hover:border-slate-700/60 transition-colors">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-bold font-sans">Threat Scope</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-indigo-400">5 Assets</span>
              <span className="text-[9px] text-slate-500 font-mono">Neo4j</span>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-slate-900/50 border border-slate-800/80 rounded-lg flex items-center justify-between hover:border-slate-700/60 transition-colors">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-bold font-sans">Feed Anchors</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-rose-400">{threatFeeds.length} Streams</span>
              <span className="text-[9px] text-emerald-400 font-mono">Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Primary Tabs Viewport Panel */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 flex flex-col gap-4">
        
        {/* TAB 1: SOC OPS COCKPIT */}
        {activeTab === 'ops' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch lg:h-[700px]">
            
            {/* Column A: SIEM Raw Alerts Feed list */}
            <div className="lg:col-span-1 bg-cyber-dark/90 border border-cyber-border rounded-xl p-4 flex flex-col gap-3 h-full">
              <div className="flex justify-between items-center pb-2 border-b border-cyber-border">
                <span className="text-xs font-mono font-semibold text-white uppercase flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyber-magenta animate-pulse" /> Raw Ingested Alerts
                </span>
                <span className="text-[10px] bg-cyber-gray px-2 py-0.5 rounded text-slate-300 font-mono">
                  {alertsSearchQuery ? `${alerts.filter(al => {
                    const q = alertsSearchQuery.trim().toLowerCase();
                    return al.title.toLowerCase().includes(q) || al.cve.toLowerCase().includes(q);
                  }).length}/${alerts.length}` : alerts.length}
                </span>
              </div>

              {/* Real-time search filter input */}
              <div className="relative flex items-center bg-[#00040f] border border-cyber-border rounded-lg h-9 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by title, CVE..."
                  value={alertsSearchQuery}
                  onChange={(e) => setAlertsSearchQuery(e.target.value)}
                  className="w-full h-full bg-transparent pl-8 pr-8 text-xs font-mono text-white placeholder-slate-500 outline-none focus:ring-0 focus:outline-none"
                />
                {alertsSearchQuery && (
                  <button
                    onClick={() => setAlertsSearchQuery('')}
                    className="p-1 hover:bg-slate-900 rounded-full text-slate-500 hover:text-white absolute right-1.5 focus:outline-none transition-colors duration-150"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
                {alerts
                  .filter((al) => {
                    const q = alertsSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return al.title.toLowerCase().includes(q) || al.cve.toLowerCase().includes(q);
                  })
                  .map((al) => {
                    const isSelected = al.id === selectedAlertId;
                    return (
                      <button
                        key={al.id}
                        onClick={() => setSelectedAlertId(al.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                          isSelected 
                            ? 'bg-cyber-gray/90 border-cyber-blue shadow-md shadow-cyber-blue/5' 
                            : 'bg-cyber-black/50 border-cyber-border/50 hover:bg-cyber-gray/30 hover:border-cyber-border'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9.5px] font-mono font-semibold text-[#a0aec0]">{al.id}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${getSeverityStyle(al.severity)} font-mono font-medium`}>
                            {al.severity}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-white mt-1.5 line-clamp-1 truncate">{al.title}</h4>
                        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-cyber-border/40 text-[10px] text-slate-400">
                          <span className="font-mono">{al.cve}</span>
                          <span className={`px-1.5 py-0.5 rounded border font-mono text-[9px] ${getStatusStyle(al.status)}`}>
                            {al.status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                {alerts.filter((al) => {
                  const q = alertsSearchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return al.title.toLowerCase().includes(q) || al.cve.toLowerCase().includes(q);
                }).length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-500 font-mono">
                    No matching alerts found
                  </div>
                )}
              </div>

              {/* Feed Simulation Manual push button */}
              <div className="mt-auto pt-3 border-t border-cyber-border">
                <h5 className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">Inject Test SIEM Alert</h5>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      await fetch('/api/alerts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: "Remote Code Execution exploit payload uploaded",
                          source: "ElasticSIEM",
                          targetAssetId: "ASSET-002",
                          cve: "CVE-2024-1002"
                        })
                      });
                      fetchData();
                    }}
                    className="w-full text-left text-[10.5px] bg-cyber-black hover:bg-cyber-gray border border-cyber-border hover:border-cyber-blue px-2.5 py-2 rounded text-slate-300 font-mono transition-colors duration-150 flex items-center justify-between"
                  >
                    <span>+ Ingest CVE-2024-1002</span>
                    <span className="text-[9px] text-cyber-magenta bg-cyber-magenta/10 px-1 rounded">Crit</span>
                  </button>
                  <button
                    onClick={async () => {
                      await fetch('/api/alerts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: "Targeted LDAP Query Bruteforce attempt",
                          source: "Sentinel",
                          targetAssetId: "ASSET-003",
                          cve: "CVE-2024-3456"
                        })
                      });
                      fetchData();
                    }}
                    className="w-full text-left text-[10.5px] bg-cyber-black hover:bg-cyber-gray border border-cyber-border hover:border-cyber-blue px-2.5 py-2 rounded text-slate-300 font-mono transition-colors duration-150 flex items-center justify-between"
                  >
                    <span>+ Ingest CVE-2024-3456</span>
                    <span className="text-[9px] text-orange-400 bg-orange-400/10 px-1 rounded">High</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Column B & C: Main Alert Inspector & Decision Engine */}
            <div className="lg:col-span-2 flex flex-col h-full bg-cyber-dark/95 border border-cyber-border rounded-xl overflow-hidden shadow-lg">
              
              {/* Embedded Sub-tabs Switcher for compact landscape zero-scroll layouts */}
              <div className="flex items-center justify-between bg-[#040812] px-4 py-2 border-b border-slate-800 shrink-0 select-none">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setOpsSubTab('modulator')}
                    className={`text-[10.5px] font-mono px-3 py-1.5 rounded transition-all duration-150 cursor-pointer ${
                      opsSubTab === 'modulator' 
                        ? 'bg-indigo-650/30 text-[#00d4ff] font-extrabold border border-indigo-500/40 shadow-[0_0_6px_rgba(99,102,241,0.15)] bg-slate-900' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    🛡️ Threat Modulator
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpsSubTab('vulnerabilities')}
                    className={`text-[10.5px] font-mono px-3 py-1.5 rounded transition-all duration-150 cursor-pointer ${
                      opsSubTab === 'vulnerabilities' 
                        ? 'bg-indigo-650/30 text-[#00d4ff] font-extrabold border border-indigo-500/40 shadow-[0_0_6px_rgba(99,102,241,0.15)] bg-slate-900' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    📊 Vulnerability Matrix
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpsSubTab('intel')}
                    className={`text-[10.5px] font-mono px-3 py-1.5 rounded transition-all duration-150 cursor-pointer ${
                      opsSubTab === 'intel' 
                        ? 'bg-indigo-650/30 text-[#00d4ff] font-extrabold border border-indigo-500/40 shadow-[0_0_6px_rgba(99,102,241,0.15)] bg-slate-900' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    📡 Live Intel Feeds
                  </button>
                </div>
                {activeAlert && (
                  <span className="text-[9.5px] font-mono text-[#00d4ff] bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/30 hidden sm:inline-block">
                    Active Alert: <strong className="text-white">{activeAlert.id}</strong>
                  </span>
                )}
              </div>

              {/* Sub-tab scrollable body content wrapper */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                
                {opsSubTab === 'modulator' && (
                  <>
                    {activeAlert ? (
                      <div className="flex flex-col gap-4">
                  
                  {/* Title and stats bar */}
                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-cyber-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-cyber-gray text-white font-mono px-2 py-0.5 rounded border border-cyber-border">
                          {activeAlert.source} SIEM
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{new Date(activeAlert.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <h2 className="text-md md:text-lg font-bold text-white mt-1.5 leading-snug">{activeAlert.title}</h2>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider">CONTEXT RISK</span>
                      <span className={`text-xl font-bold font-mono ${
                        activeAlert.riskScore > 30 ? 'text-cyber-magenta' : activeAlert.riskScore > 10 ? 'text-orange-500' : 'text-cyber-blue'
                      }`}>
                        {activeAlert.riskScore}
                      </span>
                    </div>
                  </div>

                  {/* Context Metrics: Asset & Vulnerability linkages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-cyber-black/70 p-4 rounded-xl border border-cyber-border/50">
                    
                    {/* Vuln link */}
                    <div className="flex flex-col gap-1 justify-between h-full">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium font-sans">
                            <Bug className="w-3.5 h-3.5 text-cyber-magenta" /> Vulnerability CVE Data
                          </div>
                          <button
                            onClick={() => setIsVulnDrawerOpen(true)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-350 bg-indigo-505/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/35 transition-all duration-150 cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <span>Expand Details</span>
                          </button>
                        </div>
                        <span className="text-xs text-white font-mono font-semibold mt-1">{activeAlert.cve}</span>
                        <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed">
                          {vulnerabilities.find(v => v.cve === activeAlert.cve)?.description || "Vulnerability descriptors synchronized from Threat Intelligence."}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-1.5 px-1 text-[10px] items-center text-[#cbd5e1] font-mono border-t border-slate-800/40 pt-1.5">
                        <span>CVSS: <strong className="text-orange-400">{activeAlert.baseScore}</strong></span>
                        <span className="text-slate-600">|</span>
                        <span>EPSS: <strong className="text-cyber-blue">{(vulnerabilities.find(v => v.cve === activeAlert.cve)?.epssScore || 0.1) * 100}%</strong></span>
                        <span className="text-slate-600">|</span>
                        <span>KEV: <strong className="text-cyber-magenta">{(vulnerabilities.find(v => v.cve === activeAlert.cve)?.cisaKev ? "YES" : "NO")}</strong></span>
                      </div>
                    </div>

                    {/* Mapped asset link */}
                    <div className="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-cyber-border/40 pt-3 md:pt-0 md:pl-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium font-sans">
                        <Database className="w-3.5 h-3.5 text-cyber-blue" /> Impact Node Context
                      </div>
                      <span className="text-xs text-white font-mono font-semibold mt-1">
                        {assets.find(a => a.id === activeAlert.targetAssetId)?.name || activeAlert.targetAssetId}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 rounded bg-cyber-gray border border-cyber-border/80 text-[10px] text-slate-300 font-mono">
                          IP: {assets.find(a => a.id === activeAlert.targetAssetId)?.ip || "10.0.0.1"}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyber-gray border border-cyber-border/80 text-[10px] text-cyber-blue font-mono">
                          Crit: {assets.find(a => a.id === activeAlert.targetAssetId)?.criticality || 1.0}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyber-gray border border-cyber-border/80 text-[10px] text-cyber-green font-sans">
                          {assets.find(a => a.id === activeAlert.targetAssetId)?.environment || "Production"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">
                        Labels: {assets.find(a => a.id === activeAlert.targetAssetId)?.labels?.join(', ') || 'N/A'}
                      </p>
                    </div>

                  </div>

                  {/* Interactive Formula modulator block */}
                  <div className="p-4 border border-cyber-border/60 rounded-xl bg-cyber-gray/30 flex flex-col gap-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs font-mono font-semibold text-white tracking-wide uppercase flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-cyber-green" /> Live Risk Scoring Modulator Loop (Part 8)
                      </span>
                      <button
                        onClick={() => {
                          if (checkPermission('CVSS Calculator Override', [SecurityRole.LeadAnalyst, SecurityRole.Operator])) {
                            setIsCVSSCalcOpen(true);
                          }
                        }}
                        className="text-[10px] font-mono bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/35 px-2 py-1 rounded transition duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Sliders className="w-3 h-3 text-indigo-400" />
                        <span>CVSS 3.1 Calculator</span>
                      </button>
                    </div>
                    
                    {/* Modulator dials */}
                    <div className="space-y-2.5 my-1.5 font-sans">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-mono text-slate-400">
                          <span>Base Severity (CVSS)</span>
                          <span className="text-white font-medium">{baseSeverity}</span>
                        </div>
                        <input 
                          type="range" min="1.0" max="10.0" step="0.1" 
                          value={baseSeverity}
                          onChange={(e) => {
                            if (checkPermission('Tune CVSS Base Severity', [SecurityRole.LeadAnalyst, SecurityRole.Operator])) {
                              setBaseSeverity(Number(e.target.value));
                            }
                          }}
                          className="w-full accent-cyber-blue h-1 bg bg-cyber-black rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-mono text-slate-400">
                          <span>Exploit Probability (EPSS)</span>
                          <span className="text-white font-medium">{(epssScore * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                          type="range" min="0.0" max="1.0" step="0.01" 
                          value={epssScore}
                          onChange={(e) => {
                            if (checkPermission('Tune EPSS Exploit Probability', [SecurityRole.LeadAnalyst, SecurityRole.Operator])) {
                              setEpssScore(Number(e.target.value));
                            }
                          }}
                          className="w-full accent-cyber-blue h-1 bg-cyber-black rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-mono text-slate-400">
                          <span>Asset Criticality Block Weight</span>
                          <span className="text-white font-medium">{assetCriticality}</span>
                        </div>
                        <input 
                          type="range" min="0.1" max="5.0" step="0.1" 
                          value={assetCriticality}
                          onChange={(e) => {
                            if (checkPermission('Tune Asset Criticality Weight', [SecurityRole.LeadAnalyst, SecurityRole.Operator])) {
                              setAssetCriticality(Number(e.target.value));
                            }
                          }}
                          className="w-full accent-cyber-blue h-1 bg bg-cyber-black rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-cyber-border/40">
                        <span className="text-xs text-slate-400 font-mono">Dynamic Verification Multiplier (Factor):</span>
                        <div className="flex gap-1">
                          {[
                            { label: '0.1 (Mitigated)', val: 0.1 },
                            { label: '1.0 (Unverified)', val: 1.0 },
                            { label: '2.0 (Vulnerable)', val: 2.0 },
                          ].map((fac) => (
                            <button
                              key={fac.val}
                              onClick={() => {
                                if (checkPermission('Modify Verification Factor', [SecurityRole.LeadAnalyst, SecurityRole.Operator])) {
                                  setVerifFactor(fac.val);
                                }
                              }}
                              className={`text-[10.5px] px-2 py-1 rounded transition-colors duration-150 border ${
                                verifFactor === fac.val 
                                  ? 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue' 
                                  : 'bg-cyber-black text-slate-400 border-cyber-border hover:text-slate-300'
                              }`}
                            >
                              {fac.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Interactive D3 Sparkline Chart */}
                    <div className="my-1 transition-opacity duration-300">
                      <RiskSparkline 
                        baseSeverity={baseSeverity}
                        epssScore={epssScore}
                        assetCriticality={assetCriticality}
                        verifFactor={verifFactor}
                        alertId={activeAlert.id}
                        currentRiskScore={modRiskResult}
                      />
                    </div>

                    {/* Math evaluation readout */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-cyber-black/70 border border-cyber-border mt-1">
                      <div className="text-[11px] font-mono text-[#cbd5e1]">
                        <strong>{"$R_{adjust}$"}</strong> = (Base [{baseSeverity}] * EPSS [{epssScore}]) * Asset [{assetCriticality}] * Verification [{verifFactor}]
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Interactive Result</span>
                        <span className="text-md font-bold font-mono text-cyber-green">{modRiskResult}</span>
                      </div>
                    </div>

                  </div>

                  {/* Actions Block */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleTriggerVerification}
                      disabled={isScanning || activeAlert.status === "Scanning" || activeAlert.status === "Remediated"}
                      className={`flex-1 text-xs font-mono px-4 py-3 rounded-lg flex items-center justify-center gap-1.5 focus:outline-none font-semibold transition-all duration-150 active:scale-95 ${
                        isScanning || activeAlert.status === "Scanning"
                           ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 cursor-not-allowed animate-pulse'
                          : activeAlert.status === "Remediated"
                          ? 'bg-slate-800 text-slate-500 border border-cyber-border cursor-not-allowed'
                          : 'bg-cyber-black text-cyber-green border border-cyber-green hover:bg-cyber-green/5 hover:shadow-[0_0_8px_rgba(0,255,102,0.1)]'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {isScanning || activeAlert.status === "Scanning" ? "VAPT ZAP Scan Active..." : "Trigger Verification Scan"}
                    </button>

                    <button
                      onClick={handleTriggerPlaybook}
                      disabled={isExecutingPlaybook || activeAlert.status === "Remediated"}
                      className={`flex-1 text-xs font-mono px-4 py-3 rounded-lg flex items-center justify-center gap-1.5 focus:outline-none font-semibold transition-all duration-150 active:scale-95 ${
                        isExecutingPlaybook || activeAlert.playbookState?.status === "running"
                          ? 'bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30 cursor-not-allowed'
                          : activeAlert.status === "Remediated"
                          ? 'bg-slate-800 text-slate-500 border border-cyber-border cursor-not-allowed'
                          : 'bg-cyber-blue text-cyber-black font-bold uppercase tracking-wider hover:bg-[#00e1ff] hover:shadow-[0_0_10px_rgba(0,212,255,0.25)]'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isExecutingPlaybook || activeAlert.playbookState?.status === "running" ? "SOAR Executing..." : "Execute Remediation"}
                    </button>

                    <button
                      onClick={handleDownloadPDFReport}
                      className={`flex-1 text-xs font-mono px-4 py-3 rounded-lg flex items-center justify-center gap-1.5 focus:outline-none font-semibold transition-all duration-300 active:scale-95 cursor-pointer ${
                        pdfSuccess
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 hover:shadow-[0_0_8px_rgba(79,70,229,0.15)]'
                      }`}
                    >
                      {pdfSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-cyber-green animate-pulse" />
                          <span className="text-cyber-green">PDF Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Download Report</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Playbook orchestration steps block */}
                  {activeAlert.playbookState && (
                    <div className="border border-cyber-border p-4 rounded-xl bg-cyber-black/40 mt-2 flex flex-col gap-3 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-semibold text-white uppercase flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-cyber-blue" /> Playbook Run: {activeAlert.playbookState.playbookName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                          activeAlert.playbookState.status === "completed" ? 'bg-cyber-green/10 text-cyber-green border-cyber-green' : 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue'
                        }`}>
                          {activeAlert.playbookState.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Timeline steps */}
                      <div className="relative mt-2 pl-4 border-l border-cyber-border/60 space-y-3 font-sans text-xs">
                        {activeAlert.playbookState.steps.map((st, sidx) => {
                          const isComp = st.status === "completed";
                          const isRun = st.status === "running";
                          return (
                            <div key={st.name} className="relative flex items-start gap-3">
                              {/* Pulse point */}
                              <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border ${
                                isComp 
                                  ? 'bg-cyber-green border-cyber-green' 
                                  : isRun 
                                  ? 'bg-cyber-blue border-cyber-blue animate-ping' 
                                  : 'bg-cyber-gray border-cyber-border'
                              }`}></span>
                              <div>
                                <span className={`font-mono font-medium block ${isComp ? 'text-slate-400 line-through' : isRun ? 'text-cyber-blue font-bold' : 'text-slate-400'}`}>
                                  Step {sidx+1}: {st.name}
                                </span>
                                <p className="text-[11px] text-slate-500 mt-0.5">{st.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Logs terminal container */}
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" /> Operations logs console
                      </span>
                    </div>
                    <div className="p-4 border border-cyber-border bg-cyber-black rounded-lg h-[180px] overflow-y-auto custom-scrollbar font-mono text-[10.5px] leading-relaxed text-[#a0aec0] space-y-1">
                      {activeAlert.logs.map((logLine, lidx) => (
                        <div key={lidx} className="flex gap-2">
                          <span className="text-slate-600 shrink-0 select-none">&gt;&gt;</span>
                          <span>{logLine}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                      </div>
                    ) : (
                      <div className="bg-cyber-dark border border-cyber-border rounded-xl p-8 text-center text-slate-400 text-sm">
                        Operational console offline. Ingest a SIEM alert using the test injector triggers below.
                      </div>
                    )}
                  </>
                )}

                {opsSubTab === 'vulnerabilities' && (
                  <div className="animate-fadeIn">
                    <VulnerabilityComparisonView 
                      vulnerabilities={vulnerabilities}
                      currentAssetCriticality={assetCriticality}
                      currentVerifFactor={verifFactor}
                    />
                  </div>
                )}

                {opsSubTab === 'intel' && (
                  <div className="animate-fadeIn">
                    <ThreatIntelligenceView 
                      threatFeeds={threatFeeds}
                      activeAlert={activeAlert}
                      vulnerabilities={vulnerabilities}
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Column D: AI Security Assistant (Copilot Frame) */}
            <div className="lg:col-span-1 bg-cyber-dark/95 border border-cyber-border rounded-xl p-4 flex flex-col h-full overflow-hidden">
              
              {/* Copilot header */}
              <div className="border-b border-cyber-border pb-3 mb-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue shadow-[0_0_8px_rgba(0,212,255,0.1)]">
                    <Cpu className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase">AI Security Copilot</h3>
                    <p className="text-[9.5px] text-slate-400">Gemini-3.5-flash System</p>
                  </div>
                </div>
                <div className="text-[9px] text-cyber-green bg-cyber-green/10 px-1.5 py-0.5 rounded font-mono border border-cyber-green/30 uppercase font-medium">
                  Active Context
                </div>
              </div>

              {/* Chat conversations list */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 mb-4">
                {chatMessages.map((msg, midx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={midx} 
                      className={`flex flex-col gap-1 max-w-[90%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <span className="text-[9px] font-mono text-slate-500 uppercase">{isUser ? 'SOC Analyst' : 'Copilot Client'}</span>
                      <div className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                        isUser 
                          ? 'bg-cyber-blue text-cyber-black font-semibold rounded-br-none shadow' 
                          : 'bg-cyber-gray text-slate-300 rounded-bl-none border border-cyber-border/60'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                {isCopilotTyping && (
                  <div className="flex flex-col gap-1 mr-auto items-start">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Gemini reasoning...</span>
                    <div className="p-2.5 rounded-lg bg-cyber-gray text-xs text-cyber-blue border border-cyber-blue/30 animate-pulse">
                      Analyzing risk factors and drafting explainable security advice...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendCopilotMessage} className="mt-auto border-t border-cyber-border pt-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask threat summary..."
                  className="flex-1 bg-cyber-black text-xs px-3 py-2 rounded-lg border border-cyber-border hover:border-cyber-blue/50 focus:border-cyber-blue focus:outline-none transition-all duration-150 text-white"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isCopilotTyping}
                  className="p-2 rounded-lg bg-cyber-blue hover:bg-cyber-blue/80 text-cyber-black transition-colors duration-150 disabled:opacity-50"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

            {/* Embedded details handle sub-tabs above dynamically inside workstation. No scrolling duplicates below. */}

          </div>
        )}

         {/* TAB 2: INTERACTIVE ASSET TOPOLOGY GRAPH */}
        {activeTab === 'graph' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn pb-6">
            
            {/* Left 2 Columns: SVG Visualizer Panel */}
            <div className="xl:col-span-2 flex flex-col gap-4 bg-[#080d19]/95 border border-cyber-border rounded-xl p-5 min-h-[500px]">
              
              {/* Header and Toolbar station */}
              <div className="border-b border-cyber-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xs font-semibold tracking-wider text-white uppercase flex items-center gap-1.5 font-mono">
                    <Layers className="w-4 h-4 text-cyber-blue animate-pulse" /> Interactive Topology Network & Defense Intelligence
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Click nodes to load deep asset diagnostics. Use the tactical simulator sidebar to contain hosts or filter VLAN segment routing.
                  </p>
                </div>
                
                {/* Global stats gauges */}
                <div className="flex gap-2.5 shrink-0">
                  <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-center min-w-[70px]">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block">Host Count</span>
                    <span className="text-xs font-mono font-bold text-cyber-blue">5 Online</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-center min-w-[74px]">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block">VLAN Subnets</span>
                    <span className="text-xs font-mono font-bold text-cyber-magenta">3 Segments</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-center min-w-[85px]">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block">Mitigations</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {Object.values(isolatedAssets).filter(Boolean).length + Object.values(shieldedAssets).filter(Boolean).length + Object.values(patchedAssets).filter(Boolean).length} Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Advanced Network Filter Bar */}
              <div className="flex flex-col sm:flex-row bg-[#030712] border border-slate-850/80 p-2.5 rounded-lg gap-3 items-start sm:items-center justify-between text-xs font-mono">
                {/* 1. Environment filter buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">VLAN Scope:</span>
                  <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
                    {(['All', 'Production', 'Development'] as const).map((env) => (
                      <button
                        key={env}
                        onClick={() => setGraphEnvFilter(env)}
                        className={`px-2.5 py-1 rounded text-[10px] cursor-pointer font-bold transition-all ${
                          graphEnvFilter === env
                            ? 'bg-indigo-650/30 text-[#00d4ff] border border-indigo-500/40 font-extrabold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {env === 'All' ? '🌐 ALL' : env === 'Production' ? '🏢 PROD' : '🧪 DEV'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Simulation laser mode buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Simulation Overlay:</span>
                  <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
                    <button
                      onClick={() => setGraphMitigationMode('standard')}
                      className={`px-2.5 py-1 rounded text-[10px] cursor-pointer transition-all ${
                        graphMitigationMode === 'standard'
                          ? 'bg-[#1e293b]/50 text-[#00d4ff] font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Passive background telemetry flow pulses"
                    >
                      Passive
                    </button>
                    <button
                      onClick={() => setGraphMitigationMode('threat-path')}
                      className={`px-2.5 py-1 rounded text-[10px] cursor-pointer transition-all ${
                        graphMitigationMode === 'threat-path'
                          ? 'bg-red-950/40 text-rose-450 font-bold border border-rose-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Highlights connected threat vectors exclusively"
                    >
                      Threat Path
                    </button>
                    <button
                      onClick={() => setGraphMitigationMode('attack-simulation')}
                      className={`px-2.5 py-1 rounded text-[10px] cursor-pointer transition-all ${
                        graphMitigationMode === 'attack-simulation'
                          ? 'bg-amber-950/30 text-[#ffaa22] font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Animate active laser exploit flow simulation payloads"
                    >
                      Live Attack Flow
                    </button>
                  </div>
                </div>
              </div>

              {/* SVG Canvas and interactive bounds */}
              <div className="w-full h-[420px] bg-slate-950 border border-cyber-border rounded-xl overflow-hidden relative flex items-center justify-center">
                
                {/* Context Subtitle tag overlay */}
                <div className="absolute inset-x-0 top-3 text-[10px] font-mono text-center text-slate-500 pointer-events-none select-none z-10 uppercase tracking-widest">
                  Live Network Telemetry Matrix &bull; VLAN Zone Visualization
                </div>

                {/* Flow speed control indicators */}
                <div className="absolute bottom-3 right-4 z-20 pointer-events-none select-none flex items-center gap-2 text-[9px] font-mono text-slate-500 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded">
                  <span className="w-2 h-2 rounded-full bg-cyber-green animate-ping"></span>
                  <span>FLOW CONDUITS: {graphMitigationMode === 'attack-simulation' ? 'FAST MALICIOUS (FAST)' : 'CLEAN TELEMETRY (WARM)'}</span>
                </div>

                {/* Zoom actions floating tray */}
                <div className="absolute top-12 right-4 z-20 flex flex-col sm:flex-row items-center gap-1.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 p-1.5 rounded-lg shadow-lg backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 bg-slate-950 hover:bg-indigo-600/20 text-slate-400 hover:text-white rounded border border-slate-800 hover:border-indigo-500/30 transition-colors duration-150 cursor-pointer text-xs flex items-center justify-center gap-1"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-cyber-blue" />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 bg-slate-950 hover:bg-indigo-600/20 text-slate-400 hover:text-white rounded border border-slate-800 hover:border-indigo-500/30 transition-colors duration-150 cursor-pointer text-xs flex items-center justify-center gap-1"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-cyber-blue" />
                  </button>
                  <div className="w-px h-4 bg-slate-800 hidden sm:block"></div>
                  <button
                    type="button"
                    onClick={handleZoomReset}
                    className="p-1.5 px-2 bg-slate-950 hover:bg-indigo-600/25 text-slate-400 hover:text-[#00d4ff] rounded border border-slate-800 hover:border-indigo-500/35 transition-colors duration-150 cursor-pointer text-[10.5px] flex items-center gap-1.5 font-mono font-bold"
                    title="Standard Viewport Reset"
                  >
                    <Move className="w-3.5 h-3.5 text-cyber-magenta" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCenterGraph}
                    className="p-1.5 px-2 bg-slate-950 hover:bg-indigo-600/25 text-slate-400 hover:text-cyber-blue rounded border border-slate-800 hover:border-indigo-500/35 transition-colors duration-150 cursor-pointer text-[10.5px] flex items-center gap-1.5 font-mono font-bold"
                    title="Autoconfigure zoom parameters to fit all nodes"
                    id="btn-center-graph"
                  >
                    <Maximize className="w-3.5 h-3.5 text-cyber-blue" />
                    <span>Fit Canvas</span>
                  </button>
                </div>

                {/* Quick key bindings label */}
                <div className="absolute bottom-3 left-4 z-20 pointer-events-none select-none hidden md:flex items-center gap-2 bg-slate-950/85 border border-slate-800/60 px-3 py-1.5 rounded-lg text-[9.5px] font-mono text-slate-400">
                  <span className="text-[#00d4ff] font-bold">🖱️ Click-Drag to Arrange</span>
                  <span className="text-slate-650">&bull;</span>
                  <span className="text-cyber-green font-bold">✨ Zoom Scroll</span>
                  <span className="text-slate-650">&bull;</span>
                  <span className="text-cyber-magenta font-bold">🎯 Node Lock Target</span>
                </div>

                <svg ref={svgRef} className="w-full h-full select-none cursor-grab active:cursor-grabbing" viewBox="0 0 800 400">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#283543" />
                    </marker>
                    <marker id="arrow-threat" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                    </marker>
                    {/* Diagnostic Pattern for isolated hosts */}
                    <pattern id="isolation-stripes" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="10" stroke="#f59e0b" strokeWidth="2.5" opacity="0.35"/>
                    </pattern>
                  </defs>

                  {/* Standard coordinate guidelines pattern */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(40, 53, 67, 0.12)" strokeWidth="1" />
                  </pattern>

                  {/* ZOOMABLE CONTAINER GROUP */}
                  <g className="zoom-content-container">
                    
                    {/* Background Grid */}
                    <rect x="-1600" y="-800" width="4000" height="2000" fill="url(#grid)" />

                    {/* PHYSICAL VLAN BOUNDARY BOUNDS WRAPTHERS */}
                    {graphEnvFilter === 'All' && (
                      <>
                        {/* VHF PROD BOUNDARY BOX */}
                        <rect x="140" y="125" width="490" height="255" rx="12" fill="rgba(6, 182, 212, 0.015)" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1.2" strokeDasharray="4 4" pointer-events="none" />
                        <text x="155" y="145" fill="rgba(6, 182, 212, 0.35)" className="text-[9px] font-mono font-bold tracking-wider select-none pointer-events-none">VLAN-100 &bull; ENTERPRISE PRODUCTION CORE</text>
                        
                        {/* DEV DMZ ZONE */}
                        <rect x="290" y="32" width="180" height="83" rx="8" fill="rgba(148, 163, 184, 0.01)" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" strokeDasharray="3 3" pointer-events="none" />
                        <text x="300" y="47" fill="rgba(148, 163, 184, 0.35)" className="text-[8px] font-mono tracking-wider select-none pointer-events-none">VLAN-200 &bull; SANDBOX DEV DMZ</text>
                        
                        {/* IDENTITY TRUST ZONE */}
                        <rect x="520" y="250" width="180" height="115" rx="8" fill="rgba(249, 115, 22, 0.01)" stroke="rgba(249, 115, 22, 0.1)" strokeWidth="1" strokeDasharray="3 3" pointer-events="none" />
                        <text x="530" y="265" fill="rgba(249, 115, 22, 0.35)" className="text-[8px] font-mono tracking-wider select-none pointer-events-none">VLAN-300 &bull; SECURE AD DOMAIN</text>
                      </>
                    )}

                    {/* Graph Vector Connections (Dependency linkages with live laser dynamics) */}
                    {(() => {
                      const p1 = nodePositions["ASSET-001"] || { x: 220, y: 200 };
                      const p2 = nodePositions["ASSET-002"] || { x: 540, y: 180 };
                      const p3 = nodePositions["ASSET-003"] || { x: 380, y: 80 };
                      const p4 = nodePositions["ASSET-004"] || { x: 580, y: 320 };
                      const p5 = nodePositions["ASSET-005"] || { x: 380, y: 320 };

                      const midX1 = (p1.x + p2.x) / 2;
                      const midY1 = (p1.y + p2.y) / 2 - 40;

                      const midX5 = (p5.x + p2.x) / 2 + 15;
                      const midY5 = (p5.y + p2.y) / 2 - 15;

                      // Evaluate threat levels on paths dynamically
                      const isAsset1Critical = alerts.some(a => a.targetAssetId === "ASSET-001" && a.severity === "Critical" && !patchedAssets["ASSET-001"]);
                      const isAsset2Critical = alerts.some(a => a.targetAssetId === "ASSET-002" && a.severity === "Critical" && !patchedAssets["ASSET-002"]);
                      const isThreatConduit1Active = (isAsset1Critical || isAsset2Critical) && !isolatedAssets["ASSET-001"] && !isolatedAssets["ASSET-002"];

                      const isAsset5Critical = alerts.some(a => a.targetAssetId === "ASSET-005" && a.severity === "Critical" && !patchedAssets["ASSET-005"]);
                      const isThreatConduit5Active = (isAsset5Critical || isAsset2Critical) && !isolatedAssets["ASSET-005"] && !isolatedAssets["ASSET-002"];

                      // Opacity values based on environment filters
                      const op1 = (graphEnvFilter === 'All' || graphEnvFilter === 'Production') ? 1.0 : 0.15;
                      const op3 = (graphEnvFilter === 'All' || graphEnvFilter === 'Development') ? 1.0 : 0.15;
                      const opSecureZone = (graphEnvFilter === 'All' || graphEnvFilter === 'Production') ? 1.0 : 0.15;

                      return (
                        <>
                          {/* LINK 1: Prod WebPortal -> Customer Database (Port 5432 vector) */}
                          <g opacity={op1} className="transition-all duration-300">
                            {/* Base channel conduit line */}
                            <path 
                              d={`M ${p1.x} ${p1.y} Q ${midX1} ${midY1} ${p2.x} ${p2.y}`} 
                              fill="none" 
                              stroke={isThreatConduit1Active ? "#ff0077" : (isolatedAssets["ASSET-001"] || isolatedAssets["ASSET-002"] ? "#475569" : "#1e293b")} 
                              strokeWidth={isThreatConduit1Active ? "2.5" : "1.5"} 
                              strokeDasharray={isolatedAssets["ASSET-001"] || isolatedAssets["ASSET-002"] ? "5 5" : "0"}
                              markerEnd={isThreatConduit1Active ? "url(#arrow-threat)" : "url(#arrow)"}
                            />
                            
                            {/* Flowing simulated signal laser stream */}
                            {!(isolatedAssets["ASSET-001"] || isolatedAssets["ASSET-002"]) && (
                              <path 
                                d={`M ${p1.x} ${p1.y} Q ${midX1} ${midY1} ${p2.x} ${p2.y}`} 
                                fill="none" 
                                stroke={isThreatConduit1Active && graphMitigationMode !== 'standard' ? "#ff0077" : "#00d4ff"} 
                                strokeWidth="1.2"
                                className={isThreatConduit1Active && graphMitigationMode !== 'standard' ? "animate-flow-laser-threat" : "animate-flow-laser-safe"}
                                opacity={graphMitigationMode === 'standard' ? "0.3" : "0.9"}
                              />
                            )}

                            <text x={midX1} y={midY1 - 10} fill={isThreatConduit1Active ? "#f43f5e" : "#51657a"} className="text-[8.5px] font-mono font-bold select-none pointer-events-none" textAnchor="middle" filter="drop-shadow(0 1px 2px black)">
                              {isThreatConduit1Active ? "⚠️ SQL_INJECTION FEED" : "POSTGRES :5432"}
                            </text>
                          </g>

                          {/* LINK 2: Payments API -> Customer Database */}
                          <g opacity={opSecureZone} className="transition-all duration-300">
                            <path 
                              d={`M ${p5.x} ${p5.y} Q ${midX5} ${midY5} ${p2.x} ${p2.y}`} 
                              fill="none" 
                              stroke={isThreatConduit5Active ? "#ff0077" : (isolatedAssets["ASSET-005"] || isolatedAssets["ASSET-002"] ? "#475569" : "#1e293b")} 
                              strokeWidth="1.5" 
                              strokeDasharray={isolatedAssets["ASSET-005"] || isolatedAssets["ASSET-002"] ? "4 4" : "0"}
                              markerEnd="url(#arrow)"
                            />

                            {/* Warm Telemetry Conduit simulation laser */}
                            {!(isolatedAssets["ASSET-005"] || isolatedAssets["ASSET-002"]) && (
                              <path 
                                d={`M ${p5.x} ${p5.y} Q ${midX5} ${midY5} ${p2.x} ${p2.y}`} 
                                fill="none" 
                                stroke={isThreatConduit5Active && graphMitigationMode !== 'standard' ? "#f43f5e" : "#34d399"} 
                                strokeWidth="1.0"
                                className={isThreatConduit5Active && graphMitigationMode !== 'standard' ? "animate-flow-laser-threat" : "animate-flow-laser-safe"}
                                opacity={graphMitigationMode === 'standard' ? "0.2" : "0.75"}
                              />
                            )}

                            <text x={midX5} y={midY5 - 8} fill="#4b5563" className="text-[8px] font-mono select-none pointer-events-none" textAnchor="middle">
                              billingDB_sync
                            </text>
                          </g>

                          {/* LINK 3: Prod WebPortal -> Active Directory Domain Controller */}
                          <g opacity={opSecureZone} className="transition-all duration-300">
                            <path 
                              d={`M ${p1.x} ${p1.y} L ${p4.x} ${p4.y}`} 
                              fill="none" 
                              stroke={isolatedAssets["ASSET-001"] || isolatedAssets["ASSET-004"] ? "#475569" : "#1e293b"} 
                              strokeWidth="1.2" 
                              strokeDasharray={isolatedAssets["ASSET-001"] || isolatedAssets["ASSET-004"] ? "4 4" : "3 3"}
                              markerEnd="url(#arrow)"
                            />
                            
                            {!(isolatedAssets["ASSET-001"] || isolatedAssets["ASSET-004"]) && (
                              <path 
                                d={`M ${p1.x} ${p1.y} L ${p4.x} ${p4.y}`} 
                                fill="none" 
                                stroke="#a78bfa" 
                                strokeWidth="0.8"
                                className="animate-flow-laser-safe"
                                opacity={graphMitigationMode === 'standard' ? "0.15" : "0.6"}
                              />
                            )}

                            <text x={(p1.x + p4.x)/2 + 20} y={(p1.y + p4.y)/2 - 10} fill="#4a5568" className="text-[8px] font-mono select-none pointer-events-none" textAnchor="start">
                              kerberos_auth
                            </text>
                          </g>
                        </>
                      );
                    })()}

                    {/* Nodes implementation wrappers with coordinated bindings and filter-based opacities */}

                    {/* 1. ASSET-001 (Production Web Portal) */}
                    {(() => {
                      const pos = nodePositions["ASSET-001"] || { x: 220, y: 200 };
                      const op = (graphEnvFilter === 'All' || graphEnvFilter === 'Production') ? 1.0 : 0.15;
                      const hasAlert = alerts.some(a => a.targetAssetId === "ASSET-001" && a.status !== "Remediated");
                      const isCritical = alerts.some(a => a.targetAssetId === "ASSET-001" && a.severity === "Critical" && !patchedAssets["ASSET-001"]);
                      const isVulnerableScan = alerts.some(a => a.targetAssetId === "ASSET-001" && a.verificationStatus === "Vulnerable");
                      const isSelected = selectedGraphAssetId === "ASSET-001";
                      
                      return (
                        <g 
                          transform={`translate(${pos.x}, ${pos.y})`} 
                          className="node-group cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-150"
                          data-node-id="ASSET-001"
                          onClick={(e) => { e.stopPropagation(); setSelectedGraphAssetId("ASSET-001"); }}
                          opacity={op}
                        >
                          {/* Selected outline tracker */}
                          {isSelected && (
                            <circle r="36" fill="none" stroke="#00d4ff" strokeWidth="2.0" strokeDasharray="3 2" className="animate-spin" style={{ animationDuration: '6s' }} />
                          )}
                          {/* Air-gap Containment warning stripes fill */}
                          {isolatedAssets["ASSET-001"] && (
                            <circle r="26" fill="url(#isolation-stripes)" className="animate-pulse" />
                          )}
                          {/* Enhanced forcefield WAF shield visual */}
                          {shieldedAssets["ASSET-001"] && (
                            <circle r="32" fill="none" stroke="#10b981" strokeWidth="1.8" className="animate-shield-glow" strokeDasharray="4 2" />
                          )}
                          {/* Critical pulsing threat ring */}
                          {isCritical && (
                            <circle r="34" fill="none" stroke="#f43f5e" className="animate-critical-glow-ring" />
                          )}
                          {/* Alert vulnerability ping halo */}
                          {isVulnerableScan && !patchedAssets["ASSET-001"] && (
                            <circle r="34" fill="none" stroke="#ff0077" strokeWidth="2" className="animate-ping" opacity="0.5" />
                          )}
                          
                          {/* Core node capsule body structure */}
                          <circle r="26" fill="#12181d" stroke={isolatedAssets["ASSET-001"] ? "#d97706" : (hasAlert && !patchedAssets["ASSET-001"] ? "#ff0077" : "#00d4ff")} strokeWidth="2.2" />
                          <Server className={`w-5 h-5 -translate-x-2.5 -translate-y-2.5 pointer-events-none transition-colors ${isolatedAssets["ASSET-001"] ? 'text-amber-500' : (shieldedAssets["ASSET-001"] ? 'text-emerald-400' : 'text-cyber-blue')}`} />
                          
                          <text y="42" fill="white" className="text-[10.5px] font-mono font-semibold select-none pointer-events-none" textAnchor="middle">
                            Prod WebPortal {isolatedAssets["ASSET-001"] && '⚠️'}
                          </text>
                          <text y="52" fill="#a0aec0" className="text-[9.5px] font-mono select-none pointer-events-none" textAnchor="middle">
                            {isolatedAssets["ASSET-001"] ? '[CONTAINED]' : '10.100.1.50'}
                          </text>

                          {/* Quick Patched double check badge overlay */}
                          {patchedAssets["ASSET-001"] && (
                            <g transform="translate(18, -18)">
                              <circle r="6.5" fill="#10b981" stroke="#12181d" strokeWidth="1" />
                              <path d="M-3.5 0 L-1 2.5 L3.5 -2" fill="none" stroke="white" strokeWidth="1" />
                            </g>
                          )}
                          {renderAssetNodeSparkline("ASSET-001", 62)}
                        </g>
                      );
                    })()}

                    {/* 2. ASSET-002 (Core Database Node) */}
                    {(() => {
                      const pos = nodePositions["ASSET-002"] || { x: 540, y: 180 };
                      const op = (graphEnvFilter === 'All' || graphEnvFilter === 'Production') ? 1.0 : 0.15;
                      const hasAlert = alerts.some(a => a.targetAssetId === "ASSET-002" && a.status !== "Remediated");
                      const isCritical = alerts.some(a => a.targetAssetId === "ASSET-002" && a.severity === "Critical" && !patchedAssets["ASSET-002"]);
                      const isSelected = selectedGraphAssetId === "ASSET-002";
                      
                      return (
                        <g 
                          transform={`translate(${pos.x}, ${pos.y})`} 
                          className="node-group cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-150"
                          data-node-id="ASSET-002"
                          onClick={(e) => { e.stopPropagation(); setSelectedGraphAssetId("ASSET-002"); }}
                          opacity={op}
                        >
                          {isSelected && (
                            <circle r="36" fill="none" stroke="#00d4ff" strokeWidth="2.0" strokeDasharray="3 2" className="animate-spin" style={{ animationDuration: '6s' }} />
                          )}
                          {isolatedAssets["ASSET-002"] && (
                            <circle r="26" fill="url(#isolation-stripes)" className="animate-pulse" />
                          )}
                          {shieldedAssets["ASSET-002"] && (
                            <circle r="32" fill="none" stroke="#10b981" strokeWidth="1.8" className="animate-shield-glow" strokeDasharray="4 2" />
                          )}
                          {isCritical && (
                            <circle r="34" fill="none" stroke="#f43f5e" className="animate-critical-glow-ring" />
                          )}

                          <circle r="26" fill="#12181d" stroke={isolatedAssets["ASSET-002"] ? "#d97706" : (hasAlert && !patchedAssets["ASSET-002"] ? "#ff0077" : "#00d4ff")} strokeWidth="2.2" />
                          <Database className={`w-5 h-5 -translate-x-2.5 -translate-y-2.5 pointer-events-none transition-colors ${isolatedAssets["ASSET-002"] ? 'text-amber-500' : (hasAlert && !patchedAssets["ASSET-002"] ? 'text-cyber-magenta' : 'text-emerald-400')}`} />
                          
                          <text y="42" fill="white" className="text-[10.5px] font-mono font-semibold select-none pointer-events-none" textAnchor="middle">
                            Customer DB Node {isolatedAssets["ASSET-002"] && '⚠️'}
                          </text>
                          <text y="52" fill="#a0aec0" className="text-[9.5px] font-mono select-none pointer-events-none" textAnchor="middle">
                            {isolatedAssets["ASSET-002"] ? '[OFFLINE]' : '10.100.1.120'}
                          </text>

                          {patchedAssets["ASSET-002"] && (
                            <g transform="translate(18, -18)">
                              <circle r="6.5" fill="#10b981" stroke="#12181d" strokeWidth="1" />
                              <path d="M-3.5 0 L-1 2.5 L3.5 -2" fill="none" stroke="white" strokeWidth="1" />
                            </g>
                          )}
                          {renderAssetNodeSparkline("ASSET-002", 62)}
                        </g>
                      );
                    })()}

                    {/* 3. ASSET-003 (Legacy Sandbox API Gateway - Dev environment) */}
                    {(() => {
                      const pos = nodePositions["ASSET-003"] || { x: 380, y: 80 };
                      const op = (graphEnvFilter === 'All' || graphEnvFilter === 'Development') ? 1.0 : 0.15;
                      const hasAlert = alerts.some(a => a.targetAssetId === "ASSET-003" && a.status !== "Remediated");
                      const isCritical = alerts.some(a => a.targetAssetId === "ASSET-003" && a.severity === "Critical" && !patchedAssets["ASSET-003"]);
                      const isNewAlert = alerts.some(a => a.targetAssetId === "ASSET-003" && a.status === "New" && !patchedAssets["ASSET-003"]);
                      const isSelected = selectedGraphAssetId === "ASSET-003";

                      return (
                        <g 
                          transform={`translate(${pos.x}, ${pos.y})`} 
                          className="node-group cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-150"
                          data-node-id="ASSET-003"
                          onClick={(e) => { e.stopPropagation(); setSelectedGraphAssetId("ASSET-003"); }}
                          opacity={op}
                        >
                          {isSelected && (
                            <circle r="32" fill="none" stroke="#00d4ff" strokeWidth="2.0" strokeDasharray="3 2" className="animate-spin" style={{ animationDuration: '6s' }} />
                          )}
                          {isolatedAssets["ASSET-003"] && (
                            <circle r="22" fill="url(#isolation-stripes)" className="animate-pulse" />
                          )}
                          {shieldedAssets["ASSET-003"] && (
                            <circle r="28" fill="none" stroke="#10b981" strokeWidth="1.8" className="animate-shield-glow" strokeDasharray="4 2" />
                          )}
                          {isCritical && (
                            <circle r="30" fill="none" stroke="#f43f5e" className="animate-critical-glow-ring" />
                          )}
                          {isNewAlert && (
                            <circle r="30" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="animate-pulse" />
                          )}

                          <circle r="22" fill="#12181d" stroke={isolatedAssets["ASSET-003"] ? "#d97706" : (hasAlert && !patchedAssets["ASSET-003"] ? "#ef4444" : "#475569")} strokeWidth="2.0" />
                          <Server className={`w-4 h-4 -translate-x-2 -translate-y-2 pointer-events-none ${isolatedAssets["ASSET-003"] ? 'text-amber-500' : 'text-slate-400'}`} />
                          
                          <text y="36" fill="white" className="text-[10px] font-mono font-semibold select-none pointer-events-none" textAnchor="middle">
                            Legacy Dev API
                          </text>
                          <text y="46" fill="#718096" className="text-[9px] font-mono select-none pointer-events-none" textAnchor="middle">
                            {isolatedAssets["ASSET-003"] ? '[DMZ-隔离]' : '192.168.12.33'}
                          </text>

                          {patchedAssets["ASSET-003"] && (
                            <g transform="translate(15, -15)">
                              <circle r="5" fill="#10b981" stroke="#12181d" strokeWidth="1" />
                              <path d="M-2.5 0 L-0.8 1.8 L2.5 -1.5" fill="none" stroke="white" strokeWidth="1" />
                            </g>
                          )}
                          {renderAssetNodeSparkline("ASSET-003", 56)}
                        </g>
                      );
                    })()}

                    {/* 4. ASSET-004 (Active Directory Corporate Domain Controller) */}
                    {(() => {
                      const pos = nodePositions["ASSET-004"] || { x: 580, y: 320 };
                      const op = (graphEnvFilter === 'All' || graphEnvFilter === 'Production') ? 1.0 : 0.15;
                      const hasAlert = alerts.some(a => a.targetAssetId === "ASSET-004" && a.status !== "Remediated");
                      const isCritical = alerts.some(a => a.targetAssetId === "ASSET-004" && a.severity === "Critical" && !patchedAssets["ASSET-004"]);
                      const isNewAlert = alerts.some(a => a.targetAssetId === "ASSET-004" && a.status === "New" && !patchedAssets["ASSET-004"]);
                      const isSelected = selectedGraphAssetId === "ASSET-004";

                      return (
                        <g 
                          transform={`translate(${pos.x}, ${pos.y})`} 
                          className="node-group cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-150"
                          data-node-id="ASSET-004"
                          onClick={(e) => { e.stopPropagation(); setSelectedGraphAssetId("ASSET-004"); }}
                          opacity={op}
                        >
                          {isSelected && (
                            <circle r="34" fill="none" stroke="#00d4ff" strokeWidth="2.0" strokeDasharray="3 2" className="animate-spin" style={{ animationDuration: '6s' }} />
                          )}
                          {isolatedAssets["ASSET-004"] && (
                            <circle r="24" fill="url(#isolation-stripes)" className="animate-pulse" />
                          )}
                          {shieldedAssets["ASSET-004"] && (
                            <circle r="30" fill="none" stroke="#10b981" strokeWidth="1.8" className="animate-shield-glow" strokeDasharray="4 2" />
                          )}
                          {isCritical && (
                            <circle r="32" fill="none" stroke="#f43f5e" className="animate-critical-glow-ring" />
                          )}
                          {isNewAlert && (
                            <circle r="32" fill="none" stroke="#dd6b20" strokeWidth="2" className="animate-pulse" />
                          )}

                          <circle r="24" fill="#12181d" stroke={isolatedAssets["ASSET-004"] ? "#d97706" : (hasAlert && !patchedAssets["ASSET-004"] ? "#ff7700" : "#4a5568")} strokeWidth="2.0" />
                          <Server className={`w-4.5 h-4.5 -translate-x-2.25 -translate-y-2.25 pointer-events-none ${isolatedAssets["ASSET-004"] ? 'text-amber-500' : 'text-orange-400'}`} />
                          
                          <text y="38" fill="white" className="text-[10px] font-mono font-semibold select-none pointer-events-none" textAnchor="middle">
                            AD DomainController
                          </text>
                          <text y="48" fill="#718096" className="text-[9px] font-mono select-none pointer-events-none" textAnchor="middle">
                            {isolatedAssets["ASSET-004"] ? '[LOCKED DOWN]' : '10.100.2.10'}
                          </text>

                          {patchedAssets["ASSET-004"] && (
                            <g transform="translate(16, -16)">
                              <circle r="5.5" fill="#10b981" stroke="#12181d" strokeWidth="1" />
                              <path d="M-2.7 0 L-0.9 1.9 L2.7 -1.6" fill="none" stroke="white" strokeWidth="1" />
                            </g>
                          )}
                          {renderAssetNodeSparkline("ASSET-004", 56)}
                        </g>
                      );
                    })()}

                    {/* 5. ASSET-005 (Billing Payments API Server) */}
                    {(() => {
                      const pos = nodePositions["ASSET-005"] || { x: 380, y: 320 };
                      const op = (graphEnvFilter === 'All' || graphEnvFilter === 'Production') ? 1.0 : 0.15;
                      const hasAlert = alerts.some(a => a.targetAssetId === "ASSET-005" && a.status !== "Remediated");
                      const isCritical = alerts.some(a => a.targetAssetId === "ASSET-005" && a.severity === "Critical" && !patchedAssets["ASSET-005"]);
                      const isSelected = selectedGraphAssetId === "ASSET-005";

                      return (
                        <g 
                          transform={`translate(${pos.x}, ${pos.y})`} 
                          className="node-group cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-150"
                          data-node-id="ASSET-005"
                          onClick={(e) => { e.stopPropagation(); setSelectedGraphAssetId("ASSET-005"); }}
                          opacity={op}
                        >
                          {isSelected && (
                            <circle r="34" fill="none" stroke="#00d4ff" strokeWidth="2.0" strokeDasharray="3 2" className="animate-spin" style={{ animationDuration: '6s' }} />
                          )}
                          {isolatedAssets["ASSET-005"] && (
                            <circle r="24" fill="url(#isolation-stripes)" className="animate-pulse" />
                          )}
                          {shieldedAssets["ASSET-005"] && (
                            <circle r="30" fill="none" stroke="#10b981" strokeWidth="1.8" className="animate-shield-glow" strokeDasharray="4 2" />
                          )}
                          {isCritical && (
                            <circle r="32" fill="none" stroke="#f43f5e" className="animate-critical-glow-ring" />
                          )}

                          <circle r="24" fill="#12181d" stroke={isolatedAssets["ASSET-005"] ? "#d97706" : (hasAlert && !patchedAssets["ASSET-005"] ? "#ff0077" : "#00d4ff")} strokeWidth="2.0" />
                          <Database className={`w-4.5 h-4.5 -translate-x-2.25 -translate-y-2.25 pointer-events-none ${isolatedAssets["ASSET-005"] ? 'text-amber-500' : 'text-cyber-blue'}`} />
                          
                          <text y="38" fill="white" className="text-[10px] font-mono font-semibold select-none pointer-events-none" textAnchor="middle">
                            Payments API
                          </text>
                          <text y="48" fill="#718096" className="text-[9px] font-mono select-none pointer-events-none" textAnchor="middle">
                            {isolatedAssets["ASSET-005"] ? '[ISOLATED ENCLAVE]' : '10.100.1.80'}
                          </text>

                          {patchedAssets["ASSET-005"] && (
                            <g transform="translate(16, -16)">
                              <circle r="5.5" fill="#10b981" stroke="#12181d" strokeWidth="1" />
                              <path d="M-2.7 0 L-0.9 1.9 L2.7 -1.6" fill="none" stroke="white" strokeWidth="1" />
                            </g>
                          )}
                          {renderAssetNodeSparkline("ASSET-005", 56)}
                        </g>
                      );
                    })()}

                  </g>
                </svg>
              </div>

              {/* Bottom explanatory block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-cyber-black p-4 rounded-lg border border-cyber-border text-[11px] leading-relaxed font-sans shadow-inner">
                <div>
                  <span className="font-semibold text-white block mb-1">🔍 Dynamic Visual Guides:</span>
                  <p className="text-slate-400">• Nodes connected in cyan lasers stream clean telemetry flows across port parameters.</p>
                  <p className="text-slate-400">• Glowing red rings represent <strong className="text-rose-450 font-bold">Critical exploitable vectors</strong>. Patch the software or shield the virtual node to mitigate.</p>
                </div>
                <div>
                  <span className="font-semibold text-white block mb-1">🛡️ Containment Protocols:</span>
                  <p className="text-slate-400">• Isolating a server visually blocks routing links (dashed gray paths) to airground potential cascading threat transfers safely.</p>
                  <p className="text-slate-400">• WAF shields introduce dynamic rules, lowering susceptibility index overlays instantly.</p>
                </div>
              </div>
            </div>

            {/* Right 1 Column: Security Asset Intelligence Sidebar Console */}
            <div className="xl:col-span-1 flex flex-col bg-[#050914]/95 border border-cyber-border rounded-xl shadow-xl overflow-hidden h-[730px]">
              
              {/* Header */}
              <div className="bg-[#03060f] px-4 py-3 border-b border-cyber-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-cyber-blue shadow-[0_0_8px_rgba(99,102,241,0.15)]">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-white uppercase">HARDENING SIMULATOR</h3>
                    <p className="text-[9px] font-sans text-slate-500">Node-Level SOC Sandbox Control Console</p>
                  </div>
                </div>
                {selectedGraphAssetId && (
                  <span className="text-[8.5px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                    Inspecting {selectedGraphAssetId}
                  </span>
                )}
              </div>

              {/* Sidebar Scrollable Body */}
              {(() => {
                const node = assets.find(a => a.id === selectedGraphAssetId);
                
                if (!node) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <Cpu className="w-8 h-8 text-slate-600 mb-3 animate-pulse" />
                      <p className="text-xs font-mono">No active node targeted.</p>
                      <p className="text-[10px] text-slate-500 mt-1">Select an online system in the Layer 3 map to initialize local telemetry diagnostics.</p>
                    </div>
                  );
                }

                // Dynamic calculations
                const nodeAlerts = alerts.filter(a => a.targetAssetId === node.id && !patchedAssets[node.id]);
                const hostVulns = vulnerabilities.filter(v => node.vulnerabilities.includes(v.cve));
                
                // Risk coefficient calculations
                const baseScoreSum = nodeAlerts.reduce((sum, a) => sum + a.baseScore, 0);
                const isContained = isolatedAssets[node.id] || false;
                const isShielded = shieldedAssets[node.id] || false;
                const isPatched = patchedAssets[node.id] || false;

                let dynamicRiskScore = (node.criticality * 1.5) + (baseScoreSum * 0.82);
                if (isShielded) dynamicRiskScore *= 0.45; // WAF decreases susceptibility
                if (isContained) dynamicRiskScore *= 0.15; // Isolation drops external risk vectors
                if (isPatched) dynamicRiskScore = 0.5; // Completely cleaned
                dynamicRiskScore = parseFloat(Math.max(0.1, Math.min(10, dynamicRiskScore)).toFixed(2));

                const riskColor = dynamicRiskScore >= 8.5 ? 'text-rose-500 border-rose-550/20 bg-rose-950/25' : 
                                  dynamicRiskScore >= 6.0 ? 'text-amber-500 border-amber-550/20 bg-amber-950/30' : 
                                  dynamicRiskScore >= 3.0 ? 'text-cyan-400 border-cyan-550/20 bg-cyan-950/25' : 
                                  'text-emerald-450 border-emerald-550/20 bg-emerald-950/25';

                return (
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-5 text-sans text-xs">
                    
                    {/* Identity & Metadata Panel Card */}
                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 flex gap-3 items-start relative overflow-hidden">
                      {/* Subnet watermark */}
                      <div className="absolute right-2 bottom-2 text-[20px] font-mono text-slate-800/10 font-bold pointer-events-none select-none">
                        VLAN-{node.environment === 'Production' ? '100' : '200'}
                      </div>
                      
                      <div className="p-2 bg-slate-900 border border-slate-700/60 rounded text-cyber-blue shrink-0">
                        {node.type === 'Database' ? <Database className="w-5 h-5 text-cyber-magenta" /> : <Server className="w-5 h-5 text-cyber-blue" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-mono font-bold text-white text-[12px] tracking-tight">{node.name}</h4>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                          <span>IP: <strong className="text-slate-350">{node.ip}</strong></span>
                          <span>&bull;</span>
                          <span>Domain: <strong className="text-slate-350">{node.domain}</strong></span>
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">OWNER: {node.owner || 'SOC Admin'}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono ${node.environment === 'Production' ? 'bg-indigo-950/40 text-cyber-blue border-indigo-500/20' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                            {node.environment.toUpperCase()} VLAN
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Integrated dynamic telemetry meters */}
                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className={`border p-3 rounded-lg flex flex-col gap-1 items-center justify-center text-center ${riskColor}`}>
                        <span className="text-[8px] uppercase tracking-wider font-mono text-slate-500 font-bold block">Dynamic Susceptibility</span>
                        <div className="text-lg font-mono font-extrabold flex items-baseline gap-0.5">
                          {dynamicRiskScore}
                          <span className="text-[10px] text-slate-500 font-normal">/10</span>
                        </div>
                        <span className="text-[7.5px] font-mono font-bold uppercase mt-1">
                          {dynamicRiskScore >= 8.5 ? '🔴 RED LEVEL CRITICAL' : dynamicRiskScore >= 6.0 ? '🟠 HIGH THREAT ALERT' : dynamicRiskScore >= 3.0 ? '🔵 DEGRADED RISK' : '🟢 CRYPTO HARDENED'}
                        </span>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg flex flex-col gap-1 items-center justify-center text-center">
                        <span className="text-[8px] uppercase tracking-wider font-mono text-slate-500 font-bold block">Exploit Indicators</span>
                        <div className="text-lg font-mono font-extrabold text-white">
                          {nodeAlerts.length} <span className="text-xs font-normal text-slate-500 font-sans">Unpatched</span>
                        </div>
                        <span className="text-[7.5px] font-mono text-slate-500 uppercase mt-1">
                          {nodeAlerts.some(a => a.severity === 'Critical') ? '☠️ CRITICAL INGRESS' : nodeAlerts.length > 0 ? '📡 OUTSTANDING CVE' : '🛡️ DEPLOYMENT SOLID'}
                        </span>
                      </div>
                    </div>

                    {/* HARDENING MITIGATION CONTROLS PANEL */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Mitigation Controls Simulator</span>
                      
                      {/* Action 1: CONTAIN / AIR-GAP ISOLATE */}
                      <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                        isContained 
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' 
                          : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}>
                        <div className="space-y-0.5 max-w-[70%]">
                          <span className="font-mono font-bold text-[10.5px] block flex items-center gap-1 text-slate-200">
                            {isContained ? '🌟 Air-Gap Containment Active' : '🔌 Contain & Isolate Gateway'}
                          </span>
                          <span className="text-[9px] text-slate-500 block leading-tight">
                            {isContained ? 'Mitigates lateral threat traversal by severing routing.' : 'Cut VLAN ingress paths. Completely isolates node.'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsolatedAssets(prev => {
                              const updated = { ...prev, [node.id]: !prev[node.id] };
                              addSystemChatMessage(updated[node.id] 
                                ? `SIMULATION: Activated complete logical isolation containment zone for host ${node.id} (${node.name}).` 
                                : `SIMULATION: Deactivated containment for host ${node.id}. Network interfaces re-routed.`);
                              return updated;
                            });
                          }}
                          className={`p-1 px-2 rounded text-[9.5px] font-mono font-bold transition-all duration-150 cursor-pointer border ${
                            isContained 
                              ? 'bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400' 
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {isContained ? 'DEACTIVATE' : 'ACTIVATE'}
                        </button>
                      </div>

                      {/* Action 2: ENABLE WAF SHIELD FORCEFIELD */}
                      <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                        isShielded 
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                          : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}>
                        <div className="space-y-0.5 max-w-[70%]">
                          <span className="font-mono font-bold text-[10.5px] block flex items-center gap-1 text-slate-200">
                            {isShielded ? '🛡️ Enhanced WAF Rules Live' : '💠 Inject WAF Protective Shield'}
                          </span>
                          <span className="text-[9px] text-slate-500 block leading-tight">
                            {isShielded ? 'Exploit vectors blocked. Risk decreased by 55%.' : 'Deploy regex filters to protect host against script anomalies.'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setShieldedAssets(prev => {
                              const updated = { ...prev, [node.id]: !prev[node.id] };
                              addSystemChatMessage(updated[node.id] 
                                ? `SIMULATION: Injected real-time protective WAF filters protecting host ${node.id} from SQL_Injection / exploit requests.` 
                                : `SIMULATION: Disabled protective WAF filters on ${node.id}. Node risk susceptibility reset.`);
                              return updated;
                            });
                          }}
                          className={`p-1 px-2 rounded text-[9.5px] font-mono font-bold transition-all duration-150 cursor-pointer border ${
                            isShielded 
                              ? 'bg-emerald-500 text-slate-950 border-emerald-300 hover:bg-emerald-400' 
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {isShielded ? 'REMOVE' : 'ENGAGE WAF'}
                        </button>
                      </div>

                      {/* Action 3: FIRMWARE PATCH / RE-CERTIFY */}
                      <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                        isPatched 
                          ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300' 
                          : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}>
                        <div className="space-y-0.5 max-w-[70%]">
                          <span className="font-mono font-bold text-[10.5px] block flex items-center gap-1 text-slate-200">
                            {isPatched ? '✅ Node Firmware Fully Patched' : '🔧 Hot-Patch Vulnerability CVEs'}
                          </span>
                          <span className="text-[9px] text-slate-500 block leading-tight">
                            {isPatched ? 'CVE alerts resolved. Risk drops to nominal.' : 'Resolves active exploits. Clears glow overlays.'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setPatchedAssets(prev => {
                              const updated = { ...prev, [node.id]: !prev[node.id] };
                              addSystemChatMessage(updated[node.id] 
                                ? `SIMULATION: Successfully compiled and applied patch bundle resolving CVE warnings on ${node.id}.` 
                                : `SIMULATION: Rolled back firmware patch bundle on ${node.id}. Prior alerts restored.`);
                              return updated;
                            });
                          }}
                          className={`p-1 px-2 rounded text-[9.5px] font-mono font-bold transition-all duration-150 cursor-pointer border ${
                            isPatched 
                              ? 'bg-indigo-500 text-white border-indigo-300 hover:bg-indigo-400' 
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {isPatched ? 'ROLLBACK' : 'PATCH CVEs'}
                        </button>
                      </div>
                    </div>

                    {/* DYNAMIC ASSOCIATED ALERT INGRESS TIMELINE */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Active Threat Log ({nodeAlerts.length})</span>
                      {nodeAlerts.length === 0 ? (
                        <div className="p-3 text-center border border-slate-850 border-dashed rounded text-[10px] text-slate-500 font-mono">
                          No outstanding unpatched alert threats detected. Node status healthy.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                          {nodeAlerts.map(al => (
                            <div key={al.id} className="bg-slate-950 p-2 border border-slate-900 rounded flex flex-col gap-1 hover:border-slate-855 transition-all font-mono">
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="font-extrabold text-white">{al.id}</span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold text-[8px] ${getSeverityStyle(al.severity)}`}>
                                  {al.severity}
                                </span>
                              </div>
                              <span className="text-[10px] font-sans font-semibold text-slate-300 truncate block leading-tight">{al.title}</span>
                              <div className="flex justify-between text-[8px] text-slate-500">
                                <span>CVE: <span className="text-slate-400">{al.cve}</span></span>
                                <span>Score: <span className="text-slate-400 font-bold">{al.baseScore}</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* MAPPED SYSTEM VULNERABILITIES LIST */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Vulnerabilities Deck ({hostVulns.length})</span>
                      <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                        {hostVulns.map(v => (
                          <div key={v.cve} className="bg-slate-950 border border-slate-900 rounded p-2.5 space-y-1 font-mono">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-[#00d4ff] text-[10px]">{v.cve}</span>
                              <div className="flex gap-1.5">
                                <span className="text-[8px] px-1 bg-slate-900 text-slate-400 border border-slate-800 rounded font-normal">EPSS: {v.epssScore}</span>
                                {v.cisaKev && (
                                  <span className="text-[8px] px-1 bg-amber-950/20 text-amber-500 border border-amber-500/20 rounded font-bold uppercase">CISA KEV</span>
                                )}
                              </div>
                            </div>
                            <span className="font-sans font-bold text-slate-300 text-[10.5px] block leading-tight">{v.title}</span>
                            <p className="font-sans text-[9px] text-slate-500 leading-tight block">{v.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>

          </div>
        )}
        {activeTab === 'logs' && (
          <AuditLogsView logs={auditLogs} onRefresh={fetchData} />
        )}

        {/* TAB 3: CORE BLUEPRINTS HUB (THE 19 PARTS DOCUMENTATION EXPLORER ARCHITECTURE) */}
        {activeTab === 'blueprints' && (
          <DocumentationHub />
        )}

      </main>

      {/* 3. Footer credits */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 px-6 text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider shrink-0 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span>Enterprise Cybersecurity SOC/SOAR Research Platform</span>
          <span>Aligned with CISA, FIRST EPSS, & OWASP ASVS Standards</span>
        </div>
      </footer>

      {/* Vulnerability details drawer overlay */}
      <VulnerabilityDetailsDrawer
        vulnerability={activeAlert ? vulnerabilities.find(v => v.cve === activeAlert.cve) : undefined}
        baseScore={activeAlert?.baseScore || 0}
        isOpen={isVulnDrawerOpen}
        onClose={() => setIsVulnDrawerOpen(false)}
        asset={activeAlert ? assets.find(a => a.id === activeAlert.targetAssetId) : undefined}
      />

      {/* CVSS Calculator Modal Overlay */}
      <CVSSCalculator
        isOpen={isCVSSCalcOpen}
        onClose={() => setIsCVSSCalcOpen(false)}
        onApply={(score) => {
          setBaseSeverity(score);
        }}
      />

      {/* RBAC State Blockade Pop-up Warning Display */}
      {rbacBlockade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in text-left font-sans">
          <div className="bg-[#030712] border border-rose-500/50 w-full max-w-md rounded-2xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.18)] relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header elements */}
            <div className="flex items-center gap-3 pb-3 border-b border-rose-500/20">
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-450 animate-pulse">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-rose-400 tracking-wider uppercase">Privilege Check Rejected</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">SOAR CORE PROTOCOL GUARD</p>
              </div>
            </div>

            {/* Description Body */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Your cryptographic login profile does not hold the access clearance level necessary to execute this operational routine.
              </p>

              <div className="bg-[#02050e] p-3.5 border border-slate-900 rounded-xl space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Attempted Action:</span>
                  <span className="text-[#f1f5f9] font-bold">{rbacBlockade.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Your Current Profile:</span>
                  <span className="text-rose-400 font-bold">{rbacBlockade.currentRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Required Clearance:</span>
                  <span className="text-emerald-400 font-black tracking-wide">{rbacBlockade.requiredClearance}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                Reason: Regulatory security guidelines prevent compliance auditors and operator-level profiles from altering baseline metrics or executing deconstructive actions directly. Log out in the header and sign in with the Lead Analyst (passphrase: "admin") profile to bypass.
              </p>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-900 flex justify-end">
              <button
                onClick={() => setRbacBlockade(null)}
                className="px-4 py-2 font-mono font-bold text-[10.5px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none"
              >
                Acknowledge & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
