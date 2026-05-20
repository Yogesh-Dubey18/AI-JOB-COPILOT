import nodemailer from "nodemailer";
import { env } from "../config/env.js";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function hasSmtpConfig() {
  return Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS);
}

export async function sendEmail(message: EmailMessage) {
  if (!hasSmtpConfig()) {
    return {
      provider: "mock",
      sent: false,
      to: message.to,
      subject: message.subject,
      note: "Email provider is not configured. Message was not sent."
    };
  }

  const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS
    }
  });

  const result = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });

  return {
    provider: "smtp",
    sent: true,
    messageId: result.messageId
  };
}
