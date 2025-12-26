import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface StatementData {
  ownerName: string;
  ownerEmail: string;
  propertyName: string;
  propertyAddress: string;
  statementMonth: Date;
  reservations: {
    guestName: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    amount: number;
    platform: string;
  }[];
  expenses: {
    date: Date;
    category: string;
    description: string;
    amount: number;
  }[];
  totalIncome: number;
  totalExpenses: number;
  managementFee: number;
  managementFeePercent: number;
  netAmount: number;
}

export function generateOwnerStatement(data: StatementData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(38, 122, 84); // Brand green
  doc.text('HostBaku', 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Property Management', 20, 32);
  
  // Statement title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Owner Statement', pageWidth - 20, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(format(data.statementMonth, 'MMMM yyyy'), pageWidth - 20, 32, { align: 'right' });
  
  // Divider
  doc.setDrawColor(200);
  doc.line(20, 40, pageWidth - 20, 40);
  
  // Owner & Property Info
  let yPos = 52;
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Owner', 20, yPos);
  doc.text('Property', pageWidth / 2, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(data.ownerName, 20, yPos);
  doc.text(data.propertyName, pageWidth / 2, yPos);
  
  yPos += 6;
  doc.text(data.ownerEmail, 20, yPos);
  doc.text(data.propertyAddress, pageWidth / 2, yPos);
  
  // Income Section
  yPos += 20;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('Rental Income', 20, yPos);
  
  yPos += 4;
  
  if (data.reservations.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Guest', 'Platform', 'Check-in', 'Check-out', 'Nights', 'Amount']],
      body: data.reservations.map(r => [
        r.guestName,
        r.platform,
        format(new Date(r.checkIn), 'MMM d'),
        format(new Date(r.checkOut), 'MMM d'),
        r.nights.toString(),
        `$${r.amount.toFixed(2)}`
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: [240, 249, 244],
        textColor: [38, 122, 84],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      columnStyles: {
        0: { cellWidth: 40 },
        5: { halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 8;
  } else {
    yPos += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('No reservations this month', 20, yPos);
    yPos += 12;
  }
  
  // Expenses Section
  yPos += 8;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('Expenses', 20, yPos);
  
  yPos += 4;
  
  if (data.expenses.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: data.expenses.map(e => [
        format(new Date(e.date), 'MMM d'),
        e.category,
        e.description,
        `$${e.amount.toFixed(2)}`
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: [255, 245, 245],
        textColor: [180, 60, 60],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      columnStyles: {
        3: { halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 8;
  } else {
    yPos += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('No expenses this month', 20, yPos);
    yPos += 12;
  }
  
  // Summary Section
  yPos += 16;
  doc.setDrawColor(200);
  doc.line(pageWidth - 100, yPos, pageWidth - 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  
  const summaryX = pageWidth - 100;
  const amountX = pageWidth - 20;
  
  doc.text('Total Income', summaryX, yPos);
  doc.text(`$${data.totalIncome.toFixed(2)}`, amountX, yPos, { align: 'right' });
  
  yPos += 8;
  doc.text('Total Expenses', summaryX, yPos);
  doc.text(`-$${data.totalExpenses.toFixed(2)}`, amountX, yPos, { align: 'right' });
  
  yPos += 8;
  doc.text(`Management Fee (${data.managementFeePercent}%)`, summaryX, yPos);
  doc.text(`-$${data.managementFee.toFixed(2)}`, amountX, yPos, { align: 'right' });
  
  yPos += 4;
  doc.setDrawColor(200);
  doc.line(pageWidth - 100, yPos, pageWidth - 20, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(38, 122, 84);
  doc.text('Net Payout', summaryX, yPos);
  doc.text(`$${data.netAmount.toFixed(2)}`, amountX, yPos, { align: 'right' });
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated on ${format(new Date(), 'MMMM d, yyyy')} | HostBaku Property Management`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  
  return Buffer.from(doc.output('arraybuffer'));
}

interface OwnerStatementPDFData {
  statement: {
    statement_date: string;
    total_revenue: number;
    total_expenses: number;
    net_income: number;
    management_fee: number;
    notes: string | null;
    property_name: string;
    property_address: string;
    property_city: string;
    owner_name: string;
    owner_email: string;
  };
  reservations: {
    guest_name: string;
    check_in: string;
    check_out: string;
    total_price: number;
    source: string;
    unit_name: string | null;
  }[];
  expenses: {
    description: string;
    amount: number;
    expense_date: string;
    category: string;
  }[];
}

export async function generateOwnerStatementPDF(data: OwnerStatementPDFData): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const statementDate = new Date(data.statement.statement_date);
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(38, 122, 84); // Brand green
  doc.text('HostBaku', 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Property Management', 20, 32);
  
  // Statement title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Owner Statement', pageWidth - 20, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(format(statementDate, 'MMMM yyyy'), pageWidth - 20, 32, { align: 'right' });
  
  // Divider
  doc.setDrawColor(200);
  doc.line(20, 40, pageWidth - 20, 40);
  
  // Owner & Property Info
  let yPos = 52;
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Owner', 20, yPos);
  doc.text('Property', pageWidth / 2, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(data.statement.owner_name, 20, yPos);
  doc.text(data.statement.property_name, pageWidth / 2, yPos);
  
  yPos += 6;
  doc.text(data.statement.owner_email, 20, yPos);
  const address = [data.statement.property_address, data.statement.property_city].filter(Boolean).join(', ');
  doc.text(address, pageWidth / 2, yPos);
  
  // Income Section
  yPos += 20;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('Rental Income', 20, yPos);
  
  yPos += 4;
  
  if (data.reservations.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Guest', 'Unit', 'Platform', 'Check-in', 'Check-out', 'Amount']],
      body: data.reservations.map(r => {
        const checkIn = new Date(r.check_in);
        const checkOut = new Date(r.check_out);
        return [
          r.guest_name,
          r.unit_name || '-',
          r.source || '-',
          format(checkIn, 'MMM d'),
          format(checkOut, 'MMM d'),
          `$${r.total_price.toFixed(2)}`
        ];
      }),
      theme: 'plain',
      headStyles: {
        fillColor: [240, 249, 244],
        textColor: [38, 122, 84],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        5: { halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 8;
  } else {
    yPos += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('No reservations this month', 20, yPos);
    yPos += 12;
  }
  
  // Expenses Section
  yPos += 8;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('Expenses', 20, yPos);
  
  yPos += 4;
  
  if (data.expenses.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: data.expenses.map(e => [
        format(new Date(e.expense_date), 'MMM d'),
        e.category || '-',
        e.description,
        `$${e.amount.toFixed(2)}`
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: [255, 245, 245],
        textColor: [180, 60, 60],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      columnStyles: {
        3: { halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 8;
  } else {
    yPos += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('No expenses this month', 20, yPos);
    yPos += 12;
  }
  
  // Summary Section
  yPos += 16;
  doc.setDrawColor(200);
  doc.line(pageWidth - 100, yPos, pageWidth - 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  
  const summaryX = pageWidth - 100;
  const amountX = pageWidth - 20;
  
  doc.text('Total Revenue', summaryX, yPos);
  doc.text(`$${data.statement.total_revenue.toFixed(2)}`, amountX, yPos, { align: 'right' });
  
  yPos += 8;
  doc.text('Total Expenses', summaryX, yPos);
  doc.text(`-$${data.statement.total_expenses.toFixed(2)}`, amountX, yPos, { align: 'right' });
  
  yPos += 8;
  doc.text('Management Fee', summaryX, yPos);
  doc.text(`-$${data.statement.management_fee.toFixed(2)}`, amountX, yPos, { align: 'right' });
  
  yPos += 4;
  doc.setDrawColor(200);
  doc.line(pageWidth - 100, yPos, pageWidth - 20, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(38, 122, 84);
  doc.text('Net Income', summaryX, yPos);
  doc.text(`$${data.statement.net_income.toFixed(2)}`, amountX, yPos, { align: 'right' });
  
  // Notes
  if (data.statement.notes) {
    yPos += 20;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'italic');
    doc.text('Notes:', 20, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(data.statement.notes, pageWidth - 40);
    doc.text(splitNotes, 20, yPos);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated on ${format(new Date(), 'MMMM d, yyyy')} | HostBaku Property Management`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  
  return Buffer.from(doc.output('arraybuffer'));
}

export function generateTaskReport(
  tasks: any[],
  propertyName: string,
  dateRange: { from: Date; to: Date }
): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(38, 122, 84);
  doc.text('HostBaku', 20, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Task Report', pageWidth - 20, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(propertyName, 20, 35);
  doc.text(
    `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`,
    pageWidth - 20,
    35,
    { align: 'right' }
  );
  
  doc.setDrawColor(200);
  doc.line(20, 42, pageWidth - 20, 42);
  
  let yPos = 52;
  
  if (tasks.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Type', 'Title', 'Status', 'Assigned To']],
      body: tasks.map(t => [
        t.due_date ? format(new Date(t.due_date), 'MMM d') : '-',
        t.task_type.replace('_', ' '),
        t.title,
        t.status.replace('_', ' '),
        t.assigned_name || '-'
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [38, 122, 84],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { left: 20, right: 20 },
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}
