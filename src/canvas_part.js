/* ---------- Canvas sahnesi ---------- */
const cv=$('#cv'),ctx=cv.getContext('2d'); let W=300,H=300,hits=[],flash={};
function resizeCanvas(){ const r=$('#sceneWrap').getBoundingClientRect(); const D=Math.min(2,window.devicePixelRatio||1); W=r.width;H=r.height; cv.width=Math.round(W*D);cv.height=Math.round(H*D); ctx.setTransform(D,0,0,D,0,0); }
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
const LC={green:['#39ff6a','#0e3a1b'],amber:['#ffb020','#3d2a07'],red:['#ff4d4d','#3d1010']};
function drawScene(){
  const w=world, sc=w.sc, lv=w.lv; ctx.clearRect(0,0,W,H);
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#10161d'); g.addColorStop(1,'#182029'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,.035)'; ctx.lineWidth=1; for(let x=0;x<W;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();} for(let y=0;y<H;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  const x0=16, us=(W-16-50)/100, X=u=>x0+u*us, BWp=8*us, bh=Math.max(34,BWp+10), panelH=0;
  const by=Math.max(bh/2+62,sc.pistons.length?H*0.42:H*0.56); const push=Math.max(22,Math.min(46,H-by-bh/2-BWp/2-18));
  // zemin ve tepsiler
  sc.pistons.forEach(p=>{ ctx.fillStyle='#10171e'; ctx.strokeStyle='#3a4757'; ctx.lineWidth=2; rr(X(p.x)-26,by+bh/2+4,52,push+BWp/2+10,6); ctx.fill(); ctx.stroke(); ctx.fillStyle='#4a5b6e'; ctx.font='700 10px system-ui'; ctx.textAlign='center'; ctx.fillText(tx('AYRILAN','DIVERTED'),X(p.x),by+bh/2+push+BWp/2+11); });
  // bant
  ctx.fillStyle='#0b0f14'; rr(x0-8,by-bh/2-6,100*us+16,bh+12,8); ctx.fill();
  ctx.fillStyle='#252e38'; ctx.fillRect(x0,by-bh/2,100*us,bh);
  ctx.save(); ctx.beginPath(); ctx.rect(x0,by-bh/2,100*us,bh); ctx.clip(); ctx.strokeStyle='#323e4b'; ctx.lineWidth=2; const sp=16, off=(w.beltOff*us)%sp;
  for(let x=x0-sp+off;x<x0+100*us;x+=sp){ ctx.beginPath(); ctx.moveTo(x,by-bh/2); ctx.lineTo(x,by+bh/2); ctx.stroke(); } ctx.restore();
  ctx.strokeStyle='#5d6e80'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x0,by-bh/2); ctx.lineTo(x0+100*us,by-bh/2); ctx.moveTo(x0,by+bh/2); ctx.lineTo(x0+100*us,by+bh/2); ctx.stroke();
  ctx.fillStyle=w.motor?'#39ff6a':'#46576b'; [x0,x0+100*us].forEach(x=>{ctx.beginPath();ctx.arc(x,by,5,0,7);ctx.fill();});
  ctx.fillStyle='#6b7c8f'; ctx.font='700 14px system-ui'; ctx.textAlign='center'; ctx.fillText(w.motor?'▶▶':'▷▷',x0+10,by-bh/2-8);
  // depo
  const dx=X(100)+8; ctx.fillStyle='#14202b'; ctx.strokeStyle='#4da3ff'; ctx.lineWidth=2; rr(dx,by-bh/2-4,W-dx-4,bh+8,6); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#4da3ff'; ctx.font='800 9.5px system-ui'; ctx.fillText(tx('DEPO','STORE'),dx+(W-dx-4)/2,by-3); ctx.font='800 13px ui-monospace,monospace'; ctx.fillStyle='#dfe8f2'; ctx.fillText(w.delivered,dx+(W-dx-4)/2,by+12);
  // istasyonlar / kabin
  sc.valves.forEach(v=>{ const vx=X(v.x), on=!!w.q[v.a], spray=v.kind==='spray';
    if(spray){ ctx.fillStyle='rgba(120,140,160,.10)'; ctx.strokeStyle='#5d6e80'; ctx.lineWidth=2; rr(X(v.x-13),by-bh/2-34,26*us,bh+44,6); ctx.fill(); ctx.stroke(); ctx.fillStyle='#7d8a99'; ctx.font='700 10px system-ui'; ctx.fillText(tx('BOYA KABİNİ','PAINT BOOTH'),vx,by-bh/2-38); }
    ctx.fillStyle='#2b3744'; ctx.fillRect(vx-3,by-bh/2-30,6,20); ctx.fillStyle=on?(spray?'#ff8c2a':'#4da3ff'):'#59697b'; ctx.beginPath(); ctx.moveTo(vx-7,by-bh/2-10); ctx.lineTo(vx+7,by-bh/2-10); ctx.lineTo(vx,by-bh/2-2); ctx.fill();
    if(on){ ctx.strokeStyle=spray?'rgba(255,140,42,.8)':'rgba(77,163,255,.85)'; ctx.lineWidth=spray?10:3; ctx.setLineDash([4,3]); ctx.lineDashOffset=-w.t*40; ctx.beginPath(); ctx.moveTo(vx,by-bh/2-2); ctx.lineTo(vx,by); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle='#7d8a99'; ctx.font='700 10px system-ui'; ctx.fillText(v.a,vx,spray?by+bh/2+14:by-bh/2-32); });
  if(sc.fan){ const fx=X(sc.valves[0].x)+14*us-8, fy=by-bh/2-24, on=!!w.q[sc.fan.a]; ctx.save(); ctx.translate(fx,fy); ctx.rotate(w.fanAng); ctx.fillStyle=on?'#39ff6a':'#59697b'; for(let i=0;i<3;i++){ ctx.rotate(Math.PI*2/3); ctx.beginPath(); ctx.ellipse(0,-6,3,6,0,0,7); ctx.fill(); } ctx.restore(); ctx.fillStyle='#7d8a99'; ctx.font='700 10px system-ui'; ctx.fillText('FAN '+sc.fan.a,fx,fy+17); }
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
    ctx.fillStyle='#3a4757'; ctx.fillRect(sx-7,t,14,8); ctx.fillRect(sx-7,bt,14,8);
    ctx.fillStyle=on?'#ffb020':'#ff4d4d'; ctx.beginPath(); ctx.arc(sx,t+4,2.5,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(sx,bt+4,2.5,0,7); ctx.fill();
    if(on){ ctx.shadowColor='#ffb020'; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(sx,bt+4,3,0,7); ctx.fill(); ctx.shadowBlur=0; }
    ctx.fillStyle='#8da0b4'; ctx.font='700 10px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(s.a,sx,bt+19); });
  // pistonlar
  sc.pistons.forEach(p=>{ const px=X(p.x), e=w.ext[p.a]; const hy=by-bh/2-46, front=by-BWp/2-2+e*push;
    ctx.fillStyle='#4a5b6e'; rr(px-11,hy,22,26,3); ctx.fill(); ctx.strokeStyle='#8da0b4'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=w.q[p.a]?'#39ff6a':'#2b3744'; ctx.fillRect(px-4,hy+4,8,4);
    ctx.fillStyle='#a9b8c8'; ctx.fillRect(px-3,hy+26,6,Math.max(2,front-6-(hy+26))); ctx.fillStyle='#d4dde7'; rr(px-13,front-6,26,6,2); ctx.fill();
    ctx.fillStyle='#7d8a99'; ctx.font='700 10px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(p.a,px,hy-3); });
  // lambalar
  sc.lamps.forEach((l,i)=>{ const lx=W-24-i*38, ly=Math.max(16,by-bh/2-52), on=!!w.q[l.a], c=LC[l.c]; ctx.fillStyle='#2b3744'; ctx.fillRect(lx-3,ly+10,6,12);
    ctx.fillStyle=on?c[0]:c[1]; ctx.strokeStyle='#59697b'; ctx.lineWidth=2; if(on){ctx.shadowColor=c[0];ctx.shadowBlur=16;} ctx.beginPath(); ctx.arc(lx,ly,10,0,7); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
    ctx.fillStyle='#8da0b4'; ctx.font='700 9px system-ui'; ctx.textAlign='center'; ctx.fillText(tg(l.n),lx,ly+31); });
  if(w.err){ ctx.strokeStyle='rgba(255,77,77,.9)'; ctx.lineWidth=5; ctx.strokeRect(2,2,W-4,H-4); }
  if(w.done){ ctx.strokeStyle='rgba(57,255,106,.9)'; ctx.lineWidth=5; ctx.strokeRect(2,2,W-4,H-4); }
}
/* ---------- Giriş panelı (DOM butonlar) ---------- */
function buildIO(){
  const box=$('#io'); box.innerHTML='';
  S.lv.io.I.filter(d=>d.k==='btn'||d.k==='sw').sort((a,b)=>{ const o=d=>d.n==='START'?0:d.n==='STOP'?1:2; return o(a)-o(b); }).forEach(d=>{
    const col=d.n==='START'?'#39ff6a':d.n==='STOP'?'#ff4d4d':d.k==='sw'?'#ffb020':'#4da3ff';
    const b=document.createElement('button'); b.className='iob'+(d.k==='sw'?' sw':''); b.dataset.a=d.a; b.style.setProperty('--c',col);
    b.innerHTML=`<span class="lt"></span><span class="tx"><b>${d.n}</b><small>${d.a}</small></span>`; box.appendChild(b); });
}
$('#io').addEventListener('pointerdown',e=>{ const b=e.target.closest('.iob'); if(!b) return; e.preventDefault(); Snd.init(); Snd.click();
  if(!S.running){ toast(tx('Önce ▶ RUN ile simülasyonu başlat','Start the simulation with ▶ RUN first')); return; }
  world.press(b.dataset.a); flash[b.dataset.a]=0.25; });
let goalKey='';
function updatePanel(){
  const io=$('#io'); for(const b of io.children){ const a=b.dataset.a, on=!!(world.iv&&world.iv[a])||(flash[a]>0)||(b.classList.contains('sw')&&!!world.sw[a]);
    b.classList.toggle('on',on); b.classList.toggle('idle',!S.running); }
  const gl=world.goalList(), k=gl.map(g=>g.l+g.ok).join('|');
  if(k!==goalKey){ goalKey=k; $('#goals').innerHTML=gl.map(g=>`<span class="gl ${g.ok?'ok':''}">${g.ok?'✔':'○'} ${g.l}</span>`).join(''); }
}
