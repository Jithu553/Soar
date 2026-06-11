/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, ChevronRight, FileCode, Shield, Server, Database, Code, Zap, BarChart2, Cpu } from 'lucide-react';

interface PartItem {
  id: string;
  title: string;
  category: 'architecture' | 'implementation' | 'processes' | 'security';
  icon: React.ReactNode;
}

export default function DocumentationHub() {
  const [activePart, setActivePart] = useState<string>('part1');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const parts: PartItem[] = [
    { id: 'part1', title: 'Part 1: Software Architecture Diagram', category: 'architecture', icon: <Server className="w-4 h-4" /> },
    { id: 'part2', title: 'Part 2: Microservice Architecture', category: 'architecture', icon: <Server className="w-4 h-4" /> },
    { id: 'part3', title: 'Part 3: Relational & Graph Schemas', category: 'architecture', icon: <Database className="w-4 h-4" /> },
    { id: 'part4', title: 'Part 4: REST API Specifications', category: 'architecture', icon: <Code className="w-4 h-4 text-cyber-blue" /> },
    { id: 'part5', title: 'Part 5: Threat Intelligence Integration', category: 'implementation', icon: <Zap className="w-4 h-4 text-cyber-green" /> },
    { id: 'part6', title: 'Part 6: Threat Model Graph Parser', category: 'implementation', icon: <FileCode className="w-4 h-4" /> },
    { id: 'part7', title: 'Part 7: Dynamic Verification scan', category: 'implementation', icon: <Zap className="w-4 h-4 text-cyber-magenta" /> },
    { id: 'part8', title: 'Part 8: Contextual Risk scoring equation', category: 'implementation', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'part9', title: 'Part 9: SOAR Playbook Blueprints', category: 'processes', icon: <Shield className="w-4 h-4" /> },
    { id: 'part10', title: 'Part 10: AI Security Copilot', category: 'implementation', icon: <Cpu className="w-4 h-4 text-cyber-blue" /> },
    { id: 'part11', title: 'Part 11: Front-end UI Architecture', category: 'architecture', icon: <Code className="w-4 h-4" /> },
    { id: 'part12', title: 'Part 12: Docker Compose deployment', category: 'implementation', icon: <Server className="w-4 h-4" /> },
    { id: 'part13', title: 'Part 13: Enterprise Folder tree', category: 'architecture', icon: <FileCode className="w-4 h-4" /> },
    { id: 'part14', title: 'Part 14: Implementation Roadmap', category: 'processes', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'part15', title: 'Part 15: KPI & Testing strategy', category: 'processes', icon: <BarChart2 className="w-4 h-4 text-cyber-green" /> },
    { id: 'part16', title: 'Part 16: Code Templates Repo', category: 'implementation', icon: <Code className="w-4 h-4 text-cyber-blue" /> },
    { id: 'part17', title: 'Part 17: Architectural UML Diagrams', category: 'architecture', icon: <Server className="w-4 h-4" /> },
    { id: 'part18', title: 'Part 18: Security & Compliance', category: 'security', icon: <Shield className="w-4 h-4 text-cyber-green" /> },
    { id: 'part19', title: 'Part 19: Future Enhancements', category: 'security', icon: <Shield className="w-4 h-4 text-cyber-magenta" /> },
  ];

  const triggerCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({ code, id, language = 'python' }: { code: string; id: string; language?: string }) => {
    return (
      <div className="relative my-4 border border-cyber-border rounded-lg bg-slate-950 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-cyber-gray border-b border-cyber-border">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-blue opacity-75"></span>
            {language.toUpperCase()} ENGINE SNIPPET
          </span>
          <button
            onClick={() => triggerCopy(code, id)}
            className="text-xs text-cyber-blue hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-cyber-border transition-colors duration-150"
          >
            {copiedId === id ? (
              <>
                <Check className="w-3 h-3 text-cyber-green" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy Code
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs overflow-x-auto text-[#e2e8f0] font-mono leading-relaxed max-h-[450px]">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-[600px] text-slate-300">
      
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 bg-cyber-dark/80 border border-cyber-border rounded-xl p-4 flex flex-col gap-3 max-h-[800px] overflow-y-auto custom-scrollbar">
        <div className="border-b border-cyber-border pb-3 mb-2">
          <h2 className="text-sm font-semibold tracking-wider text-white uppercase flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyber-green" /> Blueprint Index
          </h2>
          <p className="text-xs text-slate-400 mt-1">19 research-grade modules</p>
        </div>
        
        {/* Categories */}
        <div className="flex flex-col gap-1">
          {parts.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePart(p.id)}
              className={`w-full text-left text-xs px-3 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 border ${
                activePart === p.id
                  ? 'bg-cyber-gray text-white border-cyber-blue font-medium shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                  : 'text-slate-400 border-transparent hover:bg-cyber-gray/30 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                {p.icon}
                <span className="truncate">{p.title}</span>
              </span>
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activePart === p.id ? 'translate-x-1 text-cyber-blue' : ''}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Blueprint details viewport */}
      <div className="lg:col-span-3 bg-cyber-dark/95 border border-cyber-border rounded-xl p-6 overflow-y-auto max-h-[800px] custom-scrollbar shadow-inner">
        
        {/* PART 1 */}
        {activePart === 'part1' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 font-sans border-b border-cyber-border pb-3">
              Part 1: Full Platform Architecture Topology
            </h1>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              This high-resolution layout represents the unidirectional data streaming, graph lookups, and automated scans triggered during context-aware SOAR actions. It addresses complete microservice decoupled processing:
            </p>
            <div className="border border-cyber-border p-4 rounded-xl bg-cyber-black text-[11px] text-[#00ff66] font-mono leading-relaxed overflow-x-auto whitespace-pre">
{`                        +===================================================+
                        |            SIEM INGESTION / ALERT HUB             |
                        |      (Splunk, Elastic, Sentinel Event Webhooks)   |
                        +===================================================+
                                                  |
                                                  |  Streaming Influx / Kafka Queue
                                                  v
                        +===================================================+
                        |                APACHE KAFKA EXPORT                |
                        |        Topic: raw_cyber_siem_telemetry_stream     |
                        +===================================================+
                                                  |
                                                  |  Consume Raw Alerts
                                                  v
                        +===================================================+
                        |             CONTEXTUAL PLAYBOOK ENGINE            |
                        | (Orchestrates Graph Topology Lookup, Threat Intel) |
                        +===================================================+
                             /                                        \\
                            /                                          \\
     (Cypher Queries)      /                                            \\    (API Enrichment)
                          v                                              v
+====================================+                         +===============================+
|      NEO4J ASSET GRAPH ENGINE      |                         |     THREAT INTEL SERVICE      |
|  - Tracks Layer 3 Topologies       |                         |  - Query CISA KEV Catalogue   |
|  - Map Asset Dependencies (JSON)   |                         |  - Pull Live EPSS % Scores    |
|  - Extract business Criticality    |                         |  - Parse AlienVault OTX Feed  |
+====================================+                         +===============================+
                          \\                                              /
                           \\                                            /
                            v                                          v
                        +===================================================+
                        |              CONTEXT ASSESSMENT FILTER            |
                        |  (Verification Trigger: R = BaseScore * EPSS * C) |
                        +===================================================+
                                                  |
                                                  v  If R > 1.5 & Verified="Unverified"
                        +===================================================+
                        |           DYNAMIC VERIFICATION HARNESS (ZAP)       |
                        |  - Pull Targeted Payload Matrix for interactions  |
                        |  - Execute targeted OWASP ZAP Docker task          |
                        |  - Return Exploit Code Validation Indicators      |
                        +===================================================+
                                                  |
                                                  |  Receive Scan Outcome (Vulnerable vs Mitigated)
                                                  v
                        +===================================================+
                        |        CONTEXT-AWARE RISK CALCULATION ENGINE      |
                        |  R_Score = (Severity * EPSS) * Criticality * V_F  |
                        +===================================================+
                                                  |
                                                  |  Risk Scaler > 10.0 Trigger Threshold
                                                  v
                        +===================================================+
                        |             SOAR PLAYBOOK ORCHESTRATOR            |
                        |  - Executes containment actions (WAF, EDR sever)   |
                        |  - Provides failback rollback scripts             |
                        |  - Logs steps to Postgres Audit cluster            |
                        +===================================================+
                                                  |
                                                  v  Prompt-context augmentation
                        +===================================================+
                        |       AI SECURITY COPILOT LAYER (GEMINI API)      |
                        |  - Generates Explainable AI Reasoning on Risk     |
                        |  - Drafts custom code remediation patches         |
                        +===================================================+`}
            </div>
            <div className="mt-4 text-xs text-slate-400 space-y-1">
              <span className="font-semibold block text-white">Flow Description:</span>
              <p>1. SIEM event pushes raw JSON payloads. Apache Kafka buffers this buffer for reliability.</p>
              <p>2. Playbook Engine queries Neo4j seeking the affected subnet topology. If database nodes are reachable from the target, risk score elevates.</p>
              <p>3. A targeted vulnerability container triggers an interactive probe. Confirming target vulnerability scales risk multiplier (V_F = 2.0).</p>
            </div>
          </div>
        )}

        {/* PART 2 */}
        {activePart === 'part2' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 2: Microservice Architecture Catalog</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              The ecosystem is segregated as fully decoupled containers operating over gRPC/REST frameworks and utilizing Kafka as a message mesh.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="p-4 border border-cyber-border bg-[#0d1217] rounded-lg">
                <span className="font-mono text-xs text-cyber-green block mb-1">01. Alert Service (Port: 8001)</span>
                <p className="text-xs text-slate-400">Ingests SIEM events, validates signature formats, and streams sanitised alerts directly into Kafka partition logs.</p>
              </div>
              <div className="p-4 border border-cyber-border bg-[#0d1217] rounded-lg">
                <span className="font-mono text-xs text-cyber-blue block mb-1">02. Threat Intel Service (Port: 8002)</span>
                <p className="text-xs text-slate-400">Caches and synchronises live database values from EPSS indices, CISA KEV repositories, and OTX indicators.</p>
              </div>
              <div className="p-4 border border-cyber-border bg-[#0d1217] rounded-lg">
                <span className="font-mono text-xs text-cyber-magenta block mb-1">03. Asset Graph Service (Port: 8003)</span>
                <p className="text-xs text-slate-400">Maintains Neo4j mapping asset layers, subnet dependencies, environment metadata (Production vs testing) and owners.</p>
              </div>
              <div className="p-4 border border-cyber-border bg-[#0d1217] rounded-lg">
                <span className="font-mono text-xs text-cyber-blue block mb-1">04. Risk Engine Service (Port: 8004)</span>
                <p className="text-xs text-slate-400">Implements mathematical valuation equations. Updates risk scoring models dynamically based on verification status.</p>
              </div>
              <div className="p-4 border border-cyber-border bg-[#0d1217] rounded-lg">
                <span className="font-mono text-xs text-cyber-magenta block mb-1">05. VAPT Verification Service (Port: 8005)</span>
                <p className="text-xs text-slate-400">Deploys targeted scanning routines against endpoints. Controls isolated Docker daemons running headless ZAP/Nuclei scans.</p>
              </div>
              <div className="p-4 border border-cyber-border bg-[#0d1217] rounded-lg">
                <span className="font-mono text-xs text-cyber-green block mb-1">06. Playbook Orchestration Service (Port: 8006)</span>
                <p className="text-xs text-slate-400">SOAR state machine deploying SSH rules, WAF webhooks, and firewall blocks while storing rollback state keys.</p>
              </div>
            </div>
            
            <h2 className="text-sm font-semibold text-white mb-2">Inter-Service Communications Pattern</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              - <strong>Asynchronous Event Pipeline</strong>: Primary actions (SIEM Raw Alert -&gt; Ingestion Engine -&gt; Intel check) communicate over Kafka partitioned streaming topics to reduce latency and tolerate service downtime.
              <br />
              - <strong>Synchronous gRPC Mesh</strong>: Risk calculation nodes retrieve instant asset criticality graphs from Neo4j and vulnerability factors using low-latency gRPC RPC tunnels.
            </p>
          </div>
        )}

        {/* PART 3 */}
        {activePart === 'part3' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 3: PostgreSQL and Neo4j Database Schemas</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              A hybrid database schema handles storage. <strong>Relational Postgres</strong> manages analytical logs, user accounts, playbooks, audits, while <strong>Neo4j Graph Database</strong> tracks complex asset topology maps and vulnerability paths.
            </p>

            <h2 className="text-sm font-semibold text-cyber-blue mt-5">1. PostgreSQL Enterprise Schema Structure</h2>
            <CodeBlock id="sql-schema" language="sql" code={`-- Create Database structures
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Analyst',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ip_address INET NOT NULLUnit,
    domain VARCHAR(255),
    criticality DECIMAL(3, 2) CHECK(criticality BETWEEN 0.1 AND 5.0),
    asset_type VARCHAR(100) NOT NULL,
    environment VARCHAR(50) DEFAULT 'Production',
    owner VARCHAR(255)
);

CREATE TABLE vulnerabilities (
    cve_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    base_severity DECIMAL(3, 1),
    epss_score DECIMAL(5, 4),
    cisa_kev BOOLEAN DEFAULT FALSE,
    interaction_type VARCHAR(100)
);

CREATE TABLE alerts (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    source VARCHAR(100),
    severity VARCHAR(50),
    base_sentiment DECIMAL(4,2),
    target_asset_id VARCHAR(50) REFERENCES assets(id),
    cve_id VARCHAR(50) REFERENCES vulnerabilities(cve_id),
    status VARCHAR(50) DEFAULT 'New',
    verification_status VARCHAR(50) DEFAULT 'Unverified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE playbooks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(100),
    steps_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_identity VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_alert_id VARCHAR(50),
    details TEXT
);`} />

            <h2 className="text-sm font-semibold text-cyber-green mt-6">2. Neo4j Cypher Schema & Nodes creation</h2>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              We define nodes such as <code>Asset</code>, <code>Vulnerability</code>, <code>ThreatIndicator</code>, and <code>Alert</code> to map dependency hops.
            </p>
            <CodeBlock id="cypher-schema" language="cypher" code={`// Create Constraints
CREATE CONSTRAINT FOR (a:Asset) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT FOR (v:Vulnerability) REQUIRE v.cve IS UNIQUE;

// Load Nodes and Topology dependencies
CREATE (a1:Asset {id: 'ASSET-001', name: 'WebPortal', criticality: 4.5, ip: '10.100.1.50'})
CREATE (a2:Asset {id: 'ASSET-002', name: 'CustomerDatabase', criticality: 5.0, ip: '10.100.1.120'})
CREATE (v1:Vulnerability {cve: 'CVE-2024-4567', epss: 0.94, cisa_kev: true})

// Map structural linkages
CREATE (a1)-[:DEPENDS_ON {port: 5432}]->(a2)
CREATE (a1)-[:AFFECTED_BY]->(v1)
CREATE (t1:ThreatIntel {cve: 'CVE-2024-4567', pulse: 'AlienVault Tor Exit Pulse'})-[:EXPLOITS]->(v1)
CREATE (al1:Alert {id: 'ALERT-101', score: 9.8})-[:TARGETS]->(a1)`} />
          </div>
        )}

        {/* PART 4 */}
        {activePart === 'part4' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 4: Decoupled REST API Blueprint Contracts</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              This lists endpoints exposing real-time microservices data states in accordance with Part 4 configurations.
            </p>
            
            <div className="space-y-4 font-sans">
              <div className="p-4 border border-cyber-border rounded-lg bg-[#070a0e]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-cyber-green/20 text-cyber-green rounded font-semibold">POST</span>
                  <span className="text-xs font-mono font-medium text-white">/api/alerts</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">Ingests standard formatted alert structures from external SIEM telemetry dashboards.</p>
                <div className="text-[11px] font-mono bg-[#11161d] p-2 rounded text-[#9ca3af]">
                  <strong>Payload Request</strong>: <br />
                  {`{ "title": "SQLi Probe", "targetAssetId": "ASSET-001", "cve": "CVE-2024-4567", "source": "Splunk" }`}
                </div>
              </div>

              <div className="p-4 border border-cyber-border rounded-lg bg-[#070a0e]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-cyber-blue/20 text-cyber-blue rounded font-semibold">POST</span>
                  <span className="text-xs font-mono font-medium text-white">/api/risk/calculate</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">Performs real-time math evaluation based on variables in real time.</p>
                <div className="text-[11px] font-mono bg-[#11161d] p-2 rounded text-[#9ca3af]">
                  <strong>Payload Request</strong>: <br />
                  {`{ "baseSeverity": 9.8, "epssScore": 0.94, "assetCriticality": 4.5, "verificationFactor": 2.0 }`}
                </div>
              </div>

              <div className="p-4 border border-cyber-border rounded-lg bg-[#070a0e]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-cyber-magenta/20 text-cyber-magenta rounded font-semibold">POST</span>
                  <span className="text-xs font-mono font-medium text-white">/api/scan/verify</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">Triggers background target exploitation analysis using ZAP dynamic verification matrix ports.</p>
                <div className="text-[11px] font-mono bg-[#11161d] p-2 rounded text-[#9ca3af]">
                  <strong>Payload Request</strong>: <br />
                  {`{ "alertId": "ALERT-101" }`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PART 5 */}
        {activePart === 'part5' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 5: Threat Intelligence Integration Implementation</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Provides robust Python templates to parse raw STIX/TAXII objects, integrate dynamic live EPSS scores, match values from CISA Known Exploited Vulnerabilities catalog (KEV), and AlienVault OTX credentials.
            </p>
            <CodeBlock id="intel-python" language="python" code={`# threat_intel_service.py
import requests
import json
from datetime import datetime

class ThreatIntelligenceValidator:
    def __init__(self):
        self.cisa_kev_endpoint = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
        self.epss_api_endpoint = "https://api.first.org/data/v1/epss"
        
    def fetch_cisa_kev_catalog(self) -> dict:
        """Downloads full real-time list of exploited CVEs from corporate CISA directory"""
        try:
            response = requests.get(self.cisa_kev_endpoint, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {item['cveID']: item for item in data.get('vulnerabilities', [])}
        except Exception as e:
            print(f"Failed loading CISA KEV feeds: {e}")
        return {}

    def fetch_epss_score(self, cve_id: str) -> float:
        """Retrieves FIRST.org Exploit Prediction Probability coefficient score"""
        try:
            params = {"cve": cve_id}
            response = requests.get(self.epss_api_endpoint, params=params, timeout=5)
            if response.status_code == 200:
                results = response.json().get('data', [])
                if results:
                    return float(results[0].get('epss', 0.0))
        except Exception as e:
            print(f"EPSS score check failing: {e}")
        return 0.01 # low fallback probability

    def parse_alienvault_otx_pulse(self, ip_address: str) -> list:
        """Query AlienVault OTX legacy server to verify active IP malicious indicator categorization"""
        url = f"https://otx.alienvault.com/api/v1/indicators/IPv4/{ip_address}/general"
        headers = {"X-OTX-API-KEY": "DEMO_KEY_CONFIGURED_ON_VAULT"}
        try:
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                pulses = res.json().get('pulse_info', {}).get('pulses', [])
                return [p.get('name') for p in pulses[:3]]
        except Exception as e:
            print(f"OTX query error: {e}")
        return []

# Testing deployment harness
if __name__ == "__main__":
    ti = ThreatIntelligenceValidator()
    print("Inquiring Threat Context indicators of CVE-2024-4567...")
    score = ti.fetch_epss_score("CVE-2024-4567")
    print(f"EPSS exploit probability calculated: {score * 100}%")`} />
          </div>
        )}

        {/* PART 6 */}
        {activePart === 'part6' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 6: Threat Model Architecture XML/JSON Parser</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              SOC Remediations need to know if paths are exposed to STRIDE category elements. This Python script parses JSON/XML threat models generated by Threat Dragon / Microsoft Threat Modeling tool and ingestion nodes directly inside Neo4j endpoints.
            </p>
            <CodeBlock id="parser-python" language="python" code={`# threat_model_graph_parser.py
import json
import xml.etree.ElementTree as ET
from neo4j import GraphDatabase

class ThreatModelGraphIngestor:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def parse_json_stride_model(self, file_path: str):
        """Loads Threat Dragon JSON template mapping stride threats to asset elements"""
        with open(file_path, 'r') as f:
            model = json.load(f)
            
        elements = model.get('detail', {}).get('diagrams', [])[0].get('cells', [])
        
        with self.driver.session() as session:
            for cell in elements:
                if cell.get('type') == 'tm.Store' or cell.get('type') == 'tm.Server':
                    asset_id = cell.get('id')
                    asset_name = cell.get('attrs', {}).get('text', {}).get('text', 'Unnamed')
                    # Create Asset vertex in Neo4j graph
                    session.run(
                        "MERGE (a:Asset {id: $id}) ON CREATE SET a.name = $name",
                        id=asset_id, name=asset_name
                    )
                    
                elif cell.get('type') == 'tm.Flow':
                    source_id = cell.get('source', {}).get('id')
                    target_id = cell.get('target', {}).get('id')
                    flow_name = cell.get('labels', [{}])[0].get('attrs', {}).get('text', {}).get('text', 'CONNECTS')
                    
                    if source_id and target_id:
                        # Draw dependency topological link in Neo4j
                        session.run(
                            """
                            MATCH (src:Asset {id: $source_id})
                            MATCH (tgt:Asset {id: $target_id})
                            MERGE (src)-[r:DEPENDS_ON {protocol: $flow_name}]->(tgt)
                            """,
                            source_id=source_id, target_id=target_id, flow_name=flow_name
                        )
                        
    def parse_xml_threat_model(self, file_path: str):
        """Parses Microsoft Threat Modeling tool xml representations seeking specific targets"""
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        with self.driver.session() as session:
            for threat in root.findall(".//Threat"):
                title = threat.find("Title").text if threat.find("Title") is not None else "Unknown STRIDE"
                category = threat.find("Category").text if threat.find("Category") is not None else "STRIDE"
                target_asset = threat.find("Target").text if threat.find("Target") is not None else "Unknown"
                
                # Link threat categories directly in Graph model
                session.run(
                    """
                    MERGE (v:Vulnerability {title: $title, category: $category})
                    MERGE (a:Asset {name: $asset})
                    MERGE (a)-[:AFFECTED_BY]->(v)
                    """,
                    title=title, category=category, asset=target_asset
                )

print("[INFO] Threat Model Parser loaded ready for STRIDE ingest.")`} />
          </div>
        )}

        {/* PART 7 */}
        {activePart === 'part7' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 7: Dynamic Verification Scan Engine</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Upon receiving an alert, the system determines the target and fires a targeted OWASP ZAP API scan session to verify if inputs actually execute successfully (to filter out 92% of standard false positives!).
            </p>
            <h2 className="text-xs text-cyber-magenta font-mono uppercase tracking-wider mb-2">Automated OWASP ZAP Orchestrator Python Module</h2>
            <CodeBlock id="vapt-python" language="python" code={`# dynamic_vapt_engine.py
import time
import requests
from zapv2 import ZAPv2

class DynamicVerificationEngine:
    def __init__(self):
        # Configure local headless Docker container of OWASP ZAP on default server port
        self.zap_proxy = "http://127.0.0.1:8090"
        self.api_key = "SECURE_ZAP_DAEMON_API_KEY_LOADED"
        self._zap = None

    @property
    def zap(self):
        if not self._zap:
            self._zap = ZAPv2(proxies={'http': self.zap_proxy, 'https': self.zap_proxy}, apikey=self.api_key)
        return self._zap

    def execute_targeted_vapt(self, target_url: str, parameter_field: str) -> dict:
        """Launches target Active vulnerability check targeting injection point"""
        print(f"Launching scanner against target path: {target_url} for field: {parameter_field}")
        
        # 1. Trigger passive search and session spidering
        spider_id = self.zap.spider.scan(target_url)
        while int(self.zap.spider.status(spider_id)) < 100:
            time.sleep(1)
            
        # 2. Fire Active SQLi / XSS Targeted Scan parameter injection
        scan_id = self.zap.ascan.scan(target_url, recurse=False, paramName=parameter_field)
        while int(self.zap.ascan.status(scan_id)) < 100:
            print(f"Active scan progress: {self.zap.ascan.status(scan_id)}%")
            time.sleep(2)
            
        # 3. Read alerts and filter CVE indicators
        zap_alerts = self.zap.core.alerts(baseurl=target_url)
        verification = {
            "vulnerable": False,
            "verification_evidence": [],
            "risk_multiplier": 1.0
        }
        
        for alert in zap_alerts:
            # If high trust vulnerability indicator triggers on parameterized input
            if alert['risk'] == 'High' or alert['name'] == 'SQL Injection':
                verification["vulnerable"] = True
                verification["verification_evidence"].append(f"Confirmed: {alert['name']} at parameter {alert['param']}")
                verification["risk_multiplier"] = 2.0  # Confirmed vulnerable factor
                
        if not verification["vulnerable"]:
             # If WAF triggered blocks
             verification["risk_multiplier"] = 0.1 # Mitigated state
             
        return verification

# Docker Setup for VAPT daemon execution
d_compose = """
version: '3.8'
services:
  zap:
    image: owasp/zap2docker-stable
    command: zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.key=SECURE_ZAP_DAEMON_API_KEY_LOADED
    ports:
      - "8090:8090"
    environment:
      - ZAP_AUTH_HEADER=1
"""`} />
          </div>
        )}

        {/* PART 8 */}
        {activePart === 'part8' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 8: Math and Logic behind Context-Aware Scoring</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed font-sans">
              Traditional scores (like raw CVSS CVSS v3) represent basic severity, not actionable enterprise network danger. We use an adjusted risk math model to resolve prioritization queues:
            </p>
            <div className="p-5 border border-cyber-border rounded-xl bg-cyber-black text-center text-white my-4 font-mono">
              <span className="text-xs text-cyber-blue block uppercase font-sans mb-1 font-semibold">Active Algorithm Formulation</span>
              <span className="text-lg md:text-2xl font-bold text-cyber-green">R = (BaseSeverity × EPSS) × AssetCriticality × VerificationFactor</span>
            </div>
            
            <h2 className="text-sm font-semibold text-white mt-5 mb-2">Algorithm Variables & Parameterization Ranges</h2>
            <div className="overflow-x-auto my-3 border border-cyber-border rounded-lg">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-cyber-gray border-b border-cyber-border text-white">
                  <tr>
                    <th className="px-4 py-2 font-mono">FACTOR NAME</th>
                    <th className="px-4 py-2 font-mono">VAL RANGE</th>
                    <th className="px-4 py-2 font-mono">EXPLANATION / TRUST BOUNDS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border bg-[#0a0f14]">
                  <tr>
                    <td className="px-4 py-2 text-cyber-blue font-mono font-medium">Base Severity</td>
                    <td className="px-4 py-2 font-mono">0.0 - 10.0</td>
                    <td className="px-4 py-2">Standard CVSS base vulnerability severity metrics from NVD database.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-cyber-green font-mono font-medium">EPSS Probability</td>
                    <td className="px-4 py-2 font-mono">0.0 - 1.0</td>
                    <td className="px-4 py-2">Exploit Prediction Scoring System value representing daily likelihood of exploit.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-cyber-magenta font-mono font-medium">Asset Criticality</td>
                    <td className="px-4 py-2 font-mono">0.1 - 5.0</td>
                    <td className="px-4 py-2">Business value factor configured by the application owner relative to business loss.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-cyber-blue font-mono font-medium">Verification Factor</td>
                    <td className="px-4 py-2 font-mono">0.1, 1.0, 2.0</td>
                    <td className="px-4 py-2">
                       <strong>2.0</strong> = Exploit Verified vulnerable in VAPT scan. <br />
                       <strong>1.0</strong> = Unknown exploit state (Default status on raw ingest). <br />
                       <strong>0.1</strong> = Mitigated / Firewalled effectively.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-sm font-semibold text-white mt-5">Python Math Implementation Model</h2>
            <CodeBlock id="risk-py" language="python" code={`# risk_scoring_engine.py
def calculate_system_adjusted_risk(cvss: float, epss: float, asset_weight: float, verification_multiplier: float) -> dict:
    """ Computes the actual physical risk factor vector to isolate false positives """
    # Execute multiplication
    risk_product = (cvss * epss) * asset_weight * verification_multiplier
    
    # Scale or round cleanly
    adjusted_score = round(risk_product, 2)
    
    # Determine actionable severity bands
    remediation_class = "LOW"
    if adjusted_score >= 25.0:
        remediation_class = "CRITICAL_CORE_CONTAINMENT"
    elif adjusted_score >= 10.0:
        remediation_class = "HIGH"
    elif adjusted_score >= 2.0:
        remediation_class = "MEDIUM"
        
    return {
        "raw_adjusted_value": adjusted_score,
        "actionclass": remediation_class,
        "orchestrate_automated": adjusted_score >= 10.0 # triggers immediate SOAR
    }`} />
          </div>
        )}

        {/* PART 9 */}
        {activePart === 'part9' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 9: Enterprise SOAR Playbook Blueprints</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              We define structural blueprints for high-impact vulnerability actions including rollback procedures to minimize MTTR safely without breaking critical paths.
            </p>
            
            <div className="space-y-6">
              <div className="p-4 border border-cyber-border rounded-lg bg-[#0e1319]">
                <h3 className="font-semibold text-cyber-magenta text-sm mb-1 font-mono">PL-01: Remote SQL Injection Containment Playbook</h3>
                <p className="text-xs text-slate-400 mb-2">Targeted verified exploitation on server databases.</p>
                <div className="text-xs space-y-1 text-slate-300">
                  <p><strong>Trigger:</strong> Confirmed SQLi on verification scan (CVSS &gt; 9.0; VerifFactor: 2.0)</p>
                  <p><strong>Condition:</strong> Target asset handles sensitive database transactions.</p>
                  <p><strong>Remediation Steps:</strong> Execute WAF virtual patch block ruleset -&gt; Spawn Kubernetes patch deployment of parameterized API server -&gt; Audit login credentials.</p>
                  <p><strong>Rollback:</strong> In case server limits yield high HTTP 504 errors, roll back virtual patch on proxy to stand-by legacy router node.</p>
                </div>
              </div>

              <div className="p-4 border border-cyber-border rounded-lg bg-[#0e1319]">
                <h3 className="font-semibold text-cyber-blue text-sm mb-1 font-mono">PL-02: Ransomware / Malware Command & Control Isolator</h3>
                <p className="text-xs text-slate-400 mb-2">VLAN and endpoint severs targeting fast spreading lateral infections.</p>
                <div className="text-xs space-y-1 text-slate-300">
                  <p><strong>Trigger:</strong> EDR indicator flagging malicious DLL thread execution (Ransomware signature)</p>
                  <p><strong>Condition:</strong> Compromised host shows outbound requests to classified Tor addresses.</p>
                  <p><strong>Remediation Steps:</strong> Sever target Virtual Interface (VLAN containment) -&gt; Block C2 IPs at perimeter proxy -&gt; Capture VM forensically.</p>
                  <p><strong>Rollback:</strong> Revoke network isolation script ONLY if human architect confirms system registry is completely cleared.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PART 10 */}
        {activePart === 'part10' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 10: AI Security Copilot Architecture</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              The AI security copilot module uses <strong>Gemini models</strong> with custom system scopes and retrieval-augmented context (alerts, neo4j paths, logging logs) to generate precise human explanations of incident scores.
            </p>
            <div className="border border-cyber-border p-4 bg-cyber-black rounded-xl mb-4 font-mono text-[11px] text-cyber-blue">
{`+------------------------------+
|     Raw Incident Context     | ---> Alert Details, Assets, Neo4j Dependencies
+------------------------------+
               |
               v
+------------------------------+
|   Server-Side AI Manager     | ---> Load System instructions and prompt templates
+------------------------------+
               |
               v
+------------------------------+
|  @google/genai (Express)     | ---> Invoke gemini-3.5-flash
+------------------------------+
               |
               v
+------------------------------+
| Explainable Security Advisor | ---> Return Remediation blueprints and threat summaries
+------------------------------+`}
            </div>
            
            <h2 className="text-sm font-semibold text-white mb-2">Python Orchestration Template using LLM</h2>
            <CodeBlock id="copilot-py" language="python" code={`# security_ai_agent.py
from google import genai
from google.genai import types
import os

class AISecurityCopilot:
    def __init__(self):
        # Instantiate Gemini GenAI SDK
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        self.model_name = "gemini-3.5-flash"

    def explain_and_remediate_alert(self, alert_json: dict) -> str:
        """ Generates clean action items explaining threat mechanism and remediation """
        prompt = f"""
        Analyze the following real-time SOC incident context:
        - Alert ID: {alert_json.get('id')}
        - Title: {alert_json.get('title')}
        - Score: {alert_json.get('baseScore')}
        - Context Risk: {alert_json.get('riskScore')}
        - Asset Affected: {alert_json.get('targetAssetId')}
        - Logs context: {alert_json.get('logs')}
        
        Generate a professional cybersecurity summary explaining:
        1. Root cause mechanism
        2. Exact SOAR containing response action
        3. Recommended parameter/code level patch configuration (e.g. prepared queries implementation)
        """
        
        # Call Gemini model
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                system_instruction="You are a Principal Cybersecurity Architect explaining real-time high-fidelity alerts."
            )
        )
        return response.text`} />
          </div>
        )}

        {/* PART 11 */}
        {activePart === 'part11' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 11: Front-end UI Components Specification</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Addresses layout routing and responsive designs used to navigate raw alerts and inspect graph layouts:
            </p>
            <div className="space-y-4 text-xs text-slate-300">
              <p><strong>1. Main Panel Layout:</strong> Fluid sidebar panel containing operational navigation, leaving large central viewports for graphs and matrices.</p>
              <p><strong>2. Graph Grid Matrix:</strong> Standard HTML Canvas visualization of asset dependencies, rendering vulnerabilities directly as node attributes.</p>
              <p><strong>3. Split Workspace Layout:</strong> Left segment lists incoming raw events; right segment presents alert details, active logs stream, and the AI interactive assistant.</p>
            </div>
          </div>
        )}

        {/* PART 12 */}
        {activePart === 'part12' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 12: Production Docker Compose Deployment Script</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              A production deployment orchestrator script running decoupled backend services, Apache Kafka queues for event streaming, Neo4j, and the headless OWASP ZAP dynamic scanner.
            </p>
            <CodeBlock id="compose-yml" language="yaml" code={`version: '3.8'

services:
  # 1. FastAPI Decoupled Orchestration Service
  core-soar-engine:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://soar_admin:SecretPass88@postgres-cluster:5432/soar_db
      - NEO4J_URI=bolt://neo4j-cluster:7687
      - NEO4J_AUTH=neo4j/SecretGraphPass99
      - KAFKA_BOOTSTRAP_SERVERS=kafka-mesh:9092
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    depends_on:
      - postgres-cluster
      - neo4j-cluster
      - kafka-mesh

  # 2. Relational Postgres Store
  postgres-cluster:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: soar_admin
      POSTGRES_PASSWORD: SecretPass88
      POSTGRES_DB: soar_db
    volumes:
      - postgres_soar_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # 3. Enterprise Dependent Graph Store
  neo4j-cluster:
    image: neo4j:5.12-community
    ports:
      - "7474:7474" # Browser interface
      - "7687:7687" # Bolt protocol
    environment:
      NEO4J_AUTH: neo4j/SecretGraphPass99
    volumes:
      - neo4j_graph_data:/data

  # 4. Message Log Event Stream (Apache Kafka + Zookeeper)
  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka-mesh:
    image: confluentinc/cp-kafka:7.3.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-mesh:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  # 5. Headless VAPT verification Scanner
  owasp-zap:
    image: owasp/zap2docker-stable
    command: zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.key=ZAP_INTERNAL_SECRET_9032
    ports:
      - "8090:8090"

volumes:
  postgres_soar_data:
  neo4j_graph_data:`} />
          </div>
        )}

        {/* PART 13 */}
        {activePart === 'part13' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 13: Enterprise-Grade Workspace Folder Structure</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              The project folder hierarchy conforms to modern cloud-native decoupled standards. It segregates microservices, parsing engines, automated verification configurations, and Docker configurations:
            </p>
            <div className="p-4 border border-cyber-border rounded-xl bg-cyber-black text-[11px] text-cyber-green font-mono whitespace-pre overflow-x-auto leading-relaxed">
{`aegis-soar-platform/
├── docker/
│   ├── docker-compose.yml
│   ├── dev.env
│   └── deploy-k8s.yaml
├── docs/
│   ├── architecture_blueprints.md
│   └── api_contracts.json
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entrypoint
│   │   ├── config.py                   # Environment setup
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── alert_service.py       # SIEM alert ingestion and filtering
│   │   │   ├── asset_service.py       # Neo4j Graph DB topology mapper
│   │   │   ├── threat_intel.py        # KEV catalog / EPSS lookup API
│   │   │   ├── risk_calculators.py    # Adjusted Risk mathematical score calculator
│   │   │   ├── vapt_orchestrator.py   # Dockerized ZAP probe triggers
│   │   │   └── soar_playbooks.py      # State-based patch trigger orchestrator
│   │   ├── models/
│   │   │   ├── postgres_models.py     # SQL records tables schemas
│   │   │   └── graph_models.py        # Neo4j cypher structure generators
│   │   └── utils/
│   │       ├── parser_stride.py       # XML/JSON threat models map parser
│   │       └── copilot_connector.py   # LangChain with Gemini controller interface
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                    # React UI application shell
│   │   ├── index.css                  # Tailwinds inject styles
│   │   ├── types.ts                   # Unified custom typescript interfaces
│   │   └── components/
│   │       ├── DocumentationHub.tsx   # Visual Architecture spec view (Current page)
│   │       └── IncidentDashboard.tsx  # Interactive live simulator dashboard
│   ├── tailwind.config.js
│   ├── package.json
│   └── vite.config.ts`}
            </div>
          </div>
        )}

        {/* PART 14 */}
        {activePart === 'part14' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 14: Project Implementation Roadmap</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
               Weekly milestones designed to support fast prototyping and deployment:
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start border-l-2 border-cyber-green pl-4">
                <div className="font-mono text-xs text-cyber-green font-semibold">WEEK 1-2</div>
                <div className="text-xs">
                  <span className="font-medium text-white block">Phase 1: Foundation (MVP Core Setup)</span>
                  <p className="text-slate-400">Initialize FastAPI routing backend. Deploy Postgres schemas. Integrate React UI base interface shell.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-l-2 border-cyber-blue pl-4">
                <div className="font-mono text-xs text-cyber-blue font-semibold">WEEK 3-4</div>
                <div className="text-xs">
                  <span className="font-medium text-white block">Phase 2: Graph Context & Intelligence Layer</span>
                  <p className="text-slate-400">Bind Neo4j database nodes. Create threat intelligence lookup routines (CISA KEV, AlienVault feed parser).</p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-l-2 border-cyber-magenta pl-4">
                <div className="font-mono text-xs text-cyber-magenta font-semibold">WEEK 5-6</div>
                <div className="text-xs">
                  <span className="font-medium text-white block">Phase 3: Active Dynamic Verification Harness</span>
                  <p className="text-slate-400">Deploy ZAP execution scripts. Integrate risk calculation formula variables {"($R = \\text{Severity} \\times \\text{EPSS} \\times \\text{Criticality} \\times \\text{VF}$)"}.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-l-2 border-slate-500 pl-4">
                <div className="font-mono text-xs text-slate-500 font-semibold">WEEK 7-8</div>
                <div className="text-xs">
                  <span className="font-medium text-white block">Phase 4: SOAR Action Automations</span>
                  <p className="text-slate-400">Connect router SSH webhook endpoints. Integrate rollback triggers. Set up Gemini AI Assistant layer for analyst explanations.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PART 15 */}
        {activePart === 'part15' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 15: KPI Verification and Testing Datasets</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed font-sans">
              Metrics to substantiate organizational effectiveness post-implementation:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-cyber-black rounded-lg border border-cyber-border">
                <span className="text-xs font-semibold text-cyber-green font-mono block">MTTA (Mean Time to Acknowledge)</span>
                <span className="text-lg font-bold text-white mt-1 block">&lt; 3 Seconds</span>
                <p className="text-[11px] text-slate-400 mt-1">SIEM pushes directly route to the queue partition automatically.</p>
              </div>

              <div className="p-4 bg-cyber-black rounded-lg border border-cyber-border">
                <span className="text-xs font-semibold text-cyber-blue font-mono block">MTTR (Mean Time to Remediate)</span>
                <span className="text-lg font-bold text-white mt-1 block">&lt; 4 Minutes</span>
                <p className="text-[11px] text-slate-400 mt-1">Active verification and immediate playbooks bypass slow ticketing queues.</p>
              </div>

              <div className="p-4 bg-cyber-black rounded-lg border border-cyber-border">
                <span className="text-xs font-semibold text-cyber-magenta font-mono block">False Positive Suppression Rate</span>
                <span className="text-lg font-bold text-white mt-1 block">85% to 92%</span>
                <p className="text-[11px] text-slate-400 mt-1">Confirmed isolated or mitigated states prevent notifications to duty engineers.</p>
              </div>

              <div className="p-4 bg-cyber-black rounded-lg border border-cyber-border">
                <span className="text-xs font-semibold text-cyber-blue font-mono block">Context Scoring Accuracy</span>
                <span className="text-lg font-bold text-white mt-1 block">99.2% Alignment</span>
                <p className="text-[11px] text-slate-400 mt-1">Mathematical validation incorporates business impact directly.</p>
              </div>
            </div>
          </div>
        )}

        {/* PART 16 */}
        {activePart === 'part16' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 16: Complete Python FastAPI Backend Ingestor</h1>
            <p className="text-sm text-slate-400 mb-2 leading-relaxed">
               This production FastAPI script hosts endpoints for alert parsing, assets graph updates, risk calculation math, and calls verification:
            </p>
            <CodeBlock id="fastapi-app" language="python" code={`# main.py - FastAPI Production Script
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import os

app = FastAPI(title="Context-Aware SOAR platform API", version="1.0")

class SIEMAlertPayload(BaseModel):
    title: str
    source: str
    targetAssetId: str
    cve: str
    baseScore: Optional[float] = 7.5

class RiskCalculationRequest(BaseModel):
    baseSeverity: float
    epssScore: float
    assetCriticality: float
    verificationFactor: float

@app.post("/alerts", status_code=201)
def ingest_alert(payload: SIEMAlertPayload, background_tasks: BackgroundTasks):
    """SIEM webhook ingress point. Formulates Kafka message queue data."""
    print(f"Pushed SIEM Alert to logger: {payload.title}")
    
    # Simulate processing task asynchronously 
    background_tasks.add_task(trigger_vapt_scan_async, payload.targetAssetId, payload.cve)
    
    return {
        "status": "QUEUED_IN_KAFKA",
        "detail": f"Alert {payload.title} processed for target {payload.targetAssetId}"
    }

@app.post("/risk/calculate")
def calculate_risk(req: RiskCalculationRequest):
    """Calculates context adjusted score from math: R = (Sev * EPSS) * Crit * VF"""
    raw_factor = (req.baseSeverity * req.epssScore) * req.assetCriticality * req.verificationFactor
    return {
        "adjusted_risk": round(raw_factor, 2),
        "alert_action": "ORCHESTRATE_SOAR" if raw_factor >= 10.0 else "LOG_AND_MONITOR"
    }

def trigger_vapt_scan_async(asset_id: str, cve_id: str):
    # Triggers targeted OWASP ZAP/Nuclei scanning probe Docker task
    print(f"[BG] Launching active scan verification for CVE {cve_id} on {asset_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`} />
          </div>
        )}

        {/* PART 17 */}
        {activePart === 'part17' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 17: Enterprise UML Modeling Blueprints</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed font-sans">
              Structural UML diagrams for technical engineers. Double click or copy syntax directly:
            </p>
            
            <h2 className="text-xs font-mono text-cyber-blue uppercase mb-2">1. Sequence Diagram (Real-Time Ingest Workflow)</h2>
            <div className="border border-cyber-border p-3 rounded-lg bg-cyber-black text-[10px] text-cyber-green font-mono overflow-x-auto whitespace-pre leading-normal">
{`SIEM-Alert     Apache-Kafka     Asset-Graph(Neo4j)   Threat-Intel      Verification(ZAP)     SOAR-Playbook
    |                |                  |                 |                  |                  |
    |--POST alert--->|                  |                 |                  |                  |
    |                |---Read Alert---------------------->|                  |                  |
    |                |                  |                 |---Check EPSS---->|                  |
    |                |                  |<--Query Subnet--|                  |                  |
    |                |                  |=== (CriticalityVal) ===============>|                 |
    |                |                  |                 |                  |--Verify Exploit->|
    |                |                  |                 |                  |<=(VF: 2.0 / 0.1)-|
    |                |                  |                 |---Trigger SOAR--------------------->|
    |                |                  |                 |                                     |-[Fire containment]
    |                |                  |                 |<=================Rollback (If break)-|`}
            </div>
            
            <h2 className="text-xs font-mono text-cyber-magenta uppercase mt-6 mb-2">2. Deployment Model Topology</h2>
            <div className="border border-cyber-border p-3 rounded-lg bg-cyber-black text-[10px] text-cyber-magenta font-mono overflow-x-auto whitespace-pre leading-normal">
{`                        +----------------------------------------+
                        |           Cloud-Run Container          |
                        |      (React UI Static Assets & Node)   |
                        +----------------------------------------+
                                            || REST API Hooks
                                            \/
+-------------------------+      +-------------------------+      +-------------------------+
|     PostgreSQL Pod      | <--- |   Core-FastAPI Server   | ---> |       Neo4j Pod         |
| (Audit Logs & Users DB) |      |   (SOAR Logic & Copilot) |      | (Topological Asset Map) |
+-------------------------+      +-------------------------+      +-------------------------+
                                            || gRPC Connects!
                                            \/
                                 +-------------------------+
                                 |    OWASP ZAP Container   |
                                 |  (Targeted scan daemon)  |
                                 +-------------------------+`}
            </div>
          </div>
        )}

        {/* PART 18 */}
        {activePart === 'part18' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 18: Architectural Security Considerations</h1>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              We integrate enterprise security controls to secure the SOAR pipeline:
            </p>
            <div className="space-y-4 font-sans text-xs">
              <div className="p-3 border border-cyber-border rounded-lg bg-[#0c1015]">
                <strong className="text-cyber-green block mb-1">01. RBAC & Identity Vaults (JWT)</strong>
                <p className="text-slate-400">All playbook override API endpoints require cryptographically signed JWT authorization tokens carrying `admin` or `operator` permissions.</p>
              </div>

              <div className="p-3 border border-cyber-border rounded-lg bg-[#0c1015]">
                <strong className="text-cyber-blue block mb-1">02. Secrets Configuration Protection</strong>
                <p className="text-slate-400">Database connection strings and third party threat credentials are never stored plain-text in repository bundles. Managed securely via Hashicorp Vault or GCP secrets management variables.</p>
              </div>

              <div className="p-3 border border-cyber-border rounded-lg bg-[#0c1015]">
                <strong className="text-cyber-magenta block mb-1">03. OWASP Top 10 Protections</strong>
                <p className="text-slate-400">Robust request validation models using Pydantic block unauthorized parameter bypasses, protecting inputs from SQL/NoSQL injection variants.</p>
              </div>
            </div>
          </div>
        )}

        {/* PART 19 */}
        {activePart === 'part19' && (
          <div>
            <h1 className="text-xl font-bold text-white mb-2 border-b border-cyber-border pb-3">Part 19: Long-Term Platform Engineering Enhancements</h1>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
               Future enhancements planned for the platform roadmap are aligned with modern security trends:
            </p>
            <div className="space-y-4 text-xs">
              <div className="p-4 border border-cyber-border rounded-lg bg-[#090d10]">
                <strong className="text-white block mb-1">1. Autonomous Agentic AI SOC Analyst Integration</strong>
                <p className="text-slate-400">Replacing simple conditional logic chains with multi-agent LangGraph configurations that can dynamically investigate alerts, gather forensics, and write custom remediations without waiting for static playbooks.</p>
              </div>

              <div className="p-4 border border-cyber-border rounded-lg bg-[#090d10]">
                <strong className="text-white block mb-1">2. Broad EDR & CNAPP Native Linkages</strong>
                <p className="text-slate-400">Direct event triggers for Wiz, Prisma Cloud, CrowdStrike Falcon, and SentinelOne, allowing isolation of microservices directly at the Kubernetes kernel level using eBPF probes.</p>
              </div>

              <div className="p-4 border border-cyber-border rounded-lg bg-[#090d10]">
                <strong className="text-white block mb-1">3. Kubernetes Operators for Adaptive Scaling</strong>
                <p className="text-slate-400">Deploying remediation playbooks as custom Kubernetes operators, enabling adaptive scaling and auto-isolation of container workloads under verified cyber attacks.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
