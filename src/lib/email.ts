import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { env } from '../config/env.js';
import { getQueues } from './queues.js';

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: Transporter | null = null;

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM);
}

export function isEmailEnabled(): boolean {
  return smtpConfigured();
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
  }
  return transporter;
}

export function buildEmailHtml(title: string, bodyText: string): string {
  const bodyHtml = bodyText
    .split('\n')
    .map((line) => `<p style="margin:0 0 12px;line-height:1.5;color:#333">${line}</p>`)
    .join('');
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;background:#f6f6f6">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e5e5">
    <h1 style="margin:0 0 16px;font-size:20px;color:#111">${title}</h1>
    ${bodyHtml}
    <p style="margin:24px 0 0;font-size:12px;color:#888">${env.SMTP_FROM ?? 'ERP'}</p>
  </div>
</body>
</html>`;
}

/** Send immediately via Nodemailer (used by the email worker). */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  if (!smtpConfigured()) {
    console.info('[email:dev]', input.to, input.subject, input.text.slice(0, 120));
    return false;
  }

  const html = input.html ?? buildEmailHtml(input.subject, input.text);
  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html,
  });
  return true;
}

/** Queue an email for the BullMQ worker (all transactional mail should use this). */
export async function queueEmail(
  jobName: string,
  input: SendEmailInput & Record<string, unknown>,
): Promise<void> {
  const queues = getQueues();
  if (!queues) {
    await sendEmail({
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return;
  }
  await queues.emails.add(jobName, input, { removeOnComplete: 100 });
}
