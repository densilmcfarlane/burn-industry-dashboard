import { useState } from "react";

const C = { bg:'#0D0D0D', card:'#111', border:'#1e1e1e', gold:'#FFD60A', orange:'#ff6b35', red:'#D91F26', blue:'#7eb8f7', text:'#F2F2F2', muted:'#666', dim:'#2a2a2a', green:'#4ade80' };
const mono = { fontFamily:"'Space Mono',monospace" };
const display = { fontFamily:"'Anton',sans-serif", letterSpacing:'0.02em', textTransform:'uppercase' };
const base = { fontFamily:"'Space Mono',monospace", boxSizing:'border-box' };
const card = { ...base, background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:16, marginBottom:10 };
const pixel = { fontFamily:"'Press Start 2P',monospace" };

function sfxTap()   { try { const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=660;g.gain.setValueAtTime(0.12,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.06);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.06);}catch(e){} }
function sfxCheck() { try { const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=880;g.gain.setValueAtTime(0.13,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.09);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.09);}catch(e){} }
function sfxKO()    { [523,659,784,1046].forEach((f,i)=>setTimeout(()=>{ try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.14,a.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+0.16);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+0.16);}catch(e){}},i*90)); }

const PAY_ANCHOR    = new Date(2026, 5, 19);
const TODAY_FIXED   = new Date(2026, 5, 24);
const TARGET_DATE   = new Date(2027, 7,  1);
const TOTAL_ORIGINAL= 34270;
const MS_BIWEEK     = 14 * 24 * 60 * 60 * 1000;

const DEBT_DEFAULTS = [
  { id:'td',       name:'TD First Class ···6932',  bal:21854, rate:11.00,  min:228, due:6   },
  { id:'amex',     name:'Amex Cobalt ···1700',     bal:4296,  rate:21.99,  min:89,  due:18  },
  { id:'scotia',   name:'Scotiabank Visa ···3026', bal:2906,  rate:13.99,  min:42,  due:6   },
  { id:'tang_loc', name:'Tangerine LOC ···6380',   bal:2713,  rate:9.45,   min:76,  due:21, autopay:true },
  { id:'tang_mc',  name:'Tangerine MC ···6704',    bal:2501,  rate:20.95,  min:52,  due:24  },
];

const INCOME_TYPES = [
  { id:'paycheck',  label:'PAYCHECK',      default:2350  },
  { id:'guarantee', label:'GUARANTEE',     default:0     },
  { id:'merch',     label:'MERCH',         default:0     },
  { id:'reimb',     label:'REIMBURSEMENT', default:13000 },
  { id:'other',     label:'OTHER',         default:0     },
];

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('bi_money') || 'null');
    if (s && s.debts) return s;
  } catch(e) {}
  return { debts: DEBT_DEFAULTS, spending: [], incomeLog: [] };
}

