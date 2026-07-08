import prisma from '../../../prisma/prisma.js';
import { AppError } from '../../utils/AppError.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// --- Dashboard Metrics ---
export const getDashboardMetrics = async () => {
  // 1. KPIs
  const totalDevices = await prisma.device.count();
  
  const unreadAlerts = await prisma.alert.count({
    where: { type: 'CRITICAL', isRead: false }
  });
  
  const allWos = await prisma.workOrder.count();
  const completedWos = await prisma.workOrder.count({ where: { status: 'DONE' } });
  const woCompletionRate = allWos > 0 ? Math.round((completedWos / allWos) * 100) : 0;
  
  const recordsTracked = await prisma.device.count() + await prisma.workOrder.count() + await prisma.pMTask.count() + await prisma.faultReport.count();

  // 2. Compliance Trend (Mocked past 12 months for now, since generating a proper time-series in Prisma without raw queries is tricky and data might be sparse)
  // To avoid complexity, we'll return a static shape or simple aggregation if data exists.
  // Actually, let's fetch all PM tasks for the last 12 months and group by month in memory.
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const recentPMs = await prisma.pMTask.findMany({
    where: { scheduledAt: { gte: oneYearAgo } },
    select: { scheduledAt: true, status: true }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const complianceMap = {};
  
  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mName = monthNames[d.getMonth()];
    complianceMap[mName] = { total: 0, completed: 0 };
  }

  recentPMs.forEach(pm => {
    const mName = monthNames[pm.scheduledAt.getMonth()];
    if (complianceMap[mName]) {
      complianceMap[mName].total++;
      if (pm.status === 'COMPLETED') complianceMap[mName].completed++;
    }
  });

  const complianceData = Object.keys(complianceMap).map(name => {
    const { total, completed } = complianceMap[name];
    const value = total > 0 ? Math.round((completed / total) * 100) : 100; // default 100 if no tasks
    return { name, value };
  });

  // 3. Fault Summary (by Department)
  const faults = await prisma.faultReport.findMany({
    include: { device: { include: { department: true } } }
  });

  const faultMap = {};
  faults.forEach(f => {
    const depName = f.device?.department?.name || 'Other';
    faultMap[depName] = (faultMap[depName] || 0) + 1;
  });
  
  const faultData = Object.keys(faultMap).map(name => ({ name, value: faultMap[name] }));

  // 4. Maintenance Cost
  const completedWosWithCosts = await prisma.workOrder.findMany({
    where: { status: 'DONE' },
    include: { device: true }
  });

  const costMap = {};
  completedWosWithCosts.forEach(wo => {
    const cat = wo.device?.category || 'General';
    if (!costMap[cat]) costMap[cat] = { parts: 0, labour: 0 };
    costMap[cat].parts += (wo.partsCost || 0);
    costMap[cat].labour += (wo.laborCost || 0);
  });

  const costData = Object.keys(costMap).map(name => ({
    name,
    parts: costMap[name].parts,
    labour: costMap[name].labour
  }));

  // 5. Spare Parts Consumption
  const parts = await prisma.part.findMany({
    orderBy: { qty: 'asc' },
    take: 5
  });

  const sparePartsData = parts.map((p, i) => ({
    name: p.name,
    count: p.qty,
    max: p.maxLevel || 100,
    color: ['#F87171', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'][i % 5]
  }));

  return {
    kpis: {
      totalDevices,
      criticalAlerts: unreadAlerts,
      woCompletionRate: `${woCompletionRate}%`,
      recordsTracked
    },
    complianceData,
    faultData,
    costData,
    sparePartsData
  };
};

export const getGeneratedReports = async ({ page = 1, limit = 10, category, format, search }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (category) where.category = category;
  if (format) where.format = format;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [items, total] = await Promise.all([
    prisma.generatedReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: { generatedAt: 'desc' },
      include: { requestedBy: { select: { name: true } } }
    }),
    prisma.generatedReport.count({ where })
  ]);

  return {
    items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

// --- Report Generation Logic ---

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

export const generateReport = async (userId, data) => {
  const { title, category, format, period } = data;

  if (format !== 'PDF') {
    throw new AppError(`Generation of ${format} is not supported in this MVP. Only PDF is supported.`, 400);
  }

  // Create PENDING record
  const report = await prisma.generatedReport.create({
    data: {
      title,
      category,
      format,
      period,
      status: 'PENDING',
      requestedById: userId
    }
  });

  // Determine report type based on title (simple heuristic for MVP)
  const isTech = title.toLowerCase().includes('technician');
  const isPM = title.toLowerCase().includes('pm') || title.toLowerCase().includes('preventive');
  const isFault = title.toLowerCase().includes('fault') || title.toLowerCase().includes('failure');
  const isGeneral = title.toLowerCase().includes('general');

  let reportType = isGeneral ? 'GENERAL' : isPM ? 'PM' : isFault ? 'FAULT' : isTech ? 'TECH' : 'PM'; // Default to PM if unknown

  // Generate PDF asynchronously (or synchronously depending on preference, we will await for simplicity here)
  try {
    const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
    ensureDir(reportsDir);

    const fileName = `RPT-${report.id}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // Call specific generators
    if (reportType === 'PM') {
      await generatePMReportContent(doc);
    } else if (reportType === 'FAULT') {
      await generateFaultReportContent(doc);
    } else if (reportType === 'TECH') {
      await generateTechReportContent(doc);
    } else if (reportType === 'GENERAL') {
      await generatePMReportContent(doc);
      doc.addPage();
      await generateFaultReportContent(doc);
      doc.addPage();
      await generateTechReportContent(doc);
    }

    doc.end();

    // Wait for write to finish
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const stats = fs.statSync(filePath);

    // Update record to COMPLETED
    return await prisma.generatedReport.update({
      where: { id: report.id },
      data: {
        status: 'COMPLETED',
        filePath: fileName,
        sizeBytes: stats.size
      },
      include: { requestedBy: { select: { name: true } } }
    });

  } catch (error) {
    await prisma.generatedReport.update({
      where: { id: report.id },
      data: { status: 'FAILED' }
    });
    throw new AppError('Failed to generate report', 500);
  }
};

const generatePMReportContent = async (doc) => {
  const totalPM = await prisma.pMTask.count();
  const completedPM = await prisma.pMTask.count({ where: { status: 'COMPLETED' } });
  const pendingPM = await prisma.pMTask.count({ where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } });
  const overduePM = await prisma.pMTask.count({ where: { status: 'OVERDUE' } });
  
  const compliance = totalPM > 0 ? Math.round((completedPM / totalPM) * 100) : 0;

  doc.fontSize(14).text('Executive Summary / KPIs', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12)
     .text(`Total PM Tasks: ${totalPM}`)
     .text(`Completed: ${completedPM}`)
     .text(`Pending: ${pendingPM}`)
     .text(`Overdue: ${overduePM}`)
     .text(`Overall PM Compliance: ${compliance}%`);
  
  doc.moveDown(2);
  doc.fontSize(14).text('Recommendations', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  if (overduePM > 0) {
    doc.text(`- There are ${overduePM} overdue PM tasks. Prioritize scheduling technicians to resolve these immediately to maintain equipment reliability.`);
  } else {
    doc.text('- PM compliance is well-managed with no overdue tasks currently.');
  }
  if (compliance < 80) {
    doc.text('- Overall PM compliance is below 80%. Consider increasing technician capacity or reviewing PM frequency.');
  }
};

const generateFaultReportContent = async (doc) => {
  const totalFaults = await prisma.faultReport.count();
  const resolvedFaults = await prisma.faultReport.count({ where: { status: 'SOLVED' } });
  const pendingFaults = await prisma.faultReport.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } });

  doc.fontSize(14).text('Executive Summary / KPIs', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12)
     .text(`Total Fault Reports: ${totalFaults}`)
     .text(`Resolved Faults: ${resolvedFaults}`)
     .text(`Pending Faults: ${pendingFaults}`);

  doc.moveDown(2);
  doc.fontSize(14).text('Recommendations', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  if (pendingFaults > resolvedFaults) {
    doc.text('- You have more pending faults than resolved ones. Reallocate technical staff to tackle the backlog.');
  } else {
    doc.text('- Fault resolution rate is healthy.');
  }
};

const generateTechReportContent = async (doc) => {
  const techStats = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: {
      name: true,
      _count: {
        select: {
          assignedWorkOrders: true,
          assignedPMTasks: true
        }
      }
    }
  });

  doc.fontSize(14).text('Technician Workloads', { underline: true });
  doc.moveDown(0.5);
  
  let maxTech = null;
  let maxCount = -1;

  techStats.forEach(t => {
    const total = t._count.assignedWorkOrders + t._count.assignedPMTasks;
    doc.fontSize(12).text(`${t.name}: ${total} total assignments (${t._count.assignedWorkOrders} WOs, ${t._count.assignedPMTasks} PMs)`);
    if (total > maxCount) {
      maxCount = total;
      maxTech = t.name;
    }
  });

  doc.moveDown(2);
  doc.fontSize(14).text('Recommendations', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  if (maxTech) {
    doc.text(`- Technician ${maxTech} currently has the highest workload (${maxCount} tasks). Consider redistributing tasks to prevent burnout and delays.`);
  }
};

export const getReportFile = async (id) => {
  const report = await prisma.generatedReport.findUnique({ where: { id } });
  if (!report || !report.filePath) {
    throw new AppError('Report file not found', 404);
  }
  const fullPath = path.join(process.cwd(), 'uploads', 'reports', report.filePath);
  if (!fs.existsSync(fullPath)) {
    throw new AppError('File physically missing from server', 404);
  }
  return { path: fullPath, name: report.filePath };
};
