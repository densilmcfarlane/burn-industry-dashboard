'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const C = { bg:'#0D0D0D', card:'#151515', cardLight:'#1a1a1a', border:'#2a2a2a', gold:'#FFD60A', orange:'#ff6b35', red:'#D91F26', blue:'#7eb8f7', text:'#F2F2F2', muted:'#8a8a8a', dim:'#3a3a3a', green:'#4ade80' };
const mono: React.CSSProperties = { fontFamily:"'Space Mono',monospace" };
const display: React.CSSProperties = { fontFamily:"'Anton',sans-serif", letterSpacing:'0.02em', textTransform:'uppercase' };
const pixel: React.CSSProperties = { fontFamily:"'Press Start 2P',monospace" };
const base: React.CSSProperties = { fontFamily:"'Space Mono',monospace", boxSizing:'border-box' };
const card: React.CSSProperties = { ...base, background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:18, marginBottom:12 };
const lbl: React.CSSProperties = { fontSize:11, letterSpacing:'0.25em', color:C.muted, marginBottom:8, textTransform:'uppercase', fontWeight:700, ...mono };

const FOLLOWER_GOAL = 150000;

const VISION = [
  { year:'NOW → 18 MONTHS', color:'#ffd732', items:['Sell out every show','100K across TikTok / IG / YouTube','Record written and made','Mando sync conversation started','Team becomes affordable'] },
  { year:'YEAR 3', color:'#ff6b35', items:['Larger than Turnstile','Large theatre touring internationally','Big features + major syncs','Record out and working','Burn Industry label seeded with 5 artists'] },
  { year:'YEAR 5', color:'#e8192c', items:['18,000 capacity at home','Coachella top liner','Solo film released','Music/creative agency running','Multi-millionaire'] },
];

type Milestone = { id:string; label:string; value:number; done:boolean };
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
  milestones: Milestone[];
  created_at: string;
};

const COLORS = [C.gold, C.orange, C.red, C.blue, C.green, '#c084fc'];

function sfxCheck(){try{const a=new(window.AudioContext||(window as any).webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=880;g.gain.setValueAtTime(0.13,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.09);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.09);}catch(e){}}
function sfxTap(){try{const a=new(window.AudioContext||(window as any).webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=660;g.gain.setValueAtTime(0.12,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.06);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.06);}catch(e){}}

