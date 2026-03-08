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
  border: 'rgba(196,149,90,0.15)',
};

const STAGE_COLOR = { insurance_leads: '#4e7a9a', signed: '#4e9a6f', inspected: '#c4955a', contested: '#9a4e4e', work_order: '#7a4e9a', install: '#4e7a6e', final: '#b87333' };
const STAGE_LABEL = { insurance_leads: 'Insurance Leads', signed: 'Signed', inspected: 'Inspected', contested: 'Contested', work_order: 'Work Order', install: 'Install', final: 'Final' };

export default function ClientDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('projects').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ]).then(([{ data: c }, { data: p }]) => {
      setClient(c);
      setProjects(p || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...T.label, color: '#4a4f57' }}>Loading…</div>
    </div>
  );

  if (!client) return (
    <div style={{ minHeight: '100vh', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Georgia,serif', color: '#7a8390' }}>Client not found.</div>
    </div>
  );

  return (
    <>
      <Head><title>{client.name} — A&amp;B CRM</title></Head>
      <div style={{ minHeight: '100vh', background: '#141414', color: '#f4f1ec' }}>
        <nav style={{ height: 56, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20 }}>
          <a href="/" style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 300, color: '#faf9f7' }}>A &amp; B <span style={{ color: T.copper }}>CRM</span></a>
          <a href="/clients" style={{ ...T.label, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>Clients</a>
          <span style={{ ...T.label, color: T.copper }}>{client.name}</span>
        </nav>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
            <div>
              <div style={{ ...T.label, marginBottom: 6 }}>Client Record</div>
              <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 300 }}>{client.name}</h1>
              <div style={{ ...T.label, fontSize: 8, marginTop: 6 }}>{client.city}, {client.state}</div>
            </div>
            <a
              href={`/projects/new?client_id=${id}`}
              style={{ background: T.copper, color: '#141414', padding: '10px 20px', fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-block' }}
            >
              + New Project
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
            {/* Contact */}
            <div style={{ background: '#1a1a1a', border: `1px solid ${T.border}`, padding: '24px 28px' }}>
              <div style={{ ...T.label, color: T.copper, marginBottom: 18 }}>Contact</div>
              {[['Email', client.email], ['Phone', client.phone], ['Address', client.address ? `${client.address}, ${client.city}, ${client.state}` : null]].map(([l, v]) => v && (
                <div key={l} style={{ marginBottom: 14 }}>
                  <div style={{ ...T.label, fontSize: 8, marginBottom: 4 }}>{l}</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 13, color: '#c8c0b4' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Insurance */}
            <div style={{ background: '#1a1a1a', border: `1px solid ${T.border}`, padding: '24px 28px' }}>
              <div style={{ ...T.label, color: T.copper, marginBottom: 18 }}>Insurance Details</div>
              {[['Carrier', client.insurance_company], ['Claim Number', client.claim_number], ['Adjuster', client.adjuster_name], ['Adjuster Phone', client.adjuster_phone]].map(([l, v]) => v && (
                <div key={l} style={{ marginBottom: 14 }}>
                  <div style={{ ...T.label, fontSize: 8, marginBottom: 4 }}>{l}</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 13, color: '#c8c0b4' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div style={{ background: '#1a1a1a', border: `1px solid ${T.border}` }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ ...T.label, color: T.copper }}>Projects · {projects.length}</div>
            </div>
            {projects.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#4a4f57', fontFamily: "'Courier New',monospace", fontSize: 10 }}>No projects yet.</div>
            ) : projects.map(p => (
              <div key={p.id} onClick={() => router.push(`/projects/${p.id}`)}
                style={{ padding: '18px 24px', borderBottom: `1px solid rgba(196,149,90,0.06)`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20 }}
                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, marginBottom: 3 }}>{p.address || 'No address'}</div>
                  <div style={{ ...T.label, fontSize: 8 }}>{new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <span style={{ padding: '3px 10px', background: `${STAGE_COLOR[p.stage]}22`, border: `1px solid ${STAGE_COLOR[p.stage]}55`, color: STAGE_COLOR[p.stage], fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {STAGE_LABEL[p.stage]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
