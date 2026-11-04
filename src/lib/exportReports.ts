import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Expense, Deposit, CategoryItem, UserProfile } from '../types';
import { formatDate } from './dateUtils';

export interface ExpenseExportFilterParams {
  familyName: string;
  currency: string;
  dateRangeLabel: string;
  categoryFilter: string;
  paidByFilter: string;
  paymentMethodFilter: string;
  expenses: Expense[];
  categories: CategoryItem[];
  members: UserProfile[];
}

export interface DepositExportFilterParams {
  familyName: string;
  currency: string;
  dateRangeLabel: string;
  depositTypeFilter: string;
  depositByFilter: string;
  deposits: Deposit[];
  members: UserProfile[];
}

// ==========================================
// 1. EXPENSE REPORT - EXCEL EXPORT
// ==========================================
export function exportExpenseReportToExcel(data: ExpenseExportFilterParams) {
  const wb = XLSX.utils.book_new();

  const totalExpenses = data.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const avgExpense = data.expenses.length > 0 ? totalExpenses / data.expenses.length : 0;

  // Summary Sheet
  const summaryRows = [
    ['Family Expense Tracker - Expense Report'],
    ['Family Name', data.familyName],
    ['Period', data.dateRangeLabel],
    ['Generated On', new Date().toLocaleString()],
    [],
    ['Filters Applied'],
    ['Category Filter', data.categoryFilter],
    ['Paid By Filter', data.paidByFilter],
    ['Payment Method Filter', data.paymentMethodFilter],
    [],
    ['Summary Metric', `Value (${data.currency})`],
    ['Total Filtered Expenses', totalExpenses],
    ['Transaction Count', data.expenses.length],
    ['Average Expense', Math.round(avgExpense * 100) / 100],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Expense Summary');

  // Detailed Transactions Sheet
  const expenseRows = data.expenses.map((e) => ({
    'Date': formatDate(e.date),
    'Expense Title': e.title,
    'Category': e.category,
    [`Amount (${data.currency})`]: Number(e.amount) || 0,
    'Paid By': e.paidByName,
    'Payment Method': e.paymentMethod || 'Cash',
    'Description / Remarks': e.description || '',
  }));
  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Detailed Expenses');

  // Category Breakdown Sheet
  const catMap: Record<string, { count: number; total: number }> = {};
  data.expenses.forEach((e) => {
    const cat = e.category || 'Other';
    if (!catMap[cat]) catMap[cat] = { count: 0, total: 0 };
    catMap[cat].count += 1;
    catMap[cat].total += Number(e.amount) || 0;
  });
  const catRows = Object.entries(catMap).map(([cat, stat]) => ({
    'Category': cat,
    'Transactions': stat.count,
    [`Total Amount (${data.currency})`]: stat.total,
    'Percentage': totalExpenses > 0 ? `${((stat.total / totalExpenses) * 100).toFixed(1)}%` : '0%',
  }));
  const wsCategories = XLSX.utils.json_to_sheet(catRows);
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Category Breakdown');

  const filename = `${data.familyName.replace(/\s+/g, '_')}_Expense_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ==========================================
// 2. EXPENSE REPORT - PDF EXPORT
// ==========================================
export function exportExpenseReportToPDF(data: ExpenseExportFilterParams) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalExpenses = data.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const avgExpense = data.expenses.length > 0 ? totalExpenses / data.expenses.length : 0;

  // Header Banner (#006466 Deep Teal matching reports theme)
  doc.setFillColor(0, 100, 102); // #006466
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('FAMILY EXPENSE REPORT', 14, 15);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`${data.familyName} • Period: ${data.dateRangeLabel}`, 14, 23);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 23);

  // Filter badges banner
  let yPos = 40;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const filterDesc = `Filters: [Category: ${data.categoryFilter}] • [Paid By: ${data.paidByFilter}] • [Payment: ${data.paymentMethodFilter}]`;
  doc.text(filterDesc, 14, yPos);

  yPos += 7;
  // Summary Metric Cards
  doc.setFillColor(255, 241, 242); // Rose light for expenses
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(14, yPos, 58, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(159, 18, 57);
  doc.text('TOTAL EXPENSES', 18, yPos + 6);
  doc.setFontSize(12);
  doc.text(`${data.currency} ${totalExpenses.toLocaleString()}`, 18, yPos + 14);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(76, yPos, 58, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('TRANSACTIONS', 80, yPos + 6);
  doc.setFontSize(12);
  doc.text(`${data.expenses.length} records`, 80, yPos + 14);

  doc.setFillColor(240, 253, 250); // Teal light
  doc.setDrawColor(204, 251, 241);
  doc.roundedRect(138, yPos, 58, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(19, 78, 74);
  doc.text('AVERAGE EXPENSE', 142, yPos + 6);
  doc.setFontSize(12);
  doc.text(`${data.currency} ${Math.round(avgExpense).toLocaleString()}`, 142, yPos + 14);

  // Category Breakdown Table
  yPos += 28;
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Category-Wise Summary', 14, yPos);

  yPos += 5;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, yPos, 182, 7, 'F');
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Category', 18, yPos + 5);
  doc.text('Count', 90, yPos + 5);
  doc.text(`Amount (${data.currency})`, 130, yPos + 5);
  doc.text('Share %', 170, yPos + 5);

  const catMap: Record<string, { count: number; amount: number }> = {};
  data.expenses.forEach((e) => {
    const c = e.category || 'Other';
    if (!catMap[c]) catMap[c] = { count: 0, amount: 0 };
    catMap[c].count += 1;
    catMap[c].amount += Number(e.amount) || 0;
  });

  const catEntries = Object.entries(catMap).sort((a, b) => b[1].amount - a[1].amount);
  yPos += 7;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  catEntries.slice(0, 8).forEach(([cat, stat]) => {
    const pct = totalExpenses > 0 ? ((stat.amount / totalExpenses) * 100).toFixed(1) : '0';
    doc.text(cat, 18, yPos + 4);
    doc.text(String(stat.count), 90, yPos + 4);
    doc.text(`${data.currency} ${stat.amount.toLocaleString()}`, 130, yPos + 4);
    doc.text(`${pct}%`, 170, yPos + 4);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, yPos + 6, 196, yPos + 6);
    yPos += 6;
  });

  // Detailed Transactions Table
  yPos += 8;
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Detailed Expenses (${data.expenses.length} Items)`, 14, yPos);

  yPos += 5;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, yPos, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Date', 18, yPos + 5);
  doc.text('Expense Title', 42, yPos + 5);
  doc.text('Category', 95, yPos + 5);
  doc.text('Paid By', 130, yPos + 5);
  doc.text('Method', 158, yPos + 5);
  doc.text('Amount', 182, yPos + 5);

  yPos += 7;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  data.expenses.forEach((e) => {
    if (yPos > 275) {
      doc.addPage();
      yPos = 20;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Date', 18, yPos + 5);
      doc.text('Expense Title', 42, yPos + 5);
      doc.text('Category', 95, yPos + 5);
      doc.text('Paid By', 130, yPos + 5);
      doc.text('Method', 158, yPos + 5);
      doc.text('Amount', 182, yPos + 5);
      yPos += 7;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
    }
    doc.text(formatDate(e.date), 18, yPos + 4);
    doc.text(e.title.length > 25 ? e.title.substring(0, 23) + '...' : e.title, 42, yPos + 4);
    doc.text(e.category.length > 16 ? e.category.substring(0, 15) + '..' : e.category, 95, yPos + 4);
    doc.text(e.paidByName.length > 14 ? e.paidByName.substring(0, 13) + '..' : e.paidByName, 130, yPos + 4);
    doc.text((e.paymentMethod || 'Cash').substring(0, 11), 158, yPos + 4);
    doc.text(`${data.currency} ${Number(e.amount).toLocaleString()}`, 182, yPos + 4);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, yPos + 5.5, 196, yPos + 5.5);
    yPos += 5.5;
  });

  const filename = `${data.familyName.replace(/\s+/g, '_')}_Expense_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// ==========================================
// 3. DEPOSIT REPORT - EXCEL EXPORT
// ==========================================
export function exportDepositReportToExcel(data: DepositExportFilterParams) {
  const wb = XLSX.utils.book_new();

  const totalDeposits = data.deposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const avgDeposit = data.deposits.length > 0 ? totalDeposits / data.deposits.length : 0;

  // Summary Sheet
  const summaryRows = [
    ['Family Expense Tracker - Deposit Report'],
    ['Family Name', data.familyName],
    ['Period', data.dateRangeLabel],
    ['Generated On', new Date().toLocaleString()],
    [],
    ['Filters Applied'],
    ['Deposit Type Filter', data.depositTypeFilter],
    ['Deposit By Filter', data.depositByFilter],
    [],
    ['Summary Metric', `Value (${data.currency})`],
    ['Total Filtered Deposits', totalDeposits],
    ['Transaction Count', data.deposits.length],
    ['Average Deposit', Math.round(avgDeposit * 100) / 100],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Deposit Summary');

  // Detailed Transactions Sheet
  const depositRows = data.deposits.map((d) => ({
    'Date': formatDate(d.date),
    'Deposit Title': d.title,
    'Deposit Type': d.depositType || 'Contribution',
    [`Amount (${data.currency})`]: Number(d.amount) || 0,
    'Deposit By': d.depositedByName,
    'Payment Method': d.paymentMethod || 'Cash',
    'Description / Remarks': d.description || '',
  }));
  const wsDeposits = XLSX.utils.json_to_sheet(depositRows);
  XLSX.utils.book_append_sheet(wb, wsDeposits, 'Detailed Deposits');

  // Type Breakdown Sheet
  const typeMap: Record<string, { count: number; total: number }> = {};
  data.deposits.forEach((d) => {
    const t = d.depositType || 'Contribution';
    if (!typeMap[t]) typeMap[t] = { count: 0, total: 0 };
    typeMap[t].count += 1;
    typeMap[t].total += Number(d.amount) || 0;
  });
  const typeRows = Object.entries(typeMap).map(([type, stat]) => ({
    'Deposit Type': type,
    'Transactions': stat.count,
    [`Total Amount (${data.currency})`]: stat.total,
    'Percentage': totalDeposits > 0 ? `${((stat.total / totalDeposits) * 100).toFixed(1)}%` : '0%',
  }));
  const wsTypes = XLSX.utils.json_to_sheet(typeRows);
  XLSX.utils.book_append_sheet(wb, wsTypes, 'Deposit Type Breakdown');

  const filename = `${data.familyName.replace(/\s+/g, '_')}_Deposit_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ==========================================
