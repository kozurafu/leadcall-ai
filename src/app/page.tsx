'use client';
import { useState } from 'react';

export default function HomePage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    companyName: '',
    consent: false,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/demo/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Request received! Our AI will call you shortly.');
        setForm({ name: '', phone: '', email: '', companyName: '', consent: false });
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* NAV */}
      <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">Lead<span className="text-brand-500">Call</span> AI</span>
          </div>
          <a
            href="#demo"
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Get a Free Demo Call
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-1.5 text-brand-100 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          AI-Powered Outbound Calling — Available 24/7
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
          Stop Chasing Leads.<br />
          <span className="text-brand-500">Let AI Book Your Appointments.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          LeadCall AI calls every inbound lead within 60 seconds, qualifies them with a natural
          conversation, and books straight into your calendar — while you focus on closing.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#demo"
            className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Request a Live Demo Call →
          </a>
          <a
            href="#how-it-works"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '< 60s', label: 'Time to first call' },
            { value: '24/7', label: 'Always on, never tired' },
            { value: '3\u00d7', label: 'More booked appointments' },
            { value: '0', label: 'No-shows from cold leads' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold text-brand-500 mb-1">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold mb-4">How LeadCall AI Works</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            A three-step pipeline that turns cold enquiries into booked appointments automatically.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Lead Comes In',
              desc: 'A prospect fills a form, rings your number, or clicks an ad. LeadCall AI receives the trigger instantly.',
              icon: '\ud83d\udce5',
            },
            {
              step: '02',
              title: 'AI Calls & Qualifies',
              desc: 'Our voice agent rings within 60 seconds. It confirms intent, asks qualification questions, and handles objections — naturally.',
              icon: '\ud83d\udcde',
            },
            {
              step: '03',
              title: 'Appointment Booked',
              desc: 'Qualified leads are booked straight into your CRM or calendar. You get a full call summary and transcript.',
              icon: '\ud83d\udcc5',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-brand-500/50 transition-colors"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-brand-500 text-sm font-bold mb-2">STEP {item.step}</div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="bg-gray-900/40 border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Built for High-Intent Industries</h2>
            <p className="text-gray-400 text-lg">
              Wherever speed-to-lead and qualification accuracy matter most.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '\u2600\ufe0f', name: 'Solar & Energy', desc: 'Qualify panels, battery, EV charger interest in one call' },
              { icon: '\ud83c\udfe0', name: 'Home Improvement', desc: 'Confirm project scope, budget, and decision timeline' },
              { icon: '\ud83c\udfe5', name: 'Healthcare', desc: 'Pre-screen patients and book consultations automatically' },
              { icon: '\ud83d\udcbc', name: 'Financial Services', desc: 'Qualify leads before advisor time is spent' },
              { icon: '\ud83c\udfd8\ufe0f', name: 'Real Estate', desc: 'Separate serious buyers from casual browsers' },
              { icon: '\ud83d\udd27', name: 'Trades & Services', desc: 'Confirm job type, location, and urgency instantly' },
            ].map((uc) => (
              <div key={uc.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-3xl mb-3">{uc.icon}</div>
                <h3 className="font-bold text-white mb-1">{uc.name}</h3>
                <p className="text-gray-400 text-sm">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO FORM */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">Request a Live Demo Call</h2>
            <p className="text-gray-400">
              Submit your details and our AI will call you — so you can experience it firsthand.
            </p>
          </div>

          {status === 'success' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">\ud83d\udcde</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">You&apos;re on the list!</h3>
              <p className="text-gray-300">{message}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5"
            >
              {[
                { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith', required: true },
                { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+353 1 234 5678', required: true },
                { id: 'email', label: 'Work Email', type: 'email', placeholder: 'jane@company.com', required: true },
                { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Acme Ltd', required: true },
              ].map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-300 mb-1.5">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={form[field.id as keyof typeof form] as string}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              ))}

              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  checked={form.consent}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="consent" className="text-sm text-gray-400">
                  I consent to be contacted by LeadCall AI for a demonstration. I understand this
                  includes an AI-powered outbound call to my phone number.
                </label>
              </div>

              {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-colors"
              >
                {status === 'loading' ? 'Submitting...' : 'Request My Demo Call \u2192'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                No spam. No sales pitch. Just a live AI call demo. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold">Lead<span className="text-brand-500">Call</span> AI</span>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} LeadCall AI. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
