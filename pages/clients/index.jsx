import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import Head from 'next/head';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const T = {
  label: { fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7a8390' },
  copper: '#c4955a',
  bg: '#141414',
  surface: '#1a1a1a',
  border: 'rgba(196,149,90,0.15)',
};

export default function ClientList() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: 'TN', insurance_company: '', claim_number: '', adjuster_name: '', adjuster_phone: '' });

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*, projects(id, stage, created_at)')
      .order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  async function addClient(e) {
    e.preventDefault();
    setSaving(true);
    const { data: client, error } = await supabase.from('clients').insert([form]).select().single();
    if (!error && client) {
      // Auto-create first project at insurance_leads stage
      await supabase.from('projects').insert([{
        client_id: client.id,
        stage: 'insurance_leads',
        address: form.address,
        city: form.city,
        state: form.state,
      }]);
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '', address: '', city: '', state: 'TN', insurance_company: '', claim_number: '', adjuster_name: '', adjuster_phone: '' });
      fetchClients();
    }
    setSaving(false);
  }

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) || c.insurance_company?.toLowerCase().includes(search.toLowerCase())
  );

  const stageColor = { insurance_leads: '#4e7a9a', signed: '#4e9a6f', inspected: '#c4955a', contested: '#9a4e4e', work_order: '#7a4e9a', install: '#4e7a6e', final: '#b87333' };
  const stageLabel = { insurance_leads: 'Leads', signed: 'Signed', inspected: 'Inspected', contested: 'Contested', work_order: 'Work Order', install: 'Install', final: 'Final' };

  return (
    <>
      <Head><title>Clients — A&amp;B CRM</title></Head>
      <div style={{ minHeight: '100vh', background: T.bg, color: '#f4f1ec' }}>

        {/* Nav */}
        <div style={{ height: 56, background: '#111', borderBottom: '1px solid rgba(196,149,90,0.15)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 32 }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.3em', color: T.copper }}>A&B CRM</div>
          <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
            {[['/', 'Pipeline'], ['/clients', 'Clients']].map(([href, label]) => (
              <a key={href} href={href} style={{ ...T.label, color: router.pathname === href ? T.copper : '#7a8390', cursor: 'pointer', padding: '4px 0', borderBottom: router.pathname === href ? `1px solid ${T.copper}` : '1px solid transparent' }}>{label}</a>
            ))}
          </nav>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...T.label, marginBottom: 6 }}>A&B General Contracting</div>
              <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 300, color: '#f4f1ec' }}>
                Client Records <span style={{ color: T.copper }}>·</span> {filtered.length}
              </h1>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                placeholder="Search clients…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: T.surface, border: `1px solid ${T.border}`, color: '#f4f1ec', padding: '9px 14px', fontFamily: 'Georgia,serif', fontSize: 13, width: 220, outline: 'none' }}
              />
              <button
                onClick={() => setShowAdd(true)}
                style={{ background: T.copper, color: '#141414', border: 'none', padding: '10px 20px', fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                + Add Client
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', color: '#4a4f57', padding: 80, fontFamily: "'Courier New',monospace", fontSize: 10 }}>Loading…</div>
          ) : (
            <div style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 120px 100px', gap: 0, borderBottom: `1px solid ${T.border}`, padding: '10px 20px' }}>
                {['Client', 'Contact', 'Insurance Co.', 'Active Stage', 'Projects'].map(h => (
                  <div key={h} style={{ ...T.label }}>{h}</div>
                ))}
              </div>
              {filtered.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#4a4f57', fontFamily: "'Courier New',monospace", fontSize: 10 }}>No clients found.</div>
              ) : filtered.map(c => {
                const latestProject = c.projects?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                return (
                  <div
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 120px 100px', gap: 0, padding: '16px 20px', borderBottom: `1px solid rgba(196,149,90,0.08)`, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#222'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, color: '#f4f1ec', marginBottom: 3 }}>{c.name}</div>
                      <div style={{ ...T.label, fontSize: 8 }}>{c.city}, {c.state}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: '#c8c0b4', marginBottom: 3 }}>{c.email}</div>
                      <div style={{ ...T.label, fontSize: 8 }}>{c.phone}</div>
                    </div>
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: 12, color: '#c8c0b4', alignSelf: 'center' }}>{c.insurance_company || '—'}</div>
                    <div style={{ alignSelf: 'center' }}>
                      {latestProject ? (
                        <span style={{ display: 'inline-block', padding: '3px 10px', background: `${stageColor[latestProject.stage]}22`, border: `1px solid ${stageColor[latestProject.stage]}55`, color: stageColor[latestProject.stage], fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                          {stageLabel[latestProject.stage]}
                        </span>
                      ) : <span style={{ ...T.label }}>—</span>}
                    </div>
                    <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: T.copper, alignSelf: 'center' }}>{c.projects?.length || 0}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Client Modal */}
        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowAdd(false)}>
            <div style={{ background: '#181818', border: `1px solid ${T.border}`, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '28px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ ...T.label, marginBottom: 6 }}>New Record</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 300 }}>Add Client</div>
                </div>
                <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: '#7a8390', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
              </div>
              <form onSubmit={addClient} style={{ padding: '28px 32px' }}>
                {[
                  { label: 'Full Name *', key: 'name', type: 'text', required: true, span: 2 },
                  { label: 'Email Address', key: 'email', type: 'email', required: false, span: 1 },
                  { label: 'Phone Number', key: 'phone', type: 'tel', required: false, span: 1 },
                  { label: 'Property Address', key: 'address', type: 'text', required: false, span: 2 },
                  { label: 'City', key: 'city', type: 'text', required: false, span: 1 },
                  { label: 'State', key: 'state', type: 'text', required: false, span: 1 },
                  { label: 'Insurance Company', key: 'insurance_company', type: 'text', required: false, span: 2 },
                  { label: 'Claim Number', key: 'claim_number', type: 'text', required: false, span: 1 },
                  { label: 'Adjuster Name', key: 'adjuster_name', type: 'text', required: false, span: 1 },
                  { label: 'Adjuster Phone', key: 'adjuster_phone', type: 'tel', required: false, span: 1 },
                ].reduce((rows, field) => {
                  if (field.span === 2) {
                    rows.push([field]);
                  } else {
                    const last = rows[rows.length - 1];
                    if (last && last.length === 1 && last[0].span === 1) last.push(field);
                    else rows.push([field]);
                  }
                  return rows;
                }, []).map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: row.length === 2 ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
                    {row.map(f => (
                      <div key={f.key}>
                        <div style={{ ...T.label, marginBottom: 6 }}>{f.label}</div>
                        <input
                          type={f.type}
                          value={form[f.key]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          required={f.required}
                          style={{ width: '100%', background: '#222', border: `1px solid ${T.border}`, color: '#f4f1ec', padding: '10px 12px', fontFamily: 'Georgia,serif', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" onClick={() => setShowAdd(false)} style={{ background: 'none', border: `1px solid ${T.border}`, color: '#7a8390', padding: '10px 20px', fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.2em', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ background: saving ? '#333' : T.copper, color: saving ? '#666' : '#141414', border: 'none', padding: '10px 24px', fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Saving…' : 'Create Client →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
