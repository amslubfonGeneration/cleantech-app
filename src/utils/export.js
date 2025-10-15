import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import db from './db.js';

export async function exportStatsPDF() {
  const doc = new PDFDocument();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  const stats = getStats();

  doc.fontSize(20).text('Statistiques CleanTech', { align: 'center' });
  doc.moveDown();

  for (const [label, value] of Object.entries(stats)) {
    doc.fontSize(12).text(`${label} : ${value}`);
  }

  doc.end();
  return await new Promise(resolve => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

export async function exportStatsExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Statistiques');

  const stats = getStats();

  sheet.columns = [
    { header: 'Statistique', key: 'label', width: 30 },
    { header: 'Valeur', key: 'value', width: 20 }
  ];

  for (const [label, value] of Object.entries(stats)) {
    sheet.addRow({ label, value });
  }

  return await workbook.xlsx.writeBuffer();
}

function getStats() {
  return {
    'Utilisateurs': db.prepare('SELECT COUNT(*) FROM users').get()['COUNT(*)'],
    'Points cumulés': db.prepare('SELECT SUM(points) FROM users').get()['SUM(points)'] || 0,
    'Parrainages': db.prepare('SELECT COUNT(*) FROM referrals').get()['COUNT(*)'],
    'Badges attribués': db.prepare('SELECT COUNT(*) FROM user_badges').get()['COUNT(*)'],
    'Récompenses': db.prepare('SELECT COUNT(*) FROM rewards').get()['COUNT(*)'],
    'Abonnements': db.prepare('SELECT COUNT(*) FROM subscriptions').get()['COUNT(*)'],
    'Revenus': db.prepare('SELECT SUM(amount) FROM subscriptions').get()['SUM(amount)'] || 0
  };
}
