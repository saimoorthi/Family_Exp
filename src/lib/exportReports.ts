import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Expense, Deposit, CategoryItem, UserProfile } from '../types';
import { formatDate } from './dateUtils';

interface ExportReportData {
  familyName: string;
  currency: string;
  dateRangeLabel: string;
  expenses: Expense[];
  deposits: Deposit[];
  categories: CategoryItem[];
  members: UserProfile[];
}

export function exportToExcel(data: ExportReportData) {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const totalExpenses = data.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalDeposits = data.deposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const netSavings = totalDeposits - totalExpenses;

  const summaryRows = [
    ['Family Expense Management - Financial Report'],
    ['Family Name', data.familyName],
    ['Report Period', data.dateRangeLabel],
    ['Generated On', new Date().toLocaleString()],
    [],
    ['Financial Metric', `Amount (${data.currency})`],
    ['Total Deposits (Inflow)', totalDeposits],
    ['Total Expenses (Outflow)', totalExpenses],
    ['Net Savings / Balance', netSavings],
    ['Savings Rate %', totalDeposits > 0 ? `${Math.round((netSavings / totalDeposits) * 100)}%` : '0%'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Expenses Sheet
  const expenseRows = data.expenses.map((e) => ({
    'Date': formatDate(e.date),
    'Title': e.title,
    'Category': e.category,
    [`Amount (${data.currency})`]: e.amount,
    'Paid By': e.paidByName,
    'Payment Method': e.paymentMethod,
    'Description': e.description || '',
  }));
  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // 3. Deposits Sheet
  const depositRows = data.deposits.map((d) => ({
    'Date': formatDate(d.date),
    'Title': d.title,
    [`Amount (${data.currency})`]: d.amount,
    'Deposited By': d.depositedByName,
    'Payment Method': d.paymentMethod,
    'Description': d.description || '',
  }));
  const wsDeposits = XLSX.utils.json_to_sheet(depositRows);
  XLSX.utils.book_append_sheet(wb, wsDeposits, 'Deposits');

  // 4. Category Breakdown Sheet
  const catMap: Record<string, number> = {};
  data.expenses.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0);
  });
  const catRows = Object.entries(catMap).map(([cat, amt]) => ({
    'Category': cat,
    [`Total (${data.currency})`]: amt,
    'Percentage': totalExpenses > 0 ? `${((amt / totalExpenses) * 100).toFixed(1)}%` : '0%',
  }));
  const wsCategories = XLSX.utils.json_to_sheet(catRows);
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Category Breakdown');

  // Save File
  const filename = `${data.familyName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportToPDF(data: ExportReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalExpenses = data.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalDeposits = data.deposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const netSavings = totalDeposits - totalExpenses;

  // Header branding banner
  doc.setFillColor(79, 70, 229); // #4F46E5 Indigo
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('FAMILY EXPENSE REPORT', 14, 16);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${data.familyName} • ${data.dateRangeLabel}`, 14, 24);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 24);

  // Summary Metrics Section
  let yPos = 44;
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Financial Overview', 14, yPos);

  yPos += 8;
  // Card 1: Deposits
  doc.setFillColor(240, 253, 244); // mint light
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, yPos, 58, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL DEPOSITS', 18, yPos + 6);
  doc.setFontSize(12);
  doc.text(`${data.currency} ${totalDeposits.toLocaleString()}`, 18, yPos + 14);

  // Card 2: Expenses
  doc.setFillColor(255, 241, 242); // rose light
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(76, yPos, 58, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(159, 18, 57);
  doc.text('TOTAL EXPENSES', 80, yPos + 6);
  doc.setFontSize(12);
  doc.text(`${data.currency} ${totalExpenses.toLocaleString()}`, 80, yPos + 14);

  // Card 3: Balance
  doc.setFillColor(238, 242, 255); // indigo light
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(138, yPos, 58, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(49, 46, 129);
  doc.text('NET SAVINGS / BALANCE', 142, yPos + 6);
  doc.setFontSize(12);
  doc.text(`${data.currency} ${netSavings.toLocaleString()}`, 142, yPos + 14);

  // Category Breakdown Table
  yPos += 30;
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Category-Wise Breakdown', 14, yPos);

  yPos += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, yPos, 182, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Category', 18, yPos + 5);
  doc.text('Transactions', 90, yPos + 5);
  doc.text(`Amount (${data.currency})`, 130, yPos + 5);
  doc.text('Share %', 170, yPos + 5);

  const catMap: Record<string, { count: number; amount: number }> = {};
  data.expenses.forEach((e) => {
    if (!catMap[e.category]) catMap[e.category] = { count: 0, amount: 0 };
    catMap[e.category].count += 1;
    catMap[e.category].amount += Number(e.amount) || 0;
  });

  const catEntries = Object.entries(catMap).sort((a, b) => b[1].amount - a[1].amount);

  yPos += 7;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  catEntries.slice(0, 10).forEach(([cat, stat]) => {
    const pct = totalExpenses > 0 ? ((stat.amount / totalExpenses) * 100).toFixed(1) : '0';
    doc.text(cat, 18, yPos + 4);
    doc.text(String(stat.count), 90, yPos + 4);
    doc.text(`${data.currency} ${stat.amount.toLocaleString()}`, 130, yPos + 4);
    doc.text(`${pct}%`, 170, yPos + 4);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, yPos + 6, 196, yPos + 6);
    yPos += 6.5;
  });

  // Recent Transactions Section
  yPos += 6;
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Detailed Expenses Summary (Top Records)', 14, yPos);

  yPos += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, yPos, 182, 7, 'F');
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Date', 18, yPos + 5);
  doc.text('Expense Title', 45, yPos + 5);
  doc.text('Category', 105, yPos + 5);
  doc.text('Paid By', 145, yPos + 5);
  doc.text(`Amount`, 175, yPos + 5);

  yPos += 7;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  data.expenses.slice(0, 15).forEach((e) => {
    if (yPos > 275) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(formatDate(e.date), 18, yPos + 4);
    doc.text(e.title.length > 28 ? e.title.substring(0, 26) + '...' : e.title, 45, yPos + 4);
    doc.text(e.category, 105, yPos + 4);
    doc.text(e.paidByName, 145, yPos + 4);
    doc.text(`${data.currency} ${Number(e.amount).toLocaleString()}`, 175, yPos + 4);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, yPos + 6, 196, yPos + 6);
    yPos += 6;
  });

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Family Expense Management System • Confidential & for family records only.',
    14,
    285
  );

  const filename = `${data.familyName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
