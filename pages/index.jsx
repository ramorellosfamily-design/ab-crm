import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STAGES = [
  { id: 'insurance_leads', label: 'Insurance Leads', color: '#4e7a9a', desc: 'Send inspection reports' },
  { id: 'signed',          label: 'Signed',           color: '#4e9a6f', desc: 'IA/FA signed · Portal active', highlight: true },
  { id: 'inspected',       label: 'Inspected',        color: '#c4955a', desc: 'Awaiting carrier response' },
  { id: 'contested',       label: 'Contested',        color: '#9a4e4e', desc: 'Disputing with carrier' },
  { id: 'work_order',      label: 'Work Order',       color: '#7a4e9a', desc: 'Contract signed' },
  { id: 'install',         label: 'Install',          color: '#4e7a6e', desc: 'Active installation' },
  { id: 'final',           label: 'Final',            color: '#b87333', desc: 'Complete' },
];

export default function CRMKanban() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
    // Real-time updates
    const channel = supabase
      .channel('projects-kanban')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchProjects)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('project_summary')
      .select('*')
      .order('stage_updated_at', { ascending: false });
    if (!error) setProjects(data || []);
    setLoading(false);
  }

  async function moveProject(projectId, newStage) {
    await supabase
      .from('projects')
      .update({ stage: newStage })
      .eq('id', projectId);
    fetchProjects();
  }

  const filtered = projects.filter(p =>
    !search ||
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.claim_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.property_address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: '#f4f1ec' }}>

      {/* Top Nav */}
      <nav style={{ height: 56, borderBottom: '1px solid rgba(196,149,90,0.2)', display: 'flex', alignItems: 'center', padding: '0 28px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 300, color: '#faf9f7', letterSpacing: '0.02em' }}>
            A &amp; B <span style={{ color: '#c4955a' }}>CRM</span>
          </span>
          <span style={{ fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a4f57', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>
            Pipeline
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients, claims..."
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#f4f1ec', padding: '7px 14px', fontFamily: "'Courier New',monospace", fontSize: 11, width: 220, outline: 'none' }}
          />
          <a href="/clients" style={{ color: '#7a8390', fontSize: 12, textDecoration: 'none', fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Clients</a>
          <a href="/tasks" style={{ color: '#7a8390', fontSize: 12, textDecoration: 'none', fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Tasks</a>
          <button
            onClick={() => window.location.href = '/projects/new'}
            style={{ background: '#c4955a', color: '#141414', border: 'none', padding: '7px 16px', cursor: 'pointer', fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            + New Project
          </button>
        </div>
      </nav>

      {/* Stage Headers + Count */}
      <div style={{ padding: '20px 24px 0', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(200px, 1fr))', gap: 1, minWidth: 1400 }}>

          {STAGES.map(stage => {
            const stageProjects = filtered.filter(p => p.stage === stage.id);
            return (
              <div key={stage.id} style={{ position: 'relative' }}>
                {/* Stage Header */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: `2px solid ${stage.color}`,
                  background: stage.highlight ? `rgba(${hexToRgb(stage.color)}, 0.06)` : '#1a1a1a',
                  marginBottom: 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: stage.color, marginBottom: 4 }}>
                        {stage.label}
                        {stage.highlight && <span style={{ marginLeft: 6, color: '#4e9a6f', fontSize: 7 }}>⚡ PORTAL</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#4a4f57', lineHeight: 1.5 }}>{stage.desc}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: stage.color, color: '#141414',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Courier New',monospace", fontSize: 10, fontWeight: 600, flexShrink: 0
                    }}>
                      {stageProjects.length}
                    </div>
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragging) moveProject(dragging, stage.id);
                    setDragging(null);
                  }}
                  style={{ minHeight: 'calc(100vh - 170px)', padding: '6px 4px', background: dragging ? 'rgba(196,149,90,0.02)' : 'transparent' }}
                >
                  {stageProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      stageColor={stage.color}
                      onDragStart={() => setDragging(project.id)}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => window.location.href = `/projects/${project.id}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {loading && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,20,20,0.8)' }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: '0.3em', color: '#c4955a', textTransform: 'uppercase' }}>Loading Pipeline...</div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, stageColor, onDragStart, onDragEnd, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#242424' : '#1e1e1e',
        border: `1px solid ${hovered ? 'rgba(196,149,90,0.3)' : 'rgba(255,255,255,0.06)'}`,
        borderLeft: `2px solid ${stageColor}`,
        padding: '14px 14px 12px',
        marginBottom: 4,
        cursor: 'pointer',
        transition: 'all 0.18s',
        userSelect: 'none',
      }}
    >
      {/* Client Name */}
      <div style={{ fontFamily: 'Georgia,serif', fontSize: 14, color: '#faf9f7', marginBottom: 3, lineHeight: 1.2 }}>
        {project.client_name}
      </div>

      {/* Address */}
      <div style={{ fontSize: 10, color: '#7a8390', marginBottom: 10, lineHeight: 1.5 }}>
        {project.property_address}
      </div>

      {/* Claim Number */}
      {project.claim_number && (
        <div style={{ fontFamily: "'Courier New',monospace", fontSize: 9, color: '#4a4f57', letterSpacing: '0.08em', marginBottom: 8 }}>
          #{project.claim_number}
        </div>
      )}

      {/* Pills row */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {project.portal_access && (
          <span style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#4e9a6f', border: '1px solid rgba(78,154,111,0.35)', padding: '2px 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Portal Active
          </span>
        )}
        {project.ia_fa_signed && (
          <span style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#c4955a', border: '1px solid rgba(196,149,90,0.3)', padding: '2px 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            IA/FA ✓
          </span>
        )}
        {project.open_tasks > 0 && (
          <span style={{ fontFamily: "'Courier New',monospace", fontSize: 8, color: '#9a4e4e', border: '1px solid rgba(154,78,78,0.3)', padding: '2px 6px' }}>
            {project.open_tasks} tasks
          </span>
        )}
      </div>

      {/* Bottom: PM + value */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 9, color: '#4a4f57', fontFamily: "'Courier New',monospace" }}>
          {project.assigned_pm || '—'}
        </div>
        {project.project_value && (
          <div style={{ fontSize: 10, color: '#b8bfc9' }}>
            ${Number(project.project_value).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '196,149,90';
}
