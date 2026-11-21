/* ---------- Bölüm yükleme / mod ---------- */
function loadLevel(id,quiet){
  S.id=id; const lv=S.lv=getLevel(id); save.last=id; persist();
  const dn=save.done[id]; S.redo=false; S.tool=null;
  if(dn&&dn.prog){ S.view=true; S.prog=clone(dn.prog); S.tags=Object.assign(defaultTags(lv),customTags(dn.tags)); }
  else { S.view=false; const d=save.draft[id]; S.prog=d&&d.rungs&&d.rungs.length?{rungs:clone(d.rungs)}:{rungs:[]}; S.tags=Object.assign(defaultTags(lv),customTags(d&&d.tags)); }
  S.prog.rungs.forEach(fixRung);
  world=new World(lv); plc.reset(); stopSim(true);
  setHeader();
  S.fresh=S.view?[]:freshElems(lv);
  buildPalette(); buildIO(); goalKey=''; refreshMode(); renderLadder(); closeAll();
  if(!quiet&&S.fresh.length) setTimeout(()=>showIntro(S.fresh),150);
  else if(!quiet&&lv.extra&&!S.view) toast(tx('Ekstra zor bölüm — bol şans!','Extra hard level — good luck!'));
  else if(!quiet&&lv.bonus&&!S.view) toast(tx('🎉 Bonus bölüm — keyfini çıkar!','🎉 Bonus level — have fun!'));
}
function lvLabel(lv){ return `${tx('Bölüm','Level')} ${lv.n+1} · ${lv.bonus?'🎉 Bonus':CATS[lv.cat].n}`; }
function setHeader(){ const lv=S.lv, C=CATS[lv.cat]; $('#task').dataset.lbl=tx('GÖREV','TASK');
  $('#title').innerHTML=`<small style="color:${lv.extra?'var(--red)':C.c}">${lvLabel(lv).toUpperCase()}${lv.extra?' · '+tx('EKSTRA ZOR','EXTRA HARD'):''}</small>${lv.title}`;
  $('#task').innerHTML=fmtTask(lv.task); $('#task').classList.remove('cl'); $('#task').scrollTop=0; }
/* v1.1.9: görev metni — ilk cümle hedef, kalanı madde madde; yöntemi ele veren (TON), (WOR maske 0101) gibi parantezler gizlenir (ipucunda var) */
const TASK_KW=new Set('TON TOF TONR CTU CTD CMP MOV INC DEC ADD SUB DIV MUL SEG SHL SHR INV WAND WOR NOT P N Set Reset S/R SM mühür histerezis kilitleme maske kenarıyla ile'.split(' '));
function fmtTask(t){
  t=t.replace(/\s*\(([^()]*)\)/g,(m,c)=>{ const w=c.split(/[\s,+\/]+/).filter(Boolean); return w.length&&w.every(x=>TASK_KW.has(x)||/^[\d≥≤≠<>=]+$/.test(x))&&!/[IQ]\d\.\d/.test(c)?'':m; });
  const ss=t.split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9"'(])/).map(s=>s.trim()).filter(Boolean);
  const hl=s=>esc(s).replace(/\s?\(((?:SM|[IQM])\d\.\d|AIW\d|[QI]B\d)\)/g,' <b class="ad">$1</b>').replace(/(^|[^\w>])((?:SM|[IQM])\d\.\d|[TC]\d|VW\d|AIW\d|[QI]B\d)\b(?![^<]*<\/b>)/g,'$1<b>$2</b>');
  const li=ss.slice(1).map(s=>{ const tst=/^Test:/i.test(s); return `<li${tst?' class="ts"':''}>${hl(tst?s.replace(/^Test:\s*/i,''):s)}</li>`; }).join('');
  return `<p class="tg">${hl(ss[0]||'')}</p>`+(li?`<ul>${li}</ul>`:''); }
