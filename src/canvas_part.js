/* ---------- Canvas sahnesi ---------- */
/* sahne paleti: M3 token'larından */
let CP=null;
function canvasPal(){ if(CP) return CP; const cs=getComputedStyle(document.documentElement), v=n=>cs.getPropertyValue('--md-'+n).trim();
  const dark=document.documentElement.dataset.theme!=='light';
  CP={bg1:v('surfaceContainerLowest'),bg2:v('surfaceContainerLow'),grid:dark?'rgba(255,255,255,.035)':'rgba(0,0,0,.045)',
    beltOut:dark?'#0b100c':'#3a443c',belt:dark?'#26302a':'#56615a',slat:dark?'#34403a':'#6b766f',edge:dark?'#6f7d74':'#2d3530',
    txt:v('onSurfaceVariant'),strong:v('onSurface'),metal:dark?'#4f5c55':'#8a958e',metalHi:dark?'#93a199':'#5d6862',rod:dark?'#b3c0b8':'#9aa59e',plate:dark?'#dbe5de':'#4a544e',
    dim:v('outline'),pri:v('primary'),err:v('error'),tert:v('tertiary'),amber:v('ext-amber')||'#ffb95c',blue:v('ext-blue')||'#93ccff',
    depotBg:v('secondaryContainer'),depotLn:v('secondary'),depotTx:v('onSecondaryContainer'),binBg:v('surfaceContainerHigh'),binLn:v('outlineVariant')};
  return CP; }

