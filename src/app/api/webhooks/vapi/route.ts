import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CALLS_FILE = path.join(DATA_DIR, 'calls.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

interface CallRecord {
  callId: string;
  leadId?: string;
  timestamp: string;
  status: string;
  duration?: number;
  endedReason?: string;
  summary?: string;
  transcript?: string;
  structuredData?: Record<string, unknown>;
  email?: string;
  customerName?: string;
  companyName?: string;
  phone?: string;
}

interface Lead {
  leadId: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  [key: string]: unknown;
}

async function readJson<T>(filePath: string): Promise<T[]> {
  try { return JSON.parse(await fs.readFile(filePath, 'utf-8')); }
  catch { return []; }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/** Convert value to display string; treat "Not mentioned", null, empty as N/A */
function display(val: unknown): string {
  if (val === null || val === undefined) return 'N/A';
  const s = String(val).trim();
  if (!s || s === 'null' || s.toLowerCase() === 'not mentioned' || s.toLowerCase() === 'not provided' || s.toLowerCase() === 'not discussed') return 'N/A';
  return s;
}

/**
 * Find the original lead by any available identifier.
 * Priority: leadId > phone > email
 */
function findLead(leads: Lead[], identifiers: { leadId?: string; phone?: string; email?: string; customerPhone?: string }): Lead | undefined {
  if (identifiers.leadId) {
    const l = leads.find(l => l.leadId === identifiers.leadId);
    if (l) return l;
  }
  // Match by phone (the most reliable — Vapi called this number)
  const phone = identifiers.phone || identifiers.customerPhone;
  if (phone) {
    const clean = phone.replace(/[^\d+]/g, '');
    const l = leads.find(l => l.phone.replace(/[^\d+]/g, '') === clean);
    if (l) return l;
  }
  if (identifiers.email) {
    const l = leads.find(l => l.email.toLowerCase() === identifiers.email!.toLowerCase());
    if (l) return l;
  }
  return undefined;
}

function buildEmailHtml(lead: Lead, callRecord: CallRecord): string {
  const sd = (callRecord.structuredData || {}) as Record<string, unknown>;
  const name = lead.name || display(sd.customer_name);
  const appUrl = process.env.NEXTAUTH_URL || 'http://okg4gks008k4ko8ckow4cwwo.62.171.142.50.sslip.io';

  // Merge form data (always available) with AI-extracted data (from call)
  const rows = [
    ['Name', lead.name || display(sd.customer_name)],
    ['Phone', lead.phone || 'N/A'],
    ['Email', lead.email || 'N/A'],
    ['Company', lead.companyName || display(sd.company_name)],
    ['Business Type', display(sd.business_type)],
    ['Wants Follow-up', sd.wants_follow_up === true ? 'Yes ✅' : sd.wants_follow_up === false ? 'No' : 'Not discussed'],
    ['Preferred Follow-up Time', display(sd.follow_up_time_preference)],
    ['Lead Volume', display(sd.lead_volume)],
    ['Service Interest', display(sd.service_interest)],
    ['Current Process', display(sd.current_lead_process)],
    ['Pain Points', display(sd.pain_points)],
    ['Qualification Score', sd.qualification_score ? `${sd.qualification_score}/10` : 'N/A'],
    ['Recommended Next Step', display(sd.recommended_next_step)],
  ];

  const tableRows = rows
    .filter(([, value]) => value !== 'N/A') // Only show rows with actual data
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 14px;font-weight:600;color:#4a5568;border-bottom:1px solid #e2e8f0;width:40%;">${label}</td>
        <td style="padding:10px 14px;color:#1a202c;border-bottom:1px solid #e2e8f0;">${value}</td>
      </tr>`)
    .join('\n');

  const summary = callRecord.summary || 'Summary not available.';

  // Clean transcript for display — format as conversation
  let transcriptHtml = '';
  if (callRecord.transcript) {
    const lines = callRecord.transcript.split('\n').slice(0, 30); // First 30 lines
    transcriptHtml = lines
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('AI:')) {
          return `<div style="margin:4px 0;"><strong style="color:#4299e1;">Sarah:</strong> ${trimmed.slice(3).trim()}</div>`;
        } else if (trimmed.startsWith('User:')) {
          return `<div style="margin:4px 0;"><strong style="color:#48bb78;">${name !== 'N/A' ? name : 'Caller'}:</strong> ${trimmed.slice(5).trim()}</div>`;
        }
        return `<div style="margin:4px 0;">${trimmed}</div>`;
      })
      .filter(Boolean)
      .join('\n');
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;color:#1a202c;background:#f7fafc;padding:20px;">
  <div style="background:#ffffff;border-radius:12px;padding:36px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#2d3748;margin:0;font-size:24px;">📞 LeadCall AI</h1>
      <p style="color:#718096;margin:4px 0 0;">Call Summary Report</p>
    </div>

    <p style="font-size:16px;">Hi <strong>${name !== 'N/A' ? name : 'there'}</strong>,</p>
    <p>Thanks for taking the time to speak with Sarah from LeadCall AI. Here's a summary of your conversation.</p>
    
    <div style="background:#ebf8ff;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #4299e1;">
      <h3 style="margin:0 0 8px;color:#2b6cb0;font-size:15px;">💡 Call Summary</h3>
      <p style="margin:0;color:#2d3748;line-height:1.6;">${summary}</p>
    </div>

    <h3 style="color:#2d3748;font-size:15px;margin:24px 0 12px;">📋 Details Captured</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${tableRows}
    </table>

    ${transcriptHtml ? `
    <details style="margin:24px 0;">
      <summary style="cursor:pointer;font-weight:600;color:#4a5568;font-size:15px;">📝 Full Conversation Transcript</summary>
      <div style="margin-top:12px;padding:16px;background:#f7fafc;border-radius:8px;font-size:13px;line-height:1.8;max-height:400px;overflow-y:auto;">
        ${transcriptHtml}
      </div>
    </details>` : ''}

    <div style="text-align:center;margin:32px 0 16px;">
      <a href="${appUrl}" style="display:inline-block;background:#4299e1;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Learn More About LeadCall AI →</a>
    </div>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="font-size:12px;color:#a0aec0;text-align:center;">
      This summary was automatically generated by LeadCall AI after your demo call.<br>
      Questions? Simply reply to this email.
    </p>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const expectedToken = process.env.VAPI_WEBHOOK_TOKEN;
  if (expectedToken) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const payload = body as Record<string, unknown>;
  const message = (payload.message as Record<string, unknown>) || payload;
  const messageType = (message.type as string) || (payload.type as string) || '';

  // Only process end-of-call-report
  if (messageType !== 'end-of-call-report') {
    return NextResponse.json({ received: true, type: messageType });
  }

  console.log('[vapi callback] Processing end-of-call-report');

  const call = (message.call as Record<string, unknown>) || {};
  const callId = (call.id as string) || (payload.callId as string) || 'unknown';
  const endedReason = (message.endedReason as string) || (call.endedReason as string) || '';

  // Extract variable values — form data passed when call was created
  const overrides = (call.assistantOverrides as Record<string, unknown>) || {};
  const variableValues = (overrides.variableValues as Record<string, string>) || {};
  const metadata = (overrides.metadata as Record<string, string>) || {};

  // Also check customer object for phone number
  const customer = (call.customer as Record<string, string>) || {};

  const analysis = (message.analysis as Record<string, unknown>) || {};
  const artifact = (message.artifact as Record<string, unknown>) || {};

  const structuredData = (analysis.structuredData as Record<string, unknown>) ||
    (artifact.structuredData as Record<string, unknown>) || {};

  const callRecord: CallRecord = {
    callId,
    leadId: variableValues.leadId || metadata.leadId || undefined,
    timestamp: new Date().toISOString(),
    status: messageType,
    endedReason,
    duration: call.duration as number | undefined,
    summary: (analysis.summary as string) || (artifact.summary as string) || undefined,
    transcript: (artifact.transcript as string) || undefined,
    structuredData,
    email: variableValues.email || metadata.email || undefined,
    customerName: variableValues.name || metadata.customerName || undefined,
    companyName: variableValues.companyName || metadata.companyName || undefined,
    phone: variableValues.phone || metadata.phone || customer.number || undefined,
  };

  console.log('[vapi callback] leadId:', callRecord.leadId, 'phone:', callRecord.phone, 'email:', callRecord.email);

  // Persist call record
  const calls = await readJson<CallRecord>(CALLS_FILE);
  const existingIdx = calls.findIndex((c) => c.callId === callId);
  if (existingIdx !== -1) calls[existingIdx] = { ...calls[existingIdx], ...callRecord };
  else calls.unshift(callRecord);
  await writeJson(CALLS_FILE, calls);

  // Find original lead — try multiple identifiers
  const leads = await readJson<Lead>(LEADS_FILE);
  const foundLead = findLead(leads, {
    leadId: callRecord.leadId,
    phone: callRecord.phone,
    email: callRecord.email,
    customerPhone: customer.number,
  });

  const lead: Lead = foundLead || {
    leadId: callRecord.leadId || '',
    name: callRecord.customerName || '',
    phone: callRecord.phone || '',
    email: callRecord.email || '',
    companyName: callRecord.companyName || '',
  };

  console.log('[vapi callback] Lead found:', !!foundLead, 'name:', lead.name, 'email:', lead.email);

  // Send email
  const recipientEmail = lead.email || callRecord.email;
  if (recipientEmail) {
    const emailHtml = buildEmailHtml(lead, callRecord);
    const subject = `Your LeadCall AI Demo — Call Summary${lead.companyName ? ` for ${lead.companyName}` : ''}`;

    // Send via n8n (which handles SMTP)
    const n8nWebhook = process.env.N8N_DEMO_WEBHOOK;
    if (n8nWebhook) {
      try {
        const res = await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'send_email',
            to: recipientEmail,
            subject,
            html: emailHtml,
            callId,
            leadId: callRecord.leadId,
          }),
        });
        console.log('[email] n8n response:', res.status);
      } catch (err) {
        console.error('[email] n8n send failed:', err);
      }
    }
  }

  return NextResponse.json({ received: true, callId });
}
