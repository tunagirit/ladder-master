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
const BN=I18({NO:['Açık Kontak','NO Contact'],NC:['Kapalı Kontak','NC Contact'],COIL:['Bobin','Coil'],SET:['Set Bobini','Set Coil'],RST:['Reset Bobini','Reset Coil'],TON:['TON Zamanlayıcı','TON Timer'],TOF:['TOF Zamanlayıcı','TOF Timer'],CTU:['CTU Yukarı Sayıcı','CTU Up Counter'],CTD:['CTD Aşağı Sayıcı','CTD Down Counter'],
 P:['Yükselen Kenar (P)','Rising Edge (P)'],N:['Düşen Kenar (N)','Falling Edge (N)'],NOT:['Tersleyici (NOT)','Inverter (NOT)'],CMP:['Karşılaştırma (CMP)','Compare (CMP)'],TONR:['TONR Kalıcı Zamanlayıcı','TONR Retentive Timer'],
 MOV:['MOV Taşı','MOV Move'],ADD:['ADD Topla','ADD Add'],SUB:['SUB Çıkar','SUB Subtract'],MUL:['MUL Çarp','MUL Multiply'],DIV:['DIV Böl','DIV Divide'],INC:['INC Bir Artır','INC Increment'],DEC:['DEC Bir Azalt','DEC Decrement'],
 SHL:['SHL Sola Kaydır','SHL Shift Left'],SHR:['SHR Sağa Kaydır','SHR Shift Right'],WAND:['WAND Maske VE','WAND Mask AND'],WOR:['WOR Maske VEYA','WOR Mask OR'],INV:['INV Bitleri Tersle','INV Invert Bits'],SEG:['SEG 7-Segment Çevir','SEG 7-Segment'],RTC:['READ_RTC Saati Oku','READ_RTC Read Clock']});
const BS=I18({NO:['Açık','NO'],NC:['Kapalı','NC'],COIL:['Bobin','Coil'],SET:'Set',RST:'Reset',TON:'TON',TOF:'TOF',CTU:'CTU',CTD:'CTD',P:['Kenar ↑','Edge ↑'],N:['Kenar ↓','Edge ↓'],NOT:'NOT',CMP:'CMP',TONR:'TONR',
 MOV:'MOV',ADD:'ADD',SUB:'SUB',MUL:'MUL',DIV:'DIV',INC:'INC',DEC:'DEC',SHL:'SHL',SHR:'SHR',WAND:'WAND',WOR:'WOR',INV:'INV',SEG:'SEG',RTC:'RTC'});
function palSym(t){
  const m=17,y=12; let s='<svg width="34" height="24" viewBox="0 0 34 24">';
  if(t==='NO'||t==='NC'){ s+=`<path d="M0 ${y}H${m-6}M${m+6} ${y}H34M${m-6} 3V21M${m+6} 3V21"/>`; if(t==='NC') s+=`<path d="M${m-8} 20L${m+8} 4"/>`; }
  else if(t==='COIL'||t==='SET'||t==='RST'){ s+=`<path d="M0 ${y}H${m-9}M${m+9} ${y}H34M${m-4} 3Q${m-11} ${y} ${m-4} 21M${m+4} 3Q${m+11} ${y} ${m+4} 21"/>`; if(t!=='COIL') s+=`<text x="${m}" y="16">${t==='SET'?'S':'R'}</text>`; }
  else if(t==='P'||t==='N'||t==='NOT'||t==='CMP'){ s+=`<path d="M0 ${y}H8M26 ${y}H34M8 3V21M26 3V21"/>`; s+=t==='NOT'?`<text x="17" y="15" font-size="6.5">NOT</text>`:t==='CMP'?`<text x="17" y="16.5" font-size="12">≥</text>`:`<text x="17" y="16">${t}</text>`; }
  else s+=`<rect x="2" y="2" width="30" height="20" rx="3"/><text x="17" y="${t.length>3?15.5:16}"${t.length>3?' font-size="8"':' font-size="9.5"'}>${t}</text>`;
  return s+'</svg>';
}
const defPV=t=>isTim(t)?2:isCnt(t)?3:({MOV:0,ADD:1,SUB:1,MUL:2,DIV:2,SHL:1,SHR:1,WAND:255,WOR:0})[t];
/* hücre yazıları (ladder, ipucu, tooltip ortak) */
const bitsTxt=v=>(v>15?v.toString(2).padStart(8,'0'):v.toString(2).padStart(4,'0'));
function cellTxt(c){ const t=c.t, a=c.a, k=c.pv;
  if(isTim(t)) return [t+' '+a,`PT ${fx((+k).toFixed(1))}s`];
  if(isCnt(t)) return [t+' '+a,'PV '+k];
  const L2={MOV:'← '+(c.src||k),ADD:'+ '+k,SUB:'− '+k,MUL:'× '+k,DIV:'÷ '+k,INC:'+1',DEC:'−1',SHL:'≪ '+k,SHR:'≫ '+k,WAND:bitsTxt(k|0),WOR:bitsTxt(k|0),INV:'~',SEG:'← '+c.src,RTC:tx('← saat','← hour')}[t];
  return [(t==='RTC'?'RTC':t)+' '+a,L2||''];
}
function cellDesc(c){ if(NOADDR.includes(c.t)) return BN[c.t];
  if(c.t==='CMP') return `<code>${c.a} ${OPSYM[c.op]} ${c.pv}</code>`;
  const tg=S.tags[c.a]?' · '+esc(S.tags[c.a]):'';
  if(WORDOP.includes(c.t)) return `<code>${cellTxt(c).join(' ')}</code>${tg}`;
  return `<code>${c.a}</code>${tg}${c.pv!==undefined?' · '+(isTim(c.t)?fx(c.pv)+' '+tx('sn','s'):'PV '+c.pv):''}`; }
const DEFTAG=new Set(['START','STOP','I0.0']); for(const k in TAGEN){ DEFTAG.add(k); DEFTAG.add(TAGEN[k]); } ['HEP_1','ALWAYS_ON','İLK_TARAMA','FIRST_SCAN','SAAT_1SN','CLOCK_1S'].forEach(x=>DEFTAG.add(x));
function customTags(t){ const o={}; if(t) for(const a in t){ const v=(t[a]||'').trim(); if(v&&!DEFTAG.has(v)) o[a]=v; } return o; }
function defaultTags(lv){ const o={}; lv.io.I.concat(lv.io.Q).forEach(d=>o[d.a]=d.n); if(lv.wt) for(const a in lv.wt) o[a]=tg(lv.wt[a]); if(lv.SM){ o['SM0.0']=tx('HEP_1','ALWAYS_ON'); o['SM0.1']=tx('İLK_TARAMA','FIRST_SCAN'); o['SM0.5']=tx('SAAT_1SN','CLOCK_1S'); } return o; }

