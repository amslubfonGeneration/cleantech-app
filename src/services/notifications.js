import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: process.env.SMTP_PORT,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter.sendMail({ from: '"CleanTech" <no-reply@cleantech.bj>', to, subject, html });
}

export async function sendSMS({ to, text }) {
  return { success: true, to, text };
}

export async function sendPush({ to, title, body }) {
  return { success: true, to, title, body };
}
