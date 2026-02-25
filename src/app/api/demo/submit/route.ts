import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

interface Lead {
  leadId: string;
  timestamp: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  consent: boolean;
  callTriggered: boolean;
  callId?: string;
}

async function readLeads(): Promise<Lead[]> {
  try {
    const raw = await fs.readFile(LEADS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLeads(leads: Lead[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2));
}

function normalizePhoneToE164(phoneRaw: string): string {
  const clean = phoneRaw.replace(/[^\d+]/g, '').trim();
  if (clean.startsWith('+')) return clean;
  // Ireland defaults: 08xxxxxxxx -> +3538xxxxxxxx
  if (clean.startsWith('0')) return `+353${clean.slice(1)}`;
  // If already country-prefixed without +
  if (clean.startsWith('353')) return `+${clean}`;
  return clean;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, phone, email, companyName, consent } = body as Record<string, unknown>;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'name is required (min 2 chars)' }, { status: 400 });
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'valid email is required' }, { status: 400 });
  }
  if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
    return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
  }

  const leadId = uuidv4();
  const timestamp = new Date().toISOString();

  const normalizedPhone = normalizePhoneToE164((phone as string).trim());

  const lead: Lead = {
    leadId,
    timestamp,
    name: (name as string).trim(),
    phone: normalizedPhone,
    email: (email as string).trim().toLowerCase(),
    companyName: (companyName as string).trim(),
    consent: consent === true,
    callTriggered: false,
  };

  // Store to local JSON
  const leads = await readLeads();
  leads.unshift(lead);
  await writeLeads(leads);

  // Forward to n8n webhook if configured
  const n8nWebhook = process.env.N8N_DEMO_WEBHOOK;
  let n8nAccepted = false;
  if (n8nWebhook) {
    try {
      const n8nRes = await fetch(n8nWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          timestamp,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          companyName: lead.companyName,
          consent: lead.consent,
          source: 'leadcall-ai-demo',
        }),
      });

      n8nAccepted = n8nRes.ok;
      if (!n8nRes.ok) {
        console.error('[n8n webhook] Non-OK response:', n8nRes.status, await n8nRes.text());
      }
    } catch (err) {
      console.error('[n8n webhook] Failed to forward lead:', err);
    }
  }

  // Trigger Vapi outbound call directly if n8n is not configured OR n8n handoff fails.
  // In production we prefer n8n orchestration for workflow control + secret isolation.
  const vapiApiKey = process.env.VAPI_API_KEY;
  const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;
  const vapiPhoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  if ((!n8nWebhook || !n8nAccepted) && vapiApiKey && vapiAssistantId && vapiPhoneNumberId) {
    try {
      const callPayload = {
        assistantId: vapiAssistantId,
        phoneNumberId: vapiPhoneNumberId,
        customer: {
          number: lead.phone,
          name: lead.name,
        },
        assistantOverrides: {
          variableValues: {
            leadId,
            customerName: lead.name,
            companyName: lead.companyName,
            email: lead.email,
          },
          metadata: {
            leadId,
            email: lead.email,
            companyName: lead.companyName,
            qualificationGoals: [
              'solar_panels',
              'battery_storage',
              'eddi_diverter',
              'ev_charger',
            ],
          },
        },
      };

      const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callPayload),
      });

      if (vapiRes.ok) {
        const callData = await vapiRes.json() as { id?: string };
        // Update lead with callId
        lead.callTriggered = true;
        lead.callId = callData.id;
        const updatedLeads = await readLeads();
        const idx = updatedLeads.findIndex((l) => l.leadId === leadId);
        if (idx !== -1) updatedLeads[idx] = lead;
        await writeLeads(updatedLeads);
      } else {
        console.error('[Vapi] Call trigger failed:', await vapiRes.text());
      }
    } catch (err) {
      console.error('[Vapi] Error triggering call:', err);
    }
  }

  if (n8nAccepted) {
    lead.callTriggered = true;
    const updatedLeads = await readLeads();
    const idx = updatedLeads.findIndex((l) => l.leadId === leadId);
    if (idx !== -1) updatedLeads[idx] = lead;
    await writeLeads(updatedLeads);
  }

  return NextResponse.json(
    {
      success: true,
      leadId,
      message: 'Demo request received. Our AI will call you within 60 seconds.',
      callTriggered: lead.callTriggered,
    },
    { status: 201 },
  );
}
