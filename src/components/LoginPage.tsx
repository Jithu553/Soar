/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  KeyRound, 
  Terminal, 
  UserCheck, 
  AlertOctagon, 
  Cpu, 
  Lock, 
  Eye, 
  EyeOff,
  User,
  Fingerprint,
  Radio,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { SecurityRole, SecurityUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: SecurityUser) => void;
}

// Pre-defined security profiles for RBAC testing & onboarding
const SECURITY_PROFILES: {
  username: string;
  role: SecurityRole;
  badgeCode: string;
  passphrase: string;
  avatarUrl: string;
  clearanceLevel: string;
  authorizations: string[];
  restrictions: string[];
}[] = [
  {
    username: 'commander.valkyrie',
    role: SecurityRole.LeadAnalyst,
    badgeCode: 'SEC-CMD-902',
    passphrase: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    clearanceLevel: 'LEVEL 5 (Full Cryptographic Sovereign)',
    authorizations: [
      'Full CVE Risk Parameter Tuning',
      'OWASP ZAP Active Verification Scans',
      'Remediation Playbook Enforcement (Manual/Auto)',
      'Global Audit Database Cleansing & Resets',
      'Full PDF Custom Compliance Bundle Building'
    ],
    restrictions: []
  },
  {
    username: 'ops.phoenix',
    role: SecurityRole.Operator,
    badgeCode: 'SEC-OPS-415',
    passphrase: 'op',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    clearanceLevel: 'LEVEL 3 (Standard Operational Control)',
    authorizations: [
      'Interactive Alerts Investigation',
      'OWASP ZAP Active Verification Scans',
      'Remediation Playbook Enforcement',
      'Vulnerability Matrix Comparative Analysis'
    ],
    restrictions: [
      'State Database Deconstruction & Pipeline Reset',
      'Administrative Parameter Tuning Authorization'
    ]
  },
  {
    username: 'auditor.governance',
    role: SecurityRole.Auditor,
    badgeCode: 'SEC-AUD-108',
    passphrase: 'audit',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    clearanceLevel: 'LEVEL 1 (Compliance Read-Only Inspection)',
    authorizations: [
      'Interactive Asset Graph Topology Audit',
      'Audit Logs Compliance Tracking',
      'Threat Intelligence Stream Context Analysis'
    ],
    restrictions: [
      'CVSS / EPSS Manual Risk Tuning Override',
      'Active Exploits Investigation & Active Scanning',
      'Incident Playbooks Execution Triggering',
      'Pipeline Memory Resets'
    ]
  }
];

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  const [passphrase, setPassphrase] = useState<string>('');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authStep, setAuthStep] = useState<number>(0);
  const [termAccepted, setTermAccepted] = useState<boolean>(true);
  
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'SYSTEM INITIALIZATION: BOOTING ENCRYPTED VAPT CORE...',
    'ISOLATING PORT 3000 INGRESS ROUTERS...',
    'ESTABLISHING CONNECTION WITH EXPRO-SIMULATION SERVER...',
    'WAITING FOR CREDENTIAL INPUT MATRIX...'
  ]);

  const activeProfile = SECURITY_PROFILES[selectedProfileIndex];

  // Dynamically append logs to the terminal box
  const addLog = (log: string) => {
    setTerminalLogs(prev => [...prev.slice(-6), `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${log}`]);
  };

  // Profile Selection updates Terminal feedback beautifully
  const handleProfileSelect = (index: number) => {
    setSelectedProfileIndex(index);
    setErrorMsg(null);
    setPassphrase('');
    addLog(`SELECTED DECK PROFILE: ${SECURITY_PROFILES[index].username} (${SECURITY_PROFILES[index].role})`);
  };

  // Authenticate submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!termAccepted) {
      setErrorMsg('Error: You must accept the SOC Compliance guidelines and NDAs before entering.');
      addLog('AUTH ERROR: COMPLIANCE AGREEMENT REFUSED');
      return;
    }

    if (passphrase.trim() !== activeProfile.passphrase) {
      setErrorMsg('CRITICAL ERROR: Unauthorized biometric passphrase hash. Terminal lock initiated.');
      addLog('AUTH REJECTED: INVALID KEY-PHRASE CREDENTIAL');
      return;
    }

    // Trigger sequential authentication console steps for beautiful aesthetic realism
    setIsAuthenticating(true);
    setAuthStep(1);
    addLog(`INITIATING RSA KEYPAIR VALIDATION FOR ${activeProfile.badgeCode}...`);

    setTimeout(() => {
      setAuthStep(2);
      addLog('PASS: CRYPTOGRAPHIC SIGNATURE MATCH.');
      addLog(`APPLYING INTERACTIVE SECURITY SCHEME: ${activeProfile.clearanceLevel}`);
    }, 800);

    setTimeout(() => {
      setAuthStep(3);
      addLog(`COMMENCING HIGH-TRUST SECURE SESSION ON CONTAINER INFRASTRUCTURE...`);
    }, 1600);

    setTimeout(() => {
      // Create user record
      const loggedUser: SecurityUser = {
        id: activeProfile.badgeCode,
        username: activeProfile.username,
        role: activeProfile.role,
        avatarUrl: activeProfile.avatarUrl,
        badgeCode: activeProfile.badgeCode
      };

      // Set user session in Local Storage
      localStorage.setItem('vapt_soar_user_session', JSON.stringify(loggedUser));
      
      // Pass upstream
      onLoginSuccess(loggedUser);
    }, 2400);
  };

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-200 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative Grid and Ambient Lights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1328_1px,transparent_1px),linear-gradient(to_bottom,#0c1328_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#6366f1]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Terminal Frame */}
      <div className="w-full max-w-5xl bg-[#030815]/95 border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-12 overflow-hidden relative z-10 transition-all duration-300">
        
        {/* LEFT DECK PANEL: Role descriptions & Credentials (8 columns on MD) */}
        <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/40">
          
          {/* Headline heading info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white font-mono flex items-center gap-2">
                  VAPT SOAR COCKPIT
                </h1>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-medium">SecOps Role Governance Terminal</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
              Select an operational profile to initialize cybersecurity dashboard access rules. Your security privileges are determined entirely based on the cryptographic signature of your assigned profile role.
            </p>
          </div>

          {/* SECURITY PROFILES SELECTOR DECK */}
          <div className="my-6 space-y-3">
            <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Cryptographic Authorization Decks
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {SECURITY_PROFILES.map((profile, idx) => {
                const isSelected = selectedProfileIndex === idx;
                
                return (
                  <button
                    key={profile.username}
                    type="button"
                    onClick={() => handleProfileSelect(idx)}
                    disabled={isAuthenticating}
                    className={`p-4 rounded-xl text-left border transition-all duration-200 relative group flex gap-3.5 items-start cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-900 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.06)]' 
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Tick indicator */}
                    {isSelected && (
                      <span className="absolute top-3.5 right-3.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded font-black uppercase">
                        ACTIVE SELECT
                      </span>
                    )}

                    {/* Avatar preview */}
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.username}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0 select-none group-hover:border-indigo-500/40 transition-colors"
                    />

                    {/* Role data */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div>
                        <div className="font-mono text-xs font-bold text-white tracking-wide truncate">{profile.username}</div>
                        <div className="text-[10.5px] font-medium text-indigo-400 mt-0.5 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-indigo-400" />
                          <span>{profile.role}</span>
                        </div>
                      </div>

                      {/* Authorizations list */}
                      <div className="text-[10px] space-y-0.5 pr-2.5">
                        <div className="text-slate-500 font-mono font-bold uppercase tracking-tight text-[9px]">Scope Privileges:</div>
                        {profile.authorizations.map(auth => (
                          <div key={auth} className="text-slate-300 font-sans flex items-center gap-1.5 truncate">
                            <span className="text-emerald-500 text-[11px] font-black shrink-0">&bull;</span>
                            <span>{auth}</span>
                          </div>
                        ))}
                        {profile.restrictions.length > 0 && (
                          <div className="pt-1.5">
                            <div className="text-slate-500 font-mono font-bold uppercase tracking-tight text-[9px]">System Guard Blockades:</div>
                            {profile.restrictions.map(restr => (
                              <div key={restr} className="text-rose-400 font-sans flex items-center gap-1.5 truncate">
                                <span className="text-rose-400 text-[11px] font-black shrink-0">&bull;</span>
                                <span>{restr}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secure compliance statement */}
          <div className="text-[10px] text-slate-500 font-mono border-t border-slate-900 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>TERMINAL REF: VAPT-CORE-C9 &bull; PORT 3000 STRICT</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="uppercase text-[9.5px]">Clearance Active</span>
            </div>
          </div>

        </div>

        {/* RIGHT DECK PANEL: Physical Credential Entry form (5 columns on MD) */}
        <div className="md:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-[#04091a]">
          
          {/* Header section of Credentials */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Credential Checkpoint</span>
            <h2 className="text-md font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Verify Access Code</span>
            </h2>

            {/* Profile selected visual layout */}
            <div className="bg-[#02050f] border border-slate-800 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Fingerprint className="w-6 h-6 text-indigo-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase font-black">Authorized Badge</span>
                  <span className="text-xs font-mono font-medium text-[#f1f5f9] truncate block">{activeProfile.badgeCode}</span>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-2 flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">DEMO PASSPHRASE:</span>
                <span className="text-emerald-400 font-bold bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-emerald-500/20 select-all cursor-help" title="Click to copy or type this into the passphrase field below">
                  {activeProfile.passphrase}
                </span>
              </div>
            </div>
          </div>

          {/* LOGIN FORM EXECUTOR */}
          <form onSubmit={handleSubmit} className="my-6 space-y-4 flex-1 flex flex-col justify-center">
            
            {/* Passphrase Input */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-mono text-slate-400 font-semibold uppercase tracking-wide flex justify-between">
                <span>Security Passphrase</span>
                <span className="text-[10px] text-slate-500">Required</span>
              </label>
              
              <div className="relative flex items-center bg-[#02050f] border border-slate-800 rounded-lg h-10 hover:border-slate-700 transition-colors">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  placeholder="Enter 'admin', 'op' or 'audit'..."
                  disabled={isAuthenticating}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full h-full bg-transparent pl-10 pr-10 text-xs font-mono text-white placeholder-slate-600 outline-none focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* NDA / Security Policy acceptance */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none group mt-1">
              <input
                type="checkbox"
                checked={termAccepted}
                disabled={isAuthenticating}
                onChange={(e) => setTermAccepted(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 accent-indigo-500 mt-0.5"
              />
              <span className="text-[10px] leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                I hereby accept all active monitoring policies, NDA parameters, and declare compliance under the global cybersecurity operations guidelines.
              </span>
            </label>

            {/* ERROR CODE CARD RECT */}
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-start gap-2 text-[10.5px] animate-fade-in">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                <span className="text-rose-450 font-mono">{errorMsg}</span>
              </div>
            )}

            {/* Submit execution control button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className={`w-full h-11 rounded-lg font-mono font-bold text-xs uppercase cursor-pointer tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
                isAuthenticating
                  ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 pointer-events-none'
                  : 'bg-[#6366f1] hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)] border border-transparent'
              }`}
            >
              {isAuthenticating ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  <span>
                    {authStep === 1 && 'Scanning Biometrics...'}
                    {authStep === 2 && 'Signing Crypto Payload...'}
                    {authStep === 3 && 'Access Granted & Decrypted...'}
                  </span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>Establish Secure Connection</span>
                </>
              )}
            </button>
          </form>

          {/* ACTIVE LIVE CONSOLE RECT (Real-time tracking of logs) */}
          <div className="bg-[#02050e] border border-slate-900 rounded-lg p-3 pt-2.5 font-mono text-[9px] text-[#38bdf8] flex flex-col gap-1 select-none overflow-hidden h-[126px]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1 text-slate-500">
              <span className="flex items-center gap-1.5 uppercase font-bold tracking-widest"><Terminal className="w-3 h-3" /> Live Terminal Diagnostics</span>
              <span className="text-[8px] tracking-wide animate-pulse bg-[#0284c7]/15 text-[#38bdf8] px-1 rounded font-black border border-[#0284c7]/20">RECEIVER: ACTIVE</span>
            </div>
            
            <div className="flex-1 flex flex-col gap-1 custom-scrollbar overflow-y-auto">
              {terminalLogs.map((log, i) => (
                <div key={i} className="leading-normal truncate text-slate-400">
                  <span className="text-slate-600 mr-1.5">&gt;</span>
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
