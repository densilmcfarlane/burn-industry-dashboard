'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppData } from '@/lib/useAppData';
import MoneyRoom from './MoneyRoom';

const C = { bg:'#0D0D0D', card:'#111', border:'#1e1e1e', gold:'#FFD60A', orange:'#ff6b35', red:'#D91F26', blue:'#7eb8f7', text:'#F2F2F2', muted:'#666', dim:'#2a2a2a' };
const display: React.CSSProperties = { fontFamily:"'Anton',sans-serif", letterSpacing:'0.02em', textTransform:'uppercase' };
const pixel: React.CSSProperties = { fontFamily:"'Press Start 2P',monospace" };
const mono: React.CSSProperties = { fontFamily:"'Space Mono',monospace" };
const base: React.CSSProperties = { fontFamily:"'Space Mono',monospace", boxSizing:'border-box' };
const card: React.CSSProperties = { ...base, background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:16, marginBottom:10 };
const lbl: React.CSSProperties = { fontSize:9, letterSpacing:'0.35em', color:C.muted, marginBottom:6, textTransform:'uppercase', ...mono };
const btnFull = (c:string): React.CSSProperties => ({ ...base, padding:'10px 18px', background:c, border:`1px solid ${c}`, color:'#0D0D0D', fontSize:10, letterSpacing:'0.25em', fontWeight:700, cursor:'pointer', borderRadius:3 });
const btnOut  = (c:string): React.CSSProperties => ({ ...base, padding:'10px 18px', background:'transparent', border:`1px solid ${c}`, color:c, fontSize:10, letterSpacing:'0.25em', fontWeight:700, cursor:'pointer', borderRadius:3 });
const chk = (done:boolean, color:string): React.CSSProperties => ({ width:28, height:28, borderRadius:'50%', border:`2px solid ${done?color:C.dim}`, background:done?color:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.2s' });

const ENERGY_TARGET = 10;
const FOLLOWER_GOAL = 150000;
const FOLLOWERS_NOW = 16500;

const TOUR = [
  { date:"2026-05-25", city:"Eindhoven", country:"NL", venue:"TBD" },
  { date:"2026-05-26", city:"Bayreuth", country:"DE", venue:"TBD" },
  { date:"2026-05-27", city:"OFF", country:"DE", venue:null },
  { date:"2026-05-28", city:"Stuttgart", country:"DE", venue:"TBD" },
  { date:"2026-05-29", city:"Barberaz", country:"FR", venue:"TBD" },
  { date:"2026-05-30", city:"Cassano D'Adda", country:"IT", venue:"TBD" },
  { date:"2026-06-11", city:"Fredericton", country:"NB", venue:"The Cap", venueAddr:"362 Queen St., Fredericton, NB", loadin:"6:30 PM (sound tech 6:00, soundcheck 7:30)", setTime:"11:00 PM–12:00 AM (doors 8:30, curfew 1:00)", info:[["Age","19+"],["Backline","Sharing drums/bass — supports bring breakables"],["Tickets","Adv $15 / door $20"],["Wifi","The CAP / Cap2020!"],["Parking","Queen St, load in through Queen St door"],["Merch","100% to artist"],["Guest list","1 per member"],["Hospitality","Band prices on drinks + 10% off record store"],["Settlement","E-transfer 1-4 days after — confirm best email"],["Contact","Zach Atkinson 506.260.3041"],["Tech specs","drive.google.com/file/d/11LxacFAV4k1guL-K3xNxwH6cbR5yEmXY"]], hotel:"Travellers Inn, 42 Chaparral Rd, Waasis, NB E3B 0G9 — 2 rooms, itin 72075382604747", radio:"CHSR 97.9 FM", radioEmail:"MusicDirector@chsrfm.ca" } as any,
  { date:"2026-06-12", city:"Charlottetown", country:"PEI", venue:"Baba's Lounge", venueAddr:"181 Great George St., Charlottetown, PE C1A 4L1", hotel:"Glendenning Hall, 331 Grafton St, Charlottetown, PE C1A 1L9 — 2-bdrm apt, itin 72075392165371", radio:"CBC Radio One PEI 96.1", radioEmail:"via cbc.ca/pei" } as any,
  { date:"2026-06-13", city:"Halifax", country:"NS", venue:"Seahorse Tavern (Everyseeker Fest)", venueAddr:"2037 Gottingen St., Halifax, NS (entrance on Portland)", loadin:"No later than 15 min before soundcheck (5:30 PM)", setTime:"11:00 PM, 60 min (doors 9:00)", info:[["Age","19+"],["Backline","Provided"],["Sound tech","Sara Martin, saramartin.audio@gmail.com"],["Admission","PWYC @ everyseeker.com"],["Merch","100% venue-sold, table + volunteer, bring signage (no float/reader)"],["Catering","Festival catering + water backstage"],["After-party","Listen Halifax, Sun Jun 14"],["Contact","Gianna (hosp/transpo) 902.440.1258"],["Contact","Tynan (tech) 902.222.4683"],["Contact","Shuvanjan (payment) 902.401.9459"],["Note","Tag @everyseeker"]], hotel:"Hampton Inn, 1960 Brunswick St, Halifax NS B3J 2G7 — Jun 13-14, 2 rooms, conf 91991862 (room+tax only, bring CC for incidentals)" } as any,
  { date:"2026-06-14", city:"Moncton", country:"NB", venue:"Tide & Boar Ballroom", venueAddr:"700 Main St., Moncton, NB E1C 1E3", loadin:"4:00 PM (no noise til 4, soundcheck 4:00)", setTime:"10:00 PM (doors 7:00, curfew midnight)", info:[["Age","19+, cap 200"],["Tickets","Adv $15 / door $20"],["Supports","Customer Service 9PM, Diner Drugs 8PM"],["Wifi","Duo Cafe / boarpoutine"],["Merch","100% to artist"],["Parking","Right on Downing St after venue, bus+trailer behind building"],["Settlement","Zach Atkinson e-transfer"]], hotel:"Fairfield Inn & Suites, 26 Marriott Dr, Moncton, NB E1A 7S4 — check-in Jun 14, itin 72075392602940", radio:"Codiac 93.5 FM", radioEmail:"musique@codiacfm.ca" } as any,
  { date:"2026-06-18", city:"Chicago", country:"IL", venue:"The Hideout", venueAddr:"1354 W. Wabansia Ave., Chicago, IL 60642", loadin:"5:30 PM (soundcheck 5:45)", setTime:"9:00–10:00 PM (doors 7:30)", info:[["Age","21+"],["Backline","NONE — bring all gear"],["Load-in","Alley behind stage, then move car to free street parking"],["Wifi","HIDEOUT_GUEST / WoodenLeg"],["Guest list","5/act to door before doors"],["Merch","100% to band, 6ft table provided"],["DOS","Kwame Caldwell, production@hideoutchicago.com / 773-484-3755"],["Payment","Check after show (W9 required)"]], radio:"WLUW 88.7 FM", radioEmail:"musicdeptwluw@gmail.com" } as any,
  { date:"2026-06-19", city:"Detroit", country:"MI", venue:"The Sanctuary / Crypt", venueAddr:"15701 James Couzens Fwy., Detroit, MI 48238", radio:"WDET 101.9 FM", radioEmail:"via wdet.org" } as any,
  { date:"2026-06-21", city:"Gilbert", country:"PA", venue:"Camp Punksylvania", venueAddr:"West End Fairgrounds, 570 Fairground Rd., Gilbert, PA" } as any,
  { date:"2026-06-26", city:"Vancouver", country:"BC", venue:"Black to The Future (Black Music Month)", venueAddr:"2111 Main St., Vancouver, BC V5T 3C6", flight:"Jun 25 TOR→VAN · Flair F8611 · YYZ 1:55PM → YVR 4:05PM · conf 2GXV2Q · Lite + 10kg" } as any,
  { date:"2026-06-27", city:"Winnipeg", country:"MB", venue:"Village Music Festival (The Toad / Toad in the Hole)", venueAddr:"Osborne Village, Winnipeg, MB", loadin:"Anytime before set — arrive 1 hr early (street parking only, budget time)", setTime:"10:15–11:30 PM (soundcheck/load-in from 4:30 PM)", info:[["Backline","Full backline provided — PAs, mics/stands, 2 guitar amps, bass amp, drums. Bring patch cables. Drummers bring breakables."],["Hospitality","The Oak Table, basement at 107 Pulford St. Catering by Zaytoon + drinks, up to 2 hrs before/after set, until 10 PM."],["Tech","Chris — (204) 292-3476 / christopherlilako@gmail.com"],["Day-of contact","Abrielle (Real Love) — text/call (204) 770-7226"],["Payment","E-transfer 1-3 days after event"],["Bill","2nd Floor Patients 6PM · Dill the Giant 7:15 · Super Duty Tough Work 8:45 · OBGMs 10:15 · Tha Nugg sets between"]], flight:"Jun 27 VAN→WPG · WestJet WS538 · YVR 9:50AM → YWG 2:40PM · conf OLLQIB · seats Denz 10A / Cola 10B / Simon 10C / Joe 10D" } as any,
  { date:"2026-07-17", city:"Edmonton", country:"AB", venue:"TBD", radio:"CKUA 94.9 FM", radioEmail:"via ckua.com" } as any,
  { date:"2026-07-18", city:"Yellowknife", country:"NWT", venue:"Folk on the Rocks", venueAddr:"Long Lake / Folk On The Rocks Festival Site, Yellowknife, NT", flight:"Jul 18 EDM→YZF · Canadian North 5T244 · YEG 8:00AM → YZF 9:45AM | Return Jul 19 · 5T245 · YZF 6:30PM → YEG 8:10PM · confs Denz YBGNIK / Cola CXNOJG / Joe NKAHHL / Simon YEDPLE" } as any,
  { date:"2026-08-07", city:"Tillsonburg", country:"ON", venue:"Buddies Fest", venueAddr:"20 John Pound Rd., Tillsonburg, ON" } as any,
  { date:"2026-08-28", city:"Bala", country:"ON", venue:"Kee to Bala", venueAddr:"1015 Bala Falls Rd., Bala, ON P0C 1A0" } as any,
  { date:"2026-09-25", city:"London", country:"ON", venue:"TBD" } as any,
  { date:"2026-11-06", city:"Atlanta", country:"GA", venue:"The Masquerade – Altar", venueAddr:"50 Lower Alabama St., Atlanta, GA 30303" } as any,
  { date:"2026-11-07", city:"Charlotte", country:"NC", venue:"Snug Harbor", venueAddr:"1228 Gordon St., Charlotte, NC 28205" } as any,
  { date:"2026-11-08", city:"Richmond", country:"VA", venue:"The Camel", venueAddr:"2729 W. Broad St., Richmond, VA 23220" } as any,
  { date:"2026-11-11", city:"Baltimore", country:"MD", venue:"Metro Gallery", venueAddr:"1700 N. Charles St., Baltimore, MD" } as any,
  { date:"2026-11-12", city:"Philadelphia", country:"PA", venue:"Kung Fu Necktie", venueAddr:"1250 N. Front St., Philadelphia, PA 19122" } as any,
  { date:"2026-11-13", city:"Boston", country:"MA", venue:"Warehouse XI", venueAddr:"11 Sanborn Ct., Somerville, MA 02143" } as any,
  { date:"2026-11-14", city:"Brooklyn", country:"NY", venue:"The Wood Shop", venueAddr:"21A Meadow St., Brooklyn, NY 11206" } as any,
  { date:"2026-11-19", city:"Los Angeles", country:"CA", venue:"Moroccan Lounge", venueAddr:"901 E. 1st St., Los Angeles, CA 90012" } as any,
  { date:"2026-11-20", city:"Vancouver", country:"BC", venue:"Green Auto", venueAddr:"1822 Pandora St., Vancouver, BC V5L 1M5" } as any,
  { date:"2026-11-21", city:"Seattle", country:"WA", venue:"Fun Lounge", venueAddr:"109 Eastlake Ave E, Seattle, WA 98109" } as any,
];

const PNL_SEED: Record<string,any> = {
  "2026-05-25": { income:[{label:"Guarantee (€600)",amt:882}], expenses:[{label:"Van rental — 22 days + delivery (GBP)",amt:4275},{label:"Backline — Sideshow4U (GBP)",amt:1655.28},{label:"Diesel — Shell London (GBP)",amt:161.10},{label:"Diesel — Patcham Brighton (GBP)",amt:149.98},{label:"Diesel — Welcome Break Newport (GBP)",amt:172.21},{label:"Supplies — Lidl (GBP)",amt:28.86},{label:"AdBlue — BP Waalre (EUR)",amt:36.74}] },
  "2026-05-26": { income:[{label:"Guarantee (€300)",amt:441}], expenses:[{label:"Diesel — Q8 Sønderborg #1 (DKK)",amt:39.40},{label:"Diesel — Q8 Sønderborg #2 (DKK)",amt:175.83},{label:"Diesel — Aral Würzburg (EUR)",amt:170.51}] },
  "2026-05-28": { income:[{label:"Guarantee (€500)",amt:735}], expenses:[{label:"Diesel — Autohof Vöhringen (EUR)",amt:139.80},{label:"Diesel — Esso Péronne (EUR)",amt:147},{label:"Toll — Liefkenshoek (EUR)",amt:11.76},{label:"Toll — Sanef 23/05 (EUR)",amt:27.78},{label:"Toll — Sanef 24/05 (EUR)",amt:27.78}] },
  "2026-05-29": { income:[{label:"Guarantee (75% of first tix — TBD)",amt:0}], expenses:[{label:"Diesel — Intermarché (EUR)",amt:144.82},{label:"Toll — Area (EUR)",amt:22.34},{label:"Toll — SFTRF Maurienne (EUR)",amt:8.08},{label:"Toll — SFTRF Fréjus tunnel (EUR)",amt:81.58},{label:"Toll — SITAF a (EUR)",amt:11.03},{label:"Toll — SITAF b (EUR)",amt:8.08},{label:"Toll — Satap (EUR)",amt:26.61}] },
  "2026-05-30": { income:[{label:"Guarantee (€800)",amt:1176}], expenses:[{label:"Diesel — TotalEnergies Dijon (EUR)",amt:73.50},{label:"Diesel — Shell Sompuis (EUR)",amt:138.24},{label:"Diesel — Esso Angres (EUR)",amt:63.21},{label:"Toll — Corsa (EUR)",amt:82.91},{label:"Toll — ATMB Cluses (EUR)",amt:7.06},{label:"Toll — APRR (EUR)",amt:68.21},{label:"Toll — Sanef Reims (EUR)",amt:19.40},{label:"Toll — Sanef Calais (EUR)",amt:39.10}] },
  "2026-06-11": { income:[{label:"Guarantee",amt:0}], expenses:[{label:"Hotel — Travellers Inn (2 rooms)",amt:285.14},{label:"Drum beater — Long & McQuade",amt:38.70},{label:"Gas — Petro-Canada (Brighton)",amt:136.15},{label:"Gas — Shell (Valleyfield)",amt:50},{label:"Gas — Shell (Montmagny QC)",amt:145},{label:"Gas — Petro-Canada (Meductic NB)",amt:143.29},{label:"Pre-tour — LCBO hospitality",amt:61.20},{label:"Pre-tour — L&M strings/picks",amt:48.30},{label:"Pre-tour — Shell Montreal gas",amt:144.13},{label:"Pre-tour — Classic Towing",amt:113},{label:"Pre-tour — Esso gas (Apr 18)",amt:153.18},{label:"Pre-tour — Esso gas (Apr 30)",amt:93.24},{label:"Pre-tour — Petro-Canada Odessa gas",amt:143.22}] },
  "2026-06-12": { income:[{label:"Guarantee",amt:0}], expenses:[{label:"Hotel — Glendenning Hall",amt:179.99},{label:"Gas — Shell (Borden PE)",amt:130.51}] },
  "2026-06-13": { income:[{label:"Guarantee",amt:3500}] },
  "2026-06-14": { income:[{label:"Guarantee",amt:0}], expenses:[{label:"Hotel — Fairfield Inn Moncton",amt:222.25}] },
  "2026-06-18": { income:[{label:"Guarantee",amt:750}] },
  "2026-06-19": { income:[{label:"Guarantee",amt:300}] },
  "2026-06-21": { income:[{label:"Guarantee",amt:1000}] },
  "2026-06-26": { income:[{label:"Guarantee",amt:4000}], expenses:[{label:"Flight — TOR→VAN (Flair, all 4)",amt:1563.07}] },
  "2026-06-27": { income:[{label:"Guarantee",amt:4800}], expenses:[{label:"Flight — VAN→WPG (WestJet, all 4)",amt:1246.17}] },
  "2026-07-17": { income:[{label:"Guarantee",amt:1250}] },
  "2026-07-18": { income:[{label:"Guarantee",amt:5000}], expenses:[{label:"Flight — EDM→YZF + return (Cdn North, all 4)",amt:3225.20}] },
  "2026-08-07": { income:[{label:"Guarantee",amt:1000}] },
  "2026-08-28": { income:[{label:"Guarantee",amt:1000}] },
  "2026-09-25": { income:[{label:"Guarantee",amt:4000}] },
};

const MORNING_STEPS = [
  { id:"m1", time:"10 min", title:"No phone", desc:"Shower. Coffee. Window. Let your nervous system wake up before the world hits it." },
  { id:"m2", time:"5 min", title:"Box breathing", desc:"Inhale 4. Hold 4. Exhale 4. Hold 4. Repeat. This is medicine — treat it like your Vyvanse." },
  { id:"m3", time:"5 min", title:"One honest sentence", desc:"How are you actually feeling right now. Notes app. Nobody sees it. Gets it out of your head.", journal:"honest" },
  { id:"m4", time:"10 min", title:"Move your body", desc:"10 pushups. Walk around the van. Parking lot. Anything. Just move." },
  { id:"m5", time:"5 min", title:"One real good thing", desc:"Something specific and true about today. Not generic. Something real.", journal:"good" },
];
const NIGHT_STEPS = [
  { id:"n1", title:"Eat a real meal", desc:"Before anything else. Protein. This is the most important meal of your day." },
  { id:"n2", title:"Facial routine", desc:"You're already doing this. Keep it. It's grounding." },
  { id:"n4", title:"Phone across the room", desc:"Not face down beside you. Across the room. Make reaching for it an act." },
  { id:"n5", title:"One sentence written", desc:"Whatever is loudest in your head. Externalize it.", journal:"night" },
  { id:"n6", title:"Box breathing", desc:"Same as morning. 5 minutes. Then sleep." },
];
const CRISIS_STEPS = [
  { id:"c1", title:"Don't reach for the phone first", desc:"It's across the room. That distance is intentional." },
  { id:"c2", title:"Box breathing first", desc:"5 minutes before anything else." },
  { id:"c3", title:"Write one sentence", desc:"Whatever is loudest. Get it out of your head." },
  { id:"c4", title:"If ideations come", desc:"Text 988. Both are here.", crisis:true },
];
const VISION = [
  { year:"NOW → 18 MONTHS", color:"#ffd732", items:["Sell out every show","100K across TikTok / IG / YouTube","Record written and made","Mando sync conversation started","Team becomes affordable"] },
  { year:"YEAR 3", color:"#ff6b35", items:["Larger than Turnstile","Large theatre touring internationally","Big features + major syncs","Record out and working","Burn Industry label seeded with 5 artists"] },
  { year:"YEAR 5", color:"#e8192c", items:["18,000 capacity at home","Coachella top liner","Solo film released","Music/creative agency running","Multi-millionaire"] },
];
const BUMPER_TEMPLATES = [
  (city:string,station:string,venue:string,date:string) => `Hey, this is Denz from The OBGMs. You're listening to ${station}. We're playing ${venue} in ${city} on ${date}. Come through.`,
  (city:string,station:string,venue:string,date:string) => `What's up ${city}, Denz from The OBGMs on ${station}. We just finished tearing through Europe and we're bringing everything to ${venue} on ${date}. See you there.`,
  (city:string,station:string,venue:string,date:string) => `Hey ${city}, Denz from The OBGMs on ${station}. We built this band for people who look out for each other. Come find your people at ${venue} on ${date}.`,
];
const ROOMS = [
  { key:'today',    label:"LET'S WORK",        sub:'Master list · battles · energy', color:C.gold },
  { key:'routines', label:'ROUTINES',           sub:'Morning · Night · 2AM',          color:C.blue },
  { key:'journal',  label:'JOURNAL',            sub:'Your sentences, by day',          color:C.text },
  { key:'goals',    label:'GOALS',              sub:'The boss — 150K',                 color:C.red  },
  { key:'pocket',   label:"MUSICIAN'S POCKET",  sub:'Tour · bumpers · outreach',       color:C.orange },
  { key:'calendar', label:'CALENDAR',           sub:'Tour dates, month view',           color:C.blue },
  { key:'money',    label:'MONEY',              sub:'Income · debt · allocate',         color:C.gold },
];

function formatDate(str:string){const[,m,d]=str.split('-');const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return`${months[parseInt(m)-1]} ${parseInt(d)}`;}
function daysUntil(dateStr:string){const t=new Date();t.setHours(0,0,0,0);const g=new Date(dateStr);g.setHours(0,0,0,0);return Math.round((g.getTime()-t.getTime())/86400000);}

// Audio
let _ac:AudioContext|null=null;
function ac(){if(!_ac){try{_ac=new(window.AudioContext||(window as any).webkitAudioContext)();}catch{return null;}}if(_ac.state==='suspended')_ac.resume();return _ac;}
function blip(freq=440,dur=0.08,type='square' as OscillatorType,vol=0.15){const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur);}
function sfxTap(){blip(660,0.06,'square',0.12);}
function sfxCheck(){blip(880,0.07,'square',0.13);setTimeout(()=>blip(1320,0.09,'square',0.12),60);}
function sfxOpen(){blip(330,0.05,'sawtooth',0.10);setTimeout(()=>blip(495,0.06,'sawtooth',0.10),50);}
function sfxWarCry(){const c=ac();if(!c)return;[110,146,196,261].forEach((f,i)=>setTimeout(()=>blip(f,0.18,'sawtooth',0.16),i*70));setTimeout(()=>blip(523,0.5,'square',0.14),320);}
function sfxKO(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>blip(f,0.16,'square',0.16),i*90));}
let _mt:ReturnType<typeof setInterval>|null=null;
const seq=[196,0,261,0,294,0,261,0,196,0,174,0,196,0,0,0];let si=0;
function startMusic(){if(_mt)return;_mt=setInterval(()=>{const f=seq[si%seq.length];if(f)blip(f,0.12,'triangle',0.06);si++;},180);}
function stopMusic(){if(_mt){clearInterval(_mt);_mt=null;}}