$('#task').addEventListener('click',()=>$('#task').classList.toggle('cl'));
// dokunma bitince (tıklama işlendikten sonra) daralt: dokunuş sırasında yerleşim kaymasın
['#editor','#palette'].forEach(q=>$(q).addEventListener('pointerup',()=>setTimeout(()=>{ if(!$('#task').classList.contains('cl')){ $('#task').classList.add('cl'); } },0),{passive:true}));
function refreshMode(){
  $('#palette').style.display=S.view?'none':'flex'; $('#doneBar').style.display=S.view?'flex':'none';
  $('#bClear').style.visibility=S.view?'hidden':'visible'; updInfo();
}
function saveDraft(){ if(S.view||S.redo) return; save.draft[S.id]={rungs:S.prog.rungs,tags:customTags(S.tags)}; persist(); }
const saveProg=saveDraft;
function guard(){ if(S.view){ toast(tx('Tamamlanmış bölüm — düzenlemek için alttaki Sıfırla\'ya bas','Level completed — tap Reset below to edit')); return true; } return false; }
$('#bReset').onclick=()=>{ Snd.init(); Snd.click(); S.view=false; S.redo=true; S.prog={rungs:[]}; S.tags=defaultTags(S.lv); S.tool=null;
  stopSim(true); refreshMode(); renderLadder(); toast(tx('Sıfırlandı — çözmeden çıkarsan eski çözümün korunur','Reset — if you leave without solving, your old solution is kept')); };

/* ---------- Palet ---------- */
function buildPalette(){
  const p=$('#palette'); p.innerHTML='';
  S.lv.pal.forEach(t=>{ const b=document.createElement('button'); b.className='pal'; b.dataset.t=t; b.innerHTML=palSym(t)+'<span>'+BS[t]+'</span>'+((S.fresh||[]).includes(t)?'<em class="nw">'+tx('YENİ','NEW')+'</em>':''); p.appendChild(b); });
}
let justDragged=false;
$('#palette').addEventListener('click',e=>{ if(justDragged) return; const b=e.target.closest('.pal'); if(!b||S.view) return; Snd.init(); Snd.click(); Hap.tap(); S.tool=S.tool===b.dataset.t?null:b.dataset.t; refreshTool(); });
function refreshTool(){
  document.querySelectorAll('.pal').forEach(b=>b.classList.toggle('sel',b.dataset.t===S.tool));
  $('#rungs').dataset.tool=S.tool?(isOut(S.tool)?'o':'c'):''; updInfo();
}
/* yeni satır eklenince: yeni satırın başı görünsün, ekle tuşu onun altında kalsın */
function scrollToNewRung(){ const r=$('#rungs'), rs=r.querySelectorAll('.rung'), el=rs[rs.length-1]; if(!el) return;
  r.scrollTo({top:Math.max(0,el.getBoundingClientRect().top-r.getBoundingClientRect().top+r.scrollTop-6),behavior:'smooth'}); }
function updInfo(){
  const n=countBlocks(S.prog);
  const msg=S.view?tx('<span style="color:var(--neon)">Kayıtlı çözümün</span> — RUN ile çalıştırıp izle','<span style="color:var(--neon)">Your saved solution</span> — press RUN to watch')
    :S.redo?tx('<span style="color:var(--amb)">Yeniden çözüyorsun</span> — yeni çözüm bulana kadar eskisi korunur','<span style="color:var(--amb)">Re-solving</span> — old solution kept until you solve it again')
    :S.tool?tx(`Seçili: <b style="color:var(--blu)">${BN[S.tool]}</b> — ${isOut(S.tool)?'son sütuna':'sol sütunlara'} dokun`,`Selected: <b style="color:var(--blu)">${BN[S.tool]}</b> — tap ${isOut(S.tool)?'the last column':'a left column'}`):tx('Bloğu yukarı <b>sürükle-bırak</b> ya da seç &amp; dokun','<b>Drag &amp; drop</b> a block up, or select &amp; tap');
  $('#einfo').innerHTML=tx(`Blok <b>${n}</b> · referans çözüm ${S.lv.opt} blok`,`Blocks <b>${n}</b> · reference solution ${S.lv.opt}`)+`<br><span class="em${S.tool||S.view||S.redo?' on':''}"> · ${msg}</span>`;
}
function canPlace(t,i,r,c){
  const rg=S.prog.rungs[i]; if(!rg||rg.c[r][c]) return 'dolu'; if(r===1&&!rg.br) return 'x';
  if(isOut(t)){ if(c!==OUTC||r!==0) return r===1?tx('Paralel kolda yalnızca kontak olur','Only contacts go on a parallel branch'):tx('Bobin / zamanlayıcı / sayıcı en sağ sütuna konur','Coils / timers / counters go in the rightmost column'); }
  else if(c===OUTC) return tx('Kontaklar sol sütunlara konur','Contacts go in the left columns');
  return posMsg(i,r,c);
}
/* soldan sağa kuralı: solu boşken sağa blok konmaz; çıkış, hatta en az bir kontak olunca gelir */
function posMsg(i,r,c){ const rg=S.prog.rungs[i], row=rg.c[r];
  if(r===0){ if(c<OUTC&&c>0&&!row[c-1]) return tx('Soldan sağa kur: önce soldaki boş yere blok koy','Build left to right: fill the empty spot on the left first');
    if(c===OUTC&&!row[0]) return tx('Önce soldan bir kontak koy — çıkış en sona gelir','Place a contact on the left first — the output comes last'); return ''; }
  if(c<OUTC&&!rg.c[0][c]) return tx('Paralel kol, üstteki bir kontağın altına konur','A branch block goes under a contact on the main line');
  if(c<OUTC&&row.some(Boolean)&&!row[c-1]&&!row[c+1]) return tx('Paralel kol bitişik olmalı: mevcut kol bloğunun yanına koy','A branch must be continuous: place it next to the existing branch block');
  return ''; }
