/* ---------- Bölüm yükleme / mod ---------- */
function loadLevel(id,quiet){
  S.id=id; const lv=S.lv=getLevel(id); save.last=id; persist();
  const dn=save.done[id]; S.redo=false; S.tool=null;
  if(dn){ S.view=true; S.prog=clone(dn.prog); S.tags=Object.assign(defaultTags(lv),customTags(dn.tags)); }
  else { S.view=false; const d=save.draft[id]; S.prog=d&&d.rungs&&d.rungs.length?{rungs:clone(d.rungs)}:{rungs:[mkRung(),mkRung()]}; S.tags=Object.assign(defaultTags(lv),customTags(d&&d.tags)); }
  world=new World(lv); plc.reset(); stopSim(true);
  const D=DIFFS[lv.diff];
  $('#title').innerHTML=`<small style="color:${D.c}">${D.n[0]}${lv.n+1}</small>${lv.title}`;
  $('#task').textContent=lv.task;
  S.fresh=S.view?[]:freshElems(lv);
  buildPalette(); refreshMode(); renderLadder(); closeAll();
  if(!quiet&&S.fresh.length) setTimeout(()=>showIntro(S.fresh),150);
}
function refreshMode(){
  $('#palette').style.display=S.view?'none':'flex'; $('#doneBar').style.display=S.view?'flex':'none';
  $('#bClear').style.visibility=S.view?'hidden':'visible'; updInfo();
}
function saveDraft(){ if(S.view||S.redo) return; save.draft[S.id]={rungs:S.prog.rungs,tags:customTags(S.tags)}; persist(); }
const saveProg=saveDraft;
function guard(){ if(S.view){ toast(tx('Tamamlanmış bölüm — düzenlemek için alttaki Sıfırla\'ya bas','Level completed — tap Reset below to edit')); return true; } return false; }
$('#bReset').onclick=()=>{ Snd.init(); Snd.click(); S.view=false; S.redo=true; S.prog={rungs:[mkRung(),mkRung()]}; S.tags=defaultTags(S.lv); S.tool=null;
  stopSim(true); refreshMode(); renderLadder(); toast(tx('Sıfırlandı — çözmeden çıkarsan eski çözümün korunur','Reset — if you leave without solving, your old solution is kept')); };

/* ---------- Palet ---------- */
function buildPalette(){
  const p=$('#palette'); p.innerHTML='';
  S.lv.pal.forEach(t=>{ const b=document.createElement('button'); b.className='pal'; b.dataset.t=t; b.innerHTML=palSym(t)+'<span>'+BS[t]+'</span>'+((S.fresh||[]).includes(t)?'<em class="nw">'+tx('YENİ','NEW')+'</em>':''); p.appendChild(b); });
}
let justDragged=false;
$('#palette').addEventListener('click',e=>{ if(justDragged) return; const b=e.target.closest('.pal'); if(!b) return; Snd.init(); Snd.click(); S.tool=S.tool===b.dataset.t?null:b.dataset.t; refreshTool(); });
function refreshTool(){
  document.querySelectorAll('.pal').forEach(b=>b.classList.toggle('sel',b.dataset.t===S.tool));
  $('#rungs').dataset.tool=S.tool?(isOut(S.tool)?'o':'c'):''; updInfo();
}
function updInfo(){
  const n=countBlocks(S.prog);
  const msg=S.view?tx('<span style="color:var(--neon)">✔ Kayıtlı çözümün</span> — ▶ RUN ile çalıştırıp izle','<span style="color:var(--neon)">✔ Your saved solution</span> — press ▶ RUN to watch')
    :S.redo?tx('<span style="color:var(--amb)">Yeniden çözüyorsun</span> — yeni çözüm bulana kadar eskisi korunur','<span style="color:var(--amb)">Re-solving</span> — old solution kept until you solve it again')
    :S.tool?tx(`Seçili: <b style="color:var(--blu)">${BN[S.tool]}</b> — ${isOut(S.tool)?'son sütuna':'sol sütunlara'} dokun`,`Selected: <b style="color:var(--blu)">${BN[S.tool]}</b> — tap ${isOut(S.tool)?'the last column':'a left column'}`):tx('Bloğu yukarı <b>sürükle-bırak</b> ya da seç &amp; dokun','<b>Drag &amp; drop</b> a block up, or select &amp; tap');
  $('#einfo').innerHTML=tx(`Blok <b>${n}</b> · referans çözüm ${S.lv.opt} blok`,`Blocks <b>${n}</b> · reference solution ${S.lv.opt}`)+`<br>${msg}`;
}
function canPlace(t,i,r,c){
  const rg=S.prog.rungs[i]; if(!rg||rg.c[r][c]) return 'dolu'; if(r===1&&!rg.br) return 'x';
  if(isOut(t)){ if(c!==OUTC||r!==0) return r===1?tx('Paralel kolda yalnızca kontak olur','Only contacts go on a parallel branch'):tx('Bobin / zamanlayıcı / sayıcı en sağ sütuna konur','Coils / timers / counters go in the rightmost column'); }
  else if(c===OUTC) return tx('Kontaklar sol sütunlara konur','Contacts go in the left columns');
  return '';
}

