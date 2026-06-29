'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const C = { bg:'#0D0D0D', card:'#111', border:'#1e1e1e', gold:'#FFD60A', red:'#D91F26', text:'#F2F2F2', muted:'#666' };
const mono = { fontFamily:"'Space Mono',monospace" };
const display = { fontFamily:"'Anton',sans-serif", letterSpacing:'0.02em', textTransform:'uppercase' as const };
const pixel = { fontFamily:"'Press Start 2P',monospace" };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setStatus('error'); setErr(error.message); return; }
    setStatus('sent');
  }

  return (
    <main style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', ...mono }}>
      <div style={{ width:'100%', maxWidth:380, background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'2.5rem 2rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${C.red},${C.gold})` }} />
        <div style={{ ...display, fontSize:'1.8rem', color:C.text, lineHeight:0.95, marginBottom:6 }}>BURN<br/><span style={{ color:C.gold }}>INDUSTRY</span></div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:'2rem', marginTop:6 }}>The OBGMs command centre</div>

        {status === 'sent' ? (
          <div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.6, marginBottom:12 }}>Link sent to <strong>{email}</strong> — check your inbox.</div>
            <button onClick={()=>setStatus('idle')} style={{ ...mono, background:'none', border:'none', color:C.gold, fontSize:12, cursor:'pointer', padding:0 }}>Use a different email</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ fontSize:9, letterSpacing:'0.35em', color:C.muted, textTransform:'uppercase' }}>Email</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoFocus
              style={{ ...mono, background:'#0a0a0a', border:`1px solid ${C.border}`, borderRadius:3, padding:'0.75rem 0.875rem', color:C.text, fontSize:'0.95rem', outline:'none', marginBottom:8 }} />
            {status==='error' && <div style={{ color:'#c1574a', fontSize:12 }}>{err}</div>}
            <button type="submit" disabled={status==='sending'}
              style={{ ...mono, background:C.gold, border:'none', borderRadius:3, padding:'0.8rem', fontSize:'0.9rem', fontWeight:700, cursor:'pointer', opacity:status==='sending'?0.6:1, letterSpacing:'0.1em' }}>
              {status==='sending' ? 'SENDING...' : 'SEND SIGN-IN LINK'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
