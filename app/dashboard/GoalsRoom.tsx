'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const C = { bg:'#0D0D0D', card:'#111', border:'#1e1e1e', gold:'#FFD60A', orange:'#ff6b35', red:'#D91F26', blue:'#7eb8f7', text:'#F2F2F2', muted:'#888', dim:'#2a2a2a', green:'#4ade80', purple:'#c084fc' };
const mono: React.CSSProperties = { fontFamily:"'Space Mono',monospace" };
const display: React.CSSProperties = { fontFamily:"'Anton',sans-serif", letterSpacing:'0.02em', textTransform:'uppercase' };
const pixel: React.CSSProperties = { fontFamily:"'Press Start 2P',monospace" };
const base: React.CSSProperties = { fontFamily:"'Space Mono',monospace", boxSizing:'border-box' };

const FOLLOWER_GOAL = 150000;

const BUCKETS = [
  {
    key: 'legacy',
    label: 'LEGACY',
    color: C.gold,
    desc: 'Generational. Stadium-level. Billionaire.',
    goals: [
      { id:'l1', text:'Be as big as Deftones and Turnstile', done:false },
      { id:'l2', text:'Sell out stadiums', done:false },
      { id:'l3', text:'18,000 people in a park to mosh like Turnstile', done:false },
      { id:'l4', text:'Be a billionaire', done:false },
      { id:'l5', text:'Burn Industry as strong as the Canadian independents', done:false },
      { id:'l6', text:'Revered for business and music — invited to speak at conferences', done:false },
    ]
  },
  {
    key: 'music',
    label: 'MUSIC',
    color: C.red,
    desc: 'Craft. Output. Platform. Influence.',
    goals: [
      { id:'m1', text:'Write at least one song a week', done:false },
      { id:'m2', text:'Release a solo album', done:false },
      { id:'m3', text:'Be a producer as successful as Taylor Swift\'s producer', done:false },
      { id:'m4', text:'The OBGMs huge', done:false },
      { id:'m5', text:'10 million followers on all platforms', done:false },
      { id:'m6', text:'Get paid for my influence', done:false },
    ]
  },
  {
    key: 'family',
    label: 'FAMILY',
    color: C.blue,
    desc: 'The people who matter most.',
    goals: [
      { id:'f1', text:'Get married', done:false },
      { id:'f2', text:'Have a honeymoon', done:false },
      { id:'f3', text:'Have a kid', done:false },
      { id:'f4', text:'Wife and kid never have to work', done:false },
    ]
  },
  {
    key: 'body',
    label: 'BODY',
    color: C.orange,
    desc: 'Health. Strength. Adonis physique.',
    goals: [
      { id:'b1', text:'Be healthy', done:false },
      { id:'b2', text:'Look like Adonis Creed', done:false },
    ]
  },
  {
    key: 'mind',
    label: 'MIND',
    color: C.purple,
    desc: 'Knowledge. Credentials. Language.',
    goals: [
      { id:'n1', text:'Get my university degree', done:false },
      { id:'n2', text:'Become a doctor', done:false },
      { id:'n3', text:'Learn Japanese, Mandarin, French, and Spanish', done:false },
    ]
  },
];

type GoalRecord = {
  id: string;
  user_id: string;
  title: string;
  type: 'number' | 'deadline';
  current: number;
  target: number;
  unit: string;
  deadline: string | null;
  color: string;
  milestones: any[];
  bucket: string;
  created_at: string;
};

function sfxCheck(){try{const a=new(window.AudioContext||(window as any).webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=880;g.gain.setValueAtTime(0.13,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.09);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.09);}catch(e){}}
function sfxTap(){try{const a=new(window.AudioContext||(window as any).webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=660;g.gain.setValueAtTime(0.12,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.06);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.06);}catch(e){}}
function sfxKO(){try{[523,659,784,1046].forEach((f,i)=>setTimeout(()=>{const a=new(window.AudioContext||(window as any).webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.14,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.16);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.16);},i*90));}catch(e){}}

