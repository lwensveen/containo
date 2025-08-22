import { Resend } from 'resend';

const FROM = process.env.MAIL_FROM || 'Containo <no-reply@containo.local>';
const REPLY_TO = process.env.MAIL_REPLY_TO || undefined;
const BCC = process.env.MAIL_BCC || undefined;
const DRY =
  (process.env.MAIL_TEST_MODE ?? 'false').toLowerCase() === 'true' || !process.env.RESEND_API_KEY;

const resend = !DRY ? new Resend(process.env.RESEND_API_KEY!) : null;

export type SendArgs = {
  to: string;
  subject: string;
  text: string;
  bcc?: string;
};

export async function sendMail({ to, subject, text, bcc }: SendArgs) {
  const payload = {
    from: FROM,
    to,
    subject,
    text,
    reply_to: REPLY_TO,
    bcc: bcc || BCC,
  };

  if (DRY) {
    console.log('[mail:dryrun]', payload);
    return { id: `dry_${Date.now()}` };
  }

  const res = await resend!.emails.send(payload as any);
  if ((res as any)?.error) {
    throw new Error((res as any).error.message || 'resend send failed');
  }
  return res;
}
