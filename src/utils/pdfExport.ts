/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { SecurityAlert, SecurityAsset, SecurityVulnerability } from '../types';

/**
 * Handles professional formatted PDF download reports of selected target vulnerabilities
 * with their real-time CVSS v3.1 metrics, asset business criticality, and context risk scores.
 */
export function exportAlertToPDF(
  alert: SecurityAlert,
  vulnerability: SecurityVulnerability | undefined,
  asset: SecurityAsset | undefined,
  modRisk: {
    baseSeverity: number;
    epssScore: number;
    assetCriticality: number;
    verifFactor: number;
    modRiskResult: number;
  },
  cvssVectorString?: string
) {
  const doc = new jsPDF();
  let y = 15; // Vertical cursor pointer

  // Helper utility for horizontal lines
  const drawDivider = (yPos: number, accent = false) => {
    doc.setDrawColor(accent ? 79 : 226, accent ? 70 : 232, accent ? 229 : 240); // indigo accent vs light gray
    doc.setLineWidth(accent ? 1.0 : 0.5);
    doc.line(15, yPos, 195, yPos);
  };

  // Helper utility for sections
  const startSection = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229); // Brand Indigo
    doc.text(title, 15, y);
    y += 5;
    drawDivider(y, false);
    y += 6;
  };

  // --- PAGE HEADER DECORATIONS ---
  // Top thick colored rail border
  doc.setDrawColor(79, 70, 229); // Brand indigo
  doc.setLineWidth(2.5);
  doc.line(15, y, 195, y);
  y += 7;

  // Title block
  doc.setTextColor(15, 23, 42); // slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VAPT SOAR – COMPREHENSIVE CYBERSECURITY REPORT', 15, y);
  y += 5;

  // Metadata Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate 500
  const dateStr = new Date().toUTCString();
  doc.text(`Generated on: ${dateStr} | Secure Registry Ref: VAPT-SOAR-X${alert.id.slice(0, 5).toUpperCase()}`, 15, y);
  y += 5;

  // Classification stamp
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text('SECURITY STATE: STAGE-1 COCKPIT INCIDENT DRILL — RESTRICTED TO SEC-OPS', 15, y);
  y += 4;
  
  drawDivider(y, true);
  y += 8;

  // --- SECTION 1: SYSTEM ALERT IDENTIFIERS ---
  startSection('1. GENERAL THREAT ALERT IDENTIFIERS');
  
  // Left Column Labels, Right Column Data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // slate-600

  const itemsAlert = [
    { label: 'Event Alert Title:', val: alert.title, bold: true },
    { label: 'Alert Registry ID:', val: alert.id, mono: true },
    { label: 'Ingest Source:', val: `${alert.source} SIEM Collector`, bold: true },
    { label: 'Incident Timestamp:', val: new Date(alert.timestamp).toISOString() },
    { label: 'Operational Status:', val: alert.status.toUpperCase(), highlight: true }
  ];

  itemsAlert.forEach(item => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(item.label, 20, y);

    if (item.mono) {
      doc.setFont('courier', 'bold');
      doc.setTextColor(15, 23, 42);
    } else if (item.bold || item.highlight) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(item.highlight ? 79 : 15, item.highlight ? 70 : 23, item.highlight ? 229 : 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
    }
    
    doc.text(item.val, 65, y);
    y += 5.5;
  });

  y += 4;

  // --- SECTION 2: VULNERABILITY EXPOSURE INFO ---
  startSection('2. VULNERABILITY & CVE INTEL SYNC');

  if (vulnerability) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    
    // CVE Metadata Key values
    const detailsVuln = [
      { label: 'CVE Identifier:', val: vulnerability.cve, mono: true },
      { label: 'Vulnerability Class:', val: vulnerability.title, bold: true },
      { label: 'CVSS v3.1 Base Rating:', val: String(vulnerability.baseSeverity) + ' (Standard Baseline)' },
      { label: 'CISA KEV Registered:', val: vulnerability.cisaKev ? 'YES (Active Exploitation Observed in Wild)' : 'NO / Self-Contained' }
    ];

    detailsVuln.forEach(item => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item.label, 20, y);

      if (item.mono) {
        doc.setFont('courier', 'bold');
        doc.setTextColor(225, 29, 72); // Rose tint
      } else if (item.bold) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
      }
      doc.text(item.val, 65, y);
      y += 5.5;
    });

    // Write description box with multi-line word wrapping
    y += 2;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Technical Threat Scope:', 20, y);
    y += 5;

    doc.setFillColor(248, 250, 252); // slate 50
    doc.setDrawColor(226, 232, 240); // slate 200
    doc.setLineWidth(0.5);

    const wrappedDescLines = doc.splitTextToSize(vulnerability.description, 165);
    const boxHeight = (wrappedDescLines.length * 4.5) + 6;

    doc.rect(20, y - 4, 170, boxHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85); // slate-700
    wrappedDescLines.forEach((line: string, idx: number) => {
      doc.text(line, 24, y + (idx * 4.5));
    });

    y += boxHeight + 4;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Vulnerability parameters synchronization in queue...', 20, y);
    y += 8;
  }

  // --- SECTION 3: IMPACT NODE / ASSET LANDSCAPE ---
  startSection('3. IMPACT ASSET LANDSCAPE CORRELATION');

  if (asset) {
    const detailsAsset = [
      { label: 'Host Asset Name:', val: asset.name, bold: true },
      { label: 'Network Endpoint IP:', val: asset.ip, mono: true },
      { label: 'Domain Context:', val: asset.domain },
      { label: 'Deployment State:', val: asset.environment, bold: true },
      { label: 'Node Criticality Weight:', val: `${asset.criticality} (Multiplier Factor)` },
      { label: 'Compliance Tags:', val: asset.labels.join(', ') || 'None Assigned' }
    ];

    detailsAsset.forEach(item => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item.label, 20, y);

      if (item.mono) {
        doc.setFont('courier', 'bold');
        doc.setTextColor(15, 23, 42);
      } else if (item.bold) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
      }
      doc.text(item.val, 65, y);
      y += 5.5;
    });

    y += 4;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Target system assets information query in queue...', 20, y);
    y += 8;
  }

  // Ensure next critical score sections fit onto the same page, or create a clean footer.
  // Check if we have enough room on Page 1 (max length ~285mm).
  // Total height needed for risk equations and signature block is ~70mm.
  // If y exceeds 200, insert a clean page break.
  if (y > 210) {
    doc.addPage();
    y = 20;
    // Page 2 header bar
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(2.5);
    doc.line(15, 12, 195, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('VAPT SOAR – SECURITY OPS COCKPIT (CONTINUED)', 15, 18);
    drawDivider(21, false);
    y = 28;
  }

  // --- SECTION 4: CONTEXT-AWARE RISK MATH MODULATION ---
  startSection('4. RISK SCORING LOOP & MATH EQUATION');

  // Draw CVSS Vector String if active
  if (cvssVectorString) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Exploit CVSS v3.1 Vector String:', 20, y);
    y += 5;

    doc.setFillColor(241, 245, 249); // slate-100 grey background box
    doc.rect(20, y - 4, 170, 7.5, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229); // brand indigo
    doc.text(cvssVectorString, 23, y + 1);
    y += 9;
  }

  // Table of modulated multipliers
  doc.setFillColor(250, 250, 250);
  doc.rect(20, y - 3, 170, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PARAMETER DESCRIPTION', 23, y + 2);
  doc.text('MODULATOR COEFFICIENT', 125, y + 2);
  y += 5.5;
  drawDivider(y, false);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Base Severity Multiplier (calculated baseline / overridden)', 23, y);
  doc.text(modRisk.baseSeverity.toFixed(1), 140, y);
  y += 5;

  doc.text('Exploitability Prediction Factor (EPSS Likelihood)', 23, y);
  doc.text(`${(modRisk.epssScore * 100).toFixed(0)}% (${modRisk.epssScore.toFixed(2)})`, 140, y);
  y += 5;

  doc.text('Target Asset Importance Weight (Criticality Index)', 23, y);
  doc.text(modRisk.assetCriticality.toFixed(1), 140, y);
  y += 5;

  doc.text('Real-time Verification Status Coefficient (Factor)', 23, y);
  doc.text(modRisk.verifFactor.toFixed(1), 140, y);
  y += 7;

  // Final adjusted risk formula
  doc.setFillColor(224, 231, 255); // indigo-100 highlight
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.0);
  doc.rect(20, y - 4, 170, 15, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CORE CONTEXT-AWARE RISK METRIC:', 24, y + 2);
  doc.text('R_Score = (Severity * EPSS) * Criticality * Factor', 24, y + 7);

  // Big computed score text block
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229);
  doc.text(modRisk.modRiskResult.toFixed(2), 160, y + 6);
  y += 18;

  // --- SECTION 5: SIGN-OFF & OPERANT AUTHORITIES ---
  doc.setLineWidth(0.5);
  drawDivider(y, false);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Information security team audit log recorded. Report compiled by the secure VAPT SOAR real-time framework.', 15, y);
  y += 4;
  doc.text('Any adjustments made within the operational cockpit require supervisor validation before deploying firewall rules.', 15, y);

  // Save/Download PDF document
  const fileName = `SOAR_SECURITY_REPORT_CVE-${alert.cve || 'UNKNOWN'}.pdf`;
  doc.save(fileName);
}