const cv=$('#cv'),ctx=cv.getContext('2d'); let W=300,H=300,hits=[],flash={};
function resizeCanvas(){ const r=$('#sceneWrap').getBoundingClientRect(); const D=Math.min(2,window.devicePixelRatio||1); W=r.width;H=r.height; cv.width=Math.round(W*D);cv.height=Math.round(H*D); ctx.setTransform(D,0,0,D,0,0); }
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
const LC={green:['#39ff6a','#1d3a25'],amber:['#ffb020','#3d2a07'],red:['#ff4d4d','#3d1010']};
function drawScene(){
  const w=world, sc=w.sc, lv=w.lv, P=canvasPal(); ctx.clearRect(0,0,W,H);
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,P.bg1); g.addColorStop(1,P.bg2); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=P.grid; ctx.lineWidth=1; for(let x=0;x<W;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();} for(let y=0;y<H;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  const x0=16, us=(W-16-50)/100, X=u=>x0+u*us, BWp=8*us, bh=Math.max(34,BWp+10), panelH=0;
  const by=Math.max(bh/2+62,sc.pistons.length?H*0.42:H*0.56); const push=Math.max(22,Math.min(46,H-by-bh/2-BWp/2-18));
  // zemin ve tepsiler
  sc.pistons.forEach(p=>{ ctx.fillStyle=P.binBg; ctx.strokeStyle=P.binLn; ctx.lineWidth=2; rr(X(p.x)-26,by+bh/2+4,52,push+BWp/2+10,6); ctx.fill(); ctx.stroke(); ctx.fillStyle=P.txt; ctx.font='700 10px system-ui'; ctx.textAlign='center'; ctx.fillText(tx('AYRILAN','DIVERTED'),X(p.x),by+bh/2+push+BWp/2+11); });
  // bant
  ctx.fillStyle=P.beltOut; rr(x0-8,by-bh/2-6,100*us+16,bh+12,8); ctx.fill();
  ctx.fillStyle=P.belt; ctx.fillRect(x0,by-bh/2,100*us,bh);
  ctx.save(); ctx.beginPath(); ctx.rect(x0,by-bh/2,100*us,bh); ctx.clip(); ctx.strokeStyle=P.slat; ctx.lineWidth=2; const sp=16, off=(w.beltOff*us)%sp;
  for(let x=x0-sp+off;x<x0+100*us;x+=sp){ ctx.beginPath(); ctx.moveTo(x,by-bh/2); ctx.lineTo(x,by+bh/2); ctx.stroke(); } ctx.restore();
  ctx.strokeStyle=P.edge; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x0,by-bh/2); ctx.lineTo(x0+100*us,by-bh/2); ctx.moveTo(x0,by+bh/2); ctx.lineTo(x0+100*us,by+bh/2); ctx.stroke();
  ctx.fillStyle=w.motor?P.pri:P.dim; [x0,x0+100*us].forEach(x=>{ctx.beginPath();ctx.arc(x,by,5,0,7);ctx.fill();});
  ctx.fillStyle=w.motor?P.pri:P.txt; ctx.font='700 14px system-ui'; ctx.textAlign='center'; ctx.fillText(w.motor?'▶▶':'▷▷',x0+10,by-bh/2-8);
  // depo
  const dx=X(100)+8; ctx.fillStyle=P.depotBg; ctx.strokeStyle=P.depotLn; ctx.lineWidth=2; rr(dx,by-bh/2-4,W-dx-4,bh+8,6); ctx.fill(); ctx.stroke();
  ctx.fillStyle=P.depotTx; ctx.font='800 9.5px system-ui'; ctx.fillText(tx('DEPO','STORE'),dx+(W-dx-4)/2,by-3); ctx.font='800 13px ui-monospace,monospace'; ctx.fillStyle=P.depotTx; ctx.fillText(w.delivered,dx+(W-dx-4)/2,by+12);
  // istasyonlar / kabin
  sc.valves.forEach(v=>{ const vx=X(v.x), on=!!w.q[v.a], spray=v.kind==='spray';
    if(spray){ ctx.fillStyle='rgba(128,128,128,.10)'; ctx.strokeStyle=P.edge; ctx.lineWidth=2; rr(X(v.x-13),by-bh/2-34,26*us,bh+44,6); ctx.fill(); ctx.stroke(); ctx.fillStyle=P.txt; ctx.font='700 10px system-ui'; ctx.fillText(tx('BOYA KABİNİ','PAINT BOOTH'),vx,by-bh/2-38); }
    ctx.fillStyle=P.metal; ctx.fillRect(vx-3,by-bh/2-30,6,20); ctx.fillStyle=on?(spray?'#ff8c2a':'#4da3ff'):P.dim; ctx.beginPath(); ctx.moveTo(vx-7,by-bh/2-10); ctx.lineTo(vx+7,by-bh/2-10); ctx.lineTo(vx,by-bh/2-2); ctx.fill();
    if(on){ ctx.strokeStyle=spray?'rgba(255,140,42,.8)':'rgba(77,163,255,.85)'; ctx.lineWidth=spray?10:3; ctx.setLineDash([4,3]); ctx.lineDashOffset=-w.t*40; ctx.beginPath(); ctx.moveTo(vx,by-bh/2-2); ctx.lineTo(vx,by); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle=P.txt; ctx.font='700 10px system-ui'; ctx.fillText(v.a,vx,spray?by+bh/2+14:by-bh/2-32); });
  if(sc.fan){ const fx=X(sc.valves[0].x)+14*us-8, fy=by-bh/2-24, on=!!w.q[sc.fan.a]; ctx.save(); ctx.translate(fx,fy); ctx.rotate(w.fanAng); ctx.fillStyle=on?P.pri:P.dim; for(let i=0;i<3;i++){ ctx.rotate(Math.PI*2/3); ctx.beginPath(); ctx.ellipse(0,-6,3,6,0,0,7); ctx.fill(); } ctx.restore(); ctx.fillStyle=P.txt; ctx.font='700 10px system-ui'; ctx.fillText('FAN '+sc.fan.a,fx,fy+17); }
  // kutular
  for(const b of w.boxes){ let x=X(b.x),y=by,a=1,k=1;
    if(b.st==='pushed'||b.st==='bin'){ y=by+b.py*push; if(b.st==='bin') a=Math.max(0,1-Math.max(0,b.ft-1.2)/0.6); }
    if(b.st==='end'){ x=X(100)+4+b.ft*30; a=Math.max(0,1-b.ft/0.8); }
    if(b.st==='removed'){ y=by-b.ft*34; a=Math.max(0,1-b.ft/0.6); k=1+b.ft*.5; }
    const s=BWp*k; ctx.globalAlpha=a; ctx.fillStyle='#b9822f'; ctx.strokeStyle='#6b4a14'; ctx.lineWidth=1.5; rr(x-s/2,y-s/2,s,s,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,230,160,.5)'; ctx.fillRect(x-s/2+2,y-1.5,s-4,3);
    if(b.fill>0){ const col=sc.valves.some(v=>v.kind==='spray')?'255,120,30':'60,150,255'; ctx.fillStyle=`rgba(${col},${Math.min(.85,b.fill*.85)})`; rr(x-s/2+2,y-s/2+2,s-4,s-4,2); ctx.fill(); }
    if(sc.divertEvery){ ctx.fillStyle='#1d1304'; ctx.font='800 10px system-ui'; ctx.textAlign='center'; ctx.fillText(b.id,x,y+3.5); }
    ctx.globalAlpha=1; }
  // sensörler
  sc.sensors.forEach(s=>{ const sx=X(s.x), on=w.sensorOn(s.a); const t=by-bh/2-10, bt=by+bh/2+2;
    ctx.strokeStyle=on?'#ffb020':'rgba(255,77,77,.65)'; ctx.lineWidth=on?2.5:1.5; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(sx,t+8); ctx.lineTo(sx,bt); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=P.metal; ctx.fillRect(sx-7,t,14,8); ctx.fillRect(sx-7,bt,14,8);
    ctx.fillStyle=on?'#ffb020':'#ff4d4d'; ctx.beginPath(); ctx.arc(sx,t+4,2.5,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(sx,bt+4,2.5,0,7); ctx.fill();
    if(on){ ctx.shadowColor='#ffb020'; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(sx,bt+4,3,0,7); ctx.fill(); ctx.shadowBlur=0; }
    ctx.fillStyle=P.txt; ctx.font='700 10px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(s.a,sx,bt+19); });
  // pistonlar
  sc.pistons.forEach(p=>{ const px=X(p.x), e=w.ext[p.a]; const hy=by-bh/2-46, front=by-BWp/2-2+e*push;
    ctx.fillStyle=P.metal; rr(px-11,hy,22,26,3); ctx.fill(); ctx.strokeStyle=P.txt; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=w.q[p.a]?P.pri:P.metal; ctx.fillRect(px-4,hy+4,8,4);
    ctx.fillStyle=P.rod; ctx.fillRect(px-3,hy+26,6,Math.max(2,front-6-(hy+26))); ctx.fillStyle=P.plate; rr(px-13,front-6,26,6,2); ctx.fill();
    ctx.fillStyle=P.txt; ctx.font='700 10px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(p.a,px,hy-3); });
  // lambalar
  sc.lamps.forEach((l,i)=>{ const lx=W-24-i*38, ly=Math.max(16,by-bh/2-52), on=!!w.q[l.a], c=LC[l.c]; ctx.fillStyle=P.metal; ctx.fillRect(lx-3,ly+10,6,12);
    ctx.fillStyle=on?c[0]:c[1]; ctx.strokeStyle=P.dim; ctx.lineWidth=2; if(on){ctx.shadowColor=c[0];ctx.shadowBlur=16;} ctx.beginPath(); ctx.arc(lx,ly,10,0,7); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
    ctx.fillStyle=P.txt; ctx.font='700 9px system-ui'; ctx.textAlign='center'; ctx.fillText(tg(l.n),lx,ly+31); });
  if(w.err){ ctx.strokeStyle=P.err; ctx.lineWidth=5; ctx.strokeRect(2,2,W-4,H-4); }
  if(w.done){ ctx.strokeStyle=P.pri; ctx.lineWidth=5; ctx.strokeRect(2,2,W-4,H-4); }
}
/* ---------- Giriş panelı (DOM butonlar) ---------- */
function buildIO(){
  const box=$('#io'); box.innerHTML='';
  S.lv.io.I.filter(d=>d.k==='btn'||d.k==='sw').sort((a,b)=>{ const o=d=>d.n==='START'?0:d.n==='STOP'?1:2; return o(a)-o(b); }).forEach(d=>{
    const col=d.n==='START'?'var(--md-primary)':d.n==='STOP'?'var(--md-error)':d.k==='sw'?'var(--md-ext-amber)':'var(--md-ext-blue)';
    const b=document.createElement('button'); b.className='iob'+(d.k==='sw'?' sw':''); b.dataset.a=d.a; b.style.setProperty('--c',col);
    b.innerHTML=`<span class="lt"></span><span class="tx"><b>${d.n}</b><small>${d.a}</small></span>`; box.appendChild(b); });
}
$('#io').addEventListener('pointerdown',e=>{ const b=e.target.closest('.iob'); if(!b) return; e.preventDefault(); Snd.init(); Snd.click(); Hap.sw();
  if(!S.running){ toast(tx('Önce RUN ile simülasyonu başlat','Start the simulation with RUN first')); return; }
  world.press(b.dataset.a); flash[b.dataset.a]=0.25; });
let goalKey='';
function updatePanel(){
  const io=$('#io'); for(const b of io.children){ const a=b.dataset.a, on=!!(world.iv&&world.iv[a])||(flash[a]>0)||(b.classList.contains('sw')&&!!world.sw[a]);
    b.classList.toggle('on',on); b.classList.toggle('idle',!S.running); }
  const gl=world.goalList(), k=gl.map(g=>g.l+g.ok).join('|');
  if(k!==goalKey){ goalKey=k; $('#goals').innerHTML=gl.map(g=>`<span class="gl ${g.ok?'ok':''}">${g.ok?I('check'):I('radio_button_unchecked')} ${g.l}</span>`).join(''); }
}
