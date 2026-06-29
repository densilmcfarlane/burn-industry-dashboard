'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppData } from '@/lib/useAppData';
import MoneyRoom from './MoneyRoom';

// ── constants ──────────────────────────────────────────────
const C = { bg:'#0D0D0D', card:'#111', border:'#1e1e1e', gold:'#FFD60A', orange:'#ff6b35', red:'#D91F26', blue:'#7eb8f7', text:'#F2F2F2', muted:'#666', dim:'#2a2a2a' };
const display = { fontFamily:"'Anton',sans-serif", letterSpacing:'0.02em', textTransform:'uppercase' as const };
const pixel   = { fontFamily:"'Press Start 2P',monospace" };
const mono    = { fontFamily:"'Space Mono',monospace" };
const base    = { fontFamily:"'Space Mono',monospace", boxSizing:'border-box' as const };
const card    = { ...base, background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:16, marginBottom:10 };
const lbl     = { fontSize:9, letterSpacing:'0.35em', color:C.muted, marginBottom:6, textTransform:'uppercase' as const, ...mono };

const ENERGY_TARGET = 10;
const FOLLOWER_GOAL = 150000;
const FOLLOWERS_NOW = 16500;

const MORNING_STEPS = [
  { id:'m1', time:'10 min', title:'No phone',            desc:'Shower. Coffee. Window. Let your nervous system wake up before the world hits it.' },
  { id:'m2', time:'5 min',  title:'Box breathing',       desc:'Inhale 4. Hold 4. Exhale 4. Hold 4. Repeat. This is medicine — treat it like your Vyvanse.' },
  { id:'m3', time:'5 min',  title:'One honest sentence', desc:'How are you actually feeling right now. Nobody sees it. Gets it out of your head.', journal:'honest' },
  { id:'m4', time:'10 min', title:'Move your body',      desc:'10 pushups. Walk around the van. Parking lot. Anything. Just move.' },
  { id:'m5', time:'5 min',  title:'One real good thing', desc:'Something specific and true about today. Not generic. Something real.', journal:'good' },
];
const NIGHT_STEPS = [
  { id:'n1', title:'Eat a real meal',        desc:'Before anything else. Protein. This is the most important meal of your day.' },
  { id:'n2', title:'Facial routine',         desc:"You're already doing this. Keep it. It's grounding." },
  { id:'n4', title:'Phone across the room',  desc:'Not face down beside you. Across the room. Make reaching for it an act.' },
  { id:'n5', title:'One sentence written',   desc:"Whatever is loudest in your head. Externalize it.", journal:'night' },
  { id:'n6', title:'Box breathing',          desc:'Same as morning. 5 minutes. Then sleep.' },
];
const CRISIS_STEPS = [
  { id:'c1', title:"Don't reach for the phone first", desc:"It's across the room. That distance is intentional." },
  { id:'c2', title:'Box breathing first',              desc:'5 minutes before anything else.' },
  { id:'c3', title:'Write one sentence',               desc:"Whatever is loudest. Get it out of your head." },
  { id:'c4', title:'If ideations come',                desc:'Text 988. Both are here.', crisis:true },
];
const VISION = [
  { year:'NOW → 18 MONTHS', color:'#ffd732', items:['Sell out every show','100K across TikTok / IG / YouTube','Record written and made','Mando sync conversation started','Team becomes affordable'] },
  { year:'YEAR 3',          color:'#ff6b35', items:['Larger than Turnstile','Large theatre touring internationally','Big features + major syncs','Record out and working','Burn Industry label seeded with 5 artists'] },
  { year:'YEAR 5',          color:'#e8192c', items:['18,000 capacity at home','Coachella top liner','Solo film released','Music/creative agency running','Multi-millionaire'] },
];
const ROOMS = [
  { key:'today',    label:"LET'S WORK",        sub:'Master list · battles · energy', color:C.gold },
  { key:'routines', label:'ROUTINES',          sub:'Morning · Night · 2AM',          color:C.blue },
  { key:'journal',  label:'JOURNAL',           sub:'Your sentences, by day',          color:C.text },
  { key:'goals',    label:'GOALS',             sub:'The boss — 150K',                 color:C.red  },
  { key:'money',    label:'MONEY',             sub:'Income · debt · allocate',        color:C.gold },
];

