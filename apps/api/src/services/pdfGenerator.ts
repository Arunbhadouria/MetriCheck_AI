import PDFDocument from 'pdfkit';
import { Inspection, Product, RuleResult, User } from '@metricheck/shared-types';

export function generateInspectionPDF(
  inspection: Inspection,
  products: Product[],
  ruleResults: RuleResult[],
  officer?: User
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margins: { top: 24, bottom: 24, left: 30, right: 30 },
        size: 'A4',
        bufferPages: true,
        info: {
          Title: `Inspection Report - ${inspection.inspectionNumber}`,
          Author: officer?.name || inspection.inspectorName || 'Legal Metrology Department',
          Subject: 'Statutory Inspection & Seizure Memo under Legal Metrology Act, 2009',
          Keywords: 'Legal Metrology, Seizure Memo, Form 4, Inspection Report, Rule 32',
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const marginX = 30;
      const contentWidth = pageWidth - (marginX * 2); // 535.28

      // State determination
      const stateName = (inspection.jurisdictionState || officer?.jurisdictionState || 'Madhya Pradesh').toUpperCase();
      const districtName = (inspection.jurisdictionDistrict || officer?.jurisdictionDistrict || 'Indore').toUpperCase();
      const zoneName = inspection.jurisdictionZone || officer?.jurisdictionZone || 'Zone 01';
      const officerDisplayName = officer?.name || inspection.inspectorName?.replace(/\s*\([^)]*\)/, '') || 'Amit Verma';
      const officerEmpId = officer?.employeeId || inspection.inspectorName?.match(/\(([^)]+)\)/)?.[1] || 'LM-MP-0421';
      const deptName = officer?.department || `${stateName} Legal Metrology Department`;

      const drawTricolorBar = (yPos: number) => {
        doc.rect(marginX, yPos, contentWidth, 2).fill('#FF9933'); // Saffron
        doc.rect(marginX, yPos + 2, contentWidth, 1.5).fill('#FFFFFF'); // White
        doc.rect(marginX, yPos + 3.5, contentWidth, 2).fill('#138808'); // India Green
      };

      let y = 32;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 32) {
          doc.addPage();
          drawTricolorBar(24);
          y = 32;
        }
      };

      // ══ 1. OFFICIAL HEADER BANNER (46pt) ══════════════════════════════════
      drawTricolorBar(24);

      doc.rect(marginX, y, contentWidth, 46).fill('#0B1F3A');
      doc.fillColor('#F59E0B').fontSize(7.5).font('Helvetica-Bold')
         .text('GOVERNMENT OF INDIA / STATE LEGAL METROLOGY DIRECTORATE', marginX, y + 6, { align: 'center', width: contentWidth, lineBreak: false });
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold')
         .text(`GOVERNMENT OF ${stateName} - DEPARTMENT OF LEGAL METROLOGY`, marginX, y + 17, { align: 'center', width: contentWidth, lineBreak: false });
      doc.fillColor('#CBD5E1').fontSize(7.5).font('Helvetica')
         .text('FORM IV - STATUTORY INSPECTION REPORT & SEIZURE MEMO', marginX, y + 31, { align: 'center', width: contentWidth, lineBreak: false });
      y += 50;

      // ══ 2. REFERENCE & ESTABLISHMENT DETAILS (54pt) ═══════════════════════
      doc.rect(marginX, y, contentWidth, 54).fill('#F8FAFC').stroke('#CBD5E1');
      const colW = (contentWidth - 20) / 2;
      const col1X = marginX + 8;
      const col2X = marginX + colW + 12;

      // Column 1: Inspection Ref, Date, Jurisdiction
      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica-Bold').text('INSPECTION REFERENCE NUMBER:', col1X, y + 6, { lineBreak: false });
      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(inspection.inspectionNumber, col1X + 115, y + 5, { lineBreak: false });

      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica-Bold').text('DATE & TIMESTAMP:', col1X, y + 20, { lineBreak: false });
      const dateStr = inspection.startedAt ? new Date(inspection.startedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN');
      doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica').text(dateStr, col1X + 75, y + 19, { lineBreak: false });

      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica-Bold').text('JURISDICTION:', col1X, y + 34, { lineBreak: false });
      let jurisText = `${districtName}, ${stateName} | ${zoneName}`;
      if (inspection.gpsCoordinates) {
        jurisText += ` (GPS: ${inspection.gpsCoordinates.lat.toFixed(4)}, ${inspection.gpsCoordinates.lng.toFixed(4)})`;
      }
      doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica').text(jurisText, col1X + 55, y + 33, { lineBreak: false });

      // Column 2: Establishment, Trader, Officer
      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica-Bold').text('ESTABLISHMENT:', col2X, y + 6, { lineBreak: false });
      doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text((inspection.shopName || 'Commercial Establishment').slice(0, 30), col2X + 65, y + 5, { lineBreak: false });

      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica-Bold').text('PROPRIETOR / LIC:', col2X, y + 20, { lineBreak: false });
      const licText = inspection.licenseNumber ? `Lic: ${inspection.licenseNumber}` : 'Unregistered / Sec 24';
      doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica').text(`${(inspection.shopkeeperName || 'Proprietor').slice(0, 20)} | ${licText}`, col2X + 75, y + 19, { lineBreak: false });

      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica-Bold').text('INSPECTOR CODE:', col2X, y + 34, { lineBreak: false });
      doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold').text(`${officerDisplayName} (${officerEmpId}) | ${deptName}`, col2X + 72, y + 33, { lineBreak: false });

      y += 58;

      // ══ 3. SUMMARY STATS STRIP (22pt) ═════════════════════════════════════
      const totalCount = products.length;
      const passCount = products.filter(p => p.complianceStatus === 'PASS').length;
      const failCount = products.filter(p => p.complianceStatus === 'FAIL').length;
      const totalViolations = products.reduce((acc, p) => acc + (p.violationsCount || 0), 0);
      const statBoxW = (contentWidth - 12) / 4;

      const drawStatBox = (xPos: number, title: string, value: string | number, color: string) => {
        doc.rect(xPos, y, statBoxW, 22).fill('#FFFFFF').stroke('#E2E8F0');
        doc.fillColor('#64748B').fontSize(6).font('Helvetica-Bold').text(title, xPos, y + 4, { align: 'center', width: statBoxW, lineBreak: false });
        doc.fillColor(color).fontSize(9.5).font('Helvetica-Bold').text(String(value), xPos, y + 11, { align: 'center', width: statBoxW, lineBreak: false });
      };

      drawStatBox(marginX, 'TOTAL INSPECTED', totalCount, '#0F172A');
      drawStatBox(marginX + statBoxW + 4, 'COMPLIANT (PASS)', passCount, '#15803D');
      drawStatBox(marginX + (statBoxW + 4) * 2, 'NON-COMPLIANT (FAIL)', failCount, '#DC2626');
      drawStatBox(marginX + (statBoxW + 4) * 3, 'STATUTORY VIOLATIONS', totalViolations, '#D97706');

      y += 26;

      // ══ 4. INVENTORY OF COMMODITIES INSPECTED ══════════════════════════════
      checkPageBreak(30);
      doc.fillColor('#0B1F3A').fontSize(8.5).font('Helvetica-Bold').text('1. INVENTORY OF COMMODITIES INSPECTED (FIELD AUDIT)', marginX, y, { lineBreak: false });
      y += 12;

      if (products.length === 0) {
        doc.rect(marginX, y, contentWidth, 24).fill('#F8FAFC').stroke('#E2E8F0');
        doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('No commodities recorded in this inspection session.', marginX + 8, y + 8, { lineBreak: false });
        y += 28;
      } else {
        products.forEach((prod, pIdx) => {
          const isFail = prod.complianceStatus === 'FAIL';
          const violations = (prod.ruleResults && prod.ruleResults.length > 0)
            ? prod.ruleResults.filter(r => r.status === 'FAIL')
            : ruleResults.filter(r => r.productId === prod.id && r.status === 'FAIL');

          const decls = prod.declarations || [];
          const rowsCount = Math.ceil(decls.length / 2);
          const declsHeight = rowsCount > 0 ? (rowsCount * 11 + 6) : 0;
          const violHeight = violations.length * 24;
          const totalProdHeight = 18 + declsHeight + violHeight + 6;

          checkPageBreak(totalProdHeight > 160 ? 80 : totalProdHeight);

          // Product header strip
          doc.rect(marginX, y, contentWidth, 16).fill(isFail ? '#FEF2F2' : '#F0FDF4').stroke(isFail ? '#FCA5A5' : '#86EFAC');
          doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold')
             .text(`Item #${pIdx + 1}: ${prod.productName}`, marginX + 6, y + 4, { lineBreak: false });
          const statusText = isFail ? '[FAIL - SEIZURE WARRANTED]' : '[PASS - VERIFIED COMPLIANT]';
          doc.fillColor(isFail ? '#DC2626' : '#15803D').fontSize(7).font('Helvetica-Bold')
             .text(statusText, marginX, y + 4, { align: 'right', width: contentWidth - 8, lineBreak: false });
          y += 18;

          // Declarations table in 2 compact columns
          if (decls.length > 0) {
            doc.rect(marginX, y, contentWidth, declsHeight).fill('#FFFFFF').stroke('#E2E8F0');
            y += 3;
            for (let i = 0; i < decls.length; i += 2) {
              const d1 = decls[i];
              const d2 = decls[i + 1];

              // Column 1
              const isDef1 = !d1.rawValue || d1.rawValue === 'Not Detected' || /lorem|blank|undeclared/i.test(d1.rawValue);
              doc.fillColor('#475569').fontSize(6.5).font('Helvetica-Bold').text(`${d1.field}:`, marginX + 6, y, { lineBreak: false });
              doc.fillColor('#0F172A').fontSize(6.5).font('Helvetica').text(`"${(d1.rawValue || '').slice(0, 30)}"`, marginX + 85, y, { lineBreak: false });
              doc.fillColor(isDef1 ? '#DC2626' : '#15803D').fontSize(6).font('Helvetica-Bold').text(isDef1 ? '[DEFECT]' : '[OK]', marginX + 215, y, { lineBreak: false });

              // Column 2
              if (d2) {
                const isDef2 = !d2.rawValue || d2.rawValue === 'Not Detected' || /lorem|blank|undeclared/i.test(d2.rawValue);
                doc.fillColor('#475569').fontSize(6.5).font('Helvetica-Bold').text(`${d2.field}:`, marginX + 270, y, { lineBreak: false });
                doc.fillColor('#0F172A').fontSize(6.5).font('Helvetica').text(`"${(d2.rawValue || '').slice(0, 30)}"`, marginX + 355, y, { lineBreak: false });
                doc.fillColor(isDef2 ? '#DC2626' : '#15803D').fontSize(6).font('Helvetica-Bold').text(isDef2 ? '[DEFECT]' : '[OK]', marginX + contentWidth - 38, y, { lineBreak: false });
              }
              y += 11;
            }
            y += 4;
          }

          // Violations
          if (violations.length > 0) {
            violations.forEach(v => {
              checkPageBreak(26);
              doc.rect(marginX, y, contentWidth, 22).fill('#FEF2F2').stroke('#FECACA');
              doc.fillColor('#DC2626').fontSize(6.5).font('Helvetica-Bold')
                 .text(`[${v.ruleCode}] ${v.ruleTitle} - Statutory Ref: ${v.sourceReference}`, marginX + 6, y + 3, { lineBreak: false });
              doc.fillColor('#991B1B').fontSize(6).font('Helvetica')
                 .text(`Defect: ${v.message}`, marginX + 6, y + 11, { lineBreak: false });
              y += 24;
            });
          }
          y += 3;
        });
      }

      // ══ 5 & 6. STATUTORY NOTICE & SIGNATURES (Bound together ~115pt) ═══════
      checkPageBreak(115);

      doc.fillColor('#0B1F3A').fontSize(8.5).font('Helvetica-Bold').text('2. STATUTORY ACTION & COMPOUNDING PENALTY NOTICE', marginX, y, { lineBreak: false });
      y += 11;

      doc.rect(marginX, y, contentWidth, 54).fill('#FFFBEB').stroke('#FDE68A');
      doc.fillColor('#92400E').fontSize(7).font('Helvetica-Bold')
         .text('NOTICE UNDER SECTION 15 & 36, LEGAL METROLOGY ACT, 2009 (READ WITH RULE 32 OF LM PC RULES, 2011)', marginX + 8, y + 5, { lineBreak: false });
      doc.fillColor('#78350F').fontSize(6).font('Helvetica')
         .text('In exercise of powers under Section 15 of Legal Metrology Act, 2009, commodities non-compliant with Rule 6 of Packaged Commodities Rules, 2011 are seized. Trader must deposit compounding fee under Section 48 within 14 calendar days, failing which prosecution under Section 36 shall be filed before the Judicial Magistrate.', marginX + 8, y + 15, { width: contentWidth - 16 });

      const minCompounding = Math.max(5000, totalViolations * 5000);
      doc.rect(marginX + 8, y + 33, contentWidth - 16, 16).fill('#FFFFFF').stroke('#FCD34D');
      doc.fillColor('#0F172A').fontSize(6.5).font('Helvetica')
         .text(`Compoundable Violations: ${totalViolations || 1}`, marginX + 16, y + 37, { lineBreak: false });
      doc.fillColor('#0F172A').fontSize(6.5).font('Helvetica')
         .text('Statutory Rate: Rs. 5,000 / violation', marginX + 170, y + 37, { lineBreak: false });
      doc.fillColor('#B45309').fontSize(7).font('Helvetica-Bold')
         .text(`Total Compounding Deposit: Rs. ${minCompounding.toLocaleString('en-IN')}`, marginX + 320, y + 37, { lineBreak: false });

      y += 58;

      // ATTESTATION & SIGNATURE BLOCK (46pt)
      const sigW = (contentWidth - 10) / 2;
      // Left: Trader
      doc.rect(marginX, y, sigW, 46).fill('#F8FAFC').stroke('#E2E8F0');
      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica-Bold').text('TRADER / OCCUPIER ACKNOWLEDGMENT', marginX + 6, y + 5, { lineBreak: false });
      doc.fillColor('#475569').fontSize(6).font('Helvetica').text('Received copy of this statutory notice on the spot:', marginX + 6, y + 14, { lineBreak: false });
      doc.fillColor('#94A3B8').fontSize(6.5).font('Helvetica').text('Signature of Shopkeeper: _______________________', marginX + 6, y + 26, { lineBreak: false });
      doc.fillColor('#475569').fontSize(6).font('Helvetica').text(`Name: ${(inspection.shopkeeperName || 'Proprietor').slice(0, 20)} | Date: ${new Date().toLocaleDateString('en-IN')}`, marginX + 6, y + 36, { lineBreak: false });

      // Right: Officer Seal
      const sig2X = marginX + sigW + 10;
      doc.rect(sig2X, y, sigW, 46).fill('#F8FAFC').stroke('#CBD5E1');
      doc.rect(sig2X, y, sigW, 11).fill('#0B1F3A');
      doc.fillColor('#FFFFFF').fontSize(6).font('Helvetica-Bold')
         .text('DIGITALLY SIGNED & OFFICIALLY SEALED', sig2X, y + 3, { align: 'center', width: sigW, lineBreak: false });
      doc.fillColor('#0F172A').fontSize(7).font('Helvetica-Bold').text(`${officerDisplayName} - Inspector`, sig2X + 6, y + 14, { lineBreak: false });
      doc.fillColor('#475569').fontSize(6).font('Helvetica').text(`Inspector Code: ${officerEmpId} | ${stateName} LM Dept`, sig2X + 6, y + 23, { lineBreak: false });
      doc.fillColor('#15803D').fontSize(5.5).font('Helvetica-Bold')
         .text(`[OK] Timestamp: ${new Date().toISOString()} | Gazetted e-Portal`, sig2X + 6, y + 34, { lineBreak: false });

      // ══ 7. RUNNING FOOTER (With lineBreak: false and margins.bottom = 0) ═══
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const prevBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0; // Prevent PDFKit line wrapper from triggering unintended page breaks!

        doc.moveTo(marginX, pageHeight - 18).lineTo(pageWidth - marginX, pageHeight - 18).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        doc.fillColor('#94A3B8').fontSize(6).font('Helvetica')
           .text('MetriCheck AI - Official Digital Compliance Engine | Ministry of Consumer Affairs, Food & Public Distribution, GOI', marginX, pageHeight - 14, { lineBreak: false });
        doc.fillColor('#94A3B8').fontSize(6).font('Helvetica')
           .text(`Ref: ${inspection.inspectionNumber} | Page ${i + 1} of ${range.count}`, marginX + contentWidth - 150, pageHeight - 14, { align: 'right', width: 150, lineBreak: false });

        doc.page.margins.bottom = prevBottomMargin;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
