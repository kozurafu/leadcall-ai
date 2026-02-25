import { promises as fs } from 'fs';
import path from 'path';

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

async function getLeads(): Promise<Lead[]> {
  try {
    const file = path.join(process.cwd(), 'data', 'leads.json');
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function getCalls(): Promise<CallRecord[]> {
  try {
    const file = path.join(process.cwd(), 'data', 'calls.json');
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  const [leads, calls] = await Promise.all([getLeads(), getCalls()]);

  const callsByLeadId = calls.reduce<Record<string, CallRecord>>((acc, c) => {
    if (c.leadId) acc[c.leadId] = c;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">LeadCall AI — Admin Status</h1>
          <p className="text-gray-400">Recent demo leads and call outcomes</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Leads', value: leads.length },
            { label: 'Calls Triggered', value: leads.filter((l) => l.callTriggered).length },
            { label: 'Calls Completed', value: calls.filter((c) => c.status === 'end-of-call-report' || c.status === 'call-ended').length },
            { label: 'With Summary', value: calls.filter((c) => c.summary).length },
          ].map((card) => (
            <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-2xl font-bold text-brand-500">{card.value}</div>
              <div className="text-sm text-gray-400 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Leads table */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">Recent Leads</h2>
          {leads.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
              No leads yet. Submit the demo form to see data here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-left">
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Company</th>
                    <th className="pb-3 pr-4">Phone</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Call</th>
                    <th className="pb-3">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 25).map((lead) => {
                    const call = callsByLeadId[lead.leadId];
                    return (
                      <tr key={lead.leadId} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                        <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">
                          {new Date(lead.timestamp).toLocaleString('en-IE', { timeZone: 'Europe/Dublin' })}
                        </td>
                        <td className="py-3 pr-4 font-medium">{lead.name}</td>
                        <td className="py-3 pr-4 text-gray-300">{lead.companyName}</td>
                        <td className="py-3 pr-4 text-gray-400">{lead.phone}</td>
                        <td className="py-3 pr-4 text-gray-400">{lead.email}</td>
                        <td className="py-3 pr-4">
                          {lead.callTriggered ? (
                            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                              Triggered
                            </span>
                          ) : (
                            <span className="bg-gray-700/50 text-gray-500 px-2 py-0.5 rounded text-xs">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {call?.summary ? (
                            <span className="text-gray-300 text-xs" title={call.summary}>
                              {call.summary.slice(0, 80)}&hellip;
                            </span>
                          ) : call ? (
                            <span className="text-yellow-400 text-xs">{call.status}</span>
                          ) : (
                            <span className="text-gray-600 text-xs">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Calls table */}
        <div>
          <h2 className="text-xl font-bold mb-4">Call Records</h2>
          {calls.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
              No call records yet.
            </div>
          ) : (
            <div className="space-y-4">
              {calls.slice(0, 15).map((call) => (
                <div key={call.callId} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="font-mono text-xs text-gray-500">{call.callId}</span>
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">{call.status}</span>
                    <span className="text-gray-500 text-xs">{new Date(call.timestamp).toLocaleString('en-IE')}</span>
                    {call.customerName && <span className="text-white text-sm font-medium">{call.customerName}</span>}
                    {call.companyName && <span className="text-gray-400 text-sm">— {call.companyName}</span>}
                  </div>
                  {call.summary && (
                    <div className="bg-gray-800/60 rounded-lg p-4 text-sm text-gray-300">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Summary</div>
                      {call.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