// ── audio ──────────────────────────────────────────────────
let _ac: AudioContext|null = null;
function ac() { if(!_ac){try{_ac=new(window.AudioContext||(window as any).webkitAudioContext)();}catch{return null;}} if(_ac.state==='suspended')_ac.resume(); return _ac; }
function blip(freq=440,dur=0.08,type='square' as OscillatorType,vol=0.15){const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur);}
function sfxTap()   {blip(660,0.06,'square',0.12);}
function sfxCheck() {blip(880,0.07,'square',0.13);setTimeout(()=>blip(1320,0.09,'square',0.12),60);}
function sfxOpen()  {blip(330,0.05,'sawtooth',0.10);setTimeout(()=>blip(495,0.06,'sawtooth',0.10),50);}
function sfxWarCry(){const c=ac();if(!c)return;[110,146,196,261].forEach((f,i)=>setTimeout(()=>blip(f,0.18,'sawtooth',0.16),i*70));setTimeout(()=>blip(523,0.5,'square',0.14),320);}
function sfxKO()    {[523,659,784,1046].forEach((f,i)=>setTimeout(()=>blip(f,0.16,'square',0.16),i*90));}
let _musicTimer: ReturnType<typeof setInterval>|null = null;
const seq = [196,0,261,0,294,0,261,0,196,0,174,0,196,0,0,0];
let seqI = 0;
function startMusic(){if(_musicTimer)return;_musicTimer=setInterval(()=>{const f=seq[seqI%seq.length];if(f)blip(f,0.12,'triangle',0.06);seqI++;},180);}
function stopMusic() {if(_musicTimer){clearInterval(_musicTimer);_musicTimer=null;}}

function formatDate(str: string){const[,m,d]=str.split('-');const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return `${months[parseInt(m)-1]} ${parseInt(d)}`;}

