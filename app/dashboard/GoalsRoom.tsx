'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const C = { bg:'#0D0D0D', card:'#111', border:'#1e1e1e', gold:'#FFD60A', orange:'#ff6b35', red:'#D91F26', blue:'#7eb8f7', text:'#F2F2F2', muted:'#666', dim:'#2a2a2a', green:'#4ade80' };
const mono: React.CSSProperties = { fontFamily:"'Space Mono',monospace" };
const display: React.CSSProperties = { fontFamily:"'Anton',sans-serif", letterSpacing:'0.02em', textTransform:'uppercase' };
const pixel: React.CSSProperties = { fontFamily:"'Press Start 2P',monospace" };
const base: React.CSSProperties = { fontFamily:"'Space Mono',monospace", boxSizing:'border-box' };
const card: React.CSSProperties = { ...base, background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:16, marginBottom:10 };
const lbl: React.CSSProperties = { fontSize:9, letterSpacing:'0.35em', color:C.muted, marginBottom:6, textTransform:'uppercase', ...mono };

const FOLLOWER_GOAL = 150000;
const FOLLOWERS_NOW = 16500;

const VISION = [
  { year:'NOW → 18 MONTHS', color:'#ffd732', items:['Sell out every show','100K across TikTok / IG / YouTube','Record written and made','Mando sync conversation started','Team becomes affordable'] },
  { year:'YEAR 3', color:'#ff6b35', items:['Larger than Turnstile','Large theatre touring internationally','Big features + major syncs','Record out and working','Burn Industry label seeded with 5 artists'] },
  { year:'YEAR 5', color:'#e8192c', items:['18,000 capacity at home','Coachella top liner','Solo film released','Music/creative agency running','Multi-millionaire'] },
];

type Goal = {
  id: string;
  user_id: string;
  title: string;
  type: 'number' | 'deadline';
  current: number;
  target: number;
  unit: string;
  deadline: string | null;
  color: string;
  created_at: string;
};

const COLORS = [C.gold, C.orange, C.red, C.blue, C.green, '#c084fc'];
const COLOR_NAMES = ['GOLD','ORANGE','RED','BLUE','GREEN','PURPLE'];

function sfxCheck(){try{const a=new(window.AudioContext||(window as any).webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=880;g.gain.setValueAtTime(0.13,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.09);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.09);}catch(e){}}
function sfxTap(){try{const a=new(window.AudioContext||(window as any).webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=660;g.gain.setValueAtTime(0.12,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.06);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.06);}catch(e){}}

