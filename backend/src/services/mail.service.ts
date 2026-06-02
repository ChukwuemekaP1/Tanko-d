import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/index.js';
import { emailTemplates, TemplateName, TemplateContext } from '../templates/emails.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  if (!config.mail.host || !config.mail.pass) {
    console.warn('[MailService] SMTP not configured — emails will be skipped');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
  });

  console.info('[MailService] SMTP transporter initialized', { host: config.mail.host });
  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: TemplateName;
  context: TemplateContext;
}

/**
 * Send a transactional email. Runs in the background (fire-and-forget)
 * so that API responses are never delayed by the mail provider.
 */
export function sendEmail(options: SendEmailOptions): void {
  // Fire-and-forget: schedule the async work but don't await it
  sendEmailAsync(options).catch((err) => {
    console.error('[MailService] Failed to send email', {
      to: options.to,
      template: options.template,
      error: err instanceof Error ? err.message : err,
    });
  });
}

async function sendEmailAsync(options: SendEmailOptions): Promise<void> {
  const transport = getTransporter();
  if (!transport) return;

  const html = emailTemplates[options.template](options.context as any);

  const info = await transport.sendMail({
    from: config.mail.from,
    to: options.to,
    subject: options.subject,
    html,
  });

  console.info('[MailService] Email sent', {
    to: options.to,
    subject: options.subject,
    messageId: info.messageId,
  });
}