export default function GoalsRoom({ userId: userIdProp }: { userId: string | null }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [uid, setUid] = useState<string | null>(userIdProp);
  const [followersNow, setFollowersNow] = useState(16500);
  const [editingFollowers, setEditingFollowers] = useState(false);
  const [followersEditVal, setFollowersEditVal] = useState('');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'number'|'deadline'>('number');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(C.gold);

  const [msLabel, setMsLabel] = useState('');
  const [msValue, setMsValue] = useState('');

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
      if (data) setGoals(data.map((g:any) => ({ ...g, milestones: g.milestones || [] })) as Goal[]);
      const { data: prefData } = await supabase.from('preferences').select('followers_now').eq('user_id', id).single();
      if (prefData && prefData.followers_now != null) setFollowersNow(prefData.followers_now);
      setLoading(false);
    }
    init();
  }, [userIdProp]);

  async function addGoal() {
    if (!title.trim() || !uid) return;
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
      milestones: [],
    };
    const { data } = await supabase.from('goals').insert(entry).select().single();
    if (data) setGoals(g => [...g, { ...data, milestones: [] } as Goal]);
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
    if (expanded === id) setExpanded(null);
  }

  async function addMilestone(goalId: string) {
    if (!msLabel.trim() || !msValue) return;
    sfxTap();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newMs: Milestone = { id: String(Date.now()), label: msLabel.trim(), value: parseFloat(msValue) || 0, done: false };
    const updated = [...goal.milestones, newMs].sort((a,b) => a.value - b.value);
    await supabase.from('goals').update({ milestones: updated }).eq('id', goalId);
    setGoals(g => g.map(x => x.id === goalId ? { ...x, milestones: updated } : x));
    setMsLabel(''); setMsValue('');
  }

  async function toggleMilestone(goalId: string, msId: string) {
    sfxCheck();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updated = goal.milestones.map(m => m.id === msId ? { ...m, done: !m.done } : m);
    await supabase.from('goals').update({ milestones: updated }).eq('id', goalId);
    setGoals(g => g.map(x => x.id === goalId ? { ...x, milestones: updated } : x));
  }

  async function removeMilestone(goalId: string, msId: string) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updated = goal.milestones.filter(m => m.id !== msId);
    await supabase.from('goals').update({ milestones: updated }).eq('id', goalId);
    setGoals(g => g.map(x => x.id === goalId ? { ...x, milestones: updated } : x));
  }

  async function saveFollowers(val: string) {
    const n = parseInt(val.replace(/[^0-9]/g, ''));
    if (isNaN(n) || !uid) return;
    sfxCheck();
    setFollowersNow(n);
    await supabase.from('preferences').update({ followers_now: n }).eq('user_id', uid);
    setEditingFollowers(false); setFollowersEditVal('');
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

  const btnFull = (c:string): React.CSSProperties => ({ ...base, padding:'12px 18px', background:c, border:`1px solid ${c}`, color:'#0D0D0D', fontSize:12, letterSpacing:'0.15em', fontWeight:700, cursor:'pointer', borderRadius:5 });
  const btnOut  = (c:string): React.CSSProperties => ({ ...base, padding:'12px 18px', background:'transparent', border:`1px solid ${c}`, color:c, fontSize:12, letterSpacing:'0.15em', fontWeight:700, cursor:'pointer', borderRadius:5 });

  return (
    <div>
      {/* BOSS FIGHT */}
      <div style={{ ...card, borderLeft:`4px solid ${C.red}`, marginBottom:20 }}>
        <div style={{ ...lbl, color:C.red }}>The boss — 150K followers</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:10, marginBottom:10 }}>
          {!editingFollowers ? (
            <span style={{ ...display, fontSize:32, color:C.gold }}>{followersNow.toLocaleString()}</span>
          ) : (
            <input autoFocus value={followersEditVal} onChange={e=>setFollowersEditVal(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') saveFollowers(followersEditVal); if(e.key==='Escape'){setEditingFollowers(false);setFollowersEditVal('');} }}
              inputMode="numeric"
              style={{ ...mono, width:140, background:'#0a0a0a', border:`1px solid ${C.gold}`, borderRadius:5, padding:'8px 12px', fontSize:20, color:C.gold, outline:'none' }}/>
          )}
          <span style={{ ...mono, fontSize:14, color:C.muted }}>/ {FOLLOWER_GOAL.toLocaleString()}</span>
        </div>
        <div style={{ background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:5, height:20, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.max((followersNow/FOLLOWER_GOAL)*100,2)}%`, background:`linear-gradient(90deg,${C.red},${C.gold})` }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
          <div style={{ ...mono, fontSize:13, color:C.muted, lineHeight:1.5 }}>
            {Math.round((followersNow/FOLLOWER_GOAL)*100)}% chipped down — {(FOLLOWER_GOAL-followersNow).toLocaleString()} to go.
          </div>
          {!editingFollowers ? (
            <button onClick={() => { setEditingFollowers(true); setFollowersEditVal(String(followersNow)); }}
              style={{ ...mono, background:'transparent', border:`1px solid ${C.border}`, borderRadius:5, color:C.muted, fontSize:10, letterSpacing:'0.1em', fontWeight:700, padding:'6px 12px', cursor:'pointer', flexShrink:0 }}>UPDATE</button>
          ) : (
            <button onClick={() => saveFollowers(followersEditVal)}
              style={{ ...mono, background:C.gold, border:'none', borderRadius:5, color:'#0D0D0D', fontSize:10, letterSpacing:'0.1em', fontWeight:700, padding:'6px 14px', cursor:'pointer', flexShrink:0 }}>SET</button>
          )}
        </div>
      </div>

      {/* MY GOALS HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'24px 0 14px' }}>
        <div style={{ ...display, fontSize:20, color:C.text }}>My goals</div>
        <button onClick={() => { sfxTap(); setAdding(a => !a); }}
          style={{ ...mono, background: adding ? 'transparent' : C.gold, border:`1px solid ${adding?C.red:C.gold}`, borderRadius:5, color:adding?C.red:'#0D0D0D', fontSize:11, fontWeight:700, letterSpacing:'0.1em', padding:'8px 14px', cursor:'pointer' }}>
          {adding ? 'CANCEL' : '+ ADD GOAL'}
        </button>
      </div>

      {adding && (
        <div style={{ ...card, borderLeft:`4px solid ${C.gold}`, background:C.cardLight }}>
          <div style={{ ...lbl, color:C.gold, fontSize:13, marginBottom:16 }}>New goal</div>

          <div style={{ ...mono, fontSize:11, color:C.muted, marginBottom:6, fontWeight:700 }}>WHAT'S THE GOAL</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. 150K Instagram followers"
            style={{ ...mono, width:'100%', background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:5, padding:'12px 14px', fontSize:15, color:C.text, outline:'none', marginBottom:16 }}/>

          <div style={{ ...mono, fontSize:11, color:C.muted, marginBottom:8, fontWeight:700 }}>TYPE</div>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[['number','NUMBER TARGET'],['deadline','DEADLINE']].map(([k,l]) => (
              <button key={k} onClick={() => setType(k as any)}
                style={{ ...mono, flex:1, padding:'12px 10px', borderRadius:5, border:`1px solid ${type===k?C.gold:C.border}`, background:type===k?C.gold:'transparent', color:type===k?'#0D0D0D':C.muted, fontSize:11, letterSpacing:'0.08em', fontWeight:700, cursor:'pointer' }}>{l}</button>
            ))}
          </div>

          {type === 'number' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
              {[['CURRENT',current,setCurrent,'0'],['TARGET',target,setTarget,'100'],['UNIT',unit,setUnit,'followers']].map(([l,v,fn,ph]) => (
                <div key={String(l)}>
                  <div style={{ ...mono, fontSize:10, color:C.muted, marginBottom:6, fontWeight:700 }}>{String(l)}</div>
                  <input value={String(v)} onChange={e=>(fn as any)(e.target.value)} placeholder={String(ph)} inputMode={String(l)!=='UNIT'?'decimal':'text'}
                    style={{ ...mono, width:'100%', background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:5, padding:'10px 12px', fontSize:13, color:C.text, outline:'none' }}/>
                </div>
              ))}
            </div>
          )}
          {type === 'deadline' && (
            <div style={{ marginBottom:16 }}>
              <div style={{ ...mono, fontSize:10, color:C.muted, marginBottom:6, fontWeight:700 }}>DEADLINE DATE</div>
              <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}
                style={{ ...mono, width:'100%', background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:5, padding:'10px 12px', fontSize:13, color:C.text, outline:'none' }}/>
            </div>
          )}

          <div style={{ ...mono, fontSize:11, color:C.muted, marginBottom:10, fontWeight:700 }}>COLOR</div>
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                style={{ width:32, height:32, borderRadius:'50%', background:c, border:`3px solid ${color===c?'#fff':C.border}`, cursor:'pointer' }}/>
            ))}
          </div>
          <button onClick={addGoal} style={{ ...btnFull(C.gold), width:'100%', padding:14, fontSize:13 }}>CREATE GOAL</button>
        </div>
      )}

      {loading && <div style={{ ...mono, fontSize:13, color:C.muted, padding:'20px 0' }}>Loading goals…</div>}
      {!loading && goals.length === 0 && !adding && (
        <div style={{ ...card, textAlign:'center', padding:'28px 16px' }}>
          <div style={{ ...mono, fontSize:13, color:C.muted }}>No goals yet. Tap + ADD GOAL above to set your first target.</div>
        </div>
      )}

      {goals.map(goal => {
        const pct = getPct(goal);
        const isComplete = pct >= 100;
        const statusColor = isComplete ? C.green : goal.color;
        const isEditing = editing === goal.id;
        const isExpanded = expanded === goal.id;
        const d = goal.deadline ? daysUntil(goal.deadline) : null;
        const doneMilestones = goal.milestones.filter(m => m.done).length;

        return (
          <div key={goal.id} style={{ ...base, background: isComplete ? '#0f1f12' : C.card, border:`1px solid ${isExpanded?statusColor:C.border}`, borderLeft:`4px solid ${statusColor}`, borderRadius:6, marginBottom:12, overflow:'hidden' }}>
            {/* HEADER ROW */}
            <div onClick={() => { sfxTap(); setExpanded(isExpanded ? null : goal.id); }}
              style={{ padding:'16px 18px', cursor:'pointer' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, gap:10 }}>
                <div style={{ ...display, fontSize:17, color:C.text, lineHeight:1.25, flex:1 }}>{goal.title}</div>
                <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
                  {isComplete && <span style={{ ...mono, fontSize:10, fontWeight:700, color:C.green, letterSpacing:'0.1em' }}>DONE</span>}
                  <span style={{ ...mono, fontSize:18, color:C.muted, display:'inline-block', transform: isExpanded?'rotate(90deg)':'none', transition:'transform 0.2s' }}>›</span>
                </div>
              </div>
              <div style={{ background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:5, height:16, overflow:'hidden', marginBottom:10 }}>
                <div style={{ height:'100%', width:`${pct}%`, background: isComplete ? C.green : statusColor, transition:'width 0.4s' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', flexWrap:'wrap', gap:6 }}>
                <span style={{ ...mono, fontSize:13, color:C.text, fontWeight:700 }}>
                  {goal.type === 'number'
                    ? `${goal.current.toLocaleString()}${goal.unit?' '+goal.unit:''} of ${goal.target.toLocaleString()}${goal.unit?' '+goal.unit:''}`
                    : (d===null?'No deadline': d<0?`Passed ${Math.abs(d)}d ago`: d===0?'TODAY': `${d} days left`)}
                </span>
                <span style={{ ...mono, fontSize:13, color:statusColor, fontWeight:700 }}>
                  {pct}%{goal.milestones.length>0?` · ${doneMilestones}/${goal.milestones.length} steps`:''}
                </span>
              </div>
            </div>

            {/* EXPANDED */}
            {isExpanded && (
              <div style={{ padding:'4px 18px 18px', borderTop:`1px solid ${C.border}`, background:'#0d0d0d' }}>
                {goal.type === 'number' && (
                  <div style={{ display:'flex', gap:10, alignItems:'center', margin:'16px 0' }}>
                    {!isEditing ? (
                      <button onClick={(e) => { e.stopPropagation(); setEditing(goal.id); setEditVal(String(goal.current)); }}
                        style={{ ...btnOut(goal.color), flex:1, padding:'12px' }}>UPDATE PROGRESS</button>
                    ) : (
                      <>
                        <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                          onKeyDown={e=>{ if(e.key==='Enter') updateCurrent(goal.id,editVal); if(e.key==='Escape'){setEditing(null);setEditVal('');} }}
                          onClick={e=>e.stopPropagation()}
                          inputMode="decimal"
                          style={{ ...mono, flex:1, background:'#0a0a0a', border:`1px solid ${goal.color}`, borderRadius:5, padding:'12px 14px', fontSize:14, color:goal.color, outline:'none' }}/>
                        <button onClick={(e) => { e.stopPropagation(); updateCurrent(goal.id, editVal); }}
                          style={{ ...mono, background:goal.color, border:'none', borderRadius:5, padding:'12px 18px', fontSize:12, fontWeight:700, color:'#0D0D0D', cursor:'pointer' }}>SET</button>
                      </>
                    )}
                  </div>
                )}

                <div style={{ ...mono, fontSize:11, letterSpacing:'0.15em', color:C.muted, fontWeight:700, margin:'18px 0 12px' }}>WORK-BACK PLAN</div>

                {goal.milestones.length === 0 && (
                  <div style={{ ...mono, fontSize:12, color:C.muted, fontStyle:'italic', padding:'4px 0 14px', lineHeight:1.5 }}>
                    Break this goal into steps — add your first checkpoint below.
                  </div>
                )}

                {goal.milestones.map(m => (
                  <div key={m.id} onClick={(e) => { e.stopPropagation(); toggleMilestone(goal.id, m.id); }}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:`1px solid ${C.border}`, cursor:'pointer' }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', border:`2px solid ${m.done?C.green:C.muted}`, background:m.done?C.green:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {m.done && <span style={{ fontSize:12, color:'#0D0D0D', fontWeight:900 }}>✓</span>}
                    </div>
                    <span style={{ ...mono, fontSize:13, color:m.done?C.muted:C.text, textDecoration:m.done?'line-through':'none', flex:1, lineHeight:1.4 }}>{m.label}</span>
                    <span style={{ ...mono, fontSize:12, color:C.muted, fontWeight:700 }}>{m.value.toLocaleString()}{goal.unit?' '+goal.unit:''}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeMilestone(goal.id, m.id); }}
                      style={{ ...mono, background:'transparent', border:'none', color:C.dim, fontSize:18, cursor:'pointer', padding:0 }}>×</button>
                  </div>
                ))}

                <div style={{ display:'flex', gap:8, marginTop:14 }} onClick={e=>e.stopPropagation()}>
                  <input value={msLabel} onChange={e=>setMsLabel(e.target.value)} placeholder="Checkpoint, e.g. Reach 25K"
                    style={{ ...mono, flex:2, background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:5, padding:'10px 12px', fontSize:12, color:C.text, outline:'none' }}/>
                  <input value={msValue} onChange={e=>setMsValue(e.target.value)} placeholder="Value" inputMode="decimal"
                    style={{ ...mono, flex:1, background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:5, padding:'10px 12px', fontSize:12, color:C.text, outline:'none' }}/>
                  <button onClick={() => addMilestone(goal.id)} style={{ ...mono, background:goal.color, border:'none', borderRadius:5, padding:'10px 16px', fontSize:13, fontWeight:700, color:'#0D0D0D', cursor:'pointer' }}>+</button>
                </div>

                <button onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                  style={{ ...mono, background:'transparent', border:'none', color:C.muted, fontSize:11, letterSpacing:'0.05em', cursor:'pointer', marginTop:20, padding:0, textDecoration:'underline' }}>Delete this goal</button>
              </div>
            )}
          </div>
        );
      })}

      {/* VISION BOARD */}
      <div style={{ ...card, borderLeft:`4px solid ${C.gold}`, marginTop:28 }}>
        <div style={{ ...lbl, color:C.gold }}>The mission</div>
        <div style={{ ...mono, fontSize:14, color:C.muted, lineHeight:1.7, fontStyle:'italic' }}>"Protecting each other because the government won't."</div>
      </div>
      {VISION.map((v,i) => (
        <div key={i} style={{ ...card, borderLeft:`4px solid ${v.color}` }}>
          <div style={{ ...lbl, color:v.color }}>{v.year}</div>
          {v.items.map((item,j) => (
            <div key={j} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
              <span style={{ color:v.color, flexShrink:0, fontSize:14 }}>→</span>
              <span style={{ ...mono, fontSize:14, color:C.text, lineHeight:1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