export default function GoalsRoom({ userId: userIdProp }: { userId: string | null }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [uid, setUid] = useState<string | null>(userIdProp);

  // form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'number'|'deadline'>('number');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(C.gold);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      let id = userIdProp;
      if (!id) {
        const { data: { user } } = await supabase.auth.getUser();
        id = user?.id || null;
        if (id) setUid(id);
      }
      if (!id) { setLoading(false); return; }
      const { data } = await supabase.from('goals').select('*').eq('user_id', id).order('created_at');
      if (data) setGoals(data as Goal[]);
      setLoading(false);
    }
    init();
  }, [userIdProp]);

  async function addGoal() {
    if (!title.trim()) return;
    sfxCheck();
    const entry = {
      user_id: uid,
      title: title.trim(),
      type,
      current: parseFloat(current) || 0,
      target: type === 'number' ? (parseFloat(target) || 100) : 100,
      unit: unit.trim() || '',
      deadline: type === 'deadline' ? deadline || null : null,
      color,
    };
    const { data } = await supabase.from('goals').insert(entry).select().single();
    if (data) setGoals(g => [...g, data as Goal]);
    setTitle(''); setCurrent(''); setTarget(''); setUnit(''); setDeadline(''); setColor(C.gold); setAdding(false);
  }

  async function updateCurrent(id: string, val: string) {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    sfxCheck();
    await supabase.from('goals').update({ current: n }).eq('id', id);
    setGoals(g => g.map(x => x.id === id ? { ...x, current: n } : x));
    setEditing(null); setEditVal('');
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(g => g.filter(x => x.id !== id));
  }

  function daysUntil(dateStr: string) {
    const t = new Date(); t.setHours(0,0,0,0);
    const g = new Date(dateStr); g.setHours(0,0,0,0);
    return Math.round((g.getTime() - t.getTime()) / 86400000);
  }

  function getPct(goal: Goal) {
    if (goal.type === 'deadline' && goal.deadline) {
      const created = new Date(goal.created_at).getTime();
      const end = new Date(goal.deadline).getTime();
      const now = Date.now();
      const total = end - created;
      const elapsed = now - created;
      return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
    }
    if (goal.target <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((goal.current / goal.target) * 100)));
  }

  function getStatusColor(pct: number, goal: Goal) {
    if (goal.type === 'deadline') {
      const d = goal.deadline ? daysUntil(goal.deadline) : 999;
      if (d < 0) return C.muted;
      if (d < 14) return C.red;
      if (d < 30) return C.orange;
      return goal.color;
    }
    if (pct >= 100) return C.green;
    if (pct >= 75) return C.gold;
    return goal.color;
  }

  const btnFull = (c:string): React.CSSProperties => ({ ...base, padding:'10px 18px', background:c, border:`1px solid ${c}`, color:'#0D0D0D', fontSize:10, letterSpacing:'0.25em', fontWeight:700, cursor:'pointer', borderRadius:3 });
  const btnOut  = (c:string): React.CSSProperties => ({ ...base, padding:'10px 18px', background:'transparent', border:`1px solid ${c}`, color:c, fontSize:10, letterSpacing:'0.25em', fontWeight:700, cursor:'pointer', borderRadius:3 });

  return (
    <div>
      {/* ── BOSS: 150K FOLLOWERS ── */}
      <div style={{ ...card, borderLeft:`3px solid ${C.red}`, marginBottom:18 }}>
        <div style={{ ...lbl, color:C.red }}>THE BOSS — 150K FOLLOWERS</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:8, marginBottom:8 }}>
          <span style={{ ...display, fontSize:28, color:C.gold }}>{FOLLOWERS_NOW.toLocaleString()}</span>
          <span style={{ ...mono, fontSize:12, color:C.muted }}>/ {FOLLOWER_GOAL.toLocaleString()}</span>
        </div>
        <div style={{ background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, height:18, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.max((FOLLOWERS_NOW/FOLLOWER_GOAL)*100,2)}%`, background:`linear-gradient(90deg,${C.red},${C.gold})` }}/>
        </div>
        <div style={{ ...mono, fontSize:11, color:C.muted, marginTop:8 }}>
          {Math.round((FOLLOWERS_NOW/FOLLOWER_GOAL)*100)}% chipped down. {(FOLLOWER_GOAL-FOLLOWERS_NOW).toLocaleString()} health left on the boss.
        </div>
      </div>

      {/* ── VISION ── */}
      <div style={{ ...card, borderLeft:`3px solid ${C.gold}` }}>
        <div style={{ ...lbl, color:C.gold }}>THE MISSION</div>
        <div style={{ ...mono, fontSize:13, color:C.muted, lineHeight:1.7, fontStyle:'italic' }}>"Protecting each other because the government won't."</div>
      </div>
      {VISION.map((v,i) => (
        <div key={i} style={{ ...card, borderLeft:`3px solid ${v.color}` }}>
          <div style={{ ...lbl, color:v.color }}>{v.year}</div>
          {v.items.map((item,j) => (
            <div key={j} style={{ display:'flex', gap:8, marginBottom:6 }}>
              <span style={{ color:v.color, flexShrink:0 }}>→</span>
              <span style={{ ...mono, fontSize:13, color:C.muted, lineHeight:1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      ))}

      {/* ── CUSTOM GOALS ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'24px 0 12px' }}>
        <div style={{ ...lbl, marginBottom:0 }}>MY GOALS</div>
        <button onClick={() => { sfxTap(); setAdding(a => !a); }}
          style={{ ...mono, background:'transparent', border:`1px solid ${adding?C.red:C.gold}`, borderRadius:3, color:adding?C.red:C.gold, fontSize:9, letterSpacing:'0.2em', padding:'5px 12px', cursor:'pointer' }}>
          {adding ? '✕ CANCEL' : '+ ADD GOAL'}
        </button>
      </div>

      {/* ADD GOAL FORM */}
      {adding && (
        <div style={{ ...card, borderLeft:`3px solid ${C.gold}` }}>
          <div style={{ ...lbl, color:C.gold, marginBottom:12 }}>NEW GOAL</div>

          {/* Title */}
          <div style={{ ...mono, fontSize:9, letterSpacing:'0.2em', color:C.muted, marginBottom:4 }}>GOAL</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. 150K Instagram followers"
            style={{ ...mono, width:'100%', background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, padding:'9px 11px', fontSize:13, color:C.text, outline:'none', marginBottom:12 }}/>

          {/* Type toggle */}
          <div style={{ ...mono, fontSize:9, letterSpacing:'0.2em', color:C.muted, marginBottom:6 }}>TYPE</div>
          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            {[['number','NUMBER TARGET'],['deadline','DEADLINE']].map(([k,l]) => (
              <button key={k} onClick={() => setType(k as any)}
                style={{ ...mono, flex:1, padding:'8px 10px', borderRadius:3, border:`1px solid ${type===k?C.gold:C.border}`, background:type===k?C.gold:'transparent', color:type===k?'#0D0D0D':C.muted, fontSize:9, letterSpacing:'0.1em', fontWeight:700, cursor:'pointer' }}>{l}</button>
            ))}
          </div>

          {type === 'number' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
              {[['CURRENT',current,setCurrent,'0'],['TARGET',target,setTarget,'100'],['UNIT',unit,setUnit,'followers']].map(([l,v,fn,ph]) => (
                <div key={String(l)}>
                  <div style={{ ...mono, fontSize:9, letterSpacing:'0.2em', color:C.muted, marginBottom:4 }}>{String(l)}</div>
                  <input value={String(v)} onChange={e=>(fn as any)(e.target.value)} placeholder={String(ph)} inputMode={String(l)!=='UNIT'?'decimal':'text'}
                    style={{ ...mono, width:'100%', background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, padding:'8px 10px', fontSize:12, color:C.text, outline:'none' }}/>
                </div>
              ))}
            </div>
          )}

          {type === 'deadline' && (
            <div style={{ marginBottom:12 }}>
              <div style={{ ...mono, fontSize:9, letterSpacing:'0.2em', color:C.muted, marginBottom:4 }}>DEADLINE</div>
              <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}
                style={{ ...mono, width:'100%', background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, padding:'8px 10px', fontSize:12, color:C.text, outline:'none', marginBottom:8 }}/>
              <div style={{ ...mono, fontSize:9, letterSpacing:'0.2em', color:C.muted, marginBottom:4 }}>NOTES (optional)</div>
              <input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="e.g. Album release, Tour start"
                style={{ ...mono, width:'100%', background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, padding:'8px 10px', fontSize:12, color:C.text, outline:'none' }}/>
            </div>
          )}

          {/* Color picker */}
          <div style={{ ...mono, fontSize:9, letterSpacing:'0.2em', color:C.muted, marginBottom:8 }}>COLOR</div>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {COLORS.map((c,i) => (
              <button key={c} onClick={() => setColor(c)}
                style={{ width:28, height:28, borderRadius:'50%', background:c, border:`3px solid ${color===c?C.text:C.border}`, cursor:'pointer' }} title={COLOR_NAMES[i]}/>
            ))}
          </div>

          <button onClick={addGoal} style={{ ...btnFull(C.gold), width:'100%', padding:12 }}>
            ADD GOAL →
          </button>
        </div>
      )}

      {/* GOAL CARDS */}
      {loading && <div style={{ ...mono, fontSize:12, color:C.muted, padding:'16px 0' }}>Loading goals...</div>}

      {!loading && goals.length === 0 && !adding && (
        <div style={{ ...card, textAlign:'center', opacity:0.5 }}>
          <div style={{ ...mono, fontSize:12, color:C.dim }}>No goals yet. Tap + ADD GOAL to set your first target.</div>
        </div>
      )}

      {goals.map(goal => {
        const pct = getPct(goal);
        const statusColor = getStatusColor(pct, goal);
        const isComplete = pct >= 100;
        const isEditing = editing === goal.id;
        const d = goal.deadline ? daysUntil(goal.deadline) : null;

        return (
          <div key={goal.id} style={{ ...card, borderLeft:`3px solid ${statusColor}`, background: isComplete ? '#0a1a0a' : C.card }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ ...display, fontSize:16, color:statusColor, lineHeight:1.2, marginBottom:4 }}>{goal.title}</div>
                {goal.unit && goal.type === 'deadline' && <div style={{ ...mono, fontSize:11, color:C.muted }}>{goal.unit}</div>}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                {isComplete && <span style={{ ...pixel, fontSize:8, color:C.green }}>DONE</span>}
                <button onClick={() => deleteGoal(goal.id)} style={{ ...mono, background:'transparent', border:'none', color:C.dim, fontSize:15, cursor:'pointer' }}>×</button>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, height:14, overflow:'hidden', marginBottom:8 }}>
              <div style={{ height:'100%', width:`${pct}%`, background: isComplete ? C.green : `linear-gradient(90deg,${statusColor}88,${statusColor})`, transition:'width 0.4s' }}/>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              {goal.type === 'number' ? (
                <>
                  <div style={{ ...mono, fontSize:11, color:C.muted }}>
                    <span style={{ color:statusColor, fontWeight:700 }}>{goal.current.toLocaleString()}</span>
                    {goal.unit && ` ${goal.unit}`} of {goal.target.toLocaleString()}{goal.unit && ` ${goal.unit}`}
                    <span style={{ color:C.dim, marginLeft:8 }}>{pct}%</span>
                  </div>
                  {!isEditing ? (
                    <button onClick={() => { setEditing(goal.id); setEditVal(String(goal.current)); }}
                      style={{ ...mono, background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, color:C.muted, fontSize:9, letterSpacing:'0.1em', padding:'4px 10px', cursor:'pointer' }}>UPDATE</button>
                  ) : (
                    <div style={{ display:'flex', gap:6 }}>
                      <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter') updateCurrent(goal.id,editVal); if(e.key==='Escape'){setEditing(null);setEditVal('');} }}
                        inputMode="decimal"
                        style={{ ...mono, width:90, background:'#0a0a0a', border:`1px solid ${goal.color}`, borderRadius:3, padding:'5px 8px', fontSize:12, color:goal.color, outline:'none' }}/>
                      <button onClick={() => updateCurrent(goal.id, editVal)}
                        style={{ ...mono, background:goal.color, border:'none', borderRadius:3, padding:'5px 10px', fontSize:10, fontWeight:700, color:'#0D0D0D', cursor:'pointer' }}>SET</button>
                      <button onClick={() => { setEditing(null); setEditVal(''); }}
                        style={{ ...mono, background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, padding:'5px 8px', fontSize:10, color:C.muted, cursor:'pointer' }}>✕</button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ ...mono, fontSize:11, color:C.muted }}>
                  {d === null ? 'No deadline set' :
                   d < 0 ? <span style={{ color:C.muted }}>Passed {Math.abs(d)} days ago</span> :
                   d === 0 ? <span style={{ color:C.red }}>TODAY</span> :
                   d <= 7 ? <span style={{ color:C.red }}>{d} days left</span> :
                   d <= 30 ? <span style={{ color:C.orange }}>{d} days left</span> :
                   <span>{d} days left · {Math.round(d/30)} months</span>}
                  <span style={{ color:C.dim, marginLeft:8 }}>{pct}% of time elapsed</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
