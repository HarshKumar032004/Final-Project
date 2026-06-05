import { Request, Response } from 'express';
import { AppError, asyncHandler } from '../middleware/errorHandler.middleware';
import { HttpStatus } from '../types/enums';
import prisma from '../config/database';
import PDFDocument from 'pdfkit';

// ─── Export CSV ───────────────────────────────────────────────────────────────
export const exportCSV = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;

  if (!companyId) {
    throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const logs = await prisma.emissionRecord.findMany({
    where: { companyId },
    orderBy: { dateLogged: 'desc' },
  });

  const headers = ['ID', 'Scope', 'Category', 'Description', 'Amount', 'Unit', 'Emission Factor', 'CO2e', 'Date Logged'];
  const csvRows = [headers.join(',')];

  for (const log of logs) {
    const row = [
      log.id,
      log.scope,
      log.category,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      log.amount,
      log.unit,
      log.emissionFactor,
      log.calculatedCO2e,
      log.dateLogged.toISOString(),
    ];
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="emission_logs.csv"');
  res.status(HttpStatus.OK).send(csvContent);
});

// ─── Export PDF (Pro/Enterprise Only) ─────────────────────────────────────────
export const exportPDF = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;

  if (!companyId) {
    throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  if (!company) {
    throw new AppError('Company not found', HttpStatus.NOT_FOUND);
  }

  const logs = await prisma.emissionRecord.findMany({
    where: { companyId },
    orderBy: { dateLogged: 'desc' },
    take: 100, // Limit to recent 100 for dummy report
  });

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${company.name.replace(/\\s+/g, '_')}_Emissions_Report.pdf"`);
  
  doc.pipe(res);

  // Header
  doc
    .fillColor('#059669') // Emerald 600
    .fontSize(24)
    .text('CarbonTrack', { align: 'left' })
    .fillColor('#1e293b') // Slate 800
    .fontSize(16)
    .text('Emissions Report', { align: 'right', continued: true })
    .moveDown(0.5);

  doc
    .fontSize(10)
    .fillColor('#64748b') // Slate 500
    .text(`Company: ${company.name}`)
    .text(`Generated: ${new Date().toLocaleDateString()}`)
    .moveDown(2);

  // Summary
  const totalCO2e = logs.reduce((sum, log) => sum + log.calculatedCO2e, 0);
  doc
    .fillColor('#1e293b')
    .fontSize(14)
    .text('Executive Summary', { underline: true })
    .moveDown(0.5)
    .fontSize(12)
    .fillColor('#334155')
    .text(`Total recorded emissions in this period: ${totalCO2e.toFixed(2)} kgCO2e.`)
    .text(`Total logs analyzed: ${logs.length}`)
    .moveDown(2);

  // Logs Table Header
  doc
    .fillColor('#1e293b')
    .fontSize(14)
    .text('Recent Logs', { underline: true })
    .moveDown(0.5);

  let y = doc.y;
  doc
    .fontSize(10)
    .fillColor('#000000')
    .text('Date', 50, y, { width: 100 })
    .text('Scope', 150, y, { width: 100 })
    .text('Category', 250, y, { width: 100 })
    .text('CO2e (kg)', 450, y, { width: 100 });
  
  doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
  doc.moveDown(1);

  // Logs Table Rows
  y = doc.y;
  for (const log of logs) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    
    doc
      .fillColor('#334155')
      .text(log.dateLogged.toLocaleDateString(), 50, y, { width: 100 })
      .text(log.scope, 150, y, { width: 100 })
      .text(log.category, 250, y, { width: 150 })
      .text(log.calculatedCO2e.toFixed(2), 450, y, { width: 100 });
    
    y += 20;
  }

  doc.end();
});
