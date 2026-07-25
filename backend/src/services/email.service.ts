import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function hasSmtpConfig() {
  return Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS);
}

function parseEmailFrom(fromStr: string) {
  const match = fromStr.match(/^(.*?)\s*<(.*?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: undefined, email: fromStr.trim() };
}

export async function sendEmail(message: EmailMessage) {
  const effectiveProvider = env.EMAIL_PROVIDER && env.EMAIL_PROVIDER !== "mock"
    ? env.EMAIL_PROVIDER
    : (env.RESEND_API_KEY ? "resend" : (env.SENDGRID_API_KEY ? "sendgrid" : (hasSmtpConfig() ? "smtp" : "mock")));

  if (effectiveProvider === "mock") {
    return {
      provider: "mock",
      sent: false,
      to: message.to,
      subject: message.subject,
      note: "Email provider is not configured. Message was logged in mock mode."
    };
  }

  if (effectiveProvider === "resend") {
    if (!env.RESEND_API_KEY || !resend) {
      return {
        provider: "resend",
        sent: false,
        to: message.to,
        subject: message.subject,
        note: "RESEND_API_KEY is missing."
      };
    }

    try {
      const result = await resend.emails.send({
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        provider: "resend",
        sent: true,
        to: message.to,
        subject: message.subject,
        messageId: result.data?.id
      };
    } catch (error: any) {
      console.error("Resend send failed:", error.message);
      return {
        provider: "resend",
        sent: false,
        to: message.to,
        subject: message.subject,
        error: error.message
      };
    }
  }

  if (effectiveProvider === "sendgrid") {
    if (!env.SENDGRID_API_KEY) {
      return {
        provider: "sendgrid",
        sent: false,
        to: message.to,
        subject: message.subject,
        note: "SENDGRID_API_KEY is missing."
      };
    }

    const { email: fromEmail, name: fromName } = parseEmailFrom(env.EMAIL_FROM);

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: message.to }]
            }
          ],
          from: {
            email: fromEmail,
            name: fromName || "AI Job Copilot"
          },
          subject: message.subject,
          content: [
            {
              type: "text/plain",
              value: message.text
            },
            ...(message.html ? [{
              type: "text/html",
              value: message.html
            }] : [])
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`SendGrid API error: ${response.status} ${errText}`);
      }

      return {
        provider: "sendgrid",
        sent: true,
        to: message.to,
        subject: message.subject
      };
    } catch (error: any) {
      console.error("SendGrid send failed:", error.message);
      return {
        provider: "sendgrid",
        sent: false,
        to: message.to,
        subject: message.subject,
        error: error.message
      };
    }
  }

  if (!hasSmtpConfig()) {
    return {
      provider: "smtp",
      sent: false,
      to: message.to,
      subject: message.subject,
      note: "SMTP provider selected but SMTP_HOST, SMTP_USER, or SMTP_PASS is missing."
    };
  }

  try {
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
  } catch (error: any) {
    console.error("SMTP send failed:", error.message);
    return {
      provider: "smtp",
      sent: false,
      to: message.to,
      subject: message.subject,
      error: error.message
    };
  }
}