const posOK=(i,r,c)=>{ const rg=S.prog.rungs[i]; if(!rg||rg.c[r][c]||(r===1&&!rg.br)) return false; return !posMsg(i,r,c); };
// ana hatta silinen bloğun boşluğunu kapat (bloklar sola kayar)
function compact(i){ const row=S.prog.rungs[i]&&S.prog.rungs[i].c[0]; if(!row) return; const k=row.slice(0,OUTC).filter(Boolean); for(let c=0;c<OUTC;c++) row[c]=k[c]||null; }

/* ---------- Ladder etkileşimi ---------- */
$('#rungs').addEventListener('click',e=>{
  if(justDragged) return; Snd.init();
  if(e.target.closest('#addr')){ if(guard()) return; S.prog.rungs.push(mkRung()); saveDraft(); renderLadder(); Snd.click(); scrollToNewRung(); return; }
  const rm=e.target.closest('.rm'); if(rm){ if(guard()) return; rungMenu(+rm.closest('.rung').dataset.i); return; }
  const ce=e.target.closest('.cell'); if(!ce) return; if(guard()) return;
  const i=+ce.closest('.rung').dataset.i, r=+ce.dataset.r, c=+ce.dataset.c, cell=S.prog.rungs[i].c[r][c];
  if(cell){ openEditor(i,r,c,cell,false); return; }
  if(!S.tool){ toast(tx('Paletten bir bloğu buraya sürükle ya da önce seç','Drag a block here from the palette, or select one first')); return; }
  const m=canPlace(S.tool,i,r,c); if(m){ toast(m); return; }
  openEditor(i,r,c,{t:S.tool,a:null,pv:defPV(S.tool)},true);
});