// 4. DEPOSIT REPORT - PDF EXPORT
// ==========================================
export function exportDepositReportToPDF(data: DepositExportFilterParams) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalDeposits = data.deposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const avgDeposit = data.deposits.length > 0 ? totalDeposits / data.deposits.length : 0;

  // Header Banner (#006466 Deep Teal matching reports theme)
  doc.setFillColor(0, 100, 102); // #006466
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('FAMILY DEPOSIT REPORT', 14, 15);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`${data.familyName} • Period: ${data.dateRangeLabel}`, 14, 23);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 23);

  // Filter badges banner
  let yPos = 40;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const filterDesc = `Filters: [Deposit Type: ${data.depositTypeFilter}] • [Deposit By: ${data.depositByFilter}]`;
  doc.text(filterDesc, 14, yPos);

  yPos += 7;
  // Summary Metric Cards
  doc.setFillColor(240, 253, 244); // Emerald light for deposits
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, yPos, 58, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL DEPOSITS', 18, yPos + 6);
  doc.setFontSize(12);
  doc.text(`${data.currency} ${totalDeposits.toLocaleString()}`, 18, yPos + 14);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(76, yPos, 58, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('TRANSACTIONS', 80, yPos + 6);
  doc.setFontSize(12);
  doc.text(`${data.deposits.length} records`, 80, yPos + 14);

  doc.setFillColor(240, 253, 250); // Teal light
  doc.setDrawColor(204, 251, 241);
  doc.roundedRect(138, yPos, 58, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(19, 78, 74);
  doc.text('AVERAGE DEPOSIT', 142, yPos + 6);
  doc.setFontSize(12);
  doc.text(`${data.currency} ${Math.round(avgDeposit).toLocaleString()}`, 142, yPos + 14);

  // Deposit Type Breakdown Table
  yPos += 28;
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Deposit Type Summary', 14, yPos);

  yPos += 5;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, yPos, 182, 7, 'F');
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Deposit Type', 18, yPos + 5);
  doc.text('Count', 90, yPos + 5);
  doc.text(`Amount (${data.currency})`, 130, yPos + 5);
  doc.text('Share %', 170, yPos + 5);

  const typeMap: Record<string, { count: number; amount: number }> = {};
  data.deposits.forEach((d) => {
    const t = d.depositType || 'Contribution';
    if (!typeMap[t]) typeMap[t] = { count: 0, amount: 0 };
    typeMap[t].count += 1;
    typeMap[t].amount += Number(d.amount) || 0;
  });

  const typeEntries = Object.entries(typeMap).sort((a, b) => b[1].amount - a[1].amount);
  yPos += 7;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  typeEntries.slice(0, 8).forEach(([type, stat]) => {
    const pct = totalDeposits > 0 ? ((stat.amount / totalDeposits) * 100).toFixed(1) : '0';
    doc.text(type, 18, yPos + 4);
    doc.text(String(stat.count), 90, yPos + 4);
    doc.text(`${data.currency} ${stat.amount.toLocaleString()}`, 130, yPos + 4);
    doc.text(`${pct}%`, 170, yPos + 4);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, yPos + 6, 196, yPos + 6);
    yPos += 6;
  });

  // Detailed Transactions Table
  yPos += 8;
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Detailed Deposits (${data.deposits.length} Items)`, 14, yPos);

  yPos += 5;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, yPos, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Date', 18, yPos + 5);
  doc.text('Deposit Title', 42, yPos + 5);
  doc.text('Deposit Type', 95, yPos + 5);
  doc.text('Deposit By', 130, yPos + 5);
  doc.text('Method', 158, yPos + 5);
  doc.text('Amount', 182, yPos + 5);

  yPos += 7;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  data.deposits.forEach((d) => {
    if (yPos > 275) {
      doc.addPage();
      yPos = 20;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Date', 18, yPos + 5);
      doc.text('Deposit Title', 42, yPos + 5);
      doc.text('Deposit Type', 95, yPos + 5);
      doc.text('Deposit By', 130, yPos + 5);
      doc.text('Method', 158, yPos + 5);
      doc.text('Amount', 182, yPos + 5);
      yPos += 7;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
    }
    doc.text(formatDate(d.date), 18, yPos + 4);
    doc.text(d.title.length > 25 ? d.title.substring(0, 23) + '...' : d.title, 42, yPos + 4);
    doc.text((d.depositType || 'Contribution').substring(0, 15), 95, yPos + 4);
    doc.text(d.depositedByName.length > 14 ? d.depositedByName.substring(0, 13) + '..' : d.depositedByName, 130, yPos + 4);
    doc.text((d.paymentMethod || 'Cash').substring(0, 11), 158, yPos + 4);
    doc.text(`${data.currency} ${Number(d.amount).toLocaleString()}`, 182, yPos + 4);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, yPos + 5.5, 196, yPos + 5.5);
    yPos += 5.5;
  });

  const filename = `${data.familyName.replace(/\s+/g, '_')}_Deposit_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Backwards compatibility
export function exportToExcel(data: any) {
  exportExpenseReportToExcel({
    familyName: data.familyName,
    currency: data.currency,
    dateRangeLabel: data.dateRangeLabel,
    categoryFilter: 'All Categories',
    paidByFilter: 'All Paid By',
    paymentMethodFilter: 'All Payment Methods',
    expenses: data.expenses || [],
    categories: data.categories || [],
    members: data.members || [],
  });
}

export function exportToPDF(data: any) {
  exportExpenseReportToPDF({
    familyName: data.familyName,
    currency: data.currency,
    dateRangeLabel: data.dateRangeLabel,
    categoryFilter: 'All Categories',
    paidByFilter: 'All Paid By',
    paymentMethodFilter: 'All Payment Methods',
    expenses: data.expenses || [],
    categories: data.categories || [],
    members: data.members || [],
  });
}
