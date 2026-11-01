/**
 * Optional notifications (Resend e-mail + Telegram).
 *
 * Both integrations no-op silently when their environment variables are absent,
 * and every failure is caught and logged *without* private content so a provider
 * hiccup can never break Samiya's submission or leak her note into logs.
 */
import { getServerConfig } from '../config';
import { formatLongDate, formatTime12h, timeZoneLabel } from '../datetime';

export interface NotificationPayload {
  chosenDate: string;
  chosenTime: string;
  activity: string;
  timezone: string;
  note: string | null;
}

function includeNote(): boolean {
  return process.env.NOTIFY_INCLUDE_NOTE === 'true';
}

function summaryText(payload: NotificationPayload): string {
  const when = `${formatLongDate(payload.chosenDate)} · ${formatTime12h(payload.chosenTime)} (${timeZoneLabel(
    payload.timezone,
  )})`;
  const lines = [`She said yes 🎉`, `When: ${when}`, `What: ${payload.activity}`];
  if (includeNote() && payload.note) lines.push(`Her note: ${payload.note}`);
  return lines.join('\n');
}

async function sendEmail(payload: NotificationPayload): Promise<void> {
  const config = getServerConfig();
  if (!config.resendApiKey || !config.resendFromEmail || !config.notificationEmailTo) return;

  const { Resend } = await import('resend');
  const resend = new Resend(config.resendApiKey);
  const body = summaryText(payload).replace(/\n/g, '<br/>');

  const { error } = await resend.emails.send({
    from: config.resendFromEmail,
    to: config.notificationEmailTo,
    subject: 'Samiya said yes — date locked in',
    html: `<div style="font-family:Georgia,serif;background:#0B0713;color:#F3EBFF;padding:32px;border-radius:16px">
      <h1 style="color:#FF4D8D;font-size:22px;margin:0 0 16px">Samiya said yes</h1>
      <p style="line-height:1.7;margin:0">${body}</p>
      <p style="margin-top:24px;color:#FFD9A0">Open your private vault for the full details.</p>
    </div>`,
    text: summaryText(payload),
  });

  if (error) throw new Error(`resend error: ${error.name}`);
}

async function sendTelegram(payload: NotificationPayload): Promise<void> {
  const config = getServerConfig();
  if (!config.telegramBotToken || !config.telegramChatId) return;

  const response = await fetch(
    `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text: summaryText(payload),
        disable_web_page_preview: true,
      }),
      // Never let a slow provider hold the submission request hostage.
      signal: AbortSignal.timeout(6000),
    },
  );

  if (!response.ok) throw new Error(`telegram error: HTTP ${response.status}`);
}

/**
 * Fires every configured channel in parallel. Never throws: notification
 * problems are reported to the server console (without personal content).
 */
export async function notifyNewSubmission(payload: NotificationPayload): Promise<void> {
  const tasks: Promise<void>[] = [];

  try {
    const config = getServerConfig();
    if (config.resendApiKey && config.resendFromEmail && config.notificationEmailTo) {
      tasks.push(
        sendEmail(payload).catch((error: Error) =>
          console.error(`[notify] email failed — ${error.message}`),
        ),
      );
    }
    if (config.telegramBotToken && config.telegramChatId) {
      tasks.push(
        sendTelegram(payload).catch((error: Error) =>
          console.error(`[notify] telegram failed — ${error.message}`),
        ),
      );
    }
  } catch (error) {
    console.error('[notify] configuration error:', (error as Error).message);
    return;
  }

  if (tasks.length === 0) return;
  await Promise.allSettled(tasks);
}