function allocate(amount, phase, debts) {
  let remaining = amount;
  const steps = [];
  const debt = (id) => debts.find(d => d.id === id);

  if (phase === 1) {
    const mins = [
      { id:'td',     label:'TD First Class ···6932',  detail:'Min payment — due 6th',               amt:228  },
      { id:'scotia', label:'Scotiabank Visa ···3026', detail:'Min payment — due 6th',               amt:42   },
      { id:'amex',   label:'Amex Cobalt ···1700',     detail:'Min $89 — due 18th',                  amt:89   },
      { id:'rent',   label:'Rent',                    detail:'Monthly — skip if already paid this month', amt:625, optional:true },
      { id:'bills',  label:'Bills & subscriptions',   detail:'Fido, Bell, hydro, subs — ~$292',     amt:292, optional:true },
    ];
    for (const a of mins) {
      if (remaining <= 0) break;
      const cap = Math.min(debt(a.id)?.bal ?? a.amt, a.amt);
      const take = Math.min(remaining, a.id==='rent'||a.id==='bills' ? a.amt : cap);
      steps.push({ ...a, take, deficit: Math.max(0, a.amt - take) });
      remaining -= take;
    }
    if (remaining > 0) {
      const amexBal = debt('amex')?.bal || 0;
      const amexMin = steps.find(s=>s.id==='amex')?.take || 0;
      const canAttack = Math.max(0, amexBal - amexMin);
      if (canAttack > 0) {
        const attack = Math.min(remaining, canAttack);
        steps.push({ id:'amex_attack', label:'Amex — ATTACK', detail:'Every extra dollar destroys the 21.99% — this is the move', amt:attack, take:attack, deficit:0, attack:true });
        remaining -= attack;
      }
    }
    if (remaining > 0) {
      const tdBal = (debt('td')?.bal||0) - (steps.find(s=>s.id==='td')?.take||0);
      if (tdBal > 0) {
        const take = Math.min(remaining, tdBal);
        steps.push({ id:'td_extra', label:'TD — extra attack', detail:'Amex cleared, surplus hits TD next', amt:take, take, deficit:0, attack:true });
        remaining -= take;
      }
    }
  } else if (phase === 2) {
    const order = ['amex','tang_mc','scotia','tang_loc'];
    for (const id of order) {
      if (remaining <= 0) break;
      const d = debt(id);
      if (!d || d.bal <= 0) continue;
      const take = Math.min(remaining, d.bal);
      steps.push({ id, label:d.name, detail:`Clear at ${d.rate}% — kill it now`, amt:d.bal, take, deficit:d.bal-take, attack:true });
      remaining -= take;
    }
    if (remaining > 0) {
      const tdBal = debt('td')?.bal || 0;
      const take = Math.min(remaining, tdBal);
      if (take > 0) steps.push({ id:'td', label:'TD First Class ···6932', detail:'Remaining goes to TD', amt:tdBal, take, deficit:tdBal-take, attack:false });
      remaining -= take;
    }
  } else {
    const tdBal = debt('td')?.bal || 0;
    const take = Math.min(remaining, tdBal);
    steps.push({ id:'td', label:'TD First Class ···6932', detail:'Phase 3 — everything kills TD', amt:tdBal, take, deficit:tdBal-take, attack:true });
    remaining -= take;
  }

  if (remaining > 0.01) {
    steps.push({ id:'spend', label:'Spending / buffer', detail:'Living money — $40.19/day limit', amt:remaining, take:remaining, deficit:0, spend:true });
  }
  return steps;
}

