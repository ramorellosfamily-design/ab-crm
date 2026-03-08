import { useState } from 'react';
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
};

export default function NewProject() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    // Client info
    client_name: '', client_email: '', client_phone: '',
    // Property
    address: '', city: '', state: 'TN',
    // Insurance
    insurance_company: '', claim_number: '', adjuster_name: '', adjuster_phone: '',
    // Project
    damage_description: '', notes: '',
  });

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    // 1. Create or find client
    let clientId;
    if (form.client_email) {
      const { data: existing } = await supabase.from('clients').select('id').eq('email', form.client_email).maybeSingle();
      if (existing) {
        clientId = existing.id;
      }
    }

    if (!clientId) {
      const { data: newClient, error: cErr } = await supabase.from('clients').insert([{
        name: form.client_name,
        email: form.client_email,
        phone: form.client_phone,
        address: form.address,
        city: form.city,
        state: form.state,
        insurance_company: form.insurance_company,
        claim_number: form.claim_number,
        adjuster_name: form.adjuster_name,
        adjuster_phone: form.adjuster_phone,
      }]).select().single();
      if (cErr) { setError(cErr.message); setSaving(false); return; }
      clientId = newClient.id;
    }

    // 2. Create project
    const { data: project, error: pErr } = await supabase.from('projects').insert([{
      client_id: clientId,
      stage: 'insurance_leads',
      address: form.address,
      city: form.city,
      state: form.state,
      damage_description: form.damage_description,
      notes: form.notes,
    }]).select().single();

    if (pErr) { setError(pErr.message); setSaving(false); return; }

    router.push(`/projects/${project.id}`);
  }

  const Field = ({ label, name, type = 'text', required = false, wide = false, as = 'input' }) => (
    <div style={{ gridColumn: wide ? 'span 2' : 'span 1' }}>
      <div style={{ ...T.label, marginBottom: 6 }}>{label}{required && ' *'}</div>
      {as === 'textarea' ? (
        <textarea value={form[name]} onChange={e => set(name, e.target.value)} rows={3}
          style={{ width: '100%', background: '#1e1e1e', border: '1px solid rgba(196,149,90,0.2)', color: '#f4f1ec', padding: '10px 12px', fontFamily: 'Georgia,serif', fontSize: 13, outline: 'none', resize: 'vertical' }} />
      ) : (
        <input type={type} value={form[name]} onChange={e => set(name, e.target.value)} required={required}
          style={{ width: '100%', background: '#1e1e1e', border: '1px solid rgba(196,149,90,0.2)', color: '#f4f1ec', padding: '10px 12px', fontFamily: 'Georgia,serif', fontSize: 13, outline: 'none' }} />
      )}
    </div>
  );

  return (
    <>
      <Head><title>New Project — A&amp;B CRM</title></Head>
      <div style={{ minHeight: '100vh', background: '#141414', color: '#f4f1ec' }}>
        {/* Nav */}
        <nav style={{ height: 56, borderBottom: '1px solid rgba(196,149,90,0.2)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20 }}>
          <a href="/" style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 300, color: '#faf9f7' }}>A &amp; B <span style={{ color: T.copper }}>CRM</span></a>
          <span style={{ fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a4f57', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>New Project</span>
        </nav>

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 28px' }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...T.label, marginBottom: 8 }}>New Record</div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 300 }}>Create Project</h1>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Client Info */}
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(196,149,90,0.15)', padding: '28px 32px', marginBottom: 20 }}>
              <div style={{ ...T.label, marginBottom: 20, color: T.copper }}>Client Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Full Name" name="client_name" required wide />
                <Field label="Email Address" name="client_email" type="email" />
                <Field label="Phone Number" name="client_phone" type="tel" />
              </div>
            </div>

            {/* Property */}
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(196,149,90,0.15)', padding: '28px 32px', marginBottom: 20 }}>
              <div style={{ ...T.label, marginBottom: 20, color: T.copper }}>Property Address</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Street Address" name="address" wide />
                <Field label="City" name="city" />
                <Field label="State" name="state" />
              </div>
            </div>

            {/* Insurance */}
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(196,149,90,0.15)', padding: '28px 32px', marginBottom: 20 }}>
              <div style={{ ...T.label, marginBottom: 20, color: T.copper }}>Insurance Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Insurance Company" name="insurance_company" />
                <Field label="Claim Number" name="claim_number" />
                <Field label="Adjuster Name" name="adjuster_name" />
                <Field label="Adjuster Phone" name="adjuster_phone" type="tel" />
              </div>
            </div>

            {/* Notes */}
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(196,149,90,0.15)', padding: '28px 32px', marginBottom: 28 }}>
              <div style={{ ...T.label, marginBottom: 20, color: T.copper }}>Project Notes</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Damage Description" name="damage_description" as="textarea" wide />
                <Field label="Internal Notes" name="notes" as="textarea" wide />
              </div>
            </div>

            {error && <div style={{ padding: '12px 16px', background: 'rgba(154,78,78,0.1)', border: '1px solid rgba(154,78,78,0.3)', color: '#c47a7a', fontSize: 12, marginBottom: 20 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <a href="/" style={{ background: 'none', border: '1px solid rgba(196,149,90,0.2)', color: '#7a8390', padding: '12px 24px', fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.2em', cursor: 'pointer', display: 'inline-block', textAlign: 'center' }}>Cancel</a>
              <button type="submit" disabled={saving} style={{ background: saving ? '#333' : T.copper, color: saving ? '#666' : '#141414', border: 'none', padding: '12px 28px', fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Creating…' : 'Create Project →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
