$('#bClear').onclick=()=>{ if(guard()) return; if(!countBlocks(S.prog)){ toast(tx('Program zaten boş','Program is already empty')); return; }
  card(`<h3>${tx('Programı temizle?','Clear program?')}</h3><p class="t" style="text-align:center">${tx('Tüm satırlar silinecek.','All rungs will be deleted.')}</p><div class="brow"><button class="btn wide" id="n">${tx('İptal','Cancel')}</button><button class="btn dan wide" id="y">${tx('Temizle','Clear')}</button></div>`,e=>{
    if(e.target.id==='y'){ S.prog={rungs:[mkRung(),mkRung()]}; saveDraft(); renderLadder(); closeAll(); } else if(e.target.id==='n') closeAll(); }); };

/* ---------- Simülasyon kontrolü ---------- */
function setPill(){ const p=$('#pill'); if(world.err){p.textContent=tx('HATA','FAULT');p.className='bad';} else if(S.running){p.textContent='RUN';p.className='run';} else {p.textContent=world.done?tx('TAMAM','DONE'):'STOP';p.className='';} }
function startSim(){
  if(!countBlocks(S.prog)){ toast(tx('Program boş — önce ladder satırlarını doldur','Program is empty — fill in the ladder rungs first')); return; }
  Snd.init(); $('#err').style.display='none'; closeAll();
  world.reset(); plc.reset(); S.running=true; $('#run').textContent='■ STOP'; $('#run').classList.add('on'); setPill(); Snd.click();
}
function stopSim(silent){
  S.running=false; if(world) world.reset(); plc.reset(); $('#err').style.display='none';
  $('#run').textContent='▶ RUN'; $('#run').classList.remove('on'); if(world) setPill(); if(!silent) Snd.click(); if(LIVE.length) updateLive();
}
$('#run').onclick=()=>{ if(S.running||world.err) stopSim(); else startSim(); };
$('#errRetry').onclick=()=>{ stopSim(true); startSim(); };
$('#errEdit').onclick=()=>stopSim();
$('#bSpd').onclick=()=>{ S.speed=S.speed===1?2:1; $('#bSpd').textContent=S.speed+'x'; Snd.click(); };
function setSound(v){ save.sound=v; $('#bSnd').textContent=v?'🔊':'🔇'; persist(); }
$('#bSnd').onclick=()=>{ setSound(!save.sound); Snd.init(); Snd.click(); };
$('#bHint').onclick=()=>{ card(`<h3>💡 ${tx('İpucu','Hint')}</h3><p class="t">${S.lv.hint}</p><div class="brow"><button class="btn pri wide" id="ok">${tx('Tamam','OK')}</button></div>`,e=>{ if(e.target.id==='ok') closeAll(); }); };
$('#task').onclick=()=>{ card(`<h3>${S.lv.title}</h3><p class="t">${S.lv.task}</p><div class="brow"><button class="btn pri wide" id="ok">${tx('Tamam','OK')}</button></div>`,e=>{ if(e.target.id==='ok') closeAll(); }); };
$('#bMenu').onclick=()=>{ Snd.init(); Snd.click(); showMenu('grid',S.lv.cat,S.lv.diff); };

