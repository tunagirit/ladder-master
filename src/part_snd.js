/* ---------- SES (Web Audio) ---------- */
const Snd={ctx:null,nb:null,
  init(){ if(!this.ctx){ try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); const n=this.ctx.sampleRate; this.nb=this.ctx.createBuffer(1,n,n); const d=this.nb.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; }catch(e){} } if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); },
  tone(f,d,type,v,delay,f2){ if(!save.sound||!this.ctx) return; const c=this.ctx,t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain(); o.type=type||'square'; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+d); g.gain.setValueAtTime(v||0.05,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+d+0.02); },
  noise(d,fq,v,type){ if(!save.sound||!this.ctx||!this.nb) return; const c=this.ctx,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(); s.buffer=this.nb; f.type=type||'highpass'; f.frequency.value=fq; g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t+d); },
  click(){ this.tone(900,0.04,'square',0.04); },
  relay(){ this.tone(2400,0.012,'square',0.04); this.tone(140,0.04,'triangle',0.07,0.008); },
  hiss(){ this.noise(0.28,3500,0.12); },
  err(){ this.tone(190,0.4,'sawtooth',0.07,0,70); this.tone(150,0.4,'sawtooth',0.06,0.12,60); },
  win(){ [523,659,784,1047,1319].forEach((f,i)=>this.tone(f,0.22,'triangle',0.07,i*0.11)); },
  place(){ this.tone(520,0.05,'square',0.04); this.tone(780,0.06,'square',0.04,0.05); }
};

/* ---------- Yardımcılar ---------- */
let toastT; function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2200); }
const BN={NO:'Açık Kontak',NC:'Kapalı Kontak',COIL:'Bobin',SET:'Set Bobini',RST:'Reset Bobini',TON:'TON Zamanlayıcı',TOF:'TOF Zamanlayıcı',CTU:'CTU Yukarı Sayıcı',CTD:'CTD Aşağı Sayıcı'};
const BS={NO:'Açık',NC:'Kapalı',COIL:'Bobin',SET:'Set',RST:'Reset',TON:'TON',TOF:'TOF',CTU:'CTU',CTD:'CTD'};
function palSym(t){
  const m=17,y=12; let s='<svg width="34" height="24" viewBox="0 0 34 24">';
  if(t==='NO'||t==='NC'){ s+=`<path d="M0 ${y}H${m-6}M${m+6} ${y}H34M${m-6} 3V21M${m+6} 3V21"/>`; if(t==='NC') s+=`<path d="M${m-8} 20L${m+8} 4"/>`; }
  else if(t==='COIL'||t==='SET'||t==='RST'){ s+=`<path d="M0 ${y}H${m-9}M${m+9} ${y}H34M${m-4} 3Q${m-11} ${y} ${m-4} 21M${m+4} 3Q${m+11} ${y} ${m+4} 21"/>`; if(t!=='COIL') s+=`<text x="${m}" y="16">${t==='SET'?'S':'R'}</text>`; }
  else s+=`<rect x="4" y="2" width="26" height="20" rx="3"/><text x="17" y="16">${t}</text>`;
  return s+'</svg>';
}
const defPV=t=>(t==='TON'||t==='TOF')?2:3;
function defaultTags(lv){ const o={}; lv.io.I.concat(lv.io.Q).forEach(d=>o[d.a]=d.n); return o; }

