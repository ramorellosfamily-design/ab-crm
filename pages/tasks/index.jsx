import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const T = {
  label: { fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7a8390' },
  copper: '#c4955a',
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('tasks')
      .select('*, projects(address, city, clients(name))')
      .order('due_date', { ascending: true })
      .then(({ data }) => { setTasks(data || []); setLoading(false); });
  }, []);

  const statusColor = { pending: '#4e7a9a', in_progress: '#c4955a', complete: '#4e9a6f', overdue: '#9a4e4e' };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Head><title>Tasks — A&amp;B CRM</title></Head>
      <div style={{ minHeight: '100vh', background: '#141414', color: '#f4f1ec' }}>
        <nav style={{ height: 56, borderBottom: '1px solid rgba(196,149,90,0.2)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20 }}>
          <a href="/" style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 300, color: '#faf9f7' }}>A &amp; B <span style={{ color: T.copper }}>CRM</span></a>
          <span style={{ ...T.label, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>Tasks</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 24 }}>
            <a href="/" style={{ ...T.label }}>Pipeline</a>
            <a href="/clients" style={{ ...T.label }}>Clients</a>
          </div>
        </nav>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 28px' }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ ...T.label, marginBottom: 6 }}>A&B General Contracting</div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 26, fontWeight: 300 }}>Open Tasks</h1>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#4a4f57', fontFamily: "'Courier New',monospace", fontSize: 10 }}>Loading…</div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#4a4f57' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, marginBottom: 8 }}>No open tasks.</div>
              <div style={{ ...T.label }}>Tasks are created automatically by pipeline automations.</div>
            </div>
          ) : tasks.map(task => {
            const overdue = task.due_date && task.due_date < today && task.status !== 'complete';
            const status = overdue ? 'overdue' : task.status;
            return (
              <div key={task.id} style={{ background: '#1a1a1a', border: '1px solid rgba(196,149,90,0.12)', padding: '20px 24px', marginBottom: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, marginBottom: 4 }}>{task.title}</div>
                  <div style={{ ...T.label, fontSize: 8 }}>{task.projects?.clients?.name} · {task.projects?.address}</div>
                </div>
                <div style={{ ...T.label, fontSize: 8 }}>{task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</div>
                <div style={{ padding: '3px 10px', background: `${statusColor[status]}22`, border: `1px solid ${statusColor[status]}55`, color: statusColor[status], fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