function onFail(){
  S.running=false; $('#errT').textContent='⚠ '+world.err; $('#err').style.display='block';
  $('#run').textContent='▶ RUN'; $('#run').classList.remove('on'); Snd.err(); setPill();
}
function onWin(){
  S.running=false; $('#run').textContent='▶ RUN'; $('#run').classList.remove('on'); setPill();
  const wasView=S.view, first=!save.done[S.id], n=countBlocks(S.prog), lv=S.lv;
  save.done[S.id]={prog:{rungs:clone(S.prog.rungs)},tags:customTags(S.tags)}; delete save.draft[S.id]; persist();
  S.redo=false; S.view=true; refreshMode(); Snd.win();
  setTimeout(()=>{ if(!world.done) return;
    const nx=lv.n<PER-1?S.id+1:null;
    card(`<h3 style="color:var(--neon);font-size:21px">${tx('BÖLÜM TAMAM!','LEVEL COMPLETE!')}</h3><div class="gain">${first?tx('+1 PUAN','+1 POINT'):wasView?tx('✔ Çözüm çalışıyor','✔ Solution works'):tx('✔ Çözüm güncellendi','✔ Solution updated')}</div>
    <p class="t" style="text-align:center">${tx('Toplam','Total')} <b style="color:var(--neon)">${points()}</b> / ${TOTAL} ${tx('puan','points')}<br>${tx('Kullanılan blok','Blocks used')}: <b>${n}</b> · ${tx('referans','reference')} ${lv.opt}</p>
    ${nx!==null?'<div class="brow"><button class="btn pri wide" id="nx">'+tx('Sonraki Bölüm ▶','Next Level ▶')+'</button></div>':''}
    <div class="brow"><button class="btn wide" id="rt">${tx('👁 Çözümü Gör','👁 View Solution')}</button><button class="btn wide" id="mn">${tx('☰ Bölümler','☰ Levels')}</button></div>`,e=>{
      if(e.target.id==='nx') loadLevel(nx); else if(e.target.id==='rt'){ stopSim(true); closeAll(); renderLadder(); } else if(e.target.id==='mn'){ stopSim(true); closeAll(); showMenu('grid',lv.cat,lv.diff); } }); },700);
}

