/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileJson, 
  Download, 
  Search, 
  Database, 
  RefreshCw, 
  Clock, 
  User, 
  Activity, 
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsViewProps {
  logs: AuditLog[];
  onRefresh: () => void;
}

export default function AuditLogsView({ logs, onRefresh }: AuditLogsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Get unique users and actions for filters
  const usersList = useMemo(() => {
    const list = new Set<string>();
    logs.forEach(log => {
      if (log.user) list.add(log.user);
    });
    return ['All Users', ...Array.from(list)];
  }, [logs]);

  const actionsList = useMemo(() => {
    const list = new Set<string>();
    logs.forEach(log => {
      if (log.action) list.add(log.action);
    });
    return ['All Actions', ...Array.from(list)];
  }, [logs]);

  // Filter logs based on search and selected filters
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUser = selectedUser === 'All Users' || log.user === selectedUser;
      const matchesAction = selectedAction === 'All Actions' || log.action === selectedAction;

      return matchesSearch && matchesUser && matchesAction;
    });
  }, [logs, searchTerm, selectedUser, selectedAction]);

  // Export to CSV using safe Blob allocation
  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Details'];
    const rows = filteredLogs.map(log => [
      log.id,
      log.timestamp,
      log.user,
      log.action,
      log.details.replace(/"/g, '""') // Escape double quotes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aegis_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON using safe Blob allocation
  const exportToJSON = () => {
    if (filteredLogs.length === 0) return;

    const jsonString = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aegis_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 min-h-[500px]">
      
      {/* 1. View Header with Database Connection info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-md md:text-lg font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" /> PostgreSQL Analytical Audit Core
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse and export state auditable actions, simulated manual pipeline overrides, and threat response actions.
          </p>
        </div>

        {/* Database Status Tag */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5 font-mono text-emerald-400 uppercase">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.4)]"></div>
            Postgres: Connected
          </div>
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg bg-slate-800 border border-slate-700/80 hover:bg-slate-700 hover:border-slate-600 text-slate-300 transition-all ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh logs list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Advanced Controls, Search Filters, and Export Buttons */}
      <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
        
        {/* Search Input & Selectors */}
        <div className="flex flex-col md:flex-row gap-3 flex-1 max-w-full xl:max-w-4xl">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs by ID, User, Action or Details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 transition-colors placeholder:text-slate-500"
            />
          </div>

          {/* User selector */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-300 cursor-pointer appearance-none"
            >
              {usersList.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Action type selector */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-300 cursor-pointer appearance-none"
            >
              {actionsList.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">Export Tools:</span>
          <button
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="flex-1 sm:flex-initial text-xs font-mono font-semibold px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.15)]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={exportToJSON}
            disabled={filteredLogs.length === 0}
            className="flex-1 sm:flex-initial text-xs font-mono font-semibold px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-45 disabled:cursor-not-allowed text-slate-200 border border-slate-705 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>

      </div>

      {/* 3. Logical Table List */}
      <div className="flex-1 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/20">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 font-semibold text-center w-[150px]">Reference / Time</th>
                <th className="py-3 px-4 font-semibold w-[130px]">Operator</th>
                <th className="py-3 px-4 font-semibold w-[180px]">Category Action</th>
                <th className="py-3 px-4 font-semibold">Incident Documentation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/65 font-sans text-xs">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Timestamp / ID column */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-indigo-400 font-semibold">{log.id}</span>
                        <div className="flex items-center gap-1 text-[9.5px]">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </td>

                    {/* Operator Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-indigo-400">
                          {log.user ? log.user.slice(0, 2).toUpperCase() : 'OP'}
                        </div>
                        <span className="font-semibold text-[11px]">{log.user || 'System'}</span>
                      </div>
                    </td>

                    {/* Action badge column */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 text-[9.5px] font-medium border rounded-md uppercase tracking-wide bg-indigo-500/10 text-indigo-300 border-indigo-500/25">
                        {log.action}
                      </span>
                    </td>

                    {/* Details column */}
                    <td className="py-3.5 px-4 text-slate-300 leading-relaxed max-w-md break-words">
                      <p className="line-clamp-2 md:line-clamp-none whitespace-pre-line text-[11px]">
                        {log.details}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
                      <span className="text-xs italic">No matching operational records found inside the Postgres logs.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section Footer summary counts */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center text-[10.5px] font-mono text-slate-500">
          <span>Active Query Scope: <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> operations logs matched</span>
          <span className="animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Live Stream Sync Active
          </span>
        </div>
      </div>
      
    </div>
  );
}
