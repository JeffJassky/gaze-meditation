import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Mustache from 'mustache';
import sgMail from '@sendgrid/mail';
import { config } from '../config.js';

if (config.mail.apiKey) sgMail.setApiKey(config.mail.apiKey);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, '../templates');

const templateCache = new Map<string, string>();
function loadTemplate(name: string): string {
  const cached = templateCache.get(name);
  if (cached) return cached;
  const file = path.join(templatesDir, `${name}.mustache`);
  const src = fs.readFileSync(file, 'utf8');
  templateCache.set(name, src);
  return src;
}

export interface SendMailInput {
  to: string;
  subject: string;
  template: 'transactional';
  data: {
    heading: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const src = loadTemplate(input.template);
  const html = Mustache.render(src, {
    subject: input.subject,
    appName: config.mail.appName,
    appUrl: config.mail.appUrl,
    year: new Date().getFullYear(),
    ...input.data,
  });

  const text = `${input.data.heading}\n\n${input.data.body}${
    input.data.ctaUrl ? `\n\n${input.data.ctaLabel ?? 'Open'}: ${input.data.ctaUrl}` : ''
  }`;

  if (!config.mail.apiKey) {
    console.log('[gaze] mail (dev, no SENDGRID_API_KEY)', {
      to: input.to,
      subject: input.subject,
      text,
    });
    return;
  }

  await sgMail.send({
    to: input.to,
    from: config.mail.from,
    subject: input.subject,
    text,
    html,
  });
}