/* ---------- MENÜLER ---------- */
const BAR=(v,max,c)=>`<div class="bar"><i style="width:${(100*v/max).toFixed(1)}%;background:${c}"></i></div>`;
function showMenu(scr,cat,diff){
  if(S.running) stopSim(true);
  S.mscr=scr; if(cat!==undefined){ S.mcat=cat; } if(diff!==undefined) S.mdiff=diff; cat=S.mcat; diff=S.mdiff;
  const back=t=>`<button class="ib" data-go="${t}">‹</button>`; let h='';
  if(scr==='main'){
    const L=save.last>=0?getLevel(save.last):null;
    h=`<div class="mm"><canvas id="mcv"></canvas><div class="mm-title">LADDER<span>MASTER</span></div><div class="mm-sub">${tx('PLC MERDİVEN MANTIĞI BULMACASI','PLC LADDER LOGIC PUZZLE')}</div>
    <div class="pts">⚡ ${points()} / ${TOTAL} ${tx('puan','points')}</div>
    <button class="bigbtn play" data-go="cats">${tx('▶ OYNA','▶ PLAY')}</button>
    ${L?`<button class="bigbtn" data-go="cont">${tx('⏵ Devam Et','⏵ Continue')} <small>${CATS[L.cat].n} · ${DIFFS[L.diff].n} ${L.n+1}</small></button>`:''}
    <button class="bigbtn" data-go="prog">${tx('🏆 İlerleme','🏆 Progress')}</button>
    <button class="bigbtn" data-go="how">${tx('❓ Nasıl Oynanır','❓ How to Play')}</button>
    <button class="bigbtn" data-go="set">${tx('⚙ Ayarlar','⚙ Settings')}</button></div>`;
  } else if(scr==='cats'){
    h=`<div class="topbar">${back('main')}<h3>${tx('Kategori Seç','Choose Category')}</h3><span class="pp">⚡ ${points()}</span></div>`+
    CATS.map((c,i)=>{ const d=catDone(i); return `<button class="ccard" data-go="diffs" data-c="${i}" style="border-color:color-mix(in srgb,${c.c} 35%,transparent)"><div class="ic" style="color:${c.c}">${palSym(c.ic)}</div><div class="bd"><b>${c.n}</b><small>${c.s}</small>${BAR(d,300,c.c)}</div><div class="cnt">${d}<small>/300</small></div></button>`; }).join('');
  } else if(scr==='diffs'){
    const C=CATS[cat];
    h=`<div class="topbar">${back('cats')}<h3 style="color:${C.c}">${C.n}</h3><span class="pp">${catDone(cat)}/300</span></div>`+
    DIFFS.map((d,i)=>{ const k=tierDone(cat,i); return `<button class="ccard" data-go="grid" data-c="${cat}" data-d="${i}" style="border-color:color-mix(in srgb,${d.c} 40%,transparent)"><div class="ic" style="color:${d.c};font:900 22px system-ui">${'●'.repeat(i+1)}</div><div class="bd"><b style="color:${d.c}">${d.n}</b><small>${d.s} · 100 ${tx('bölüm','levels')}</small>${BAR(k,100,d.c)}</div><div class="cnt">${k}<small>/100</small></div></button>`; }).join('');
  } else if(scr==='grid'){
    const C=CATS[cat], D=DIFFS[diff], base=cat*300+diff*100;
    h=`<div class="topbar">${back('diffs')}<h3><span style="color:${C.c}">${C.n}</span> · <span style="color:${D.c}">${D.n}</span></h3><button class="ib" data-go="main">🏠</button></div>
    <div class="prow"><span>${tx('İlerleme','Progress')}</span>${BAR(tierDone(cat,diff),100,D.c)}<b>${tierDone(cat,diff)}/100</b></div><div class="lvs5" style="margin-top:10px">`;
    for(let i=0;i<PER;i++){ const id=base+i, dn=!!save.done[id], ok=unlocked(id);
      h+=`<button class="lv5 ${dn?'dn':''} ${ok?'':'lock'} ${id===S.id?'cur':''}" data-go="lvl" data-id="${id}">${ok?i+1:'🔒'}<small>${dn?'✔':''}</small></button>`; }
    h+='</div>';
  } else if(scr==='prog'){
    h=`<div class="topbar">${back('main')}<h3>${tx('İlerleme','Progress')}</h3><span class="pp">⚡ ${points()} / ${TOTAL}</span></div><p class="t">${tx(`Her tamamlanan bölüm <b>1 puan</b>. Toplam ${TOTAL} bölüm.`,`Each completed level is worth <b>1 point</b>. ${TOTAL} levels in total.`)}</p>`+
    CATS.map((c,ci)=>`<div class="cat" style="color:${c.c}">${c.n} · ${catDone(ci)}/300</div>`+DIFFS.map((d,di)=>`<div class="prow"><span style="color:${d.c}">${d.n}</span>${BAR(tierDone(ci,di),100,d.c)}<b>${tierDone(ci,di)}/100</b></div>`).join('')).join('');
  } else if(scr==='set'){
    const sg=(k,v,l)=>`<button data-go="${k}" data-v="${v}" class="${save[k]===v?'on':''}">${l}</button>`;
    h=`<div class="topbar">${back('main')}<h3>${tx('Ayarlar','Settings')}</h3></div>
    <div class="grp">${tx('TEMA','THEME')}</div><div class="seg">${sg('theme','light',tx('☀ Açık','☀ Light'))}${sg('theme','dark',tx('☾ Karanlık','☾ Dark'))}${sg('theme','auto',tx('◐ Otomatik','◐ Auto'))}</div>
    <div class="grp">${tx('DİL','LANGUAGE')}</div><div class="seg">${sg('lang','tr','🇹🇷 Türkçe')}${sg('lang','en','🇬🇧 English')}</div>
    <div class="grp">${tx('OYUN','GAME')}</div>
    <button class="mi" data-go="snd">${save.sound?tx('🔊 Ses: Açık','🔊 Sound: On'):tx('🔇 Ses: Kapalı','🔇 Sound: Off')}</button>
    <button class="mi" data-go="unl">${save.unlock?'☑':'☐'} ${tx('Tüm bölüm kilitlerini aç','Unlock all levels')}</button>
    <button class="mi" data-go="rst" style="color:var(--redt)">${tx('↺ Tüm ilerlemeyi sıfırla','↺ Reset all progress')}</button>`;
  } else if(scr==='how'){
    h=`<div class="topbar">${back('main')}<h3>${tx('Nasıl Oynanır?','How to Play')}</h3></div>${HOW()}<button class="bigbtn play" data-go="cats" style="margin-top:12px">${tx('▶ OYNA','▶ PLAY')}</button>`;
  }
  $('#menuIn').innerHTML=h; $('#menuIn').scrollTop=0; $('#menu').classList.add('show');
  if(scr==='grid'){ const cur=$('#menuIn .lv5.cur'); if(cur) cur.scrollIntoView({block:'center'}); }
}
const HOW=()=>tx(`<p class="t"><b>Amaç:</b> Görevdeki fabrika makinesini ladder (merdiven) diyagramı ile programla.</p>
<p class="t"><b>1.</b> Alttaki paletten bir bloğu tutup ızgaradaki boş kutuya <b>sürükle-bırak</b> (ya da bloğa dokunup sonra kutuya dokun).<br>
<b>2.</b> Açılan pencerede adresi seç: <b>I</b> giriş, <b>Q</b> çıkış, <b>M</b> hafıza, <b>T</b> zamanlayıcı, <b>C</b> sayıcı. İstersen etiket yaz, süre/adet ayarla.<br>
<b>3.</b> Kontaklar sol 4 sütuna, bobin/TON/TOF/CTU/CTD en sağ sütuna gider. VEYA bağlantısı için satırın <b>⋮</b> menüsünden paralel kol ekle.<br>
<b>4.</b> Yerleştirdiğin bir bloğu tutup sürükleyerek <b>taşı</b>; dolu kutuya bırakırsan iki blok <b>yer değiştirir</b>, alttaki palete bırakırsan <b>silinir</b>.<br>
<b>5.</b> <b style="color:var(--neon)">▶ RUN</b> ile çalıştır, sahnedeki START / STOP / şalterlere dokun. Yeşil hatlar enerjili.<br>
<b>6.</b> Görevi tamamlayınca <b>+1 puan</b>. Tamamlanan bölümü açınca kayıtlı çözümün görünür; Sıfırla ile yeniden çözebilirsin — çözmeden çıkarsan eski çözüm silinmez.</p>`,
`<p class="t"><b>Goal:</b> Program the factory machine in each task with a ladder diagram.</p>
<p class="t"><b>1.</b> Grab a block from the palette below and <b>drag &amp; drop</b> it onto an empty cell (or tap the block, then tap the cell).<br>
<b>2.</b> In the popup choose an address: <b>I</b> input, <b>Q</b> output, <b>M</b> memory, <b>T</b> timer, <b>C</b> counter. Optionally type a tag and set time/count.<br>
<b>3.</b> Contacts go in the 4 left columns; coil/TON/TOF/CTU/CTD go in the rightmost column. For an OR connection add a parallel branch from the rung's <b>⋮</b> menu.<br>
<b>4.</b> Drag a placed block to <b>move</b> it; drop it on a filled cell to <b>swap</b>, or onto the palette to <b>delete</b> it.<br>
<b>5.</b> Press <b style="color:var(--neon)">▶ RUN</b> and tap START / STOP / switches in the scene. Green lines are energized.<br>
<b>6.</b> Complete the task for <b>+1 point</b>. Opening a completed level shows your saved solution; Reset lets you solve it again — if you leave without solving, the old solution is kept.</p>`);
$('#menuIn').onclick=e=>{
  const b=e.target.closest('[data-go]'); if(!b) return; Snd.init(); Snd.click(); const g=b.dataset.go;
  if(g==='main'||g==='cats'||g==='prog'||g==='set'||g==='how') showMenu(g);
  else if(g==='diffs') showMenu('diffs',b.dataset.c!==undefined?+b.dataset.c:S.mcat);
  else if(g==='grid') showMenu('grid',+b.dataset.c,+b.dataset.d);
  else if(g==='cont') loadLevel(save.last);
  else if(g==='lvl'){ const id=+b.dataset.id; if(!unlocked(id)){ toast(tx('Önce önceki bölümü tamamla (Ayarlar → kilitleri aç)','Complete the previous level first (Settings → unlock all)')); return; } loadLevel(id); }
  else if(g==='theme'){ save.theme=b.dataset.v; persist(); applyTheme(); showMenu('set'); }
  else if(g==='lang'){ setLang(b.dataset.v); showMenu('set'); }
  else if(g==='snd'){ setSound(!save.sound); showMenu('set'); }
  else if(g==='unl'){ save.unlock=!save.unlock; persist(); showMenu('set'); }
  else if(g==='rst'){ card(`<h3>${tx('Tüm ilerleme silinsin mi?','Delete all progress?')}</h3><p class="t" style="text-align:center">${tx('Puanlar ve kayıtlı çözümler silinecek.','Points and saved solutions will be deleted.')}</p><div class="brow"><button class="btn wide" id="n">${tx('İptal','Cancel')}</button><button class="btn dan wide" id="y">${tx('Sıfırla','Reset')}</button></div>`,ev=>{
      if(ev.target.id==='y'){ save.done={}; save.draft={}; save.last=-1; persist(); loadLevel(0); showMenu('main'); } else if(ev.target.id==='n') $('#ovCard').classList.remove('show'); }); }
};
function drawMenuAnim(now){
  const c=document.getElementById('mcv'); if(!c) return; const r=c.getBoundingClientRect(); if(!r.width) return;
  const D=Math.min(2,window.devicePixelRatio||1); if(c.width!==Math.round(r.width*D)){ c.width=Math.round(r.width*D); c.height=Math.round(r.height*D); }
  const x=c.getContext('2d'); x.setTransform(D,0,0,D,0,0); const w=r.width,h=r.height,t=now/1000; x.clearRect(0,0,w,h);
  const L=18,Rr=w-18, cs=getComputedStyle(document.documentElement), BG=cs.getPropertyValue('--bg').trim()||'#0d1117', WR=cs.getPropertyValue('--bar').trim()||'#26323f', SY=cs.getPropertyValue('--sym').trim()||'#9fb0c2';
  x.shadowColor='#39ff6a'; x.shadowBlur=10; x.strokeStyle='#39ff6a'; x.lineWidth=3.5; x.beginPath(); x.moveTo(L,6); x.lineTo(L,h*0.58); x.moveTo(Rr,6); x.lineTo(Rr,h*0.58); x.stroke();
  [0,1].forEach(i=>{ const y=22+i*36, ph=(t*0.5+i*0.45)%1.4, p=Math.min(1,ph);
    x.shadowBlur=0; x.strokeStyle=WR; x.lineWidth=3; x.beginPath(); x.moveTo(L,y); x.lineTo(Rr,y); x.stroke();
    x.shadowBlur=10; x.strokeStyle='#39ff6a'; x.beginPath(); x.moveTo(L,y); x.lineTo(L+(Rr-L)*p,y); x.stroke();
    const cx=L+(Rr-L)*(0.25+i*0.15), qx=L+(Rr-L)*0.8, lit=p>0.8;
    x.fillStyle=BG; x.fillRect(cx-9,y-12,18,24); x.fillRect(qx-12,y-14,24,28);
    x.strokeStyle=p>0.3?'#39ff6a':SY; x.lineWidth=3; x.beginPath(); x.moveTo(cx-7,y-11); x.lineTo(cx-7,y+11); x.moveTo(cx+7,y-11); x.lineTo(cx+7,y+11); x.stroke();
    x.strokeStyle=lit?'#39ff6a':SY; x.beginPath(); x.arc(qx+12,y,14,Math.PI*0.75,Math.PI*1.25); x.stroke(); x.beginPath(); x.arc(qx-12,y,14,-Math.PI*0.25,Math.PI*0.25); x.stroke();
    if(lit){ x.fillStyle='rgba(57,255,106,.25)'; x.beginPath(); x.arc(qx,y,8,0,7); x.fill(); } });
  x.shadowBlur=0; const by=h*0.82, bh=26;
  x.fillStyle='#0b0f14'; x.fillRect(0,by-bh/2-4,w,bh+8); x.fillStyle='#252e38'; x.fillRect(0,by-bh/2,w,bh);
  x.strokeStyle='#323e4b'; x.lineWidth=2; const off=(t*40)%16; for(let X=-16+off;X<w;X+=16){ x.beginPath(); x.moveTo(X,by-bh/2); x.lineTo(X,by+bh/2); x.stroke(); }
  for(let i=0;i<6;i++){ const X=((t*40+i*90)%(w+60))-30; x.fillStyle='#b9822f'; x.strokeStyle='#6b4a14'; x.lineWidth=1.5; rr(X-10,by-10,20,20,3); x.fill(); x.stroke(); x.fillStyle='rgba(255,230,160,.5)'; x.fillRect(X-8,by-1.5,16,3); }
  const sx=w*0.62, on=[0,1,2,3,4,5].some(i=>Math.abs(((t*40+i*90)%(w+60))-30-sx)<10);
  x.strokeStyle=on?'#ffb020':'rgba(255,77,77,.7)'; x.setLineDash([3,3]); x.beginPath(); x.moveTo(sx,by-bh/2-6); x.lineTo(sx,by+bh/2+6); x.stroke(); x.setLineDash([]);
}