export default function GoalsRoom({ userId: userIdProp }: { userId: string | null }) {
  const [uid, setUid] = useState<string|null>(userIdProp);
  const [dbGoals, setDbGoals] = useState<GoalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBucket, setExpandedBucket] = useState<string|null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string|null>(null);
  const [followersNow, setFollowersNow] = useState(16500);
  const [editingFollowers, setEditingFollowers] = useState(false);
  const [followersEditVal, setFollowersEditVal] = useState('');
  const [bucketDone, setBucketDone] = useState<Record<string, Record<string,boolean>>>({});

  // Add goal form state
  const [adding, setAdding] = useState<string|null>(null); // bucket key
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<'number'|'deadline'>('number');
  const [addCurrent, setAddCurrent] = useState('');
  const [addTarget, setAddTarget] = useState('');
  const [addUnit, setAddUnit] = useState('');
  const [addDeadline, setAddDeadline] = useState('');

  // Edit progress
  const [editingGoal, setEditingGoal] = useState<string|null>(null);
  const [editVal, setEditVal] = useState('');

  // Milestone form
  const [msLabel, setMsLabel] = useState('');
  const [msValue, setMsValue] = useState('');

  const supabase = createClient();

  useEffect(()=>{
    async function init(){
      let id = userIdProp;
      if(!id){const{data:{user}}=await supabase.auth.getUser();id=user?.id||null;if(id)setUid(id);}
      if(!id){setLoading(false);return;}
      const[{data:prefData},{data:goalsData}]=await Promise.all([
        supabase.from('preferences').select('followers_now').eq('user_id',id).single(),
        supabase.from('goals').select('*').eq('user_id',id).order('created_at'),
      ]);
      if(prefData?.followers_now!=null) setFollowersNow(prefData.followers_now);
      if(goalsData) setDbGoals(goalsData.map((g:any)=>({...g,milestones:g.milestones||[]})));

      // Load bucket done state from preferences
      const{data:bucketPref}=await supabase.from('preferences').select('*').eq('user_id',id).single();
      if(bucketPref?.band_emails){
        try{const bd=JSON.parse(bucketPref.band_emails.includes('__BUCKET__')?bucketPref.band_emails.split('__BUCKET__')[1]:'{}');setBucketDone(bd);}catch{}
      }
      setLoading(false);
    }
    init();
  },[userIdProp]);

  async function saveFollowers(val:string){
    const n=parseInt(val.replace(/[^0-9]/g,''));
    if(isNaN(n)||!uid)return;
    sfxCheck();setFollowersNow(n);
    await supabase.from('preferences').update({followers_now:n}).eq('user_id',uid);
    setEditingFollowers(false);setFollowersEditVal('');
  }

  async function toggleBucketGoal(bucketKey:string, goalId:string){
    sfxCheck();
    const next={...bucketDone,[bucketKey]:{...(bucketDone[bucketKey]||{}),[goalId]:!(bucketDone[bucketKey]||{})[goalId]}};
    setBucketDone(next);
    if(uid){
      // Store in a simple way — we'll use a separate column eventually
      // For now store serialized in preferences as a JSON blob
      try{await supabase.from('preferences').update({band_emails:`denz@burnindustry.com, simonouthit@gmail.com__BUCKET__${JSON.stringify(next)}`}).eq('user_id',uid);}catch{}
    }
  }

  async function addDbGoal(bucketKey:string){
    if(!addTitle.trim()||!uid)return;
    sfxCheck();
    const entry={
      user_id:uid,title:addTitle.trim(),type:addType,
      current:parseFloat(addCurrent)||0,
      target:addType==='number'?(parseFloat(addTarget)||100):100,
      unit:addUnit.trim()||'',
      deadline:addType==='deadline'?addDeadline||null:null,
      color:BUCKETS.find(b=>b.key===bucketKey)?.color||C.gold,
      milestones:[],
      bucket:bucketKey,
    };
    const{data}=await supabase.from('goals').insert(entry).select().single();
    if(data) setDbGoals(g=>[...g,{...data,milestones:[]}]);
    setAdding(null);setAddTitle('');setAddCurrent('');setAddTarget('');setAddUnit('');setAddDeadline('');
  }

  async function updateProgress(id:string,val:string){
    const n=parseFloat(val);if(isNaN(n))return;sfxCheck();
    await supabase.from('goals').update({current:n}).eq('id',id);
    setDbGoals(g=>g.map(x=>x.id===id?{...x,current:n}:x));
    setEditingGoal(null);setEditVal('');
  }

  async function deleteDbGoal(id:string){
    await supabase.from('goals').delete().eq('id',id);
    setDbGoals(g=>g.filter(x=>x.id!==id));
  }

  async function addMilestone(goalId:string){
    if(!msLabel.trim()||!msValue)return;sfxTap();
    const goal=dbGoals.find(g=>g.id===goalId);if(!goal)return;
    const newMs={id:String(Date.now()),label:msLabel.trim(),value:parseFloat(msValue)||0,done:false};
    const updated=[...goal.milestones,newMs].sort((a:any,b:any)=>a.value-b.value);
    await supabase.from('goals').update({milestones:updated}).eq('id',goalId);
    setDbGoals(g=>g.map(x=>x.id===goalId?{...x,milestones:updated}:x));
    setMsLabel('');setMsValue('');
  }

  async function toggleMilestone(goalId:string,msId:string){
    sfxCheck();
    const goal=dbGoals.find(g=>g.id===goalId);if(!goal)return;
    const updated=goal.milestones.map((m:any)=>m.id===msId?{...m,done:!m.done}:m);
    await supabase.from('goals').update({milestones:updated}).eq('id',goalId);
    setDbGoals(g=>g.map(x=>x.id===goalId?{...x,milestones:updated}:x));
  }

  function getPct(goal:GoalRecord){
    if(goal.type==='deadline'&&goal.deadline){
      const created=new Date(goal.created_at).getTime(),end=new Date(goal.deadline).getTime(),now=Date.now();
      return Math.max(0,Math.min(100,Math.round(((now-created)/(end-created))*100)));
    }
    if(!goal.target)return 0;
    return Math.max(0,Math.min(100,Math.round((goal.current/goal.target)*100)));
  }

  function daysUntil(d:string){const t=new Date();t.setHours(0,0,0,0);const g=new Date(d);g.setHours(0,0,0,0);return Math.round((g.getTime()-t.getTime())/86400000);}

  const followerPct = Math.max((followersNow/FOLLOWER_GOAL)*100,2);

  return(
    <div>
      {/* ── BOSS FIGHT ── */}
      <div style={{...base,background:C.card,border:`1px solid ${C.border}`,borderLeft:`4px solid ${C.red}`,borderRadius:6,padding:18,marginBottom:24}}>
        <div style={{...mono,fontSize:9,letterSpacing:'0.3em',color:C.red,fontWeight:700,marginBottom:10}}>THE BOSS — 150K FOLLOWERS</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
          {!editingFollowers?(
            <span style={{...display,fontSize:36,color:C.gold}}>{followersNow.toLocaleString()}</span>
          ):(
            <input autoFocus value={followersEditVal} onChange={e=>setFollowersEditVal(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')saveFollowers(followersEditVal);if(e.key==='Escape'){setEditingFollowers(false);setFollowersEditVal('');}}}
              inputMode="numeric"
              style={{...mono,width:140,background:'#0a0a0a',border:`1px solid ${C.gold}`,borderRadius:4,padding:'8px 12px',fontSize:22,color:C.gold,outline:'none'}}/>
          )}
          <span style={{...mono,fontSize:13,color:C.muted}}>/ {FOLLOWER_GOAL.toLocaleString()}</span>
        </div>
        <div style={{background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:4,height:18,overflow:'hidden',marginBottom:10}}>
          <div style={{height:'100%',width:`${followerPct}%`,background:`linear-gradient(90deg,${C.red},${C.gold})`,transition:'width 0.4s'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{...mono,fontSize:12,color:C.muted}}>{Math.round(followerPct)}% — {(FOLLOWER_GOAL-followersNow).toLocaleString()} left</div>
          {!editingFollowers?(
            <button onClick={()=>{setEditingFollowers(true);setFollowersEditVal(String(followersNow));}}
              style={{...mono,background:'transparent',border:`1px solid ${C.border}`,borderRadius:4,color:C.muted,fontSize:9,letterSpacing:'0.15em',padding:'5px 12px',cursor:'pointer'}}>UPDATE</button>
          ):(
            <button onClick={()=>saveFollowers(followersEditVal)}
              style={{...mono,background:C.gold,border:'none',borderRadius:4,color:'#0D0D0D',fontSize:9,letterSpacing:'0.15em',fontWeight:700,padding:'5px 14px',cursor:'pointer'}}>SET</button>
          )}
        </div>
      </div>

      {/* ── BUCKETS ── */}
      <div style={{...mono,fontSize:9,letterSpacing:'0.3em',color:C.muted,fontWeight:700,marginBottom:14}}>MY GOALS</div>

      {BUCKETS.map(bucket=>{
        const isOpen = expandedBucket===bucket.key;
        const bucketGoals = bucket.goals;
        const doneCount = bucketGoals.filter(g=>(bucketDone[bucket.key]||{})[g.id]).length;
        const pct = Math.round((doneCount/bucketGoals.length)*100);
        const dbBucketGoals = dbGoals.filter(g=>g.bucket===bucket.key);
        const isAdding = adding===bucket.key;

        return(
          <div key={bucket.key} style={{...base,background:C.card,border:`1px solid ${isOpen?bucket.color:C.border}`,borderLeft:`4px solid ${bucket.color}`,borderRadius:6,marginBottom:10,overflow:'hidden'}}>
            {/* BUCKET HEADER */}
            <div onClick={()=>{sfxTap();setExpandedBucket(isOpen?null:bucket.key);}} style={{padding:'16px 18px',cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div>
                  <div style={{...display,fontSize:20,color:bucket.color,lineHeight:1}}>{bucket.label}</div>
                  <div style={{...mono,fontSize:11,color:C.muted,marginTop:4}}>{bucket.desc}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
                  <div style={{...mono,fontSize:13,color:bucket.color,fontWeight:700}}>{doneCount}/{bucketGoals.length}</div>
                  <span style={{...mono,fontSize:18,color:C.muted,display:'inline-block',transform:isOpen?'rotate(90deg)':'none',transition:'transform 0.2s'}}>›</span>
                </div>
              </div>
              <div style={{background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:4,height:10,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.max(pct,pct>0?3:0)}%`,background:pct===100?C.green:bucket.color,transition:'width 0.4s'}}/>
              </div>
            </div>

            {/* BUCKET EXPANDED */}
            {isOpen&&(
              <div style={{borderTop:`1px solid ${C.border}`,background:'#0d0d0d'}}>
                {/* STATIC GOALS */}
                {bucketGoals.map(goal=>{
                  const done=(bucketDone[bucket.key]||{})[goal.id];
                  return(
                    <div key={goal.id} onClick={()=>toggleBucketGoal(bucket.key,goal.id)}
                      style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderBottom:`1px solid ${C.border}`,cursor:'pointer',opacity:done?0.45:1}}>
                      <div style={{width:24,height:24,borderRadius:'50%',border:`2px solid ${done?C.green:bucket.color}`,background:done?C.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {done&&<span style={{fontSize:11,color:'#0D0D0D',fontWeight:900}}>✓</span>}
                      </div>
                      <span style={{...mono,fontSize:13,color:done?C.muted:C.text,textDecoration:done?'line-through':'none',lineHeight:1.4,flex:1}}>{goal.text}</span>
                    </div>
                  );
                })}

                {/* TRACKED GOALS (with progress bars) */}
                {dbBucketGoals.length>0&&(
                  <div style={{padding:'14px 18px 0'}}>
                    <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:C.muted,fontWeight:700,marginBottom:10}}>TRACKED GOALS</div>
                    {dbBucketGoals.map(goal=>{
                      const pct=getPct(goal);
                      const isExpanded=expandedGoal===goal.id;
                      const isEditing=editingGoal===goal.id;
                      const d=goal.deadline?daysUntil(goal.deadline):null;
                      return(
                        <div key={goal.id} style={{background:C.card,border:`1px solid ${isExpanded?goal.color:C.border}`,borderRadius:5,marginBottom:10,overflow:'hidden'}}>
                          <div onClick={()=>{sfxTap();setExpandedGoal(isExpanded?null:goal.id);}} style={{padding:'12px 14px',cursor:'pointer'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                              <div style={{...mono,fontSize:13,color:C.text,fontWeight:700,flex:1,lineHeight:1.3}}>{goal.title}</div>
                              <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                                <span style={{...mono,fontSize:12,color:goal.color,fontWeight:700}}>{pct}%</span>
                                <span style={{...mono,fontSize:16,color:C.muted,display:'inline-block',transform:isExpanded?'rotate(90deg)':'none',transition:'transform 0.2s'}}>›</span>
                              </div>
                            </div>
                            <div style={{background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,height:10,overflow:'hidden',marginBottom:6}}>
                              <div style={{height:'100%',width:`${pct}%`,background:pct>=100?C.green:goal.color,transition:'width 0.4s'}}/>
                            </div>
                            <div style={{...mono,fontSize:11,color:C.muted}}>
                              {goal.type==='number'
                                ?`${goal.current.toLocaleString()}${goal.unit?' '+goal.unit:''} of ${goal.target.toLocaleString()}${goal.unit?' '+goal.unit:''}`
                                :(d===null?'No deadline':d<0?`Passed ${Math.abs(d)}d ago`:d===0?'TODAY':`${d} days left`)}
                              {goal.milestones.length>0&&<span style={{marginLeft:8}}>· {goal.milestones.filter((m:any)=>m.done).length}/{goal.milestones.length} steps</span>}
                            </div>
                          </div>
                          {isExpanded&&(
                            <div style={{padding:'0 14px 14px',borderTop:`1px solid ${C.border}`}}>
                              {goal.type==='number'&&(
                                <div style={{margin:'12px 0'}}>
                                  {!isEditing?(
                                    <button onClick={e=>{e.stopPropagation();setEditingGoal(goal.id);setEditVal(String(goal.current));}}
                                      style={{...mono,width:'100%',background:'transparent',border:`1px solid ${goal.color}`,borderRadius:4,color:goal.color,fontSize:11,letterSpacing:'0.1em',fontWeight:700,padding:'10px',cursor:'pointer'}}>UPDATE PROGRESS</button>
                                  ):(
                                    <div style={{display:'flex',gap:8}} onClick={e=>e.stopPropagation()}>
                                      <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                                        onKeyDown={e=>{if(e.key==='Enter')updateProgress(goal.id,editVal);if(e.key==='Escape'){setEditingGoal(null);setEditVal('');}}}
                                        inputMode="decimal"
                                        style={{...mono,flex:1,background:'#0a0a0a',border:`1px solid ${goal.color}`,borderRadius:4,padding:'10px 12px',fontSize:14,color:goal.color,outline:'none'}}/>
                                      <button onClick={()=>updateProgress(goal.id,editVal)}
                                        style={{...mono,background:goal.color,border:'none',borderRadius:4,padding:'10px 16px',fontSize:11,fontWeight:700,color:'#0D0D0D',cursor:'pointer'}}>SET</button>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:C.muted,fontWeight:700,margin:'14px 0 10px'}}>WORK-BACK PLAN</div>
                              {goal.milestones.length===0&&<div style={{...mono,fontSize:11,color:C.muted,fontStyle:'italic',marginBottom:12}}>Add checkpoints to break this down into steps.</div>}
                              {goal.milestones.map((m:any)=>(
                                <div key={m.id} onClick={e=>{e.stopPropagation();toggleMilestone(goal.id,m.id);}}
                                  style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${C.border}`,cursor:'pointer'}}>
                                  <div style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${m.done?C.green:C.muted}`,background:m.done?C.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    {m.done&&<span style={{fontSize:10,color:'#0D0D0D',fontWeight:900}}>✓</span>}
                                  </div>
                                  <span style={{...mono,fontSize:12,color:m.done?C.muted:C.text,textDecoration:m.done?'line-through':'none',flex:1}}>{m.label}</span>
                                  <span style={{...mono,fontSize:11,color:C.muted}}>{m.value.toLocaleString()}{goal.unit?' '+goal.unit:''}</span>
                                  <button onClick={e=>{e.stopPropagation();const updated=goal.milestones.filter((x:any)=>x.id!==m.id);supabase.from('goals').update({milestones:updated}).eq('id',goal.id);setDbGoals(g=>g.map(x=>x.id===goal.id?{...x,milestones:updated}:x));}}
                                    style={{...mono,background:'transparent',border:'none',color:C.dim,fontSize:16,cursor:'pointer',padding:0}}>×</button>
                                </div>
                              ))}
                              <div style={{display:'flex',gap:8,marginTop:12}} onClick={e=>e.stopPropagation()}>
                                <input value={msLabel} onChange={e=>setMsLabel(e.target.value)} placeholder="Checkpoint"
                                  style={{...mono,flex:2,background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:4,padding:'8px 10px',fontSize:11,color:C.text,outline:'none'}}/>
                                <input value={msValue} onChange={e=>setMsValue(e.target.value)} placeholder="Value" inputMode="decimal"
                                  style={{...mono,flex:1,background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:4,padding:'8px 10px',fontSize:11,color:C.text,outline:'none'}}/>
                                <button onClick={()=>addMilestone(goal.id)}
                                  style={{...mono,background:goal.color,border:'none',borderRadius:4,padding:'8px 14px',fontSize:13,fontWeight:700,color:'#0D0D0D',cursor:'pointer'}}>+</button>
                              </div>
                              <button onClick={e=>{e.stopPropagation();deleteDbGoal(goal.id);}}
                                style={{...mono,background:'transparent',border:'none',color:C.muted,fontSize:10,cursor:'pointer',marginTop:16,padding:0,textDecoration:'underline'}}>Delete goal</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ADD TRACKED GOAL */}
                <div style={{padding:'14px 18px'}}>
                  {!isAdding?(
                    <button onClick={()=>{sfxTap();setAdding(bucket.key);}}
                      style={{...mono,width:'100%',background:'transparent',border:`1px dashed ${bucket.color}44`,borderRadius:4,color:bucket.color,fontSize:10,letterSpacing:'0.15em',fontWeight:700,padding:'10px',cursor:'pointer'}}>
                      + ADD TRACKED GOAL TO {bucket.label}
                    </button>
                  ):(
                    <div style={{background:C.card,border:`1px solid ${bucket.color}`,borderRadius:5,padding:14}}>
                      <div style={{...mono,fontSize:11,color:bucket.color,fontWeight:700,letterSpacing:'0.15em',marginBottom:12}}>NEW TRACKED GOAL</div>
                      <input value={addTitle} onChange={e=>setAddTitle(e.target.value)} placeholder="Goal title"
                        style={{...mono,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:4,padding:'10px 12px',fontSize:13,color:C.text,outline:'none',marginBottom:10}}/>
                      <div style={{display:'flex',gap:6,marginBottom:10}}>
                        {[['number','NUMBER'],['deadline','DEADLINE']].map(([k,l])=>(
                          <button key={k} onClick={()=>setAddType(k as any)}
                            style={{...mono,flex:1,padding:'8px',borderRadius:4,border:`1px solid ${addType===k?bucket.color:C.border}`,background:addType===k?bucket.color:'transparent',color:addType===k?'#0D0D0D':C.muted,fontSize:10,fontWeight:700,cursor:'pointer'}}>{l}</button>
                        ))}
                      </div>
                      {addType==='number'&&(
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
                          {[['NOW',addCurrent,setAddCurrent,'0'],['TARGET',addTarget,setAddTarget,'100'],['UNIT',addUnit,setAddUnit,'e.g. songs']].map(([l,v,fn,ph])=>(
                            <div key={String(l)}>
                              <div style={{...mono,fontSize:9,color:C.muted,marginBottom:4,fontWeight:700}}>{String(l)}</div>
                              <input value={String(v)} onChange={e=>(fn as any)(e.target.value)} placeholder={String(ph)}
                                style={{...mono,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:4,padding:'8px 10px',fontSize:12,color:C.text,outline:'none'}}/>
                            </div>
                          ))}
                        </div>
                      )}
                      {addType==='deadline'&&(
                        <input type="date" value={addDeadline} onChange={e=>setAddDeadline(e.target.value)}
                          style={{...mono,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:4,padding:'8px 10px',fontSize:12,color:C.text,outline:'none',marginBottom:10}}/>
                      )}
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>addDbGoal(bucket.key)}
                          style={{...mono,flex:1,background:bucket.color,border:'none',borderRadius:4,padding:'10px',fontSize:11,fontWeight:700,color:'#0D0D0D',cursor:'pointer'}}>ADD GOAL</button>
                        <button onClick={()=>setAdding(null)}
                          style={{...mono,background:'transparent',border:`1px solid ${C.border}`,borderRadius:4,padding:'10px 14px',fontSize:11,color:C.muted,cursor:'pointer'}}>CANCEL</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