export default function MoneyRoom() {
  const [state, setState]         = useState(loadState);
  const [tab, setTab]             = useState('allocate');
  const [incomeType, setIncomeType] = useState('paycheck');
  const [incomeAmt, setIncomeAmt] = useState('2350');
  const [incomeNote, setIncomeNote] = useState('');
  const [allocation, setAllocation] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [statPaste, setStatPaste] = useState('');
  const [statMode, setStatMode]   = useState('paste');
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal]     = useState('');

  const save = (next) => { setState(next); try { localStorage.setItem('bi_money', JSON.stringify(next)); } catch(e) {} };

  const { debts, incomeLog } = state;
  const totalDebt = debts.reduce((s,d)=>s+d.bal,0);

  const anchorMs    = PAY_ANCHOR.getTime();
  const todayMs     = TODAY_FIXED.getTime();
  const currentN    = Math.floor((todayMs - anchorMs) / MS_BIWEEK);
  const periodStart = new Date(anchorMs + currentN * MS_BIWEEK);
  const sep2026 = new Date(2026,8,1), oct2026 = new Date(2026,9,1);
  const phase   = periodStart < sep2026 ? 1 : periodStart < oct2026 ? 2 : 3;
  const phaseLabel= ['','Phase 1 — Attack Amex','Phase 2 — Reimburse & clear','Phase 3 — TD knockout'][phase];
  const phaseColor= [C.gold, C.orange, C.red, C.gold][phase];
  const daysLeft  = Math.max(0,Math.round((TARGET_DATE-TODAY_FIXED)/86400000));
  const paidPct   = Math.max(0,Math.round(((TOTAL_ORIGINAL-totalDebt)/TOTAL_ORIGINAL)*100));
  const periodKey = periodStart.toISOString().slice(0,10);

  function runAllocate() {
    const amt = parseFloat(incomeAmt);
    if (!amt||amt<=0) return;
    sfxCheck();
    setAllocation(allocate(amt, phase, debts));
    setConfirmed(false);
  }

  function confirmAllocation() {
    const amt = parseFloat(incomeAmt);
    sfxKO();
    const paid = {};
    allocation.forEach(s => {
      const baseId = s.id.replace('_attack','').replace('_extra','');
      paid[baseId] = (paid[baseId]||0) + s.take;
    });
    const newDebts = debts.map(d => ({ ...d, bal: Math.max(0, d.bal - (paid[d.id]||0)) }));
    const entry = {
      id: Date.now(),
      period: periodKey,
      type: incomeType,
      amt,
      note: incomeNote.trim() || INCOME_TYPES.find(t=>t.id===incomeType)?.label || 'Income',
      date: TODAY_FIXED.toISOString().slice(0,10),
      allocation: allocation.map(s=>({ label:s.label, take:s.take })),
    };
    save({ ...state, debts: newDebts, incomeLog: [...(incomeLog||[]), entry] });
    setConfirmed(true);
    setTimeout(()=>{ setAllocation(null); setConfirmed(false); setIncomeAmt(''); setIncomeNote(''); }, 3500);
  }

  function updateDebtBal(id, val) {
    const n = parseFloat(val);
    if (isNaN(n)||n<0) return;
    save({ ...state, debts: debts.map(d=>d.id===id?{...d,bal:Math.round(n*100)/100}:d) });
    setEditingId(null); setEditVal('');
  }

  function parseStatement(text) {
    const updates = {};
    const patterns = [
      { id:'td',       rx:/td.*?first|first.*?class|\*+6932/i    },
      { id:'amex',     rx:/amex.*?cobalt|cobalt|\*+1700|17001/i  },
      { id:'scotia',   rx:/scotiabank|scotia|\*+3026/i           },
      { id:'tang_loc', rx:/tangerine.*?loc|loc.*?tang|\*+6380/i  },
      { id:'tang_mc',  rx:/tangerine.*?mc|tangerine.*?master|\*+6704/i },
    ];
    text.split('\n').forEach(line => {
      patterns.forEach(p => {
        if (p.rx.test(line)) {
          const m = line.match(/\$?\s*([\d,]+\.?\d{0,2})/);
          if (m) { const v = parseFloat(m[1].replace(',','')); if (!isNaN(v)&&v>0) updates[p.id]=v; }
        }
      });
    });
    return updates;
  }

  function applyPaste() {
    const updates = parseStatement(statPaste);
    if (!Object.keys(updates).length) return;
    sfxCheck();
    save({ ...state, debts: debts.map(d=>updates[d.id]!==undefined?{...d,bal:updates[d.id]}:d) });
    setStatPaste('');
  }

  const btnFull = c => ({ ...base, padding:'10px 18px', background:c, border:`1px solid ${c}`, color:'#0D0D0D', fontSize:10, letterSpacing:'0.25em', fontWeight:700, cursor:'pointer', borderRadius:3 });
  const btnOut  = c => ({ ...base, padding:'10px 18px', background:'transparent', border:`1px solid ${c}`, color:c, fontSize:10, letterSpacing:'0.25em', fontWeight:700, cursor:'pointer', borderRadius:3 });
  const lbl = { fontSize:9, letterSpacing:'0.35em', color:C.muted, marginBottom:6, textTransform:'uppercase', ...mono };

  return (
    <div>
      {/* TOP STRIP */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
        {[
          { label:'TOTAL DEBT', val:`$${totalDebt.toLocaleString()}`, col:totalDebt<20000?C.green:C.text },
          { label:'DAYS LEFT',  val:`${daysLeft}d`,                   col:daysLeft<180?C.gold:C.text     },
          { label:'CLEARED',    val:`${paidPct}%`,                    col:paidPct>0?C.gold:C.muted       },
        ].map(x=>(
          <div key={x.label} style={{ ...card, padding:'10px 12px', marginBottom:0, textAlign:'center' }}>
            <div style={{ ...lbl, marginBottom:3 }}>{x.label}</div>
            <div style={{ ...display, fontSize:18, color:x.col, lineHeight:1 }}>{x.val}</div>
          </div>
        ))}
      </div>

      {/* PROGRESS */}
      <div style={{ ...card, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', ...mono, fontSize:9, color:C.muted, marginBottom:5 }}>
          <span>JUN 2026</span>
          <span style={{ color:phaseColor }}>{phaseLabel}</span>
          <span>AUG 2027</span>
        </div>
        <div style={{ background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, height:10, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.max(paidPct,1)}%`, background:`linear-gradient(90deg,${C.red},${C.gold})` }} />
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, marginBottom:16 }}>
        {[['allocate','ALLOCATE'],['log','LOG'],['debts','BALANCES'],['statement','STATEMENT']].map(([id,lbl2])=>(
          <button key={id} onClick={()=>{ sfxTap(); setTab(id); }}
            style={{ ...mono, padding:'8px 4px', borderRadius:3, border:`1px solid ${tab===id?C.gold:C.border}`, background:tab===id?C.gold:'transparent', color:tab===id?'#0D0D0D':C.muted, fontSize:8, letterSpacing:'0.1em', fontWeight:700, cursor:'pointer' }}>
            {lbl2}
          </button>
        ))}
      </div>

      {/* ── ALLOCATE ── */}
      {tab==='allocate' && (
        <div>
          <div style={{ ...card, borderLeft:`3px solid ${C.gold}` }}>
            <div style={{ ...lbl, color:C.gold }}>MONEY IN — WHERE DOES IT GO?</div>
            <div style={{ ...mono, fontSize:11, color:C.muted, lineHeight:1.6 }}>Drop in any amount — paycheck, guarantee, e-transfer, whatever. The app tells you exactly where every dollar goes based on your phase and current balances.</div>
          </div>

          <div style={{ ...lbl, marginBottom:8 }}>INCOME TYPE</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
            {INCOME_TYPES.map(t=>(
              <button key={t.id} onClick={()=>{ sfxTap(); setIncomeType(t.id); if(t.default) setIncomeAmt(String(t.default)); }}
                style={{ ...mono, padding:'7px 12px', borderRadius:3, border:`1px solid ${incomeType===t.id?C.gold:C.border}`, background:incomeType===t.id?C.gold:'transparent', color:incomeType===t.id?'#0D0D0D':C.muted, fontSize:10, letterSpacing:'0.08em', cursor:'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ ...lbl, marginBottom:6 }}>AMOUNT</div>
          <div style={{ position:'relative', marginBottom:10 }}>
            <span style={{ ...mono, position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.gold, fontSize:20, fontWeight:700 }}>$</span>
            <input
              value={incomeAmt}
              onChange={e=>setIncomeAmt(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&runAllocate()}
              placeholder="0.00"
              inputMode="decimal"
              style={{ ...mono, width:'100%', background:'#0a0a0a', border:`2px solid ${C.gold}`, borderRadius:4, padding:'14px 14px 14px 34px', fontSize:22, color:C.gold, outline:'none' }}
            />
          </div>

          <input
            value={incomeNote}
            onChange={e=>setIncomeNote(e.target.value)}
            placeholder="What is this? (e.g. Halifax guarantee, OBGMs $13k reimbursement)"
            style={{ ...mono, width:'100%', background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, padding:'10px 12px', fontSize:12, color:C.text, outline:'none', marginBottom:14 }}
          />

          <button onClick={runAllocate} style={{ ...btnFull(C.gold), width:'100%', padding:14, fontSize:12, letterSpacing:'0.3em' }}>
            SHOW ME WHERE IT GOES →
          </button>

          {/* RESULT */}
          {allocation && !confirmed && (
            <div style={{ marginTop:20 }}>
              <div style={{ ...lbl, color:C.orange, marginBottom:12 }}>MARCHING ORDERS — ${parseFloat(incomeAmt||0).toLocaleString()} IN</div>

              {allocation.map((step,i)=>{
                const col = step.attack ? C.orange : step.spend ? C.blue : C.text;
                const bg  = step.attack ? '#1a1200' : step.spend ? '#060d18' : C.card;
                return (
                  <div key={i} style={{ ...card, background:bg, borderLeft:`3px solid ${col}`, marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                      <div style={{ display:'flex', gap:12, alignItems:'center', flex:1 }}>
                        <div style={{ ...mono, width:26, height:26, borderRadius:'50%', background:col, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#0D0D0D', flexShrink:0 }}>{i+1}</div>
                        <div>
                          <div style={{ ...display, fontSize:13, color:col, lineHeight:1.2 }}>{step.label}</div>
                          <div style={{ ...mono, fontSize:10, color:C.muted, marginTop:2, lineHeight:1.4 }}>{step.detail}</div>
                          {step.deficit>0.01 && <div style={{ ...mono, fontSize:9, color:C.red, marginTop:2 }}>⚠ ${step.deficit.toFixed(2)} short — cover from next pay or savings</div>}
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ ...display, fontSize:18, color:col }}>${step.take.toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        {step.deficit>0.01 && <div style={{ ...mono, fontSize:9, color:C.dim }}>of ${step.amt.toFixed(2)}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ ...card, borderColor:C.gold, background:'#14110a' }}>
                <div style={{ display:'flex', justifyContent:'space-between', ...mono, fontSize:11, marginBottom:4 }}>
                  <span style={{ color:C.muted }}>Total in</span>
                  <span style={{ color:C.gold, fontWeight:700 }}>${parseFloat(incomeAmt||0).toFixed(2)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', ...mono, fontSize:11, marginBottom:4 }}>
                  <span style={{ color:C.muted }}>Goes to debt</span>
                  <span style={{ color:C.orange }}>${allocation.filter(s=>!s.spend&&s.id!=='rent'&&s.id!=='bills').reduce((s,x)=>s+x.take,0).toFixed(2)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', ...mono, fontSize:11 }}>
                  <span style={{ color:C.muted }}>Spending money</span>
                  <span style={{ color:C.blue }}>${(allocation.find(s=>s.spend)?.take||0).toFixed(2)}</span>
                </div>
              </div>

              <button onClick={confirmAllocation} style={{ ...btnFull(C.orange), width:'100%', padding:14, fontSize:12, letterSpacing:'0.2em', marginTop:8 }}>
                ✓ I DID THIS — UPDATE MY BALANCES
              </button>
              <button onClick={()=>setAllocation(null)} style={{ ...btnOut(C.muted), width:'100%', padding:10, fontSize:10, marginTop:6 }}>
                CANCEL
              </button>
            </div>
          )}

          {confirmed && (
            <div style={{ ...card, borderColor:'#4ade80', background:'#061a0a', textAlign:'center', marginTop:20 }}>
              <div style={{ ...pixel, fontSize:12, color:'#4ade80' }}>BANKED</div>
              <div style={{ ...mono, fontSize:11, color:C.muted, marginTop:10 }}>Balances updated. Income logged. Keep going.</div>
            </div>
          )}
        </div>
      )}

      {/* ── LOG ── */}
      {tab==='log' && (
        <div>
          <div style={{ ...card, borderLeft:`3px solid ${C.blue}` }}>
            <div style={{ ...lbl, color:C.blue }}>INCOME LOG</div>
            <div style={{ ...mono, fontSize:11, color:C.muted }}>Every dollar logged. Tap × to remove an entry.</div>
          </div>

          {!(incomeLog||[]).length && (
            <div style={{ ...card, textAlign:'center', padding:'32px 16px', opacity:0.4 }}>
              <div style={{ ...mono, fontSize:12, color:C.dim }}>Nothing logged yet. Hit ALLOCATE and enter your first pay.</div>
            </div>
          )}

          {[...(incomeLog||[])].reverse().map(entry=>(
            <div key={entry.id} style={{ ...card }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'baseline', marginBottom:4 }}>
                    <span style={{ ...display, fontSize:18, color:C.gold }}>${entry.amt.toLocaleString()}</span>
                    <span style={{ ...mono, fontSize:9, color:C.muted, letterSpacing:'0.15em' }}>{entry.type.toUpperCase()}</span>
                  </div>
                  <div style={{ ...mono, fontSize:12, color:C.text, marginBottom:3 }}>{entry.note}</div>
                  <div style={{ ...mono, fontSize:10, color:C.muted }}>{entry.date}</div>
                  {entry.allocation && (
                    <div style={{ marginTop:8, borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
                      {entry.allocation.map((a,i)=>(
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', ...mono, fontSize:10, color:C.muted, padding:'2px 0' }}>
                          <span>→ {a.label}</span><span style={{ color:C.text }}>${a.take.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={()=>save({...state,incomeLog:(incomeLog||[]).filter(x=>x.id!==entry.id)})} style={{ ...mono, background:'transparent', border:'none', color:C.dim, fontSize:16, cursor:'pointer' }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BALANCES ── */}
      {tab==='debts' && (
        <div>
          <div style={{ ...card, borderLeft:`3px solid ${C.orange}` }}>
            <div style={{ ...lbl, color:C.orange }}>BALANCES</div>
            <div style={{ ...mono, fontSize:11, color:C.muted, lineHeight:1.6 }}>Tap any card to update its balance. Or use STATEMENT to paste from your bank app.</div>
          </div>
          {debts.map(d=>{
            const attacking = (phase===1&&d.id==='amex')||(phase===3&&d.id==='td');
            const orig = DEBT_DEFAULTS.find(x=>x.id===d.id)?.bal||1;
            const pct  = Math.round((d.bal/orig)*100);
            const isEd = editingId===d.id;
            return (
              <div key={d.id} style={{ ...card, borderLeft:`3px solid ${attacking?C.orange:C.border}`, cursor:'pointer' }}
                onClick={()=>{ if(!isEd){setEditingId(d.id);setEditVal(String(d.bal));} }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ ...mono, fontSize:12, color:attacking?C.orange:C.text }}>{d.name}</div>
                    <div style={{ ...mono, fontSize:10, color:C.muted, marginTop:2 }}>
                      {d.rate}% · min ${d.min} · due {d.due}{d.autopay?' · autopay':''}
                      {attacking&&<span style={{ color:C.orange, marginLeft:6 }}>← ATTACKING</span>}
                    </div>
                  </div>
                  <div style={{ ...display, fontSize:18, color:attacking?C.orange:C.text }}>${d.bal.toLocaleString()}</div>
                </div>
                <div style={{ background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:2, height:4, overflow:'hidden', marginBottom:isEd?12:0 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:attacking?C.orange:C.dim }} />
                </div>
                {isEd && (
                  <div style={{ display:'flex', gap:6 }} onClick={e=>e.stopPropagation()}>
                    <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter')updateDebtBal(d.id,editVal); if(e.key==='Escape'){setEditingId(null);setEditVal('');} }}
                      inputMode="decimal"
                      style={{ ...mono, flex:1, background:'#0a0a0a', border:`1px solid ${C.gold}`, borderRadius:3, padding:'9px 11px', fontSize:14, color:C.gold, outline:'none' }} />
                    <button onClick={()=>updateDebtBal(d.id,editVal)} style={{ ...btnFull(C.gold), padding:'9px 16px' }}>SET</button>
                    <button onClick={e=>{e.stopPropagation();setEditingId(null);setEditVal('');}} style={{ ...btnOut(C.muted), padding:'9px 12px' }}>✕</button>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ ...mono, fontSize:10, color:C.dim, marginTop:6, lineHeight:1.7 }}>
            Tangerine LOC is autopay from savings — it pays itself. KMHN charges on TD are therapy reimbursed by Manulife.
          </div>
        </div>
      )}

      {/* ── STATEMENT ── */}
      {tab==='statement' && (
        <div>
          <div style={{ ...card, borderLeft:`3px solid ${C.blue}` }}>
            <div style={{ ...lbl, color:C.blue }}>LOAD STATEMENT</div>
            <div style={{ ...mono, fontSize:11, color:C.muted, lineHeight:1.6 }}>Paste text from your bank or credit card app and the app will scan for balances automatically. Nothing leaves your device.</div>
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:14 }}>
            {[['paste','PASTE & SCAN'],['manual','MANUAL ENTRY']].map(([k,l])=>(
              <button key={k} onClick={()=>setStatMode(k)}
                style={{ ...mono, flex:1, padding:'9px 6px', borderRadius:3, border:`1px solid ${statMode===k?C.blue:C.border}`, background:statMode===k?C.blue:'transparent', color:statMode===k?'#0D0D0D':C.muted, fontSize:9, letterSpacing:'0.1em', fontWeight:700, cursor:'pointer' }}>
                {l}
              </button>
            ))}
          </div>

          {statMode==='paste' && (
            <>
              <textarea
                value={statPaste}
                onChange={e=>setStatPaste(e.target.value)}
                placeholder={"Paste any text from your bank app, online banking, or statement.\n\nExamples that work:\n  TD First Class Travel Visa ****6932  $21,854.00\n  Amex Cobalt ****1700  Balance: $4,296\n  Scotiabank Visa *3026 — $2,906.14\n\nThe scanner looks for your card names and pulls the dollar amount on the same line."}
                rows={10}
                style={{ ...mono, width:'100%', background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, padding:'10px 12px', fontSize:11, color:C.text, outline:'none', resize:'vertical', lineHeight:1.6, marginBottom:12 }}
              />
              <button onClick={applyPaste} style={{ ...btnFull(C.blue), width:'100%', padding:12 }}>
                SCAN &amp; UPDATE BALANCES
              </button>
              <div style={{ ...mono, fontSize:10, color:C.muted, marginTop:10, lineHeight:1.6 }}>
                If a card isn't detected automatically, switch to MANUAL ENTRY and update it directly.
              </div>
            </>
          )}

          {statMode==='manual' && (
            <>
              <div style={{ ...mono, fontSize:11, color:C.muted, lineHeight:1.6, marginBottom:12 }}>Enter each balance from your latest statement.</div>
              {debts.map(d=>{
                const isEd = editingId===d.id;
                return (
                  <div key={d.id} style={{ ...card }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:isEd?10:0 }}>
                      <div>
                        <div style={{ ...mono, fontSize:12, color:C.text }}>{d.name}</div>
                        <div style={{ ...mono, fontSize:10, color:C.muted }}>Current: ${d.bal.toLocaleString()}</div>
                      </div>
                      {!isEd && <button onClick={()=>{setEditingId(d.id);setEditVal(String(d.bal));}} style={{ ...btnOut(C.gold), padding:'6px 12px', fontSize:9 }}>UPDATE</button>}
                    </div>
                    {isEd && (
                      <div style={{ display:'flex', gap:6 }}>
                        <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                          onKeyDown={e=>{ if(e.key==='Enter')updateDebtBal(d.id,editVal); if(e.key==='Escape'){setEditingId(null);setEditVal('');} }}
                          inputMode="decimal" placeholder="New balance from statement"
                          style={{ ...mono, flex:1, background:'#0a0a0a', border:`1px solid ${C.gold}`, borderRadius:3, padding:'9px 11px', fontSize:13, color:C.gold, outline:'none' }} />
                        <button onClick={()=>updateDebtBal(d.id,editVal)} style={{ ...btnFull(C.gold), padding:'9px 14px' }}>SET</button>
                        <button onClick={()=>{setEditingId(null);setEditVal('');}} style={{ ...btnOut(C.muted), padding:'9px 10px' }}>✕</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      <style>{`@keyframes biPop{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