/* ---------- Tema & Dil ---------- */
const mqDark=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
function applyTheme(){ const t=save.theme||'auto'; const dark=t==='dark'||(t==='auto'&&(!mqDark||mqDark.matches));
  document.documentElement.dataset.theme=dark?'dark':'light'; const m=document.querySelector('meta[name=theme-color]'); if(m) m.content=dark?'#0d1117':'#eef2f6'; }
if(mqDark){ try{ mqDark.addEventListener('change',()=>{ if((save.theme||'auto')==='auto') applyTheme(); }); }catch(e){ mqDark.addListener&&mqDark.addListener(()=>{ if((save.theme||'auto')==='auto') applyTheme(); }); } }
function applyStatic(){
  document.documentElement.lang=LANG;
  $('#errRetry').textContent=tx('↻ Tekrar Dene','↻ Retry'); $('#errEdit').textContent=tx('✎ Düzenle','✎ Edit');
  $('#doneTxt').innerHTML=tx('<b>✔ Bu bölüm tamamlandı.</b><br>Sıfırlamak ister misiniz?','<b>✔ Level completed.</b><br>Do you want to reset it?');
  $('#bReset').textContent=tx('↺ Sıfırla','↺ Reset'); $('#bClear').textContent=tx('🗑 Temizle','🗑 Clear');
  $('#palette').dataset.trash=tx('🗑  Silmek için buraya bırak','🗑  Drop here to delete');
}
function setLang(l){
  LANG=l==='en'?'en':'tr'; save.lang=LANG; persist(); for(const k in LV_CACHE) delete LV_CACHE[k];
  applyStatic();
  if(S.lv){ const lv=S.lv=getLevel(S.id); S.tags=Object.assign(defaultTags(lv),customTags(S.tags)); world=new World(lv); plc.reset(); stopSim(true);
    const D=DIFFS[lv.diff]; $('#title').innerHTML=`<small style="color:${D.c}">${D.n[0]}${lv.n+1}</small>${lv.title}`; $('#task').textContent=lv.task;
    buildPalette(); refreshMode(); renderLadder(); }
}