// ── main component ─────────────────────────────────────────
export default function Dashboard() {
  const db = useAppData();
  const [screen, setScreen] = useState<'cold'|'hub'|'room'>('cold');
  const [room, setRoom]     = useState('today');
  const [drawer, setDrawer] = useState(false);
  const [shake, setShake]   = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [crisisDone, setCrisisDone] = useState<Record<string,boolean>>({});
  const [newTask, setNewTask]       = useState('');
  const [newEnergy, setNewEnergy]   = useState(2);
  const [newPriority, setNewPriority] = useState(2);
  const [unpText, setUnpText]       = useState('');
  const [unpEnergy, setUnpEnergy]   = useState(1);

  const snd = (fn: ()=>void) => { if(db.prefs.sound) fn(); };

  // music
  useEffect(()=>{ if(db.prefs.music && screen!=='cold') startMusic(); else stopMusic(); return ()=>stopMusic(); },[db.prefs.music, screen]);

  // KO + streak
  const masterSorted = [...db.tasks].sort((a,b)=>(b.priority-a.priority)||(a.created_at<b.created_at?-1:1));
  const slotIds = (db.dailyState.battle_slots||[null,null,null]).filter(Boolean);
  const donIds  = Object.keys(db.dailyState.battle_done||{}).filter(k=>(db.dailyState.battle_done||{})[k]);
  const available = masterSorted.filter(t=>!slotIds.includes(t.id)&&!donIds.includes(t.id));
  let fi=0;
  const filledSlots = (db.dailyState.battle_slots||[null,null,null]).map((id:string|null)=>{
    if(id && db.tasks.find(t=>t.id===id)) return id;
    const n=available[fi++]; return n?n.id:null;
  });
  const battleTasks = filledSlots.map((id:string|null)=>db.tasks.find(t=>t.id===id)||null);
  const battleEnergy   = db.tasks.filter(t=>(db.dailyState.battle_done||{})[t.id]).reduce((a:number,t:any)=>a+(t.energy||0),0);
  const unplannedEnergy= (db.dailyState.unplanned||[]).reduce((a:number,u:any)=>a+(u.energy||0),0);
  const energyBanked   = battleEnergy + unplannedEnergy;
  const energyPct      = Math.min(100,(energyBanked/ENERGY_TARGET)*100);
  const dayComplete    = energyBanked >= ENERGY_TARGET;

  useEffect(()=>{
    if(dayComplete && !(db.dailyState.ko_shown) && db.loaded){
      db.saveDailyState({...db.dailyState, ko_shown:true});
      snd(sfxKO);
      const today = db.today;
      if(db.streak.last_day!==today){
        db.saveStreak(db.streak.count+1, today);
      }
    }
  },[dayComplete, db.dailyState.ko_shown, db.loaded]);

  const morningCount = Object.values(db.dailyState.morning_done||{}).filter(Boolean).length;
  const nightCount   = Object.values(db.dailyState.night_done||{}).filter(Boolean).length;

  const btnFull = (c:string) => ({...base,padding:'10px 18px',background:c,border:`1px solid ${c}`,color:'#0D0D0D',fontSize:10,letterSpacing:'0.25em',fontWeight:700,cursor:'pointer',borderRadius:3});
  const btnOut  = (c:string) => ({...base,padding:'10px 18px',background:'transparent',border:`1px solid ${c}`,color:c,fontSize:10,letterSpacing:'0.25em',fontWeight:700,cursor:'pointer',borderRadius:3});
  const chk     = (done:boolean,color:string)=>({width:28,height:28,borderRadius:'50%',border:`2px solid ${done?color:C.dim}`,background:done?color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all 0.2s'});

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  // ── COLD ──
  if(screen==='cold') return (
    <div onClick={()=>{snd(sfxWarCry);setShake(true);setTimeout(()=>setShake(false),420);setTimeout(()=>setScreen('hub'),260);}}
      style={{minHeight:'100vh',background:C.bg,color:C.text,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:24,textAlign:'center',...base,animation:shake?'biShake 0.4s':'none'}}>
      <div style={{...mono,fontSize:10,letterSpacing:'0.45em',color:C.muted,marginBottom:24}}>BURN INDUSTRY / THE OBGMS</div>
      <div style={{...display,fontSize:'clamp(44px,13vw,92px)',lineHeight:0.92}}>LET'S</div>
      <div style={{...display,fontSize:'clamp(44px,13vw,92px)',lineHeight:0.92,color:C.red}}>FUCKING</div>
      <div style={{...display,fontSize:'clamp(44px,13vw,92px)',lineHeight:0.92,color:C.gold}}>GO</div>
      <div style={{...mono,fontSize:12,color:C.muted,maxWidth:300,marginTop:28,lineHeight:1.7}}>16,500 today. 150,000 by year end. Every show sold out. You drive the ship.</div>
      <div style={{...pixel,fontSize:9,color:C.gold,marginTop:36,animation:'biBlink 1.2s steps(1) infinite'}}>TAP TO ENTER</div>
    </div>
  );

  // ── HUB ──
  if(screen==='hub') return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,padding:'28px 20px 60px',...base}}>
      <div style={{...mono,fontSize:9,letterSpacing:'0.45em',color:C.muted,marginBottom:8}}>BURN INDUSTRY / THE OBGMS</div>
      <div style={{...display,fontSize:'clamp(34px,9vw,56px)',lineHeight:0.95,marginBottom:6}}>CHOOSE YOUR<br/><span style={{color:C.red}}>BATTLE</span></div>
      <div style={{...mono,fontSize:11,color:C.muted,marginBottom:24}}>
        {db.streak.count>0?`${db.streak.count} day streak · `:''}Cross-device sync active
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10}}>
        {ROOMS.map(r=>(
          <button key={r.key} onClick={()=>{snd(sfxOpen);setRoom(r.key);setScreen('room');}}
            style={{...base,textAlign:'left',background:C.card,border:`1px solid ${C.border}`,borderLeft:`4px solid ${r.color}`,borderRadius:6,padding:'18px 18px',cursor:'pointer',color:C.text,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{...display,fontSize:22,color:r.color,lineHeight:1}}>{r.label}</div>
              <div style={{...mono,fontSize:11,color:C.muted,marginTop:5}}>{r.sub}</div>
            </div>
            <span style={{...display,fontSize:24,color:C.dim}}>→</span>
          </button>
        ))}
      </div>
      <button onClick={signOut} style={{...mono,marginTop:24,background:'transparent',border:'none',color:C.dim,fontSize:10,cursor:'pointer',letterSpacing:'0.2em'}}>SIGN OUT</button>
    </div>
  );

  // ── ROOM SHELL ──
  const activeRoom = ROOMS.find(r=>r.key===room)||ROOMS[0];
  return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,paddingBottom:80,...base}}>
      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px 18px',borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,background:C.bg,zIndex:40}}>
        <button onClick={()=>{snd(sfxTap);setDrawer(true);}} style={{...base,background:'transparent',border:'none',color:C.text,fontSize:22,cursor:'pointer',lineHeight:1,padding:0}}>≡</button>
        <div style={{...display,fontSize:20,color:activeRoom.color,lineHeight:1}}>{activeRoom.label}</div>
        <button onClick={()=>{snd(sfxTap);setScreen('hub');}} style={{...mono,marginLeft:'auto',background:'transparent',border:`1px solid ${C.border}`,color:C.muted,fontSize:9,letterSpacing:'0.2em',padding:'6px 10px',borderRadius:3,cursor:'pointer'}}>HUB</button>
      </div>

      {/* DRAWER */}
      {drawer && (
        <div onClick={()=>setDrawer(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:60}}>
          <div onClick={e=>e.stopPropagation()} style={{position:'absolute',left:0,top:0,bottom:0,width:268,maxWidth:'82vw',background:C.card,borderRight:`1px solid ${C.border}`,padding:'24px 18px',animation:'biSlideIn 0.22s ease-out',overflowY:'auto'}}>
            <div style={{...mono,fontSize:9,letterSpacing:'0.4em',color:C.muted,marginBottom:18}}>JUMP TO</div>
            {ROOMS.map(r=>(
              <button key={r.key} onClick={()=>{snd(sfxOpen);setRoom(r.key);setScreen('room');setDrawer(false);}}
                style={{...base,display:'block',width:'100%',textAlign:'left',background:room===r.key?'#0a0a0a':'transparent',border:`1px solid ${room===r.key?r.color:C.border}`,borderRadius:5,padding:'12px 14px',marginBottom:8,cursor:'pointer'}}>
                <div style={{...display,fontSize:16,color:r.color}}>{r.label}</div>
                <div style={{...mono,fontSize:10,color:C.muted,marginTop:2}}>{r.sub}</div>
              </button>
            ))}
            <div style={{borderTop:`1px solid ${C.border}`,margin:'18px 0 14px'}}/>
            {[['SOUND',db.prefs.sound,()=>db.savePrefs({sound:!db.prefs.sound})],['MUSIC',db.prefs.music,()=>db.savePrefs({music:!db.prefs.music})]].map(([l,on,fn])=>(
              <div key={String(l)} onClick={fn as any} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',cursor:'pointer'}}>
                <span style={{...mono,fontSize:12,color:C.text}}>{String(l)}</span>
                <span style={{...mono,fontSize:10,letterSpacing:'0.2em',color:on?C.gold:C.muted,border:`1px solid ${on?C.gold:C.border}`,borderRadius:3,padding:'3px 10px'}}>{on?'ON':'OFF'}</span>
              </div>
            ))}
            <button onClick={signOut} style={{...mono,marginTop:16,background:'transparent',border:'none',color:C.dim,fontSize:10,cursor:'pointer',letterSpacing:'0.2em',padding:0}}>SIGN OUT</button>
          </div>
        </div>
      )}

      <div style={{padding:'20px 20px 0',opacity:db.loaded?1:0,transition:'opacity 0.4s'}}>

        {/* TODAY */}
        {room==='today' && <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:18}}>
            <div style={{...display,fontSize:36}}>{db.today}</div>
            <div style={{...mono,fontSize:11,color:C.muted}}>{db.streak.count>0?`${db.streak.count}d streak`:''}</div>
          </div>

          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {[{label:'MORNING',count:morningCount,total:MORNING_STEPS.length,color:C.gold},{label:'ENERGY',count:energyBanked,total:ENERGY_TARGET,color:C.orange},{label:'NIGHT',count:nightCount,total:NIGHT_STEPS.length,color:C.blue}].map(b=>(
              <div key={b.label} style={{flex:1,background:C.card,border:`1px solid ${b.count>=b.total&&b.total>0?b.color:C.border}`,borderRadius:3,padding:'8px 10px'}}>
                <div style={{...lbl,marginBottom:3}}>{b.label}</div>
                <div style={{...display,fontSize:18,color:b.count>=b.total&&b.total>0?b.color:C.text}}>{b.count}/{b.total}</div>
              </div>
            ))}
          </div>

          <div style={{...card}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
              <div style={{...lbl,color:dayComplete?C.gold:C.muted}}>DAILY ENERGY</div>
              <div style={{...mono,fontSize:11,color:C.muted}}>{energyBanked}/{ENERGY_TARGET} pts</div>
            </div>
            <div style={{background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,height:16,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${energyPct}%`,background:dayComplete?C.gold:`linear-gradient(90deg,${C.red},${C.gold})`,transition:'width 0.4s'}}/>
            </div>
          </div>

          {db.dailyState.ko_shown && (
            <div style={{...card,borderColor:C.gold,textAlign:'center',background:'#14110a'}}>
              <div style={{...pixel,fontSize:16,color:C.gold}}>DAY KILLED</div>
              <div style={{...mono,fontSize:11,color:C.muted,marginTop:8}}>{db.streak.count} day streak. Rest up.</div>
            </div>
          )}

          {/* BATTLES */}
          <div style={{...card,borderLeft:`3px solid ${C.orange}`}}>
            <div style={{...lbl,color:C.orange}}>TODAY'S BATTLES</div>
            <div style={{...mono,fontSize:11,color:C.muted,lineHeight:1.6}}>Top 3 by priority. Tap circle to complete.</div>
          </div>
          {battleTasks.map((task:any,i:number)=>task?(
            <div key={task.id} style={{...card}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start',flex:1}}>
                  <div style={chk(false,C.orange)} onClick={()=>{snd(sfxCheck);const bd={...db.dailyState.battle_done,[task.id]:true};const bs=db.dailyState.battle_slots.map((x:string|null)=>x===task.id?null:x);db.saveDailyState({...db.dailyState,battle_done:bd,battle_slots:bs});}}/>
                  <div>
                    <div style={{...mono,fontSize:14,color:C.text,lineHeight:1.5}}>{task.text}</div>
                    <div style={{...mono,fontSize:10,color:C.muted,marginTop:5}}>{'★'.repeat(task.priority)} · {task.energy} pts</div>
                  </div>
                </div>
                <button onClick={()=>{snd(sfxTap);const bs=db.dailyState.battle_slots.map((x:string|null)=>x===task.id?null:x);db.saveDailyState({...db.dailyState,battle_slots:bs});}} style={{...mono,background:'transparent',border:`1px solid ${C.border}`,borderRadius:3,color:C.muted,fontSize:9,padding:'5px 8px',cursor:'pointer'}}>SWAP ↩</button>
              </div>
            </div>
          ):(
            <div key={'e'+i} style={{...card,border:`1px dashed ${C.border}`,textAlign:'center'}}>
              <div style={{...mono,fontSize:11,color:C.dim}}>Empty — add tasks below</div>
            </div>
          ))}

          {/* LOG UNPLANNED */}
          <div style={{...card,borderLeft:`3px solid ${C.red}`,marginTop:24}}>
            <div style={{...lbl,color:C.red}}>LOG UNPLANNED WORK</div>
            <input value={unpText} onChange={e=>setUnpText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&unpText.trim()){snd(sfxCheck);const u=[...db.dailyState.unplanned,{text:unpText.trim(),energy:unpEnergy,t:Date.now()}];db.saveDailyState({...db.dailyState,unplanned:u});setUnpText('');setUnpEnergy(1);}}} placeholder="What came up?"
              style={{...mono,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'9px 11px',fontSize:13,color:C.text,outline:'none',marginBottom:10,marginTop:10}}/>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{display:'flex',gap:5}}>
                {[1,2,3].map(n=><button key={n} onClick={()=>setUnpEnergy(n)} style={{...mono,width:32,height:32,borderRadius:3,border:`1px solid ${unpEnergy===n?C.red:C.border}`,background:unpEnergy===n?C.red:'transparent',color:unpEnergy===n?'#fff':C.muted,fontSize:13,fontWeight:700,cursor:'pointer'}}>{n}</button>)}
              </div>
              <button onClick={()=>{if(!unpText.trim())return;snd(sfxCheck);const u=[...db.dailyState.unplanned,{text:unpText.trim(),energy:unpEnergy,t:Date.now()}];db.saveDailyState({...db.dailyState,unplanned:u});setUnpText('');setUnpEnergy(1);}} style={{...btnFull(C.red),flex:1,color:'#fff'}}>LOG — BANK {unpEnergy} PT{unpEnergy>1?'S':''}</button>
            </div>
          </div>

          {/* MASTER LIST */}
          <div style={{...card,borderLeft:`3px solid ${C.gold}`,marginTop:24}}>
            <div style={{...lbl,color:C.gold}}>MASTER LIST</div>
            <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')db.addTask(newTask.trim(),newEnergy,newPriority).then(()=>{setNewTask('');setNewEnergy(2);setNewPriority(2);});}} placeholder="Add a task…"
              style={{...mono,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'9px 11px',fontSize:13,color:C.text,outline:'none',marginBottom:10,marginTop:10}}/>
            <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' as const}}>
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                <span style={{...mono,fontSize:9,color:C.muted}}>PRI</span>
                {[1,2,3].map(n=><button key={n} onClick={()=>setNewPriority(n)} style={{...mono,width:30,height:30,borderRadius:3,border:`1px solid ${newPriority===n?C.gold:C.border}`,background:newPriority===n?C.gold:'transparent',color:newPriority===n?'#0D0D0D':C.muted,fontSize:12,fontWeight:700,cursor:'pointer'}}>{'★'.repeat(n)}</button>)}
              </div>
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                <span style={{...mono,fontSize:9,color:C.muted}}>NRG</span>
                {[1,2,3].map(n=><button key={n} onClick={()=>setNewEnergy(n)} style={{...mono,width:30,height:30,borderRadius:3,border:`1px solid ${newEnergy===n?C.orange:C.border}`,background:newEnergy===n?C.orange:'transparent',color:newEnergy===n?'#0D0D0D':C.muted,fontSize:12,fontWeight:700,cursor:'pointer'}}>{n}</button>)}
              </div>
              <button onClick={()=>{if(!newTask.trim())return;snd(sfxTap);db.addTask(newTask.trim(),newEnergy,newPriority).then(()=>{setNewTask('');setNewEnergy(2);setNewPriority(2);});}} style={{...btnFull(C.gold),flex:1,minWidth:60}}>ADD</button>
            </div>
          </div>

          {masterSorted.filter((t:any)=>!db.dailyState.battle_done?.[t.id]).map((task:any)=>{
            const inBattle=filledSlots.includes(task.id);
            return(
              <div key={task.id} style={{...card,opacity:inBattle?0.55:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
                  <div style={{display:'flex',gap:11,alignItems:'flex-start',flex:1}}>
                    <div style={chk(false,C.gold)} onClick={()=>{const bd={...db.dailyState.battle_done,[task.id]:true};const bs=db.dailyState.battle_slots.map((x:string|null)=>x===task.id?null:x);db.saveDailyState({...db.dailyState,battle_done:bd,battle_slots:bs});snd(sfxCheck);}}/>
                    <div style={{flex:1}}>
                      <div style={{...mono,fontSize:13,color:C.text,lineHeight:1.5}}>{task.text}</div>
                      <div style={{display:'flex',gap:6,alignItems:'center',marginTop:7}}>
                        {[1,2,3].map(n=><button key={n} onClick={()=>db.updateTask(task.id,{priority:n})} style={{...mono,fontSize:11,color:task.priority>=n?C.gold:C.dim,background:'transparent',border:'none',cursor:'pointer',padding:0}}>★</button>)}
                        <span style={{...mono,fontSize:10,color:C.muted,marginLeft:4}}>{task.energy} pts</span>
                        {inBattle&&<span style={{...mono,fontSize:9,color:C.orange,marginLeft:4}}>IN BATTLE</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {!inBattle&&<button onClick={()=>{snd(sfxTap);const bs=[...db.dailyState.battle_slots];const oi=bs.findIndex((x:string|null)=>!x||!db.tasks.find(t=>t.id===x));bs[oi===-1?0:oi]=task.id;db.saveDailyState({...db.dailyState,battle_slots:bs});}} style={{...mono,background:'transparent',border:`1px solid ${C.orange}`,borderRadius:3,color:C.orange,fontSize:9,padding:'5px 8px',cursor:'pointer'}}>→ BATTLE</button>}
                    <button onClick={()=>db.removeTask(task.id)} style={{...mono,background:'transparent',border:'none',color:C.dim,fontSize:16,cursor:'pointer'}}>×</button>
                  </div>
                </div>
              </div>
            );
          })}

          {db.tasks.filter((t:any)=>db.dailyState.battle_done?.[t.id]).length>0&&(
            <div style={{...card,marginTop:16}}>
              <div style={{...lbl,color:C.gold,marginBottom:10}}>DONE — {battleEnergy} PTS BANKED</div>
              {db.tasks.filter((t:any)=>db.dailyState.battle_done?.[t.id]).map((task:any)=>(
                <div key={task.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:'flex',gap:10,alignItems:'center',flex:1}}>
                    <div style={{...chk(true,C.gold)}}><span style={{fontSize:11,color:'#0D0D0D',fontWeight:900}}>✓</span></div>
                    <span style={{...mono,fontSize:12,color:C.muted,textDecoration:'line-through'}}>{task.text}</span>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{...mono,fontSize:10,color:C.gold}}>+{task.energy}</span>
                    <button onClick={()=>db.removeTask(task.id)} style={{...mono,background:'transparent',border:'none',color:C.dim,fontSize:15,cursor:'pointer'}}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>}

        {/* ROUTINES */}
        {room==='routines' && <>
          <div style={{...card,borderLeft:`3px solid ${C.gold}`}}>
            <div style={{...lbl,color:C.gold}}>MORNING PROTOCOL</div>
            <div style={{...mono,fontSize:12,color:C.muted}}>Starts when you start moving. Not at a clock time.</div>
          </div>
          {MORNING_STEPS.map(step=>(
            <div key={step.id} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'14px 0',borderBottom:`1px solid ${C.border}`,opacity:(db.dailyState.morning_done||{})[step.id]?0.4:1,cursor:'pointer'}}
              onClick={()=>{snd(sfxCheck);const md={...db.dailyState.morning_done,[step.id]:!(db.dailyState.morning_done||{})[step.id]};db.saveDailyState({...db.dailyState,morning_done:md});}}>
              <div style={chk(!!(db.dailyState.morning_done||{})[step.id],C.gold)}>
                {(db.dailyState.morning_done||{})[step.id]&&<span style={{fontSize:12,color:'#0D0D0D',fontWeight:900}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:4}}>
                  <span style={{...mono,fontSize:13,fontWeight:700}}>{step.title}</span>
                  <span style={{...mono,fontSize:10,color:C.muted}}>{step.time}</span>
                </div>
                <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.6}}>{step.desc}</div>
                {step.journal&&(
                  <input onClick={e=>e.stopPropagation()} value={db.journal[db.today]?.[step.journal]||''} onChange={e=>db.saveJournal(db.today,step.journal!,e.target.value)} placeholder="Write it here — saved to JOURNAL"
                    style={{...mono,marginTop:10,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'8px 10px',fontSize:12,color:C.text,outline:'none'}}/>
                )}
              </div>
            </div>
          ))}
          {morningCount===MORNING_STEPS.length&&<div style={{...card,borderColor:C.gold,textAlign:'center',marginTop:12}}><div style={{...display,fontSize:16,color:C.gold}}>MORNING DONE.</div></div>}

          <div style={{...card,borderLeft:`3px solid ${C.blue}`,marginTop:24}}>
            <div style={{...lbl,color:C.blue}}>NIGHT PROTOCOL</div>
          </div>
          {NIGHT_STEPS.map(step=>(
            <div key={step.id} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'14px 0',borderBottom:`1px solid ${C.border}`,opacity:(db.dailyState.night_done||{})[step.id]?0.4:1,cursor:'pointer'}}
              onClick={()=>{snd(sfxCheck);const nd={...db.dailyState.night_done,[step.id]:!(db.dailyState.night_done||{})[step.id]};db.saveDailyState({...db.dailyState,night_done:nd});}}>
              <div style={chk(!!(db.dailyState.night_done||{})[step.id],C.blue)}>
                {(db.dailyState.night_done||{})[step.id]&&<span style={{fontSize:12,color:'#0D0D0D',fontWeight:900}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{...mono,fontSize:13,fontWeight:700,marginBottom:4}}>{step.title}</div>
                <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.6}}>{step.desc}</div>
                {step.journal&&(
                  <input onClick={e=>e.stopPropagation()} value={db.journal[db.today]?.[step.journal]||''} onChange={e=>db.saveJournal(db.today,step.journal!,e.target.value)} placeholder="Write it here"
                    style={{...mono,marginTop:10,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'8px 10px',fontSize:12,color:C.text,outline:'none'}}/>
                )}
              </div>
            </div>
          ))}

          <div style={{marginTop:16}}>
            <button style={{...btnOut(C.red),width:'100%',padding:14}} onClick={()=>{snd(sfxTap);setShowCrisis(!showCrisis);}}>
              {showCrisis?'▲ CLOSE 2AM PROTOCOL':'2AM PROTOCOL'}
            </button>
          </div>
          {showCrisis&&(
            <div style={{...card,borderColor:C.red,marginTop:8}}>
              <div style={{...lbl,color:C.red}}>IF YOU WAKE AT 2AM</div>
              {CRISIS_STEPS.map(step=>(
                <div key={step.id} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'14px 0',borderBottom:`1px solid ${step.crisis?C.red:C.border}`,cursor:'pointer'}}
                  onClick={()=>setCrisisDone(p=>({...p,[step.id]:!p[step.id]}))}>
                  <div style={chk(!!crisisDone[step.id],C.red)}>{crisisDone[step.id]&&<span style={{fontSize:11,color:'#fff',fontWeight:900}}>✓</span>}</div>
                  <div style={{flex:1}}>
                    <div style={{...mono,fontSize:13,fontWeight:700,color:step.crisis?C.red:C.text,marginBottom:3}}>{step.title}</div>
                    <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.5}}>{step.desc}</div>
                    {step.crisis&&<a href="sms:988" style={{display:'inline-block',marginTop:10,padding:'10px 18px',background:C.red,color:'#fff',fontSize:10,letterSpacing:'0.25em',fontWeight:700,borderRadius:3,textDecoration:'none',...mono}}>TEXT 988 NOW</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>}

        {/* JOURNAL */}
        {room==='journal' && <>
          <div style={{...card,borderLeft:`3px solid ${C.text}`}}>
            <div style={{...lbl}}>JOURNAL</div>
            <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.6}}>Your sentences, kept by day. Write in ROUTINES — they collect here.</div>
          </div>
          {Object.entries(db.journal).sort(([a],[b])=>b.localeCompare(a)).map(([date,entry]:any)=>{
            if(!entry?.honest&&!entry?.good&&!entry?.night) return null;
            return(
              <div key={date} style={card}>
                <div style={{...lbl,marginBottom:10}}>{date===db.today?'TODAY':formatDate(date)}</div>
                {[['honest','HONEST',C.gold],['good','ONE GOOD THING',C.orange],['night','NIGHT',C.blue]].map(([k,l,c])=>entry[k]?(
                  <div key={k} style={{marginBottom:10}}>
                    <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:String(c),marginBottom:3}}>{l}</div>
                    <div style={{...mono,fontSize:13,color:C.text,lineHeight:1.5}}>{entry[k]}</div>
                  </div>
                ):null)}
              </div>
            );
          })}
        </>}

        {/* GOALS */}
        {room==='goals' && <>
          <div style={{...card,borderLeft:`3px solid ${C.red}`,marginBottom:18}}>
            <div style={{...lbl,color:C.red}}>THE BOSS — 150K FOLLOWERS</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:8,marginBottom:8}}>
              <span style={{...display,fontSize:28,color:C.gold}}>{FOLLOWERS_NOW.toLocaleString()}</span>
              <span style={{...mono,fontSize:12,color:C.muted}}>/ {FOLLOWER_GOAL.toLocaleString()}</span>
            </div>
            <div style={{background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,height:18,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.max((FOLLOWERS_NOW/FOLLOWER_GOAL)*100,2)}%`,background:`linear-gradient(90deg,${C.red},${C.gold})`}}/>
            </div>
          </div>
          {VISION.map((v,i)=>(
            <div key={i} style={{...card,borderLeft:`3px solid ${v.color}`}}>
              <div style={{...lbl,color:v.color}}>{v.year}</div>
              {v.items.map((item,j)=>(
                <div key={j} style={{display:'flex',gap:8,marginBottom:6}}>
                  <span style={{color:v.color,flexShrink:0}}>→</span>
                  <span style={{...mono,fontSize:13,color:C.muted,lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </>}

        {/* MONEY */}
        {room==='money' && (
          <MoneyRoom
            debts={db.debts}
            incomeLog={db.incomeLog}
            spendingLog={db.spendingLog}
            updateDebt={db.updateDebt}
            addIncome={db.addIncome}
            deleteIncome={db.deleteIncome}
            addSpend={db.addSpend}
            deleteSpend={db.deleteSpend}
          />
        )}

      </div>
    </div>
  );
}
