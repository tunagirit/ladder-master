/* ---------- Ana döngü ---------- */
// bant uzun süre duruyor, kutular bekliyor ve START butonu varsa oyuncuya hatırlat
let idleT=0;
function idleNudge(dt){
  const sc=world.sc, st=S.lv.io.I.find(d=>d.n==='START'||d.k==='btn');
  const waiting=!world.motor&&world.boxes.some(b=>b.st==='belt')&&!S.lv.scene.ackA;
  if(!waiting||!st||!sc.startA){ idleT=0; return; }
  idleT+=dt*S.speed; if(idleT>3.5){ idleT=-30; Hap.tap(); toast(tx(`Bant duruyor — devam etmek için START (${sc.startA}) butonuna bas`,`Belt is stopped — press START (${sc.startA}) to continue`)); }
}
let last=performance.now(), acc=0, fr=0;
function scanOnce(){
  const iv=world.sense(); for(const k in iv) plc.b[k]=iv[k];
  const qs=S.lv.io.Q.map(d=>d.a), before=qs.map(a=>!!plc.b[a]);
  plc.scan(S.prog,20); world.advance(plc.b,SCAN);
  let ch=false,hs=false; qs.forEach((a,i)=>{ if(!!plc.b[a]!==before[i]){ ch=true; if(world.sc.pistons.some(p=>p.a===a)) hs=true; } });
  if(ch) Snd.relay(); if(hs) Snd.hiss();
  if(world.err) onFail(); else if(world.done) onWin();
}
function frame(now){
  const dt=Math.min(0.1,(now-last)/1000); last=now;
  for(const k in flash) if(flash[k]>0) flash[k]-=dt;
  if(S.running){ acc+=dt*S.speed; let n=0; while(acc>=SCAN&&n<300&&S.running){ scanOnce(); acc-=SCAN; n++; } } else acc=0;
  const mOpen=$('#menu').classList.contains('show');
  if(mOpen&&S.mscr==='main') drawMenuAnim(now);
  if(S.running&&world&&!world.err&&!world.done) idleNudge(dt);
  if(!mOpen){ drawScene(); if((fr++&1)===0){ updateLive(); updatePanel(); } }
  requestAnimationFrame(frame);
if(me()) pullProgress().catch(()=>{});
if(isIOS()) setTimeout(maybeAskInstall,1500);
}
function relayout(){ resizeCanvas(); if(S.prog){ const cw=calcCW(); if(cw!==S.cw) renderLadder(); } }
window.addEventListener('resize',relayout); if(window.ResizeObserver) new ResizeObserver(relayout).observe($('#sceneWrap'));
$('#bSnd').innerHTML=I(save.sound?'volume_up':'volume_off');
LANG=save.lang||((navigator.language||'tr').toLowerCase().startsWith('tr')?'tr':'en'); save.lang=LANG; applyTheme(); applyStatic();
resizeCanvas(); loadLevel(save.last>=0?save.last:0,true);
showMenu('main');
if(!save.intro){ card(`<h3>${tx('Ladder Master\'a hoş geldin!','Welcome to Ladder Master!')}</h3>${HOW()}<div class="brow"><button class="btn pri wide" id="ok">${tx('Başlayalım','Let\'s go')}</button></div>`,e=>{ if(e.target.id==='ok'){ save.intro=true; persist(); closeAll(); showMenu('main'); } }); }
requestAnimationFrame(frame);
if(me()) pullProgress().catch(()=>{});
if(isIOS()) setTimeout(maybeAskInstall,1500);
