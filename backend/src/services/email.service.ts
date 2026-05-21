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
  if (env.EMAIL_PROVIDER === "mock") {
    return {
      provider: "mock",
      sent: false,
      to: message.to,
      subject: message.subject,
      note: "Email provider is not configured. Message was not sent."
    };
  }

  if (env.EMAIL_PROVIDER === "resend") {
    return {
      provider: "resend",
      sent: false,
      to: message.to,
      subject: message.subject,
      note: env.RESEND_API_KEY ? "Resend provider is configured but network send is disabled in this provider-ready foundation." : "RESEND_API_KEY is missing."
    };
  }

  if (env.EMAIL_PROVIDER === "sendgrid") {
    return {
      provider: "sendgrid",
      sent: false,
      to: message.to,
      subject: message.subject,
      note: env.SENDGRID_API_KEY ? "SendGrid provider is configured but network send is disabled in this provider-ready foundation." : "SENDGRID_API_KEY is missing."
    };
  }

  if (!hasSmtpConfig()) {
    return {
      provider: "smtp",
      sent: false,
      to: message.to,
      subject: message.subject,
      note: "SMTP provider selected but EMAIL_HOST, EMAIL_USER, or EMAIL_PASS is missing."
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