export default function Dashboard() {
  const db = useAppData();
  const [screen,setScreen] = useState<'cold'|'hub'|'room'>('cold');
  const [room,setRoom]     = useState('today');
  const [drawer,setDrawer] = useState(false);
  const [shake,setShake]   = useState(false);
  const [showCrisis,setShowCrisis] = useState(false);
  const [crisisDone,setCrisisDone] = useState<Record<string,boolean>>({});
  const [newTask,setNewTask]   = useState('');
  const [newEnergy,setNewEnergy] = useState(2);
  const [newPriority,setNewPriority] = useState(2);
  const [unpText,setUnpText]   = useState('');
  const [unpEnergy,setUnpEnergy] = useState(1);
  const [copied,setCopied]     = useState('');
  const [pocketTab,setPocketTab] = useState('advance');
  const [advanceShow,setAdvanceShow] = useState('');
  const [advanceMode,setAdvanceMode] = useState('promoter');
  const [bumperCity,setBumperCity] = useState<any>(null);
  const [bumperVer,setBumperVer] = useState(0);
  const [localPnl,setLocalPnl] = useState<Record<string,any>>(PNL_SEED);
  const [bandEmails,setBandEmails] = useState('denz@burnindustry.com, simonouthit@gmail.com');

  const snd = (fn:()=>void) => { if(db.prefs.sound) fn(); };

  useEffect(()=>{ if(db.prefs.music && screen!=='cold') startMusic(); else stopMusic(); return ()=>stopMusic(); },[db.prefs.music,screen]);

  useEffect(()=>{
    if(db.loaded && db.advanceData) {
      // sync band emails from db if available
    }
  },[db.loaded]);

  const today = db.today;
  const todayShow = TOUR.find(s=>s.date===today&&s.city!=='OFF');
  const nextShows = TOUR.filter(s=>s.date>=today&&s.city!=='OFF').slice(0,3);

  const masterSorted = [...db.tasks].sort((a:any,b:any)=>(b.priority-a.priority)||(a.created_at<b.created_at?-1:1));
  const donIds = Object.keys(db.dailyState.battle_done||{}).filter(k=>(db.dailyState.battle_done||{})[k]);
  const slotIds = (db.dailyState.battle_slots||[null,null,null]).filter(Boolean);
  const available = masterSorted.filter((t:any)=>!slotIds.includes(t.id)&&!donIds.includes(t.id));
  let fi=0;
  const filledSlots=(db.dailyState.battle_slots||[null,null,null]).map((id:any)=>{if(id&&db.tasks.find((t:any)=>t.id===id))return id;const n=available[fi++];return n?n.id:null;});
  const battleTasks=filledSlots.map((id:any)=>db.tasks.find((t:any)=>t.id===id)||null);
  const battleEnergy=db.tasks.filter((t:any)=>(db.dailyState.battle_done||{})[t.id]).reduce((a:number,t:any)=>a+(t.energy||0),0);
  const unplannedEnergy=(db.dailyState.unplanned||[]).reduce((a:number,u:any)=>a+(u.energy||0),0);
  const energyBanked=battleEnergy+unplannedEnergy;
  const energyPct=Math.min(100,(energyBanked/ENERGY_TARGET)*100);
  const dayComplete=energyBanked>=ENERGY_TARGET;
  const morningCount=Object.values(db.dailyState.morning_done||{}).filter(Boolean).length;
  const nightCount=Object.values(db.dailyState.night_done||{}).filter(Boolean).length;

  useEffect(()=>{
    if(dayComplete&&!(db.dailyState.ko_shown)&&db.loaded){
      db.saveDailyState({...db.dailyState,ko_shown:true});
      snd(sfxKO);
      if(db.streak.last_day!==today) db.saveStreak(db.streak.count+1,today);
    }
  },[dayComplete,db.dailyState.ko_shown,db.loaded]);

  function copyText(text:string,key:string){navigator.clipboard.writeText(text).then(()=>{setCopied(key);setTimeout(()=>setCopied(''),2000);}).catch(()=>{});}

  async function signOut(){const s=createClient();await s.auth.signOut();window.location.href='/login';}
  function go(r:string){snd(sfxOpen);setRoom(r);setScreen('room');setDrawer(false);}

  const now = new Date();
  const days=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months3=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  const advData = db.advanceData;
  const upcoming = TOUR.filter((s:any)=>s.city!=='OFF'&&daysUntil(s.date)>=0);
  const selDate = advanceShow||(upcoming[0]&&upcoming[0].date)||'';
  const sel:any = TOUR.find((s:any)=>s.date===selDate);
  const advD:any = advData[selDate]||{};

  function setAdvField(date:string,field:string,value:string){
    db.saveAdvance(date,{...advData[date]||{},[field]:value});
  }
  function addPnlLine(date:string,kind:string){setLocalPnl(p=>{const r=p[date]||{};const l=r[kind]||[];return{...p,[date]:{...r,[kind]:[...l,{label:'',amt:0}]}};});}
  function setPnlLine(date:string,kind:string,i:number,field:string,value:string){setLocalPnl(p=>{const r=p[date]||{};const l=[...(r[kind]||[])];l[i]={...l[i],[field]:field==='amt'?(parseFloat(value)||0):value};return{...p,[date]:{...r,[kind]:l}};});}
  function removePnlLine(date:string,kind:string,i:number){setLocalPnl(p=>{const r=p[date]||{};const l=(r[kind]||[]).filter((_:any,idx:number)=>idx!==i);return{...p,[date]:{...r,[kind]:l}};});}

  const origin = typeof window!=='undefined'?window.location.origin:'';
  const SP_URL=origin+'/obgms-stage-plot.jpeg';
  const RD_URL=origin+'/obgms-rider.pdf';
  const promoterSubject=sel?`The OBGMs — Advance — ${sel.city} ${formatDate(sel.date)}`:'The OBGMs — Advance';
  const infoLines=(sel&&sel.info)?sel.info.map(([k,v]:string[])=>`${k}: ${v}`).join('\n'):'';
  const promoterBody=`Hello everyone,\n\nHope you're doing well! We're really excited to be a part of this show and can't wait to get in the room with everyone.\n\nPlease find our Stage Plot, Input List, and Rider below:\nStage Plot + Input List: ${SP_URL}\nRider: ${RD_URL}\n\nPlease fill in all fields below and reply back to this email at your earliest convenience. Don't hesitate to reach out if you have any questions.\n\nMAIN CONTACTS\nDensil McFarlane: denz@burnindustry.com\nSimon Outhit: simonouthit@gmail.com\n\nTRAVEL PARTY\nWe are traveling as a party of 4 in one van. We do not travel with a FOH engineer, monitor engineer, or lighting director.\n\nBACKLINE\nWe are comfortable backlining drums for the show. Other artists on the bill will need to provide their own breakables.\n\n---\n\nSHOW SCHEDULE\nPlease send the full show schedule for the day, including load-in, soundcheck, doors, set times for all acts, and curfew.\n\nVENUE\nLoad-in instructions:\nArrival contact (name & phone):\nParking (we need 1 van spot):\n\nPRODUCTION\nOur stage plot and rider are linked above. We are traveling with all backline but will need mics, stands, and DIs provided. Please flag any issues with this.\n\nCREW\nWe do not travel with a tour manager. Please confirm the following will be provided:\nHouse FOH engineer:\nMonitor engineer:\nLighting director:\n\nHOSPITALITY\nDressing room provided: (Y/N)\nDressing room location:\nMeals or buyout:\nWifi network:\nWifi password:\nShowers available:\nLaundry available:\n\nMERCHANDISING\nMerch table location:\nMerch split:\nHouse merch seller available if needed:\n\nCOMPS\nGuest list spots allocated:\nGuest list submitted to:\nDeadline:\n\nCONTACTS\nOn-site artist liaison (name, email, phone):\nProduction contact (name, email, phone):\n\nThanks so much — genuinely looking forward to this one.\n\nDenz — The OBGMs`;
  const bandBody=sel?`Team,\n\nHere's the info for ${sel.city} on ${formatDate(sel.date)}.\n\n═══ SHOW ═══\nVenue: ${advD.venue||sel.venue||'TBD'}\nAddress: ${advD.venueAddr||sel.venueAddr||'TBD'}\nLoad-in: ${advD.loadin||sel.loadin||'TBD'}\nSet time: ${advD.setTime||sel.setTime||'TBD'}\n${infoLines?'\n─ DETAILS ─\n'+infoLines+'\n':''}\n═══ STAY ═══\nHotel: ${advD.hotel||sel.hotel||'TBD'}\n${advD.hotelAddr?'Address: '+advD.hotelAddr+'\n':''}${advD.checkin?'Check-in: '+advD.checkin+'\n':''}${advD.conf?'Confirmation #: '+advD.conf+'\n':''}\n═══ TRAVEL ═══\n${advD.travelMode==='flight'||(sel.flight&&advD.travelMode!=='van')?(advD.flightInfo||sel.flight||'Flight — TBD'):'Van'+(advD.driveNotes?' — '+advD.driveNotes:'')}\n\n${advD.notes?'NOTES\n'+advD.notes+'\n\n':''}— Denz`:'';
  const promoterMailto=`mailto:${encodeURIComponent(advD.promoterEmail||'')}?subject=${encodeURIComponent(promoterSubject)}&body=${encodeURIComponent(promoterBody)}`;
  const bandMailto=`mailto:${encodeURIComponent(bandEmails)}?subject=${encodeURIComponent(sel?`${sel.city} ${formatDate(sel.date)} — show + stay`:'Show + stay details')}&body=${encodeURIComponent(bandBody)}`;

  const fld=(lbl2:string,key:string,ph:string)=>(
    <div style={{marginBottom:10}}>
      <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:C.muted,marginBottom:4}}>{lbl2}</div>
      <input value={advD[key]||''} onChange={e=>setAdvField(selDate,key,e.target.value)} placeholder={ph}
        style={{...mono,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'8px 10px',fontSize:12,color:C.text,outline:'none'}}/>
    </div>
  );

  const keyframesCSS=`@import url('https://fonts.googleapis.com/css2?family=Anton&family=Press+Start+2P&family=Space+Start+2P&family=Space+Mono:wght@400;700&display=swap');@keyframes biShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}@keyframes biBlink{0%,50%{opacity:1}51%,100%{opacity:0.25}}@keyframes biSlideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}@keyframes biPop{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}`;

  if(screen==='cold') return(
    <div onClick={()=>{snd(sfxWarCry);setShake(true);setTimeout(()=>setShake(false),420);setTimeout(()=>setScreen('hub'),260);}}
      style={{minHeight:'100vh',background:C.bg,color:C.text,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:24,textAlign:'center',...base,animation:shake?'biShake 0.4s':'none'}}>
      <style>{keyframesCSS}</style>
      <div style={{...mono,fontSize:10,letterSpacing:'0.45em',color:C.muted,marginBottom:24}}>BURN INDUSTRY / THE OBGMS</div>
      <div style={{...display,fontSize:'clamp(44px,13vw,92px)',lineHeight:0.92}}>LET'S</div>
      <div style={{...display,fontSize:'clamp(44px,13vw,92px)',lineHeight:0.92,color:C.red}}>FUCKING</div>
      <div style={{...display,fontSize:'clamp(44px,13vw,92px)',lineHeight:0.92,color:C.gold}}>GO</div>
      <div style={{...mono,fontSize:12,color:C.muted,maxWidth:300,marginTop:28,lineHeight:1.7}}>16,500 today. 150,000 by year end. Every show sold out. You drive the ship.</div>
      <div style={{...pixel,fontSize:9,color:C.gold,marginTop:36,animation:'biBlink 1.2s steps(1) infinite'}}>TAP TO ENTER</div>
    </div>
  );

  if(screen==='hub') return(
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,padding:'28px 20px 60px',...base}}>
      <style>{keyframesCSS}</style>
      <div style={{...mono,fontSize:9,letterSpacing:'0.45em',color:C.muted,marginBottom:8}}>BURN INDUSTRY / THE OBGMS</div>
      <div style={{...display,fontSize:'clamp(34px,9vw,56px)',lineHeight:0.95,marginBottom:6}}>CHOOSE YOUR<br/><span style={{color:C.red}}>BATTLE</span></div>
      <div style={{...mono,fontSize:11,color:C.muted,marginBottom:24}}>
        {todayShow?`Tonight: ${todayShow.city}`:nextShows[0]?`Next: ${nextShows[0].city} — ${formatDate(nextShows[0].date)}`:'No upcoming shows'}
        {db.streak.count>0?` · ${db.streak.count} day streak`:''}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10}}>
        {ROOMS.map(r=>(
          <button key={r.key} onClick={()=>go(r.key)}
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

  const activeRoom=ROOMS.find(r=>r.key===room)||ROOMS[0];
  return(
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,paddingBottom:80,...base}}>
      <style>{keyframesCSS}</style>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px 18px',borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,background:C.bg,zIndex:40}}>
        <button onClick={()=>{snd(sfxTap);setDrawer(true);}} style={{...base,background:'transparent',border:'none',color:C.text,fontSize:22,cursor:'pointer',lineHeight:1,padding:0}}>≡</button>
        <div style={{...display,fontSize:20,color:activeRoom.color,lineHeight:1}}>{activeRoom.label}</div>
        <button onClick={()=>{snd(sfxTap);setScreen('hub');}} style={{...mono,marginLeft:'auto',background:'transparent',border:`1px solid ${C.border}`,color:C.muted,fontSize:9,letterSpacing:'0.2em',padding:'6px 10px',borderRadius:3,cursor:'pointer'}}>HUB</button>
      </div>

      {drawer&&(
        <div onClick={()=>setDrawer(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:60}}>
          <div onClick={e=>e.stopPropagation()} style={{position:'absolute',left:0,top:0,bottom:0,width:268,maxWidth:'82vw',background:C.card,borderRight:`1px solid ${C.border}`,padding:'24px 18px',animation:'biSlideIn 0.22s ease-out',overflowY:'auto'}}>
            <div style={{...mono,fontSize:9,letterSpacing:'0.4em',color:C.muted,marginBottom:18}}>JUMP TO</div>
            {ROOMS.map(r=>(
              <button key={r.key} onClick={()=>go(r.key)}
                style={{...base,display:'block',width:'100%',textAlign:'left',background:room===r.key?'#0a0a0a':'transparent',border:`1px solid ${room===r.key?r.color:C.border}`,borderRadius:5,padding:'12px 14px',marginBottom:8,cursor:'pointer'}}>
                <div style={{...display,fontSize:16,color:r.color}}>{r.label}</div>
                <div style={{...mono,fontSize:10,color:C.muted,marginTop:2}}>{r.sub}</div>
              </button>
            ))}
            <div style={{borderTop:`1px solid ${C.border}`,margin:'18px 0 14px'}}/>
            <div style={{...mono,fontSize:9,letterSpacing:'0.4em',color:C.muted,marginBottom:12}}>SETTINGS</div>
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

        {room==='today'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:18}}>
            <div>
              <span style={{...display,fontSize:40}}>{days[now.getDay()]}</span>
              <span style={{...display,fontSize:40,color:C.gold,marginLeft:8}}>{now.getDate()}</span>
              <span style={{...mono,fontSize:13,color:C.muted,marginLeft:8,letterSpacing:'0.2em'}}>{months3[now.getMonth()]}</span>
            </div>
            {todayShow?(
              <div style={{textAlign:'right'}}>
                <div style={{...mono,fontSize:9,letterSpacing:'0.3em',color:C.gold,marginBottom:3}}>TONIGHT</div>
                <div style={{...display,fontSize:18}}>{todayShow.city}</div>
                {todayShow.venue&&todayShow.venue!=='TBD'&&<div style={{...mono,fontSize:11,color:C.muted}}>{todayShow.venue}</div>}
              </div>
            ):(
              <div style={{textAlign:'right'}}>
                <div style={{...mono,fontSize:9,letterSpacing:'0.3em',color:C.muted,marginBottom:3}}>NEXT SHOW</div>
                {nextShows[0]&&<div style={{...display,fontSize:16}}>{nextShows[0].city} — {formatDate(nextShows[0].date)}</div>}
              </div>
            )}
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
              <div style={{...mono,fontSize:11,color:C.muted}}>{energyBanked}/{ENERGY_TARGET} pts{db.streak.count>0?` · ${db.streak.count} day streak`:''}</div>
            </div>
            <div style={{background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,height:16,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${energyPct}%`,background:dayComplete?C.gold:`linear-gradient(90deg,${C.red},${C.gold})`,transition:'width 0.4s'}}/>
            </div>
            <div style={{...mono,fontSize:10,color:C.muted,marginTop:8,lineHeight:1.5}}>Battles + unplanned work bank points. Hit {ENERGY_TARGET} and the day's won — however you got there.</div>
          </div>

          {db.dailyState.ko_shown&&(
            <div style={{...card,borderColor:C.gold,textAlign:'center',background:'#14110a',animation:'biPop 0.3s'}}>
              <div style={{...pixel,fontSize:18,color:C.gold}}>DAY KILLED</div>
              <div style={{...mono,fontSize:11,color:C.muted,marginTop:8}}>{ENERGY_TARGET} energy banked. {db.streak.count} day streak. Rest up.</div>
            </div>
          )}

          <div style={{...card,borderLeft:`3px solid ${C.orange}`}}>
            <div style={{...lbl,color:C.orange}}>TODAY'S BATTLES</div>
            <div style={{...mono,fontSize:11,color:C.muted,lineHeight:1.6}}>The 3 things you're fighting today. Top priority auto-fills. Swap one back if it's not the move.</div>
          </div>
          {battleTasks.map((task:any,i:number)=>task?(
            <div key={task.id} style={{...card,border:`1px solid ${C.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start',flex:1}}>
                  <div style={chk(false,C.orange)} onClick={()=>{snd(sfxCheck);const bd={...db.dailyState.battle_done,[task.id]:true};const bs=(db.dailyState.battle_slots||[null,null,null]).map((x:any)=>x===task.id?null:x);db.saveDailyState({...db.dailyState,battle_done:bd,battle_slots:bs});}}/>
                  <div style={{flex:1}}>
                    <div style={{...mono,fontSize:14,color:C.text,lineHeight:1.5}}>{task.text}</div>
                    <div style={{...mono,fontSize:10,color:C.muted,marginTop:5,letterSpacing:'0.1em'}}>{'★'.repeat(task.priority)} · {task.energy} {task.energy===1?'pt':'pts'}</div>
                  </div>
                </div>
                <button onClick={()=>{snd(sfxTap);const bs=(db.dailyState.battle_slots||[null,null,null]).map((x:any)=>x===task.id?null:x);db.saveDailyState({...db.dailyState,battle_slots:bs});}} style={{...mono,background:'transparent',border:`1px solid ${C.border}`,borderRadius:3,color:C.muted,fontSize:9,letterSpacing:'0.1em',padding:'5px 8px',cursor:'pointer',whiteSpace:'nowrap'}}>SWAP ↩</button>
              </div>
            </div>
          ):(
            <div key={'e'+i} style={{...card,border:`1px dashed ${C.border}`,textAlign:'center'}}>
              <div style={{...mono,fontSize:11,color:C.dim}}>Empty slot — add tasks to the master list below</div>
            </div>
          ))}

          <div style={{...card,borderLeft:`3px solid ${C.red}`,marginTop:24}}>
            <div style={{...lbl,color:C.red}}>LOG UNPLANNED WORK</div>
            <div style={{...mono,fontSize:11,color:C.muted,lineHeight:1.6,marginBottom:12}}>A fire hit that wasn't on the list. Log it — it still counts.</div>
            <input value={unpText} onChange={e=>setUnpText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&unpText.trim()){snd(sfxCheck);const u=[...db.dailyState.unplanned,{text:unpText.trim(),energy:unpEnergy,t:Date.now()}];db.saveDailyState({...db.dailyState,unplanned:u});setUnpText('');setUnpEnergy(1);}}} placeholder="What came up?"
              style={{...mono,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'9px 11px',fontSize:13,color:C.text,outline:'none',marginBottom:10}}/>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{display:'flex',gap:5}}>
                {[1,2,3].map(n=><button key={n} onClick={()=>setUnpEnergy(n)} style={{...mono,width:32,height:32,borderRadius:3,border:`1px solid ${unpEnergy===n?C.red:C.border}`,background:unpEnergy===n?C.red:'transparent',color:unpEnergy===n?'#fff':C.muted,fontSize:13,fontWeight:700,cursor:'pointer'}}>{n}</button>)}
              </div>
              <button onClick={()=>{if(!unpText.trim())return;snd(sfxCheck);const u=[...db.dailyState.unplanned,{text:unpText.trim(),energy:unpEnergy,t:Date.now()}];db.saveDailyState({...db.dailyState,unplanned:u});setUnpText('');setUnpEnergy(1);}} style={{...btnFull(C.red),flex:1,color:'#fff'}}>LOG IT — BANK {unpEnergy} {unpEnergy===1?'PT':'PTS'}</button>
            </div>
          </div>
          {(db.dailyState.unplanned||[]).length>0&&(
            <div style={{...card}}>
              <div style={{...lbl,marginBottom:10}}>LOGGED TODAY ({unplannedEnergy} pts)</div>
              {(db.dailyState.unplanned||[]).map((u:any,i:number)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:i<(db.dailyState.unplanned||[]).length-1?`1px solid ${C.border}`:'none'}}>
                  <div style={{...mono,fontSize:12,color:C.muted,flex:1}}>{u.text}</div>
                  <div style={{...mono,fontSize:10,color:C.red,marginRight:8}}>+{u.energy}</div>
                  <button onClick={()=>{const u2=(db.dailyState.unplanned||[]).filter((_:any,idx:number)=>idx!==i);db.saveDailyState({...db.dailyState,unplanned:u2});}} style={{...mono,background:'transparent',border:'none',color:C.dim,fontSize:15,cursor:'pointer'}}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{...card,borderLeft:`3px solid ${C.gold}`,marginTop:24}}>
            <div style={{...lbl,color:C.gold}}>MASTER LIST</div>
            <div style={{...mono,fontSize:11,color:C.muted,lineHeight:1.6,marginBottom:12}}>Everything on your plate. Set priority + energy. Top 3 feed your battles.</div>
            <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newTask.trim()){snd(sfxTap);db.addTask(newTask.trim(),newEnergy,newPriority).then(()=>{setNewTask('');setNewEnergy(2);setNewPriority(2);});}}} placeholder="Add a task…"
              style={{...mono,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'9px 11px',fontSize:13,color:C.text,outline:'none',marginBottom:10}}/>
            <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                <span style={{...mono,fontSize:9,color:C.muted,letterSpacing:'0.1em'}}>PRIORITY</span>
                {[1,2,3].map(n=><button key={n} onClick={()=>setNewPriority(n)} style={{...mono,width:30,height:30,borderRadius:3,border:`1px solid ${newPriority===n?C.gold:C.border}`,background:newPriority===n?C.gold:'transparent',color:newPriority===n?'#0D0D0D':C.muted,fontSize:12,fontWeight:700,cursor:'pointer'}}>{'★'.repeat(n)}</button>)}
              </div>
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                <span style={{...mono,fontSize:9,color:C.muted,letterSpacing:'0.1em'}}>ENERGY</span>
                {[1,2,3].map(n=><button key={n} onClick={()=>setNewEnergy(n)} style={{...mono,width:30,height:30,borderRadius:3,border:`1px solid ${newEnergy===n?C.orange:C.border}`,background:newEnergy===n?C.orange:'transparent',color:newEnergy===n?'#0D0D0D':C.muted,fontSize:12,fontWeight:700,cursor:'pointer'}}>{n}</button>)}
              </div>
              <button onClick={()=>{if(!newTask.trim())return;snd(sfxTap);db.addTask(newTask.trim(),newEnergy,newPriority).then(()=>{setNewTask('');setNewEnergy(2);setNewPriority(2);});}} style={{...btnFull(C.gold),flex:1,minWidth:80}}>ADD</button>
            </div>
          </div>

          {masterSorted.filter((t:any)=>!(db.dailyState.battle_done||{})[t.id]).map((task:any)=>{
            const inBattle=filledSlots.includes(task.id);
            return(
              <div key={task.id} style={{...card,opacity:inBattle?0.55:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
                  <div style={{display:'flex',gap:11,alignItems:'flex-start',flex:1}}>
                    <div style={chk(false,C.gold)} onClick={()=>{snd(sfxCheck);const bd={...db.dailyState.battle_done,[task.id]:true};const bs=(db.dailyState.battle_slots||[null,null,null]).map((x:any)=>x===task.id?null:x);db.saveDailyState({...db.dailyState,battle_done:bd,battle_slots:bs});}}/>
                    <div style={{flex:1}}>
                      <div style={{...mono,fontSize:13,color:C.text,lineHeight:1.5}}>{task.text}</div>
                      <div style={{display:'flex',gap:6,alignItems:'center',marginTop:7}}>
                        {[1,2,3].map(n=><button key={n} onClick={()=>db.updateTask(task.id,{priority:n})} style={{...mono,fontSize:11,color:task.priority>=n?C.gold:C.dim,background:'transparent',border:'none',cursor:'pointer',padding:0}}>★</button>)}
                        <span style={{...mono,fontSize:10,color:C.muted,marginLeft:4}}>{task.energy} {task.energy===1?'pt':'pts'}</span>
                        {inBattle&&<span style={{...mono,fontSize:9,color:C.orange,letterSpacing:'0.1em',marginLeft:4}}>IN BATTLE</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    {!inBattle&&<button onClick={()=>{snd(sfxTap);const bs=[...(db.dailyState.battle_slots||[null,null,null])];const oi=bs.findIndex((x:any)=>!x||!db.tasks.find((t:any)=>t.id===x));bs[oi===-1?0:oi]=task.id;db.saveDailyState({...db.dailyState,battle_slots:bs});}} style={{...mono,background:'transparent',border:`1px solid ${C.orange}`,borderRadius:3,color:C.orange,fontSize:9,letterSpacing:'0.1em',padding:'5px 8px',cursor:'pointer',whiteSpace:'nowrap'}}>→ BATTLE</button>}
                    <button onClick={()=>db.removeTask(task.id)} style={{...mono,background:'transparent',border:'none',color:C.dim,fontSize:16,cursor:'pointer'}}>×</button>
                  </div>
                </div>
              </div>
            );
          })}
          {db.tasks.length===0&&<div style={{...card,textAlign:'center'}}><div style={{...mono,fontSize:12,color:C.dim,lineHeight:1.6}}>Master list is empty. Add what's on your plate above.</div></div>}
          {db.tasks.filter((t:any)=>(db.dailyState.battle_done||{})[t.id]).length>0&&(
            <div style={{...card,marginTop:16}}>
              <div style={{...lbl,color:C.gold,marginBottom:10}}>DONE — {battleEnergy} PTS BANKED</div>
              {db.tasks.filter((t:any)=>(db.dailyState.battle_done||{})[t.id]).map((task:any)=>(
                <div key={task.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:'flex',gap:10,alignItems:'center',flex:1}}>
                    <div style={{...chk(true,C.gold)}}><span style={{fontSize:11,color:'#0D0D0D',fontWeight:900}}>✓</span></div>
                    <span style={{...mono,fontSize:12,color:C.muted,textDecoration:'line-through',lineHeight:1.4}}>{task.text}</span>
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

        {room==='routines'&&<>
          <div style={{...card,borderLeft:`3px solid ${C.gold}`}}>
            <div style={{...lbl,color:C.gold}}>MORNING PROTOCOL</div>
            <div style={{...mono,fontSize:12,color:C.muted}}>Starts when you start moving. Not at a clock time.</div>
          </div>
          {MORNING_STEPS.map((step:any)=>(
            <div key={step.id} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'14px 0',borderBottom:`1px solid ${C.border}`,opacity:(db.dailyState.morning_done||{})[step.id]?0.4:1,cursor:'pointer'}}
              onClick={()=>{snd(sfxCheck);const md={...db.dailyState.morning_done,[step.id]:!(db.dailyState.morning_done||{})[step.id]};db.saveDailyState({...db.dailyState,morning_done:md});}}>
              <div style={chk(!!(db.dailyState.morning_done||{})[step.id],C.gold)}>{(db.dailyState.morning_done||{})[step.id]&&<span style={{fontSize:12,color:'#0D0D0D',fontWeight:900}}>✓</span>}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:4}}>
                  <span style={{...mono,fontSize:13,fontWeight:700}}>{step.title}</span>
                  <span style={{...mono,fontSize:10,color:C.muted}}>{step.time}</span>
                </div>
                <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.6}}>{step.desc}</div>
                {step.journal&&(
                  <input onClick={e=>e.stopPropagation()} value={db.journal[today]?.[step.journal]||''} onChange={e=>db.saveJournal(today,step.journal,e.target.value)} placeholder="Write it here — saved to JOURNAL"
                    style={{...mono,marginTop:10,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'8px 10px',fontSize:12,color:C.text,outline:'none'}}/>
                )}
              </div>
            </div>
          ))}
          {morningCount===MORNING_STEPS.length&&<div style={{...card,borderColor:C.gold,textAlign:'center',marginTop:12}}><div style={{...display,fontSize:16,color:C.gold}}>MORNING DONE.</div></div>}

          <div style={{...card,borderLeft:`3px solid ${C.blue}`,marginTop:24}}>
            <div style={{...lbl,color:C.blue}}>NIGHT PROTOCOL</div>
            <div style={{...mono,fontSize:12,color:C.muted}}>After load out and fans. In this order.</div>
          </div>
          {NIGHT_STEPS.map((step:any)=>(
            <div key={step.id} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'14px 0',borderBottom:`1px solid ${C.border}`,opacity:(db.dailyState.night_done||{})[step.id]?0.4:1,cursor:'pointer'}}
              onClick={()=>{snd(sfxCheck);const nd={...db.dailyState.night_done,[step.id]:!(db.dailyState.night_done||{})[step.id]};db.saveDailyState({...db.dailyState,night_done:nd});}}>
              <div style={chk(!!(db.dailyState.night_done||{})[step.id],C.blue)}>{(db.dailyState.night_done||{})[step.id]&&<span style={{fontSize:12,color:'#0D0D0D',fontWeight:900}}>✓</span>}</div>
              <div style={{flex:1}}>
                <div style={{...mono,fontSize:13,fontWeight:700,marginBottom:4}}>{step.title}</div>
                <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.6}}>{step.desc}</div>
                {step.journal&&(
                  <input onClick={e=>e.stopPropagation()} value={db.journal[today]?.[step.journal]||''} onChange={e=>db.saveJournal(today,step.journal,e.target.value)} placeholder="Write it here — saved to JOURNAL"
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
              {CRISIS_STEPS.map((step:any)=>(
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

        {room==='journal'&&<>
          <div style={{...card,borderLeft:`3px solid ${C.text}`}}>
            <div style={{...lbl}}>JOURNAL</div>
            <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.6}}>Your three sentences, kept by day. Write them in ROUTINES — they collect here.</div>
          </div>
          {Object.entries(db.journal).sort(([a],[b])=>b.localeCompare(a)).map(([date,entry]:any)=>{
            if(!entry?.honest&&!entry?.good&&!entry?.night) return null;
            const FIELDS=[['honest','HONEST',C.gold],['good','ONE GOOD THING',C.orange],['night','NIGHT',C.blue]];
            return(
              <div key={date} style={card}>
                <div style={{...lbl,marginBottom:10}}>{date===today?'TODAY':formatDate(date)}</div>
                {FIELDS.map(([k,l,c])=>entry[k]?(
                  <div key={String(k)} style={{marginBottom:10}}>
                    <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:String(c),marginBottom:3}}>{String(l)}</div>
                    <div style={{...mono,fontSize:13,color:C.text,lineHeight:1.5}}>{entry[String(k)]}</div>
                  </div>
                ):null)}
              </div>
            );
          })}
          {Object.keys(db.journal).length===0&&<div style={{...mono,fontSize:12,color:C.muted,fontStyle:'italic',paddingTop:8}}>Nothing logged yet. Your sentences show up here once you write them in ROUTINES.</div>}
        </>}

        {room==='goals'&&<>
          <div style={{...card,borderLeft:`3px solid ${C.red}`,marginBottom:18}}>
            <div style={{...lbl,color:C.red}}>THE BOSS — 150K FOLLOWERS</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:8,marginBottom:8}}>
              <span style={{...display,fontSize:28,color:C.gold}}>{FOLLOWERS_NOW.toLocaleString()}</span>
              <span style={{...mono,fontSize:12,color:C.muted}}>/ {FOLLOWER_GOAL.toLocaleString()}</span>
            </div>
            <div style={{background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,height:18,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.max((FOLLOWERS_NOW/FOLLOWER_GOAL)*100,2)}%`,background:`linear-gradient(90deg,${C.red},${C.gold})`}}/>
            </div>
            <div style={{...mono,fontSize:11,color:C.muted,marginTop:8}}>{Math.round((FOLLOWERS_NOW/FOLLOWER_GOAL)*100)}% chipped down. {(FOLLOWER_GOAL-FOLLOWERS_NOW).toLocaleString()} health left on the boss.</div>
          </div>
          <div style={{...card,borderLeft:`3px solid ${C.gold}`}}>
            <div style={{...lbl,color:C.gold}}>THE MISSION</div>
            <div style={{...mono,fontSize:13,color:C.muted,lineHeight:1.7,fontStyle:'italic'}}>"Protecting each other because the government won't."</div>
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

        {room==='pocket'&&<>
          <div style={{display:'flex',gap:6,marginBottom:16}}>
            {[['advance','ADVANCE'],['pnl','TOUR P&L']].map(([k,l])=>(
              <button key={k} onClick={()=>{snd(sfxTap);setPocketTab(k);}}
                style={{...mono,flex:1,padding:'9px 10px',borderRadius:3,border:`1px solid ${pocketTab===k?C.gold:C.border}`,background:pocketTab===k?C.gold:'transparent',color:pocketTab===k?'#0D0D0D':C.muted,fontSize:11,letterSpacing:'0.14em',fontWeight:700,cursor:'pointer'}}>{l}</button>
            ))}
          </div>

          {pocketTab==='advance'&&<>
            <div style={{...card,borderLeft:`3px solid ${C.red}`}}>
              <div style={{...lbl,color:C.red}}>ADVANCE</div>
              <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.6}}>Generate the promoter advance and band logistics email for any upcoming show.</div>
            </div>
            <div style={{...lbl,marginBottom:8}}>SHOW</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
              {upcoming.map((s:any,i:number)=>(
                <button key={i} style={{...mono,padding:'6px 12px',borderRadius:3,border:`1px solid ${selDate===s.date?C.red:C.border}`,background:selDate===s.date?C.red:'transparent',color:selDate===s.date?'#0D0D0D':C.muted,fontSize:10,letterSpacing:'0.1em',cursor:'pointer'}}
                  onClick={()=>{snd(sfxTap);setAdvanceShow(s.date);}}>{s.city} {formatDate(s.date)}</button>
              ))}
              {upcoming.length===0&&<div style={{...mono,fontSize:12,color:C.muted,fontStyle:'italic'}}>No upcoming shows.</div>}
            </div>
            <div style={{display:'flex',gap:6,marginBottom:14}}>
              {[['promoter','PROMOTER ADVANCE'],['band','BAND LOGISTICS']].map(([k,l])=>(
                <button key={k} onClick={()=>{snd(sfxTap);setAdvanceMode(k);}}
                  style={{...mono,flex:1,padding:'8px 10px',borderRadius:3,border:`1px solid ${advanceMode===k?C.gold:C.border}`,background:advanceMode===k?C.gold:'transparent',color:advanceMode===k?'#0D0D0D':C.muted,fontSize:10,letterSpacing:'0.12em',fontWeight:700,cursor:'pointer'}}>{l}</button>
              ))}
            </div>
            {sel&&advanceMode==='promoter'&&(
              <div style={card}>
                {fld('PROMOTER EMAIL (optional)','promoterEmail','promoter@venue.com')}
                <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:C.muted,margin:'4px 0 6px'}}>PREVIEW</div>
                <div style={{...mono,background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:12,fontSize:11,lineHeight:1.6,color:C.text,whiteSpace:'pre-wrap',maxHeight:200,overflowY:'auto',marginBottom:12}}>{promoterBody}</div>
                <div style={{display:'flex',gap:8}}>
                  <button style={{...btnFull(C.gold),flex:1}} onClick={()=>copyText(promoterBody,'padv')}>{copied==='padv'?'COPIED ✓':'COPY EMAIL'}</button>
                  <a href={promoterMailto} style={{...btnOut(C.gold),flex:1,textAlign:'center',textDecoration:'none'}}>OPEN IN MAIL</a>
                </div>
              </div>
            )}
            {sel&&advanceMode==='band'&&(
              <div style={card}>
                <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:C.muted,marginBottom:4}}>BAND EMAILS (saved)</div>
                <input value={bandEmails} onChange={e=>setBandEmails(e.target.value)} placeholder="comma-separated"
                  style={{...mono,width:'100%',background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'8px 10px',fontSize:12,color:C.text,outline:'none',marginBottom:14}}/>
                {fld('VENUE','venue',sel.venue&&sel.venue!=='TBD'?sel.venue:'venue')}
                {fld('VENUE ADDRESS','venueAddr',sel.venueAddr||'street, city')}
                {fld('LOAD-IN','loadin',sel.loadin||'e.g. 4:00 PM')}
                {fld('SET TIME','setTime',sel.setTime||'e.g. 10:30 PM')}
                {fld('HOTEL','hotel',sel.hotel||'hotel name')}
                {fld('HOTEL ADDRESS','hotelAddr','street, city')}
                {fld('CHECK-IN','checkin','e.g. June 13, after 3 PM')}
                {fld('CONFIRMATION #','conf','booking ref')}
                <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:C.muted,margin:'4px 0 6px'}}>TRAVEL</div>
                <div style={{display:'flex',gap:6,marginBottom:10}}>
                  {[['van','VAN'],['flight','FLIGHT']].map(([k,l])=>{const active=advD.travelMode===k||(!advD.travelMode&&k==='flight'&&sel.flight)||(!advD.travelMode&&k==='van'&&!sel.flight);return(<button key={k} onClick={()=>setAdvField(selDate,'travelMode',k)} style={{...mono,flex:1,padding:'7px 10px',borderRadius:3,border:`1px solid ${active?C.blue:C.border}`,background:active?C.blue:'transparent',color:active?'#0D0D0D':C.muted,fontSize:10,letterSpacing:'0.12em',fontWeight:700,cursor:'pointer'}}>{l}</button>);})}
                </div>
                {(advD.travelMode==='flight'||(!advD.travelMode&&sel.flight))?(
                  <>
                    {sel.flight&&<div style={{...mono,fontSize:11,color:C.blue,lineHeight:1.5,background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:10,marginBottom:10,whiteSpace:'pre-wrap'}}>{sel.flight}</div>}
                    {fld('FLIGHT (override)','flightInfo',sel.flight||'airline, flight #, conf, times, seats')}
                  </>
                ):fld('DRIVE NOTES','driveNotes','route, departure, drive time')}
                {fld('NOTES','notes','anything else')}
                <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:C.muted,margin:'4px 0 6px'}}>PREVIEW</div>
                <div style={{...mono,background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:12,fontSize:11,lineHeight:1.6,color:C.text,whiteSpace:'pre-wrap',maxHeight:200,overflowY:'auto',marginBottom:12}}>{bandBody}</div>
                <div style={{display:'flex',gap:8}}>
                  <button style={{...btnFull(C.gold),flex:1}} onClick={()=>copyText(bandBody,'badv')}>{copied==='badv'?'COPIED ✓':'COPY EMAIL'}</button>
                  <a href={bandMailto} style={{...btnOut(C.gold),flex:1,textAlign:'center',textDecoration:'none'}}>OPEN IN MAIL</a>
                </div>
              </div>
            )}
            <div style={card}>
              <div style={{...lbl,marginBottom:8}}>DOCS</div>
              <a href={SP_URL} target="_blank" rel="noreferrer" style={{...mono,display:'block',fontSize:12,color:C.gold,marginBottom:8,textDecoration:'none'}}>→ Stage Plot + Input List</a>
              <a href={RD_URL} target="_blank" rel="noreferrer" style={{...mono,display:'block',fontSize:12,color:C.gold,textDecoration:'none'}}>→ Hospitality Rider</a>
            </div>
            <div style={{borderTop:`1px solid ${C.border}`,margin:'24px 0 4px'}}/>
            <div style={{...card,borderLeft:`3px solid ${C.gold}`}}>
              <div style={{...lbl,color:C.gold}}>OUTREACH RULE</div>
              <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.6}}>Every city you play in 14 days gets outreach today. Promoter first. Then radio. Then press.</div>
            </div>
            <div style={{...lbl,marginBottom:10}}>NEEDS OUTREACH NOW</div>
            {TOUR.filter((s:any)=>s.city!=='OFF'&&daysUntil(s.date)>0&&daysUntil(s.date)<=21).map((show:any,i:number)=>(
              <div key={i} style={card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <div style={{...display,fontSize:18}}>{show.city}</div>
                    <div style={{...mono,fontSize:11,color:C.muted}}>{formatDate(show.date)} · {show.venue&&show.venue!=='TBD'?show.venue:'venue TBD'}</div>
                  </div>
                  <div style={{...mono,fontSize:11,color:daysUntil(show.date)<=7?C.red:C.orange,fontWeight:700}}>{daysUntil(show.date)}D</div>
                </div>
                {show.radio&&<div style={{...mono,marginTop:8,fontSize:11,color:C.muted,borderTop:`1px solid ${C.border}`,paddingTop:8}}>Radio: {show.radio} — {show.radioEmail}</div>}
              </div>
            ))}
            {TOUR.filter((s:any)=>s.city!=='OFF'&&daysUntil(s.date)>0&&daysUntil(s.date)<=21).length===0&&<div style={{...mono,fontSize:12,color:C.muted,fontStyle:'italic',paddingBottom:8}}>No shows in the next 21 days.</div>}
            <div style={{...card,borderLeft:`3px solid ${C.orange}`,marginTop:16}}>
              <div style={{...lbl,color:C.orange}}>RADIO BUMPERS</div>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
              {TOUR.filter((s:any)=>s.radio&&s.city!=='OFF').map((show:any,i:number)=>(
                <button key={i} style={{...mono,padding:'6px 12px',borderRadius:3,border:`1px solid ${bumperCity?.city===show.city?C.orange:C.border}`,background:bumperCity?.city===show.city?C.orange:'transparent',color:bumperCity?.city===show.city?'#0D0D0D':C.muted,fontSize:10,letterSpacing:'0.2em',cursor:'pointer'}}
                  onClick={()=>{snd(sfxTap);setBumperCity(show);setBumperVer(0);}}>{show.city}</button>
              ))}
            </div>
            {bumperCity&&(
              <div style={card}>
                <div style={{...lbl,color:C.orange}}>{bumperCity.city.toUpperCase()} — {bumperCity.radio}</div>
                <div style={{display:'flex',gap:6,marginBottom:14}}>
                  {[0,1,2].map(v=><button key={v} style={{...mono,padding:'5px 10px',borderRadius:3,border:`1px solid ${bumperVer===v?C.gold:C.border}`,background:bumperVer===v?C.gold:'transparent',color:bumperVer===v?'#0D0D0D':C.muted,fontSize:10,cursor:'pointer'}} onClick={()=>setBumperVer(v)}>V{v+1}</button>)}
                </div>
                <div style={{...mono,background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:14,fontSize:13,lineHeight:1.7,color:C.text,fontStyle:'italic',marginBottom:12}}>"{BUMPER_TEMPLATES[bumperVer](bumperCity.city,bumperCity.radio,bumperCity.venue!=='TBD'?bumperCity.venue:'the venue',formatDate(bumperCity.date))}"</div>
                <button style={btnFull(C.gold)} onClick={()=>copyText(BUMPER_TEMPLATES[bumperVer](bumperCity.city,bumperCity.radio,bumperCity.venue!=='TBD'?bumperCity.venue:'the venue',formatDate(bumperCity.date)),'bumper')}>{copied==='bumper'?'COPIED ✓':'COPY SCRIPT'}</button>
                <div style={{...mono,marginTop:12,fontSize:11,color:C.muted,borderLeft:`2px solid ${C.border}`,paddingLeft:10}}>Send to: {bumperCity.radioEmail}</div>
              </div>
            )}
            <div style={{...card,marginTop:16}}>
              <div style={{...lbl,marginBottom:12}}>FULL TOUR — {TOUR.filter((s:any)=>s.city!=='OFF').length} SHOWS</div>
              {TOUR.map((show:any,i:number)=>{const d=daysUntil(show.date);const isPast=d<0;const isToday=d===0;return(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${C.border}`,opacity:isPast?0.25:1}}>
                  <div style={{...mono,fontSize:12,color:isToday?C.gold:show.city==='OFF'?C.dim:C.text,fontWeight:isToday?700:400}}>
                    {show.city==='OFF'?'— OFF —':show.city}{show.country&&show.city!=='OFF'&&<span style={{fontSize:10,color:C.muted,marginLeft:6}}>{show.country}</span>}
                  </div>
                  <div style={{...mono,fontSize:11,color:isToday?C.gold:C.muted}}>{isToday?'TONIGHT':formatDate(show.date)}</div>
                </div>
              );})}
            </div>
          </>}

          {pocketTab==='pnl'&&(()=>{
            const fmtCAD=(n:number)=>'$'+n.toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
            const shows=TOUR.filter((s:any)=>s.city!=='OFF');
            let tourIn=0,tourOut=0;
            shows.forEach((s:any)=>{const r=localPnl[s.date]||{};(r.income||[]).forEach((l:any)=>tourIn+=(l.amt||0));(r.expenses||[]).forEach((l:any)=>tourOut+=(l.amt||0));});
            const tourNet=tourIn-tourOut;
            const rowsToShow=shows.filter((s:any)=>{const r=localPnl[s.date]||{};return(r.income&&r.income.length)||(r.expenses&&r.expenses.length)||s.date===selDate;});
            const lineRow=(s:any,kind:string)=>(localPnl[s.date]?.[kind]||[]).map((l:any,i:number)=>(
              <div key={kind+i} style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
                <input value={l.label} onChange={e=>setPnlLine(s.date,kind,i,'label',e.target.value)} placeholder={kind==='income'?'income source':'expense'}
                  style={{...mono,flex:1,background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'7px 9px',fontSize:12,color:C.text,outline:'none'}}/>
                <input value={l.amt||''} onChange={e=>setPnlLine(s.date,kind,i,'amt',e.target.value)} placeholder="0" inputMode="decimal"
                  style={{...mono,width:74,background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:3,padding:'7px 9px',fontSize:12,color:kind==='income'?C.gold:C.text,outline:'none',textAlign:'right'}}/>
                <button onClick={()=>removePnlLine(s.date,kind,i)} style={{...mono,background:'transparent',border:'none',color:C.muted,fontSize:16,cursor:'pointer',padding:'0 4px'}}>×</button>
              </div>
            ));
            return(<>
              <div style={{...card,borderLeft:`3px solid ${tourNet>=0?C.gold:C.red}`}}>
                <div style={{...lbl,color:tourNet>=0?C.gold:C.red}}>TOUR P&L</div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
                  <div><div style={{...mono,fontSize:9,color:C.muted,letterSpacing:'0.15em'}}>IN</div><div style={{...mono,fontSize:15,color:C.gold}}>{fmtCAD(tourIn)}</div></div>
                  <div><div style={{...mono,fontSize:9,color:C.muted,letterSpacing:'0.15em'}}>OUT</div><div style={{...mono,fontSize:15,color:C.text}}>{fmtCAD(tourOut)}</div></div>
                  <div><div style={{...mono,fontSize:9,color:C.muted,letterSpacing:'0.15em'}}>NET</div><div style={{...mono,fontSize:15,fontWeight:700,color:tourNet>=0?C.gold:C.red}}>{tourNet<0?'−':''}{fmtCAD(Math.abs(tourNet))}</div></div>
                </div>
              </div>
              <div style={{...lbl,marginBottom:8}}>ADD TO SHOW</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
                {shows.map((s:any,i:number)=>(
                  <button key={i} style={{...mono,padding:'6px 10px',borderRadius:3,border:`1px solid ${selDate===s.date?C.gold:C.border}`,background:selDate===s.date?C.gold:'transparent',color:selDate===s.date?'#0D0D0D':C.muted,fontSize:10,letterSpacing:'0.08em',cursor:'pointer'}}
                    onClick={()=>{snd(sfxTap);setAdvanceShow(s.date);}}>{s.city} {formatDate(s.date)}</button>
                ))}
              </div>
              {rowsToShow.map((s:any)=>{
                const r=localPnl[s.date]||{};
                const inSum=(r.income||[]).reduce((a:number,l:any)=>a+(l.amt||0),0);
                const outSum=(r.expenses||[]).reduce((a:number,l:any)=>a+(l.amt||0),0);
                const net=inSum-outSum;
                return(
                  <div key={s.date} style={{...card,border:`1px solid ${s.date===selDate?C.gold:C.border}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
                      <div style={{...mono,fontSize:14,fontWeight:700}}>{s.city}</div>
                      <div style={{...mono,fontSize:11,color:C.muted}}>{formatDate(s.date)} · net <span style={{color:net>=0?C.gold:C.red}}>{net<0?'−':''}{fmtCAD(Math.abs(net))}</span></div>
                    </div>
                    <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:C.gold,marginBottom:6}}>INCOME</div>
                    {lineRow(s,'income')}
                    <button onClick={()=>addPnlLine(s.date,'income')} style={{...mono,background:'transparent',border:`1px dashed ${C.border}`,borderRadius:3,color:C.muted,fontSize:10,padding:'6px 10px',cursor:'pointer',marginBottom:14,width:'100%'}}>+ income</button>
                    <div style={{...mono,fontSize:9,letterSpacing:'0.2em',color:C.muted,marginBottom:6}}>EXPENSES</div>
                    {lineRow(s,'expenses')}
                    <button onClick={()=>addPnlLine(s.date,'expenses')} style={{...mono,background:'transparent',border:`1px dashed ${C.border}`,borderRadius:3,color:C.muted,fontSize:10,padding:'6px 10px',cursor:'pointer',width:'100%'}}>+ expense</button>
                  </div>
                );
              })}
            </>);
          })()}
        </>}

        {room==='calendar'&&<>
          <div style={{...card,borderLeft:`3px solid ${C.blue}`}}>
            <div style={{...lbl,color:C.blue}}>TOUR CALENDAR</div>
            <div style={{...mono,fontSize:12,color:C.muted,lineHeight:1.6}}>Month view of show dates. Tap a show to open its advance.</div>
          </div>
          {(()=>{
            const mNames=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
            const showMonths=[...new Set(TOUR.filter((s:any)=>s.city!=='OFF'&&daysUntil(s.date)>=-31).map((s:any)=>s.date.slice(0,7)))].sort() as string[];
            const dow=['S','M','T','W','T','F','S'];
            return showMonths.map(ym=>{
              const[yy,mm]=ym.split('-').map(Number);
              const firstDay=new Date(yy,mm-1,1).getDay();
              const daysInM=new Date(yy,mm,0).getDate();
              const cells:any[]=[];
              for(let i=0;i<firstDay;i++)cells.push(null);
              for(let dn=1;dn<=daysInM;dn++)cells.push(dn);
              return(
                <div key={ym} style={card}>
                  <div style={{...lbl,color:C.blue,marginBottom:12}}>{mNames[mm-1]} {yy}</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
                    {dow.map((d,i)=><div key={'h'+i} style={{...mono,fontSize:9,color:C.muted,textAlign:'center',padding:'2px 0'}}>{d}</div>)}
                    {cells.map((dn,i)=>{
                      if(!dn)return<div key={'e'+i}/>;
                      const ds=`${yy}-${String(mm).padStart(2,'0')}-${String(dn).padStart(2,'0')}`;
                      const show:any=TOUR.find((s:any)=>s.date===ds&&s.city!=='OFF');
                      const isTod=ds===today;
                      return(
                        <div key={ds} onClick={()=>{if(show){setAdvanceShow(ds);setAdvanceMode('band');go('pocket');}}}
                          style={{aspectRatio:'1',borderRadius:3,border:`1px solid ${isTod?C.gold:show?C.red:C.border}`,background:show?C.red:'transparent',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:show?'pointer':'default',padding:2,overflow:'hidden'}}>
                          <div style={{...mono,fontSize:11,fontWeight:show?700:400,color:show?'#0D0D0D':isTod?C.gold:C.muted}}>{dn}</div>
                          {show&&<div style={{...mono,fontSize:7,color:'#0D0D0D',letterSpacing:'0.02em',textAlign:'center',lineHeight:1,marginTop:1,maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{show.city.slice(0,6)}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
          <div style={{...mono,fontSize:10,color:C.muted,marginTop:4,lineHeight:1.6}}><span style={{color:C.red}}>■</span> Show night &nbsp; <span style={{color:C.gold}}>□</span> Today</div>
        </>}

        {room==='money'&&(
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
