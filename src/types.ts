/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SecurityAsset {
  id: string;
  name: string;
  ip: string;
  domain: string;
  criticality: number; // 0.1 to 5.0 (business impact factor)
  type: 'WebServer' | 'Database' | 'InternalAPI' | 'ActiveDirectory' | 'Workstation';
  environment: 'Production' | 'Staging' | 'Development';
  owner: string;
  vulnerabilities: string[]; // CVE IDs
  dependsOn?: string[]; // IDs of other assets
  labels: string[];
}

export interface SecurityVulnerability {
  cve: string;
  title: string;
  description: string;
  baseSeverity: number; // 0.0 to 10.0
  epssScore: number; // 0.0 to 1.0 (exploit prediction scoring system)
  cisaKev: boolean; // Known Exploited Vulnerability list
  interactionType: 'SQL_Injection' | 'XSS' | 'Brute_Force' | 'Credential_Stuffing' | 'Malware' | 'Data_Exfiltration' | 'Ransomware';
}

export interface SecurityAlert {
  id: string;
  title: string;
  source: 'Splunk' | 'ElasticSIEM' | 'Sentinel' | 'CrowdStrike';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  baseScore: number; // 0.0 to 10.0
  targetAssetId: string;
  cve: string;
  timestamp: string;
  status: 'New' | 'Investigating' | 'Scanning' | 'Verified' | 'Mitigated' | 'Remediated' | 'False Positive';
  details?: string;
  verificationStatus: 'Unverified' | 'Vulnerable' | 'Not Vulnerable' | 'Mitigated';
  riskScore: number; // calculated context-aware risk
  playbookState?: PlaybookState;
  logs: string[];
}

export interface PlaybookState {
  id: string;
  playbookName: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'rolled_back';
  currentStep: number;
  steps: {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    description: string;
  }[];
  logs: string[];
  trigger: string;
}

export interface ThreatIntelligenceFeed {
  id: string;
  source: string;
  indicator: string;
  type: string;
  malwareFamily: string;
  confidence: number;
  cve: string;
  observedDate: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export enum SecurityRole {
  LeadAnalyst = 'Lead Analyst',
  Operator = 'Security Operating Engineer',
  Auditor = 'Compliance Auditor'
}

export interface SecurityUser {
  id: string;
  username: string;
  role: SecurityRole;
  avatarUrl: string;
  badgeCode: string;
}