/* ---------- Sürükle-bırak ---------- */
let drag=null;
function cellAt(x,y){ const el=document.elementFromPoint(x,y); return el&&el.closest?el.closest('#rungs .cell'):null; }
function inPalette(x,y){ const el=document.elementFromPoint(x,y); return !!(el&&el.closest&&el.closest('#palette')); }
function dragClean(){ document.querySelectorAll('.cell.dz,.dragsrc').forEach(x=>x.classList.remove('dz','sw','dragsrc')); $('#ghost').style.display='none'; $('#ghost').classList.remove('lift'); document.body.classList.remove('dragging'); $('#palette').classList.remove('trash','hot'); refreshTool(); }
// hedef hücre için eylem: 'move' | 'swap' | hata mesajı
function dropAction(d,i,r,c){
  if(!d.from) return canPlace(d.t,i,r,c)||'new';
  const f=d.from; if(f.i===i&&f.r===r&&f.c===c) return 'x';
  const rs=S.prog.rungs, src=rs[f.i].c[f.r][f.c], dst=rs[i].c[r][c];
  if(r===1&&!rs[i].br) return 'x';
  rs[f.i].c[f.r][f.c]=null;
  let res;
  if(!dst) res=canPlace(src.t,i,r,c)||'move';
  else { rs[i].c[r][c]=null; const a=canPlace(src.t,i,r,c), b=canPlace(dst.t,f.i,f.r,f.c); rs[i].c[r][c]=dst; res=a||b?(a||b):'swap'; }
  rs[f.i].c[f.r][f.c]=src; return res;
}
/* basılı tutunca bilgi balonu */
let tipT=null;
function hideTip(){ const t=$('#tip'); if(t) t.classList.remove('show'); }
function showTip(el,t,extra){
  const E=ELEM[ELEM_OF(t)]; if(!E) return; const tp=$('#tip');
  tp.innerHTML=`<div class="th">${palSym(t)}<b>${E===ELEM[t]?tx(E.t[0],E.t[1]):BN[t]}</b></div>${extra?`<div class="tx2">${extra}</div>`:''}<p>${tx(E.d[0],E.d[1])}</p><small>${tx(E.e[0],E.e[1])}</small>`;
  const r=el.getBoundingClientRect(), app=$('#app').getBoundingClientRect(); tp.style.left='0px'; tp.style.top='0px'; tp.classList.add('show');
  const w=tp.offsetWidth, h=tp.offsetHeight; let x=r.left+r.width/2-w/2; x=Math.max(app.left+8,Math.min(app.right-w-8,x));
  let y=r.top-h-12; if(y<app.top+8) y=r.bottom+12; tp.style.left=x+'px'; tp.style.top=y+'px';
  tp.style.setProperty('--ax',(r.left+r.width/2-x)+'px'); tp.classList.toggle('below',y>r.top);
  Hap.info(); Snd.init(); Snd.click();
}
const isMouse=e=>e&&e.pointerType==='mouse';
function armTip(el,t,extra,e){ clearTimeout(tipT); if(isMouse(e)) return; tipT=setTimeout(()=>{ if(drag&&!drag.on){ drag.tip=true; showTip(el,t,extra); } },430); }
// parçayı tutulduğu noktadan kaldır (hayalet, imleç/parmak altındaki noktayı korur)
function grab(e,el,o){ const rc=el.getBoundingClientRect(); o.gx=(e.clientX-rc.left)/rc.width; o.gy=(e.clientY-rc.top)/rc.height; o.mouse=isMouse(e);
  if(o.mouse){ e.preventDefault(); try{ el.setPointerCapture(e.pointerId); }catch(_){} } return o; }
function placeGhost(x,y){ const g=$('#ghost'); g.style.left=(x-drag.gx*72)+'px'; g.style.top=(y-drag.gy*64)+'px'; }
document.addEventListener('pointerdown',e=>{ if(!e.target.closest('#tip')) hideTip(); },true);
$('#palette').addEventListener('pointerdown',e=>{ const b=e.target.closest('.pal'); if(!b||e.button>0) return;
  drag=grab(e,b,{t:b.dataset.t,x:e.clientX,y:e.clientY,pid:e.pointerId,on:false,ro:S.view}); armTip(b,b.dataset.t,null,e); });
