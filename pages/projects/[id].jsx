import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STAGES = [
  { id: 'insurance_leads', label: 'Insurance Leads', color: '#4e7a9a' },
  { id: 'signed',          label: 'Signed',           color: '#4e9a6f' },
  { id: 'inspected',       label: 'Inspected',        color: '#c4955a' },
  { id: 'contested',       label: 'Contested',        color: '#9a4e4e' },
  { id: 'work_order',      label: 'Work Order',       color: '#7a4e9a' },
  { id: 'install',         label: 'Install',          color: '#4e7a6e' },
  { id: 'final',           label: 'Final',            color: '#b87333' },
];

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  async function loadAll() {
    const [proj, docs, phs, tsks, acts] = await Promise.all([
      supabase.from('project_summary').select('*').eq('id', id).single(),
      supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('photos').select('*').eq('project_id', id).order('sort_order'),
      supabase.from('tasks').select('*').eq('project_id', id).order('due_date'),
      supabase.from('activity_log').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(50),
    ]);
    if (proj.data) {
      setProject(proj.data);
      // Also fetch full client
      const { data: cl } = await supabase.from('clients').select('*').eq('id', proj.data.client_id).single();
      setClient(cl);
    }
    setDocuments(docs.data || []);
    setPhotos(phs.data || []);
    setTasks(tsks.data || []);
    setActivity(acts.data || []);
    setLoading(false);
  }

  async function updateStage(newStage) {
    if (!project || newStage === project.stage) return;
    setSaving(true);
    await supabase.from('projects').update({ stage: newStage }).eq('id', id);
    setProject(prev => ({ ...prev, stage: newStage }));
    setSaving(false);
    loadAll();
  }

  async function toggleTask(taskId, current) {
    const newStatus = current === 'complete' ? 'pending' : 'complete';
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'complete' ? new Date().toISOString() : null
    }).eq('id', taskId);
    loadAll();
  }

  if (loading || !project) return (
    <div style={{ minHeight: '100vh', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: '0.3em', color: '#c4955a', textTransform: 'uppercase' }}>Loading...</div>
    </div>
  );

  const currentStageIndex = STAGES.findIndex(s => s.id === project.stage);

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: '#f4f1ec' }}>

      {/* Top Bar */}
      <div style={{ height: 56, borderBottom: '1px solid rgba(196,149,90,0.2)', display: 'flex', alignItems: 'center', padding: '0 28px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#7a8390', cursor: 'pointer', fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            ← Pipeline
          </button>
          <span style={{ color: '#2a2a2a' }}>|</span>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 15, color: '#faf9f7' }}>{project.property_address}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {project.portal_access && (
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#4e9a6f', border: '1px solid rgba(78,154,111,0.35)', padding: '4px 8px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Portal Active</span>
          )}
          <span style={{
            fontFamily: "'Courier New',monospace", fontSize: 8,
            color: STAGES[currentStageIndex]?.color,
            border: `1px solid ${STAGES[currentStageIndex]?.color}40`,
            padding: '4px 8px', letterSpacing: '0.12em', textTransform: 'uppercase'
          }}>
            {STAGES[currentStageIndex]?.label}
          </span>
        </div>
      </div>

      {/* Stage Pipeline Bar */}
      <div style={{ padding: '18px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1a' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <button
                key={stage.id}
                disabled={saving}
                onClick={() => updateStage(stage.id)}
                style={{
                  flex: 1, padding: '8px 4px', border: 'none',
                  background: isCurrent ? stage.color : isDone ? `${stage.color}22` : '#242424',
                  color: isCurrent ? '#141414' : isDone ? stage.color : '#4a4f57',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                  borderBottom: isCurrent ? `2px solid ${stage.color}` : '2px solid transparent',
                }}
              >
                {stage.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body: Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 1, height: 'calc(100vh - 120px)' }}>

        {/* Left: Tabs */}
        <div style={{ overflowY: 'auto' }}>
          {/* Tab Nav */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 28px' }}>
            {['overview', 'documents', 'photos', 'tasks', 'activity'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: activeTab === tab ? '#c4955a' : '#4a4f57',
                borderBottom: activeTab === tab ? '1px solid #c4955a' : '1px solid transparent',
                marginBottom: -1,
              }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ padding: '28px' }}>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginBottom: 24 }}>
                  {[
                    ['Property', project.property_address],
                    ['Claim Number', project.claim_number || '—'],
                    ['Insurance Company', project.insurance_company || '—'],
                    ['Policy Number', project.policy_number || '—'],
                    ['Date of Loss', project.date_of_loss ? new Date(project.date_of_loss).toLocaleDateString() : '—'],
                    ['Project Value', project.project_value ? `$${Number(project.project_value).toLocaleString()}` : '—'],
                    ['IA/FA Signed', project.ia_fa_signed ? '✓ Yes' : '⨯ Pending'],
                    ['Portal Access', project.portal_access ? `✓ Active — ${project.portal_username || ''}` : '⨯ Not sent'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '16px', background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a4f57', marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 13, color: '#f4f1ec' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {project.notes && (
                  <div style={{ padding: 16, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a4f57', marginBottom: 8 }}>Notes</div>
                    <div style={{ fontSize: 13, color: '#b8bfc9', lineHeight: 1.7 }}>{project.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div>
                {documents.length === 0 && <div style={{ color: '#4a4f57', fontSize: 13 }}>No documents uploaded yet.</div>}
                {documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#faf9f7', marginBottom: 4 }}>{doc.name}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#c4955a', border: '1px solid rgba(196,149,90,0.3)', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{doc.doc_type?.replace('_', ' ')}</span>
                        {doc.is_signed && <span style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#4e9a6f', border: '1px solid rgba(78,154,111,0.3)', padding: '2px 6px' }}>Signed ✓</span>}
                      </div>
                    </div>
                    {doc.minio_key && (
                      <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/ab-documents/${doc.minio_key}`} target="_blank" rel="noreferrer" style={{ color: '#c4955a', fontSize: 11, fontFamily: "'Courier New',monospace", textDecoration: 'none', letterSpacing: '0.1em' }}>
                        View →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* PHOTOS TAB */}
            {activeTab === 'photos' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                {photos.length === 0 && <div style={{ color: '#4a4f57', fontSize: 13, gridColumn: '1/-1' }}>No photos uploaded yet.</div>}
                {photos.map(photo => (
                  <div key={photo.id} style={{ position: 'relative', aspectRatio: '4/3', background: '#1e1e1e', overflow: 'hidden', cursor: 'pointer' }}>
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/ab-photos/${photo.minio_key}`}
                      alt={photo.caption || 'Project photo'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', loading: 'lazy' }}
                    />
                    {photo.photo_type && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 8px', background: 'rgba(0,0,0,0.7)', fontFamily: "'Courier New',monospace", fontSize: 8, color: '#c4955a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {photo.photo_type}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TASKS TAB */}
            {activeTab === 'tasks' && (
              <div>
                {tasks.length === 0 && <div style={{ color: '#4a4f57', fontSize: 13 }}>No tasks yet.</div>}
                {tasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 2, opacity: task.status === 'complete' ? 0.5 : 1 }}>
                    <button onClick={() => toggleTask(task.id, task.status)} style={{
                      width: 18, height: 18, flexShrink: 0, border: `1px solid ${task.status === 'complete' ? '#4e9a6f' : 'rgba(255,255,255,0.2)'}`,
                      background: task.status === 'complete' ? '#4e9a6f' : 'transparent', cursor: 'pointer', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {task.status === 'complete' && <span style={{ color: '#141414', fontSize: 10 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#faf9f7', marginBottom: 4, textDecoration: task.status === 'complete' ? 'line-through' : 'none' }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 11, color: '#7a8390', lineHeight: 1.6, marginBottom: 6 }}>{task.description}</div>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {task.due_date && <span style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#4a4f57' }}>Due {new Date(task.due_date).toLocaleDateString()}</span>}
                        {task.priority === 'urgent' && <span style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#9a4e4e', border: '1px solid rgba(154,78,78,0.3)', padding: '2px 5px' }}>URGENT</span>}
                        {task.priority === 'high' && <span style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#c4955a', border: '1px solid rgba(196,149,90,0.3)', padding: '2px 5px' }}>HIGH</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <div>
                {activity.map((event, i) => (
                  <div key={event.id} style={{ display: 'flex', gap: 12, paddingBottom: 16, borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 16, marginLeft: 6, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -4, top: 4, width: 8, height: 8, background: event.performed_by === 'automated' ? '#c4955a' : '#7a8390', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontSize: 12, color: '#b8bfc9', marginBottom: 3 }}>{event.description}</div>
                      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#4a4f57' }}>
                        {new Date(event.created_at).toLocaleString()} · {event.performed_by}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Right: Client Card */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1a', padding: 20, overflowY: 'auto' }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a4f57', marginBottom: 16 }}>Client</div>

          {client && (
            <>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: '#faf9f7', marginBottom: 4 }}>
                {client.first_name} {client.last_name}
              </div>
              <div style={{ fontSize: 11, color: '#7a8390', marginBottom: 20 }}>{client.property_address}</div>

              {[
                ['Email', client.email],
                ['Phone', client.phone],
                ['Portal User', client.portal_username || '—'],
              ].map(([l, v]) => v && (
                <div key={l} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4a4f57', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 12, color: '#b8bfc9' }}>{v}</div>
                </div>
              ))}

              <div style={{ marginTop: 20 }}>
                <a href={`/clients/${client.id}`} style={{ display: 'block', textAlign: 'center', padding: '10px', border: '1px solid rgba(196,149,90,0.3)', color: '#c4955a', textDecoration: 'none', fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Full Client Record →
                </a>
              </div>
            </>
          )}

          <div style={{ marginTop: 32, fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a4f57', marginBottom: 12 }}>Assigned PM</div>
          <div style={{ fontSize: 12, color: '#b8bfc9' }}>{project.assigned_pm || '—'}</div>
        </div>

      </div>
    </div>
  );
}