/* ---------- Ladder etkileşimi ---------- */
$('#rungs').addEventListener('click',e=>{
  if(justDragged) return; Snd.init();
  if(e.target.closest('#addr')){ if(guard()) return; S.prog.rungs.push(mkRung()); saveDraft(); renderLadder(); Snd.click(); const r=$('#rungs'); r.scrollTop=r.scrollHeight; return; }
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
function dragClean(){ document.querySelectorAll('.cell.dz,.dragsrc').forEach(x=>x.classList.remove('dz','sw','dragsrc')); $('#ghost').style.display='none'; $('#palette').classList.remove('trash','hot'); refreshTool(); }
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
$('#palette').addEventListener('pointerdown',e=>{ const b=e.target.closest('.pal'); if(!b||S.view) return; drag={t:b.dataset.t,x:e.clientX,y:e.clientY,pid:e.pointerId,on:false}; });
$('#rungs').addEventListener('pointerdown',e=>{
  const ce=e.target.closest('.cell'); if(!ce||S.view) return;
  const i=+ce.closest('.rung').dataset.i, r=+ce.dataset.r, c=+ce.dataset.c, cell=S.prog.rungs[i].c[r][c]; if(!cell) return;
  drag={t:cell.t,x:e.clientX,y:e.clientY,pid:e.pointerId,on:false,from:{i,r,c,el:ce}};
});
window.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pid) return;
  if(!drag.on){
    const dx=e.clientX-drag.x, dy=e.clientY-drag.y, dist=Math.hypot(dx,dy);
    if(drag.from){ if(dist<7) return; drag.from.el.classList.add('dragsrc'); $('#palette').classList.add('trash'); }
    else { if(dist<10) return; if(e.pointerType!=='mouse'&&Math.abs(dy)<Math.abs(dx)){ drag=null; return; } }
    drag.on=true; const g=$('#ghost'); g.innerHTML=palSym(drag.t)+'<span>'+(drag.from?drag.from.el.querySelector('.ad,.bt')?.textContent||BS[drag.t]:BS[drag.t])+'</span>'; g.style.display='flex';
    $('#rungs').dataset.tool=isOut(drag.t)?'o':'c'; Snd.init(); Snd.click();
  }
  e.preventDefault();
  $('#ghost').style.transform=`translate(${e.clientX-31}px,${e.clientY-64}px)`;
  const rb=$('#rungs').getBoundingClientRect();
  if(e.clientY<rb.top+28&&e.clientY>rb.top-40) $('#rungs').scrollTop-=7; else if(e.clientY>rb.bottom-28&&e.clientY<rb.bottom+4) $('#rungs').scrollTop+=7;
  if(drag.from) $('#palette').classList.toggle('hot',inPalette(e.clientX,e.clientY));
  const ce=cellAt(e.clientX,e.clientY);
  document.querySelectorAll('.cell.dz').forEach(x=>{ if(x!==ce) x.classList.remove('dz','sw'); });
  if(ce){ const a=dropAction(drag,+ce.closest('.rung').dataset.i,+ce.dataset.r,+ce.dataset.c);
    if(a==='new'||a==='move'||a==='swap'){ ce.classList.add('dz'); ce.classList.toggle('sw',a==='swap'); } }
},{passive:false});
document.addEventListener('touchmove',e=>{ if(drag&&drag.on) e.preventDefault(); },{passive:false});
window.addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.pid) return; const d=drag; drag=null; dragClean();
  if(!d.on) return; justDragged=true; setTimeout(()=>justDragged=false,60); Snd.init();
  const rs=S.prog.rungs;
  if(d.from&&inPalette(e.clientX,e.clientY)){ rs[d.from.i].c[d.from.r][d.from.c]=null; saveDraft(); renderLadder(); Snd.click(); toast(tx('Blok silindi','Block deleted')); return; }
  const ce=cellAt(e.clientX,e.clientY); if(!ce) return;
  const i=+ce.closest('.rung').dataset.i, r=+ce.dataset.r, c=+ce.dataset.c, a=dropAction(d,i,r,c);
  if(a==='new') openEditor(i,r,c,{t:d.t,a:null,pv:defPV(d.t)},true);
  else if(a==='move'){ rs[i].c[r][c]=rs[d.from.i].c[d.from.r][d.from.c]; rs[d.from.i].c[d.from.r][d.from.c]=null; saveDraft(); renderLadder(); Snd.place(); }
  else if(a==='swap'){ const t=rs[i].c[r][c]; rs[i].c[r][c]=rs[d.from.i].c[d.from.r][d.from.c]; rs[d.from.i].c[d.from.r][d.from.c]=t; saveDraft(); renderLadder(); Snd.place(); toast(tx('Bloklar yer değiştirdi','Blocks swapped')); }
  else if(a!=='dolu'&&a!=='x') toast(a);
});
window.addEventListener('pointercancel',e=>{ if(drag&&e.pointerId===drag.pid){ drag=null; dragClean(); } });
