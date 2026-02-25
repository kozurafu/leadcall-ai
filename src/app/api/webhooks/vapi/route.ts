import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CALLS_FILE = path.join(DATA_DIR, 'calls.json');

interface CallRecord {
  callId: string;
  leadId?: string;
  timestamp: string;
  status: string;
  duration?: number;
  summary?: string;
  transcript?: string;
  qualificationOutcomes?: Record<string, unknown>;
  email?: string;
  customerName?: string;
  companyName?: string;
}

async function readCalls(): Promise<CallRecord[]> {
  try {
    const raw = await fs.readFile(CALLS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeCalls(calls: CallRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CALLS_FILE, JSON.stringify(calls, null, 2));
}

export async function POST(req: NextRequest) {
  // Verify optional token
  const expectedToken = process.env.VAPI_WEBHOOK_TOKEN;
  if (expectedToken) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // Extract key fields from Vapi callback
  const message = (payload.message as Record<string, unknown>) || payload;
  const callId =
    (message.call as Record<string, unknown>)?.id as string ||
    (payload.callId as string) ||
    'unknown';
  const status =
    (message.type as string) ||
    (payload.status as string) ||
    'unknown';

  const metadata =
    ((message.call as Record<string, unknown>)?.assistantOverrides as Record<string, unknown>)?.metadata as Record<string, unknown> ||
    {};

  const analysis = (message.analysis as Record<string, unknown>) || {};
  const artifact = (message.artifact as Record<string, unknown>) || {};

  const callRecord: CallRecord = {
    callId,
    leadId: metadata.leadId as string | undefined,
    timestamp: new Date().toISOString(),
    status,
    duration: (message.call as Record<string, unknown>)?.endedReason as number | undefined,
    summary: (analysis.summary as string) || (artifact.summary as string) || undefined,
    transcript: (artifact.transcript as string) || undefined,
    qualificationOutcomes: analysis as Record<string, unknown>,
    email: metadata.email as string | undefined,
    customerName: metadata.customerName as string | undefined,
    companyName: metadata.companyName as string | undefined,
  };

  // Persist to calls.json
  const calls = await readCalls();
  const existingIdx = calls.findIndex((c) => c.callId === callId);
  if (existingIdx !== -1) {
    calls[existingIdx] = { ...calls[existingIdx], ...callRecord };
  } else {
    calls.unshift(callRecord);
  }
  await writeCalls(calls);

  // Send summary email via n8n webhook (preferred) or SMTP fallback
  const summaryText = callRecord.summary || 'No summary available.';
  const recipientEmail = callRecord.email;

  if (recipientEmail && summaryText) {
    const n8nWebhook = process.env.N8N_DEMO_WEBHOOK;
    if (n8nWebhook) {
      try {
        await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'call_completed',
            callId,
            leadId: callRecord.leadId,
            email: recipientEmail,
            customerName: callRecord.customerName,
            companyName: callRecord.companyName,
            summary: summaryText,
            transcript: callRecord.transcript,
            qualificationOutcomes: callRecord.qualificationOutcomes,
          }),
        });
      } catch (err) {
        console.error('[n8n] Failed to send call summary:', err);
      }
    } else if (process.env.SMTP_HOST && process.env.SMTP_FROM) {
      // SMTP fallback
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: recipientEmail,
          subject: `Your LeadCall AI demo call summary — ${callRecord.companyName || ''}`,
          text: `Hi ${callRecord.customerName || ''},\n\nHere is your call summary:\n\n${summaryText}\n\nThank you for trying LeadCall AI.\n`,
          html: `<p>Hi ${callRecord.customerName || ''},</p><p>Here is your call summary:</p><blockquote>${summaryText}</blockquote><p>Thank you for trying LeadCall AI.</p>`,
        });
      } catch (err) {
        console.error('[SMTP] Failed to send email:', err);
      }
    }
  }

  return NextResponse.json({ received: true, callId });
}