$('#rungs').addEventListener('pointerdown',e=>{
  const ce=e.target.closest('.cell'); if(!ce||e.button>0) return;
  const i=+ce.closest('.rung').dataset.i, r=+ce.dataset.r, c=+ce.dataset.c, cell=S.prog.rungs[i].c[r][c]; if(!cell) return;
  drag=grab(e,ce,{t:cell.t,x:e.clientX,y:e.clientY,pid:e.pointerId,on:false,from:{i,r,c,el:ce},ro:S.view});
  armTip(ce,cell.t,cellDesc(cell),e);
});
window.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pid) return;
  if(drag.tip||drag.ro) return;
  if(!drag.on){
    const dx=e.clientX-drag.x, dy=e.clientY-drag.y, dist=Math.hypot(dx,dy);
    if(dist<(drag.mouse?4:drag.from?7:10)) return;
    if(!drag.from&&!drag.mouse&&Math.abs(dy)<Math.abs(dx)*0.45){ clearTimeout(tipT); drag=null; return; }   // belirgin yatay hareket = palet kaydırma
    if(drag.from){ drag.from.el.classList.add('dragsrc'); $('#palette').classList.add('trash'); }
    clearTimeout(tipT); hideTip(); Hap.pick();
    drag.on=true; const g=$('#ghost'); g.innerHTML=palSym(drag.t)+'<span>'+(drag.from?drag.from.el.querySelector('.ad,.bt')?.textContent||BS[drag.t]:BS[drag.t])+'</span>';
    placeGhost(e.clientX,e.clientY); g.style.display='flex'; requestAnimationFrame(()=>g.classList.add('lift')); document.body.classList.add('dragging');
    $('#rungs').dataset.tool=isOut(drag.t)?'o':'c'; Snd.init(); Snd.click();
  }
  e.preventDefault();
  placeGhost(e.clientX,e.clientY);
  const rb=$('#rungs').getBoundingClientRect();
  // kenar kaydırma yalnızca kenarda bir an bekleyince (paletten yukarı geçerken liste kaymasın)
  const zone=(e.clientY<rb.top+28&&e.clientY>rb.top-40)?-1:(e.clientY>rb.bottom-28&&e.clientY<rb.bottom)?1:0, now=performance.now();
  if(zone!==drag.zone){ drag.zone=zone; drag.zt=now; } if(zone&&now-drag.zt>350) $('#rungs').scrollTop+=zone*7;
  if(drag.from) $('#palette').classList.toggle('hot',inPalette(e.clientX,e.clientY));
  const ce=cellAt(e.clientX,e.clientY);
  document.querySelectorAll('.cell.dz').forEach(x=>{ if(x!==ce) x.classList.remove('dz','sw'); });
  if(ce){ const a=dropAction(drag,+ce.closest('.rung').dataset.i,+ce.dataset.r,+ce.dataset.c);
    if(a==='new'||a==='move'||a==='swap'){ if(!ce.classList.contains('dz')) Hap.tap(); ce.classList.add('dz'); ce.classList.toggle('sw',a==='swap'); } }
},{passive:false});
document.addEventListener('touchmove',e=>{ if(drag&&drag.on) e.preventDefault(); },{passive:false});
window.addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.pid) return; const d=drag; drag=null; clearTimeout(tipT); dragClean();
  if(d.tip){ justDragged=true; setTimeout(()=>justDragged=false,80); setTimeout(hideTip,2600); return; }
  if(!d.on) return; Hap.drop(); justDragged=true; setTimeout(()=>justDragged=false,60); Snd.init();
  const rs=S.prog.rungs;
  if(d.from&&inPalette(e.clientX,e.clientY)){ rs[d.from.i].c[d.from.r][d.from.c]=null; if(d.from.r===0) compact(d.from.i); saveDraft(); renderLadder(); Snd.click(); Hap.err(); toast(tx('Blok silindi','Block deleted')); return; }
  const ce=cellAt(e.clientX,e.clientY);
  if(!ce){ const ad=document.elementFromPoint(e.clientX,e.clientY); if(!d.from&&ad&&ad.closest&&ad.closest('#addr')&&S.prog.rungs.length<8){   // "Oluştur" üstüne bırakınca satır açılır
      if(isOut(d.t)){ toast(tx('Yeni satır bir kontakla başlar','A new rung starts with a contact')); return; }
      S.prog.rungs.push(mkRung()); saveDraft(); renderLadder(); openEditor(S.prog.rungs.length-1,0,0,{t:d.t,a:null,pv:defPV(d.t)},true); }
    return; }
  const i=+ce.closest('.rung').dataset.i, r=+ce.dataset.r, c=+ce.dataset.c, a=dropAction(d,i,r,c);
  if(a==='new') openEditor(i,r,c,{t:d.t,a:null,pv:defPV(d.t)},true);
  else if(a==='move'){ rs[i].c[r][c]=rs[d.from.i].c[d.from.r][d.from.c]; rs[d.from.i].c[d.from.r][d.from.c]=null; if(d.from.r===0&&!(d.from.i===i&&r===0)) compact(d.from.i); else if(d.from.r===0) compact(i); S.popCell=null; saveDraft(); renderLadder(); Snd.place(); }
  else if(a==='swap'){ const t=rs[i].c[r][c]; rs[i].c[r][c]=rs[d.from.i].c[d.from.r][d.from.c]; rs[d.from.i].c[d.from.r][d.from.c]=t; S.popCell=[i,r,c]; saveDraft(); renderLadder(); Snd.place(); toast(tx('Bloklar yer değiştirdi','Blocks swapped')); }
  else if(a!=='dolu'&&a!=='x') toast(a);
});
window.addEventListener('pointercancel',e=>{ if(drag&&e.pointerId===drag.pid){ clearTimeout(tipT); drag=null; dragClean(); } });
$('#palette').addEventListener('contextmenu',e=>e.preventDefault()); $('#rungs').addEventListener('contextmenu',e=>e.preventDefault());
