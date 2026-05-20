declare module "nodemailer" {
  type TransportOptions = {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
  };

  type MailOptions = {
    from?: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
  };

  type SendMailResult = {
    messageId?: string;
  };

  const nodemailer: {
    createTransport(options: TransportOptions): {
      sendMail(message: MailOptions): Promise<SendMailResult>;
    };
  };

  export default nodemailer;
}
