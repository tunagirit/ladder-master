$('#bClear').onclick=()=>{ if(guard()) return; if(!countBlocks(S.prog)){ toast(tx('Program zaten boş','Program is already empty')); return; }
  card(`<h3>${tx('Programı temizle?','Clear program?')}</h3><p class="t" style="text-align:center">${tx('Tüm satırlar silinecek.','All rungs will be deleted.')}</p><div class="brow"><button class="btn wide" id="n">${tx('İptal','Cancel')}</button><button class="btn dan wide" id="y">${tx('Temizle','Clear')}</button></div>`,e=>{
    if(e.target.id==='y'){ S.prog={rungs:[]}; saveDraft(); renderLadder(); closeAll(); } else if(e.target.id==='n') closeAll(); }); };

/* ---------- Simülasyon kontrolü ---------- */
function setPill(){ const p=$('#pill'); if(world.err){p.textContent=tx('HATA','FAULT');p.className='bad';} else if(S.running){p.textContent='RUN';p.className='run';} else {p.textContent=world.done?tx('TAMAM','DONE'):'STOP';p.className='';} }
function startSim(){
  if(!countBlocks(S.prog)){ toast(tx('Program boş — önce ladder satırlarını doldur','Program is empty — fill in the ladder rungs first')); return; }
  Snd.init(); $('#err').style.display='none'; closeAll();
  world.reset(); plc.reset(); idleT=0; S.running=true; $('#run').innerHTML=I('stop','f')+'STOP'; $('#run').classList.add('on'); setPill(); Snd.click();
}
function stopSim(silent){
  S.running=false; if(world) world.reset(); plc.reset(); $('#err').style.display='none';
  $('#run').innerHTML=I('play_arrow','f')+'RUN'; $('#run').classList.remove('on'); if(world) setPill(); if(!silent) Snd.click(); if(LIVE.length) updateLive();
}
$('#run').onclick=()=>{ Hap.tap(); if(S.running||world.err) stopSim(); else startSim(); };
$('#errRetry').onclick=()=>{ stopSim(true); startSim(); };
$('#errEdit').onclick=()=>stopSim();
$('#bSpd').onclick=()=>{ S.speed=S.speed===1?2:1; $('#bSpd').textContent=S.speed+'x'; Snd.click(); };
function setSound(v){ save.sound=v; $('#bSnd').innerHTML=I(v?'volume_up':'volume_off'); persist(); }
$('#bSnd').onclick=()=>{ setSound(!save.sound); Snd.init(); Snd.click(); };
// çözümü editördekine benzer görsel ladder diyagramı olarak çiz
function solLadder(lv){
  const tags=defaultTags(lv), cw=60, x0=22, W=x0*2+cw*COLS, RH=62, BR=58;
  const inner=t=>palSym(t).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
  const lbl=a=>(tags[a]||'').slice(0,11);
  return lv.sol.rungs.map((rg,ri)=>{
    const sp=branchSpan(rg), H=RH+(sp?BR:0), y=30;
    let g=`<text class="rn" x="2" y="11">R${ri+1}</text><path class="rl" d="M${x0-4} 4V${H-4}M${W-x0+4} 4V${H-4}"/><path class="w" d="M${x0-4} ${y}H${W-x0+4}"/>`;
    if(sp){ const xa=x0+sp.from*cw, xb=x0+(sp.to+1)*cw, yb=y+BR; g+=`<path class="w" d="M${xa} ${y}V${yb}H${xb}V${y}"/>`; }
    const cell=(c,col,yy)=>{ if(!c) return ''; const cx=x0+col*cw+cw/2;
      if(isOut(c.t)&&!['COIL','SET','RST'].includes(c.t)){
        const L=cellTxt(c), v=isTim(c.t)?`${fx(c.pv)} ${tx('sn','s')}`:L[1];
        return `<rect class="bx" x="${cx-28}" y="${yy-17}" width="56" height="34" rx="4"/><text class="bt" x="${cx}" y="${yy-3}"${L[0].length>8?' style="font-size:8px"':''}>${L[0]}</text><text class="bv" x="${cx}" y="${yy+11}"${v.length>8?' style="font-size:8px"':''}>${v}</text>`; }
      if(NOADDR.includes(c.t)) return `<rect class="bg" x="${cx-19}" y="${yy-13}" width="38" height="26"/><svg x="${cx-17}" y="${yy-12}" width="34" height="24" viewBox="0 0 34 24" class="sy">${inner(c.t)}</svg>`;
      if(c.t==='CMP') return `<rect class="bg" x="${cx-19}" y="${yy-13}" width="38" height="26"/><svg x="${cx-17}" y="${yy-12}" width="34" height="24" viewBox="0 0 34 24" class="sy"><path d="M0 12H8M26 12H34M8 3V21M26 3V21"/><text x="17" y="17" font-size="12">${OPSYM[c.op]}</text></svg><text class="ad" x="${cx}" y="${yy-17}">${c.a}</text><text class="ad" x="${cx}" y="${yy+24}" style="font-size:8.5px">${OPSYM[c.op]} ${c.pv}</text>`;
      return `<rect class="bg" x="${cx-19}" y="${yy-13}" width="38" height="26"/><svg x="${cx-17}" y="${yy-12}" width="34" height="24" viewBox="0 0 34 24" class="sy">${inner(c.t)}</svg><text class="ad" x="${cx}" y="${yy-17}">${c.a}</text><text class="tg" x="${cx}" y="${yy+24}">${lbl(c.a)}</text>`; };
    for(let col=0;col<COLS;col++) g+=cell(rg.c[0][col],col,y);
    if(sp) for(let col=sp.from;col<=sp.to;col++) g+=cell(rg.c[1][col],col,y+BR);
    return `<svg class="sl" viewBox="0 0 ${W} ${H}" width="100%">${g}</svg>`;
  }).join('');
}
function hintCard(open,reveal){
  const els=levelElems(S.lv), nR=S.lv.sol.rungs.length;
  card(`<h3>${tx('İpucu','Hint')}</h3>
   <div class="hstep"><h4><i>1</i>${tx('Hangi elemanlar lazım?','Which elements do you need?')}</h4>
    <div class="elist">${els.map(k=>`<button class="elb ${open===k?'on':''}" data-k="${k}">${elSym(k)}<span>${tx(ELEM[k].t[0],ELEM[k].t[1]).split('  ')[0].split(' — ')[0]}</span></button>`).join('')}</div>
    ${open?elemHTML(open,true):`<p class="t" style="margin:4px 0 0;font-size:12.5px">${tx(`Çözüm <b>${nR} satır</b> ve <b>${S.lv.opt} blok</b> ile yapılabilir. Bir elemana dokunarak ne işe yaradığını gör.`,`It can be solved with <b>${nR} rung(s)</b> and <b>${S.lv.opt} blocks</b>. Tap an element to see what it does.`)}</p>`}</div>
   <div class="hstep"><h4><i>2</i>${tx('Devre tarifi','Circuit recipe')}</h4>${reveal?`<p class="t" style="margin:0">${S.lv.hint}</p>`:`<button class="btn wide" id="rv1" style="width:100%">${I('lock_open')}${tx('Tarifi göster','Show recipe')}</button>`}</div>
   <div class="hstep"><h4><i>3</i>${tx('Tam çözüm','Full solution')}</h4>${reveal===2?`<div class="solv">${solLadder(S.lv)}</div><p class="t" style="font-size:11.5px;color:var(--dim);margin:6px 0 0">${tx('Bu devreyi aşağıdaki editöre kur, sonra RUN.','Build this circuit in the editor below, then RUN.')}</p>`:`<button class="btn wide" id="rv2" style="width:100%" ${reveal?'':'disabled style="opacity:.4;width:100%"'}>${I('key')}${tx('Çözümü göster','Show solution')}</button>`}</div>
   <div class="brow"><button class="btn pri wide" id="ok">${tx('Tamam','OK')}</button></div>`,e=>{
    const b=e.target.closest('.elb'); if(b){ Snd.click(); hintCard(open===b.dataset.k?null:b.dataset.k,reveal); return; }
    if(e.target.id==='rv1'){ Snd.click(); hintCard(open,1); return; }
    if(e.target.id==='rv2'&&reveal){ Snd.click(); hintCard(open,2); return; }
    if(e.target.id==='ok') closeAll(); });
}
$('#bHint').onclick=()=>hintCard(null);
$('#bMenu').onclick=()=>{ Snd.init(); Snd.click(); openPause(); };
function openPause(){
  const wasRun=S.running; if(wasRun) S.running=false;
  const lv=S.lv;
  card(`<h3>${tx('Duraklatıldı','Paused')}</h3><div style="color:var(--dim);font-size:12.5px">${lvLabel(lv)}${lv.extra?' · <span style="color:var(--red)">'+tx('Ekstra Zor','Extra Hard')+'</span>':''} — ${lv.title}</div>
   <div class="pz"><button class="bigbtn play" id="pzC" style="min-height:64px;font-size:20px">${I('play_arrow','f')}${tx('Devam Et','Resume')}</button>
   <button class="bigbtn" id="pzR">${I('restart_alt')}${tx('Simülasyonu Baştan Başlat','Restart Simulation')}</button>
   <button class="bigbtn" id="pzL">${I('map')}${tx('Yol Haritası','Level Map')}</button>
   <div class="brow2"><button class="bigbtn" id="pzS">${I('settings')}${tx('Ayarlar','Settings')}</button><button class="bigbtn" id="pzM">${I('home')}${tx('Ana Menü','Main Menu')}</button></div></div>`,e=>{
    const id=e.target.closest('button')&&e.target.closest('button').id; if(!id) return; Snd.click();
    if(id==='pzC'){ closeAll(); if(wasRun&&!world.err&&!world.done){ S.running=true; last=performance.now(); } }
    else if(id==='pzR'){ closeAll(); stopSim(true); if(countBlocks(S.prog)) startSim(); }
    else if(id==='pzL'){ stopSim(true); closeAll(); showMenu('map'); }
    else if(id==='pzS'){ stopSim(true); closeAll(); S.setBack='game'; showMenu('set'); }
    else if(id==='pzM'){ stopSim(true); closeAll(); showMenu('main'); } });
}

function onFail(){
  S.running=false; $('#errT').textContent=world.err; $('#err').style.display='block';
  $('#run').innerHTML=I('play_arrow','f')+'RUN'; $('#run').classList.remove('on'); Snd.err(); Hap.err(); $('#sceneWrap').classList.remove('shk'); void $('#sceneWrap').offsetWidth; $('#sceneWrap').classList.add('shk'); setPill();
}
function onWin(){
  S.running=false; $('#run').innerHTML=I('play_arrow','f')+'RUN'; $('#run').classList.remove('on'); setPill();
  const wasView=S.view, first=!save.done[S.id], n=countBlocks(S.prog), lv=S.lv;
  save.done[S.id]={prog:{rungs:clone(S.prog.rungs)},tags:customTags(S.tags)}; delete save.draft[S.id]; persist();
  S.redo=false; S.view=true; refreshMode(); Snd.win(); Hap.win(); confetti(); schedulePush();
  setTimeout(()=>{ if(!world.done) return;
    const nx=S.id+1;
    card(`<h3 style="color:var(--md-primary);font-size:24px">${tx('BÖLÜM TAMAM!','LEVEL COMPLETE!')}</h3><div class="gain">${first?tx('+1 PUAN','+1 POINT'):wasView?tx('Çözüm çalışıyor','Solution works'):tx('Çözüm güncellendi','Solution updated')}</div>
    <p class="t" style="text-align:center">${I('bolt','f sm')} <b style="color:var(--neon)">${points()}</b> ${tx('puan','points')}<br>${tx('Kullanılan blok','Blocks used')}: <b>${n}</b> · ${tx('referans','reference')} ${lv.opt}</p>
    ${nx!==null?'<div class="brow"><button class="btn pri wide" id="nx" style="height:56px;font-size:17px">'+tx('Sonraki Bölüm','Next Level')+I('arrow_forward')+'</button></div>':''}
    <div class="brow"><button class="btn wide" id="rt">${I('visibility')}${tx('Çözümü Gör','View')}</button><button class="btn wide" id="mn">${I('map')}${tx('Harita','Map')}</button></div>`,e=>{
      if(e.target.id==='nx'){ loadLevel(nx); } else if(e.target.id==='rt'){ stopSim(true); closeAll(); renderLadder(); } else if(e.target.id==='mn'){ stopSim(true); closeAll(); showMenu('map'); } }); },700);
}

/* ---------- MENÜLER ---------- */
const BAR=(v,max,c)=>`<div class="bar"><i style="width:${(100*v/max).toFixed(1)}%;background:${c}"></i></div>`;
function showMenu(scr,cat,diff){
  if(S.running) stopSim(true);
  S.mscr=scr; if(cat!==undefined){ S.mcat=cat; } if(diff!==undefined) S.mdiff=diff; cat=S.mcat; diff=S.mdiff;
  const back=t=>`<button class="ib" data-go="${t==='main'&&S.setBack==='game'&&scr==='set'?'game':t}">${I('arrow_back')}</button>`; let h='';
  if(scr==='main'){
    const L=save.last>=0?getLevel(save.last):null;
    h=`<div class="mm"><div class="mm-hero"><canvas id="mcv"></canvas><div class="mm-title">LADDER<span>MASTER</span></div><div class="mm-sub">${tx('PLC MERDİVEN MANTIĞI BULMACASI','PLC LADDER LOGIC PUZZLE')}</div>
    <div class="mm-chips"><div class="pts">${I('bolt','f sm')} ${points()} ${tx('puan','points')}</div>
    <button class="acct" data-go="acct">${me()?`<span class="av2">${esc(me().username[0].toUpperCase())}</span><b>${esc(me().username)}</b>`:I('account_circle')+tx('Giriş yap / Kayıt ol','Sign in / Sign up')}</button></div></div>
    <div class="mm-act"><button class="bigbtn play" data-go="map">${I('play_arrow','f')}${tx('OYNA','PLAY')}</button>
    ${L?`<button class="bigbtn" data-go="cont">${I('resume')}<span style="flex:1;text-align:left">${tx('Devam Et','Continue')}<br><small>${tx('Bölüm','Level')} ${L.n+1}</small></span></button>`:''}
    <div class="brow2"><button class="bigbtn" data-go="board">${I('leaderboard')}${tx('Liderlik','Leaderboard')}</button><button class="bigbtn" data-go="prog">${I('insights')}${tx('İlerleme','Progress')}</button></div>
    ${canInstall()?`<button class="bigbtn instb" data-go="install">${I('install_mobile')}${tx('Uygulamayı Yükle','Install App')}</button>`:''}
    <div class="brow3"><button class="bigbtn" data-go="how">${I('help')}${tx('Nasıl Oynanır','How to Play')}</button>
    <button class="bigbtn" data-go="set">${I('settings')}${tx('Ayarlar','Settings')}</button></div><div class="ver">Ladder Master ${VERSION}</div></div></div>`;
  } else if(scr==='map'){
    h=`<div class="topbar mapbar">${back('main')}<h3>${tx('Yol Haritası','Level Map')}</h3><span class="pp">${I('bolt','f sm')} ${points()}</span></div><div id="road"></div>`;
  } else if(scr==='prog'){
    h=`<div class="topbar">${back('main')}<h3>${tx('İlerleme','Progress')}</h3><span class="pp">${I('bolt','f sm')} ${points()}</span></div><p class="t">${tx('Her tamamlanan bölüm <b>1 puan</b>. Yol sonsuz — ne kadar ileri gidebilirsin?','Each completed level is worth <b>1 point</b>. The road is endless — how far can you go?')}</p>
    <div class="pcard"><div class="cstat big"><span>${I('map','sm')} ${tx('Bölüm','Level')} <b>${frontier()+1}</b></span><span>${I('check_circle','sm')} <b>${points()}</b></span><span>${I('local_fire_department','sm')} <b>${extraDone()}</b></span></div></div>
    <div class="grp">${tx('KONULARA GÖRE TAMAMLANAN','COMPLETED BY TOPIC')}</div>`+
    CATS.map((c,ci)=>`<div class="pcard" style="display:flex;align-items:center;gap:12px;border-color:color-mix(in srgb,${c.c} 40%,transparent)"><div class="pic" style="color:${c.c}">${palSym(c.ic)}</div><div style="flex:1"><b style="color:${c.c}">${c.n}</b><div style="font-size:12px;color:var(--dim)">${c.s}</div></div><b style="font-size:20px">${topicDone(ci)}</b></div>`).join('')+
    `<p class="t" style="font-size:12px;color:var(--dim)">${I('map','sm')} ${tx('ulaştığın bölüm','level reached')} · ${I('check_circle','sm')} ${tx('tamamlanan','completed')} · ${I('local_fire_department','sm')} ${tx('ekstra zor tamamlanan','extra hard completed')}</p>`;
  } else if(scr==='set'){
    const sg=(k,v,l)=>`<button data-go="${k}" data-v="${v}" class="${save[k]===v?'on':''}">${l}</button>`;
    h=`<div class="topbar">${back('main')}<h3>${tx('Ayarlar','Settings')}</h3></div>
    <div class="grp">${tx('TEMA','THEME')}</div><div class="seg">${sg('theme','light',I('light_mode')+tx('Açık','Light'))}${sg('theme','dark',I('dark_mode')+tx('Koyu','Dark'))}${sg('theme','auto',I('brightness_auto')+tx('Otomatik','Auto'))}</div>
    <div class="grp">${tx('DİL','LANGUAGE')}</div><div class="seg">${sg('lang','tr','🇹🇷 Türkçe')}${sg('lang','en','🇬🇧 English')}</div>
    <div class="grp">${tx('OYUN','GAME')}</div>
    <button class="mi" data-go="snd">${I(save.sound?'volume_up':'volume_off')}<span class="sp" style="text-align:left">${tx('Ses','Sound')}</span><span class="swt ${save.sound?'on':''}"></span></button>
    <button class="mi" data-go="hap">${I('vibration')}<span class="sp" style="text-align:left">${tx('Titreşim','Haptics')}</span><span class="swt ${save.haptic!==false?'on':''}"></span></button>
    <button class="mi" data-go="rst" style="color:var(--md-error)">${I('delete_history')}${tx('Tüm ilerlemeyi sıfırla','Reset all progress')}</button>
    <div class="ver">Ladder Master ${VERSION}</div>`;
  } else if(scr==='acct'){
    if(me()) h=`<div class="topbar">${back('main')}<h3>${tx('Hesabım','My Account')}</h3></div>
      <div class="prof"><div class="av">${esc(me().username[0].toUpperCase())}</div><b>${esc(me().username)}</b><span>${I('bolt','f sm')} ${points()} ${tx('puan','points')}</span></div>
      <p class="t">${tx('İlerlemen bu hesaba kaydediliyor. Başka bir cihazda aynı kullanıcı adıyla giriş yaparsan çözümlerin ve puanın gelir.','Your progress is saved to this account. Sign in with the same username on another device to get your solutions and points.')}</p>
      <button class="mi" data-go="sync">${I('sync')}${tx('Şimdi senkronize et','Sync now')}</button>
      <button class="mi" data-go="board">${I('leaderboard')}${tx('Liderlik tablosu','Leaderboard')}</button>
      <button class="mi" data-go="out" style="color:var(--redt)">${I('logout')}${tx('Çıkış yap','Sign out')}</button>`;
    else h=`<div class="topbar">${back('main')}<h3>${S.mreg?tx('Kayıt Ol','Sign Up'):tx('Giriş Yap','Sign In')}</h3></div>
      ${NET.ok?'':`<p class="t" style="color:var(--amb)">${tx('Çevrimiçi hesaplar henüz yapılandırılmadı.','Online accounts are not configured yet.')}</p>`}
      <div class="fld"><label>${tx('Kullanıcı adı','Username')}</label><input id="uN" maxlength="16" autocomplete="username" autocapitalize="off" value="${esc(NET.expiredUser||'')}" placeholder="${tx('ör: tuna_plc','e.g. tuna_plc')}"></div>
      <div class="fld"><label>${tx('Şifre','Password')}</label><input id="uP" type="password" autocomplete="${S.mreg?'new-password':'current-password'}" placeholder="••••••"></div>
      <p class="t" id="uErr" style="color:var(--red);min-height:1.4em;margin:6px 0"></p>
      <button class="bigbtn play" data-go="${S.mreg?'doReg':'doLogin'}" style="min-height:52px;font-size:17px">${S.mreg?tx('Kayıt Ol','Sign Up'):tx('Giriş Yap','Sign In')}</button>
      <button class="mi" data-go="tog" style="margin-top:10px;text-align:center">${S.mreg?tx('Hesabın var mı? Giriş yap','Have an account? Sign in'):tx('Hesabın yok mu? Kayıt ol','No account? Sign up')}</button>
      <p class="t" style="font-size:11.5px;color:var(--dim)">${tx('Kullanıcı adın liderlik tablosunda herkese görünür. 3-16 karakter: harf, rakam, alt çizgi.','Your username is visible to everyone on the leaderboard. 3-16 chars: letters, digits, underscore.')}</p>`;
  } else if(scr==='board'){
    h=`<div class="topbar">${back('main')}<h3>${tx('Liderlik Tablosu','Leaderboard')}</h3><button class="ib" data-go="board">${I('refresh')}</button></div><div id="brd"><p class="t" style="text-align:center">${tx('Yükleniyor…','Loading…')}</p></div>`;
  } else if(scr==='how'){
    h=`<div class="topbar">${back('main')}<h3>${tx('Nasıl Oynanır?','How to Play')}</h3></div>${HOW()}<div class="cat">${tx('ELEMAN REHBERİ','ELEMENT GUIDE')}</div>${ELEM_ORDER.map(k=>`<div class="gcard">${elemHTML(k,true)}</div>`).join('')}<button class="bigbtn play" data-go="map" style="margin-top:12px">${tx('▶ OYNA','▶ PLAY')}</button>`;
  }
  $('#menuIn').innerHTML=h; $('#menuIn').scrollTop=0; $('#menu').classList.add('show');
  const mi=$('#menuIn'); mi.classList.remove('scrIn'); void mi.offsetWidth; mi.classList.add('scrIn');
  if(scr==='board') loadBoard();
  if(scr==='map') drawRoad();
  if(scr==='main') maybeAskInstall();
}
const HOW=()=>tx(`<p class="t"><b>Amaç:</b> Görevdeki fabrika makinesini ladder (merdiven) diyagramı ile programla.</p>
<p class="t"><b>1.</b> Alttaki paletten bir bloğu tutup ızgaradaki boş kutuya <b>sürükle-bırak</b> (ya da bloğa dokunup sonra kutuya dokun).<br>
<b>2.</b> Açılan pencerede adresi seç: <b>I</b> giriş, <b>Q</b> çıkış, <b>M</b> hafıza, <b>T</b> zamanlayıcı, <b>C</b> sayıcı. İstersen etiket yaz, süre/adet ayarla.<br>
<b>3.</b> Kontaklar sol 4 sütuna, bobin/TON/TOF/CTU/CTD en sağ sütuna gider. VEYA bağlantısı için satırın <b>⋮</b> menüsünden paralel kol ekle.<br>
<b>4.</b> Yerleştirdiğin bir bloğu tutup sürükleyerek <b>taşı</b>; dolu kutuya bırakırsan iki blok <b>yer değiştirir</b>, alttaki palete bırakırsan <b>silinir</b>.<br>
<b>5.</b> <b style="color:var(--neon)">RUN</b> ile çalıştır, sahnedeki START / STOP / şalterlere dokun. Yeşil hatlar enerjili.<br>
<b>6.</b> Görevi tamamlayınca <b>+1 puan</b>. Tamamlanan bölümü açınca kayıtlı çözümün görünür; Sıfırla ile yeniden çözebilirsin — çözmeden çıkarsan eski çözüm silinmez.</p>`,
`<p class="t"><b>Goal:</b> Program the factory machine in each task with a ladder diagram.</p>
<p class="t"><b>1.</b> Grab a block from the palette below and <b>drag &amp; drop</b> it onto an empty cell (or tap the block, then tap the cell).<br>
<b>2.</b> In the popup choose an address: <b>I</b> input, <b>Q</b> output, <b>M</b> memory, <b>T</b> timer, <b>C</b> counter. Optionally type a tag and set time/count.<br>
<b>3.</b> Contacts go in the 4 left columns; coil/TON/TOF/CTU/CTD go in the rightmost column. For an OR connection add a parallel branch from the rung's <b>⋮</b> menu.<br>
<b>4.</b> Drag a placed block to <b>move</b> it; drop it on a filled cell to <b>swap</b>, or onto the palette to <b>delete</b> it.<br>
<b>5.</b> Press <b style="color:var(--neon)">RUN</b> and tap START / STOP / switches in the scene. Green lines are energized.<br>
<b>6.</b> Complete the task for <b>+1 point</b>. Opening a completed level shows your saved solution; Reset lets you solve it again — if you leave without solving, the old solution is kept.</p>`);
$('#menuIn').onclick=e=>{
  const b=e.target.closest('[data-go]'); if(!b) return; Snd.init(); Snd.click(); Hap.tap(); const g=b.dataset.go;
  if(g==='game'){ S.setBack=null; closeAll(); return; }
  if(g==='main') S.setBack=null;
  if(g==='main'||g==='cats'||g==='prog'||g==='set'||g==='how') showMenu(g);
  else if(g==='map') showMenu('map');
  else if(g==='install') installFlow(true);
  else if(g==='cont') loadLevel(save.last);
  else if(g==='lvl'){ const id=+b.dataset.id; if(!unlocked(id)){ toast(tx('Önce önceki bölümü tamamla','Complete the previous level first')); return; } loadLevel(id); }
  else if(g==='acct'){ S.mreg=false; showMenu('acct'); }
  else if(g==='board') showMenu('board');
  else if(g==='tog'){ S.mreg=!S.mreg; showMenu('acct'); }
  else if(g==='doLogin'||g==='doReg'){ if(NET.busy) return; const u=$('#uN').value.trim(), p=$('#uP').value, er=$('#uErr');
    if(!NET.ok){ er.textContent=tx('Çevrimiçi hesaplar henüz yapılandırılmadı.','Online accounts are not configured yet.'); return; }
    NET.busy=true; b.disabled=true; er.style.color='var(--dim)'; er.textContent=tx('Bağlanıyor…','Connecting…');
    (g==='doReg'?register(u,p):login(u,p)).then(()=>{ toast(tx('Hoş geldin, ','Welcome, ')+me().username+'!'); showMenu('main'); })
      .catch(e=>{ er.style.color='var(--red)'; er.textContent=e.msg||String(e); }).finally(()=>{ NET.busy=false; b.disabled=false; }); }
  else if(g==='out'){ logout(); toast(tx('Çıkış yapıldı','Signed out')); showMenu('main'); }
  else if(g==='sync'){ pullProgress().then(n=>{ toast(tx('Senkronize edildi','Synced')+(n?` (+${n})`:'')); showMenu('acct'); }).catch(e=>toast(e.msg||'!')); }
  else if(g==='theme'){ save.theme=b.dataset.v; persist(); applyTheme(); showMenu('set'); }
  else if(g==='lang'){ setLang(b.dataset.v); showMenu('set'); }
  else if(g==='hap'){ save.haptic=save.haptic===false; persist(); Hap.pick(); showMenu('set'); }
  else if(g==='snd'){ setSound(!save.sound); showMenu('set'); }
  else if(g==='rst'){ card(`<h3>${tx('Tüm ilerleme silinsin mi?','Delete all progress?')}</h3><p class="t" style="text-align:center">${tx('Puanlar ve kayıtlı çözümler silinecek.','Points and saved solutions will be deleted.')}</p><div class="brow"><button class="btn wide" id="n">${tx('İptal','Cancel')}</button><button class="btn dan wide" id="y">${tx('Sıfırla','Reset')}</button></div>`,ev=>{
      if(ev.target.id==='y'){ save.done={}; save.draft={}; save.last=-1; save.v=4; persist(); if(me()) pushProgress().catch(()=>{}); loadLevel(0,true); showMenu('main'); } else if(ev.target.id==='n') $('#ovCard').classList.remove('show'); }); }
};
const dkm=()=>document.documentElement.dataset.theme!=='light';
function drawMenuAnim(now){
  const c=document.getElementById('mcv'); if(!c) return; const r=c.getBoundingClientRect(); if(!r.width||r.height<40) return;
  const D=Math.min(2,window.devicePixelRatio||1); if(c.width!==Math.round(r.width*D)||c.height!==Math.round(r.height*D)){ c.width=Math.round(r.width*D); c.height=Math.round(r.height*D); }
  const k=Math.min(1.25,r.height/150), x=c.getContext('2d'); x.setTransform(D*k,0,0,D*k,0,0); const w=Math.min(r.width/k,520), ox=(r.width/k-w)/2, h=150, t=now/1000;
  x.clearRect(0,0,r.width/k,h); x.save(); x.translate(ox,0);
  const cs=getComputedStyle(document.documentElement), V=n=>cs.getPropertyValue('--md-'+n).trim();
  const PRI=V('primary')||'#00e471', TER=V('tertiary')||'#7cd0ff', LN=V('outlineVariant')||'#3c4a40', ND=V('surfaceContainerHigh')||'#1f2a23', ND2=V('surfaceContainerHighest')||'#2a352d', TX=V('onSurfaceVariant')||'#b8c7bb', ON=V('onSurface')||'#e0e8e1';
  const rr=(X,Y,W,H,R)=>{ x.beginPath(); x.moveTo(X+R,Y); x.arcTo(X+W,Y,X+W,Y+H,R); x.arcTo(X+W,Y+H,X,Y+H,R); x.arcTo(X,Y+H,X,Y,R); x.arcTo(X,Y,X+W,Y,R); x.closePath(); };
  const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
  const P=3.6, ph=(t%P)/P;                         // bir döngü: giriş → PLC → çıkış
  const NR=15, xi=NR+6, xo=w-NR-6, pw=Math.max(140,Math.min(200,w*0.42)), px0=w/2-pw/2, px1=w/2+pw/2, py0=12, py1=138, ys=[28,75,122];
  const pinL=i=>[px0,62+i*24], pinR=i=>[px1,62+i*24];
  const curve=(a,b)=>{ const mx=(a[0]+b[0])/2; return [a,[mx,a[1]],[mx,b[1]],b]; };
  const bez=(q,u)=>{ const v=1-u; return [v*v*v*q[0][0]+3*v*v*u*q[1][0]+3*v*u*u*q[2][0]+u*u*u*q[3][0], v*v*v*q[0][1]+3*v*v*u*q[1][1]+3*v*u*u*q[2][1]+u*u*u*q[3][1]]; };
  const strokeC=(q,col,wd)=>{ x.strokeStyle=col; x.lineWidth=wd; x.beginPath(); x.moveTo(q[0][0],q[0][1]); x.bezierCurveTo(q[1][0],q[1][1],q[2][0],q[2][1],q[3][0],q[3][1]); x.stroke(); };
  // kanal zamanları
  const st=[0,1,2].map(i=>{ const s0=(i*0.22), inP=(ph-s0)/0.16, inOn=ph>=s0+0.16&&ph<s0+0.62, outP=(ph-s0-0.24)/0.16, outOn=ph>=s0+0.4&&ph<s0+0.78; return {inP,inOn,outP,outOn}; });
  // kablolar
  [0,1,2].forEach(i=>{ const qi=curve([xi+NR,ys[i]],pinL(i)), qo=curve(pinR(i),[xo-NR,ys[i]]);
    strokeC(qi,LN,2); strokeC(qo,LN,2);
    if(st[i].inOn){ x.globalAlpha=.55; strokeC(qi,PRI,2.5); x.globalAlpha=1; }
    if(st[i].outOn){ x.globalAlpha=.55; strokeC(qo,TER,2.5); x.globalAlpha=1; }
    [[qi,st[i].inP,PRI],[qo,st[i].outP,TER]].forEach(([q,u,col])=>{ if(u<=0||u>=1) return; const [X,Y]=bez(q,ease(u));
      x.fillStyle=col; x.globalAlpha=.25; x.beginPath(); x.arc(X,Y,7,0,7); x.fill(); x.globalAlpha=1; x.beginPath(); x.arc(X,Y,3.2,0,7); x.fill(); }); });
  // PLC modülü
  x.fillStyle=ND; rr(px0,py0,pw,py1-py0,16); x.fill(); x.strokeStyle=LN; x.lineWidth=1.5; x.stroke();
  x.fillStyle=ND2; rr(px0+8,py0+8,pw-16,24,10); x.fill();
  x.fillStyle=ON; x.font='800 12px ui-monospace,monospace'; x.textAlign='left'; x.fillText('PLC',px0+16,py0+24.5);
  const run=(t%1)<0.5; x.fillStyle=run?PRI:LN; x.beginPath(); x.arc(px1-38,py0+20,3.5,0,7); x.fill();
  x.fillStyle=TX; x.font='700 8.5px ui-monospace,monospace'; x.textAlign='left'; x.fillText('RUN',px1-31,py0+23.5);
  x.strokeStyle=LN; x.lineWidth=1; x.beginPath(); x.moveTo(w/2,py0+42); x.lineTo(w/2,py1-12); x.stroke();
  [0,1,2].forEach(i=>{ const [a,b]=pinL(i), [c2,d]=pinR(i);
    x.fillStyle=st[i].inOn?PRI:ND2; rr(a+10,b-4.5,16,9,4.5); x.fill(); x.fillStyle=st[i].outOn?TER:ND2; rr(c2-26,d-4.5,16,9,4.5); x.fill();
    x.fillStyle=st[i].inOn?ON:TX; x.font='700 9px ui-monospace,monospace'; x.textAlign='left'; x.fillText('I0.'+i,a+32,b+3.5);
    x.fillStyle=st[i].outOn?ON:TX; x.textAlign='right'; x.fillText('Q0.'+i,c2-32,d+3.5);
    x.fillStyle=LN; x.beginPath(); x.arc(a,b,2.8,0,7); x.fill(); x.beginPath(); x.arc(c2,d,2.8,0,7); x.fill(); });
  // cihazlar
  const node=(X,Y,on,col,draw)=>{ if(on){ x.fillStyle=col; x.globalAlpha=.18; x.beginPath(); x.arc(X,Y,NR+5,0,7); x.fill(); x.globalAlpha=1; }
    x.fillStyle=ND; x.beginPath(); x.arc(X,Y,NR,0,7); x.fill(); x.strokeStyle=on?col:LN; x.lineWidth=on?2:1.5; x.stroke();
    x.strokeStyle=on?col:TX; x.fillStyle=on?col:TX; x.lineWidth=1.8; x.lineCap='round'; draw(X,Y,on); };
  node(xi,ys[0],st[0].inOn,PRI,(X,Y,on)=>{ x.beginPath(); x.arc(X,Y,7,0,7); x.stroke(); x.beginPath(); x.arc(X,Y,on?4:3,0,7); x.fill(); });            // buton
  node(xi,ys[1],st[1].inOn,PRI,(X,Y,on)=>{ x.beginPath(); x.moveTo(X-7,Y+4); x.lineTo(X-3,Y+4); x.lineTo(X+5,on?Y+4:Y-4); x.moveTo(X+4,Y+4); x.lineTo(X+7,Y+4); x.stroke(); });   // şalter
  node(xi,ys[2],st[2].inOn,PRI,(X,Y,on)=>{ x.beginPath(); x.arc(X-4,Y,2,0,7); x.fill(); [5,9].forEach(R=>{ x.beginPath(); x.arc(X-4,Y,R,-0.7,0.7); x.stroke(); }); });   // sensör
  node(xo,ys[0],st[0].outOn,TER,(X,Y,on)=>{ x.font='800 10px ui-monospace,monospace'; x.textAlign='center'; x.fillText('M',X,Y+3.5); if(on){ x.beginPath(); x.arc(X,Y,9.5,t*6,t*6+1.6); x.stroke(); } });   // motor
  node(xo,ys[1],st[1].outOn,TER,(X,Y,on)=>{ x.beginPath(); x.arc(X,Y-1.5,5,Math.PI*0.8,Math.PI*2.2); x.stroke(); x.beginPath(); x.moveTo(X-3,Y+5); x.lineTo(X+3,Y+5); x.stroke(); if(on){ x.globalAlpha=.6; x.beginPath(); x.arc(X,Y-1.5,3,0,7); x.fill(); x.globalAlpha=1; } });   // lamba
  node(xo,ys[2],st[2].outOn,TER,(X,Y,on)=>{ x.beginPath(); x.moveTo(X-7,Y-5); x.lineTo(X+7,Y+5); x.lineTo(X+7,Y-5); x.lineTo(X-7,Y+5); x.closePath(); on?x.fill():x.stroke(); });   // valf
  x.restore();
}
/* ---------- Tema & Dil ---------- */
const mqDark=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
function applyTheme(){ CP=null; const t=save.theme||'auto'; const dark=t==='dark'||(t==='auto'&&(!mqDark||mqDark.matches));
  document.documentElement.dataset.theme=dark?'dark':'light'; const m=document.querySelector('meta[name=theme-color]'); if(m) m.content=getComputedStyle(document.documentElement).getPropertyValue('--md-surfaceContainer').trim()||(dark?'#0d1117':'#eef2f6'); }
if(mqDark){ try{ mqDark.addEventListener('change',()=>{ if((save.theme||'auto')==='auto') applyTheme(); }); }catch(e){ mqDark.addListener&&mqDark.addListener(()=>{ if((save.theme||'auto')==='auto') applyTheme(); }); } }
function applyStatic(){
  document.documentElement.lang=LANG;
  $('#errRetry').innerHTML=I('restart_alt')+tx('Tekrar Dene','Retry'); $('#errEdit').innerHTML=I('edit')+tx('Düzenle','Edit');
  $('#doneTxt').innerHTML=tx('<b>Bu bölüm tamamlandı</b><br>Sıfırlamak ister misiniz?','<b>Level completed</b><br>Do you want to reset it?');
  $('#bReset').innerHTML=I('restart_alt')+tx('Sıfırla','Reset'); $('#bClear').innerHTML=I('delete_sweep')+tx('Temizle','Clear');
  $('#palette').dataset.trash=tx('Silmek için buraya bırak','Drop here to delete');
}
function setLang(l){
  LANG=l==='en'?'en':'tr'; save.lang=LANG; persist(); for(const k in LV_CACHE) delete LV_CACHE[k];
  applyStatic();
  if(S.lv){ const lv=S.lv=getLevel(S.id); S.tags=Object.assign(defaultTags(lv),customTags(S.tags)); world=new World(lv); plc.reset(); stopSim(true);
    setHeader(); buildIO(); goalKey='';
    buildPalette(); refreshMode(); renderLadder(); }
}

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadBoard(){
  const el=()=>document.getElementById('brd'); if(!el()) return;
  if(!NET.ok){ el().innerHTML=`<p class="t" style="text-align:center;color:var(--amb)">${tx('Çevrimiçi liderlik tablosu henüz yapılandırılmadı.','The online leaderboard is not configured yet.')}</p>`; return; }
  try{
    if(me()&&Date.now()-NET.lastPush>3000) await pushProgress().catch(()=>{});
    const {list,rank}=await fetchBoard(); if(!el()) return;
    const medal=i=>i<3?`<span class="ms f" style="color:${['#f5b400','#a8b3bd','#cd7f32'][i]}">workspace_premium</span>`:(i+1);
    let h=me()?`<div class="myr">${tx('Senin sıran','Your rank')}: <b>#${rank||'—'}</b> · ${I('bolt','f sm')} ${points()}</div>`
      :`<button class="mi" data-go="acct" style="text-align:center;color:var(--neon)">${I('login')}${tx('Listeye girmek için giriş yap','Sign in to join the leaderboard')}</button>`;
    h+=list.length?'<div class="lb">'+list.map((x,i)=>`<div class="lbr ${me()&&x.id===me().id?'me':''}"><span class="rk">${medal(i)}</span><span class="nm">${esc(x.username)}</span><span class="sc">${I('bolt','f sm')}${x.points}</span></div>`).join('')+'</div>'
      :`<p class="t" style="text-align:center">${tx('Henüz kimse yok — ilk sen ol!','No one yet — be the first!')}</p>`;
    el().innerHTML=h;
  }catch(e){ if(el()) el().innerHTML=`<p class="t" style="text-align:center;color:var(--red)">${esc(e.msg||tx('Yüklenemedi','Could not load'))}</p>`; }
}

/* ---------- YOL HARİTASI (Candy Crush tarzı) ---------- */
// M3 Expressive şekilleri: dalgalı daire (cookie), güneş (sunny), yumuşak patlama (burst)
const SHP={};
function shape(k){ if(SHP[k]) return SHP[k];
  const [lobes,amp,soft]={cookie:[9,.075,1],sunny:[8,.11,1],burst:[10,.17,.6],clover:[4,.16,1],round:[12,.025,1]}[k], pts=[];
  for(let j=0;j<120;j++){ const a=j/120*Math.PI*2; let c=Math.cos(lobes*a); if(soft<1) c=Math.sign(c)*Math.pow(Math.abs(c),soft);
    const r=(1-amp+amp*c)/1; pts.push(`${(50+50*r*Math.cos(a)).toFixed(2)}% ${(50+50*r*Math.sin(a)).toFixed(2)}%`); }
  return SHP[k]=`polygon(${pts.join(',')})`; }
function drawRoad(){ const c=0;
  const box=document.getElementById('road'); if(!box) return;
  const f=frontier(), show=Math.max(f+10,14), STEP=92, W=box.clientWidth||360, H=show*STEP+150;
  const xs=i=>W/2+Math.sin(i*0.85)*W*0.3, ys=i=>H-70-i*STEP;
  let d=`M${xs(0)} ${ys(0)}`; for(let i=1;i<show;i++){ const x0=xs(i-1),y0=ys(i-1),x1=xs(i),y1=ys(i); d+=` C${x0} ${y0-STEP/2},${x1} ${y1+STEP/2},${x1} ${y1}`; }
  let dn=`M${xs(0)} ${ys(0)}`; for(let i=1;i<=Math.min(f,show-1);i++){ const x0=xs(i-1),y0=ys(i-1),x1=xs(i),y1=ys(i); dn+=` C${x0} ${y0-STEP/2},${x1} ${y1+STEP/2},${x1} ${y1}`; }
  const deco=['settings','factory','build','inventory_2','electrical_services','oil_barrel','bolt','precision_manufacturing'];
  let h=`<div class="rd" style="height:${H}px"><svg class="rdp" width="${W}" height="${H}"><path d="${d}" class="rb"/><path d="${d}" class="rl"/>${f>0?`<path d="${dn}" class="rdn"/>`:''}</svg>`;
  for(let i=0;i<show;i++){ if(i%3===1){ const side=Math.sin(i*0.85)>0?-1:1; h+=`<span class="dec" style="left:${W/2+side*W*0.36-14}px;top:${ys(i)-14}px">${I(deco[(i*7+c*3)%deco.length],'xl')}</span>`; } }
  for(let i=0;i<show;i++){ const id=i, done=!!save.done[id], cur=i===f, ex=isExtra(i), bn=isBonus(i), lock=!done&&!cur;
    const cls=['nd',done?'dn':'',cur?'cur':'',lock?'lk':'',ex?'ex':'',bn?'bn':''].join(' ');
    const shp=ex?shape('burst'):bn?shape('clover'):cur?shape('sunny'):done?shape(i%3===0?'clover':'cookie'):shape('round');
    h+=`<button class="${cls}" data-go="lvl" data-id="${id}" style="left:${xs(i)}px;top:${ys(i)}px;--shp:${shp}">${lock?(ex?I('local_fire_department','f'):bn?I('celebration','f'):I('lock','f')):`<b>${i+1}</b>`}${done?'<i>'+I('check')+'</i>':''}${cur?'<em>'+tx('OYNA','PLAY')+'</em>':''}${ex&&!lock?'<u>'+I('local_fire_department','f')+'</u>':''}${bn&&!lock?'<u>'+I('celebration','f')+'</u>':''}${!lock&&!ex&&!bn?`<s class="tp" style="background:${CATS[getLevel(id).cat].c}"></s>`:''}</button>`;
    if(i===TOPIC_START[1]&&!save.done[id]) h+=`<span class="exl" style="left:${xs(i)}px;top:${ys(i)+40}px;color:var(--amb)">${tx('YENİ: ZAMANLAYICILAR','NEW: TIMERS')}</span>`;
    if(i===TOPIC_START[2]&&!save.done[id]) h+=`<span class="exl" style="left:${xs(i)}px;top:${ys(i)+40}px;color:var(--pur)">${tx('YENİ: SAYICILAR','NEW: COUNTERS')}</span>`;
    if(ex&&(cur||lock)&&i<f+10) h+=`<span class="exl" style="left:${xs(i)}px;top:${ys(i)+36}px">${tx('EKSTRA ZOR','EXTRA HARD')}</span>`;
    if(bn&&(cur||lock)&&i<f+10) h+=`<span class="exl bnl" style="left:${xs(i)}px;top:${ys(i)+36}px">BONUS</span>`; }
  h+=`<div class="fog" style="top:0;height:150px"><span>${I('cloud')} ${tx('Yol devam ediyor…','The road continues…')}</span></div></div>`;
  box.innerHTML=h;
  const cur=box.querySelector('.nd.cur'); if(cur){ const m=$('#menuIn'); m.scrollTop=Math.max(0,cur.offsetTop-m.clientHeight*0.55); }
}

/* ---------- UYGULAMA OLARAK YÜKLEME (PWA) ---------- */
let deferredInstall=null;
const isStandalone=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const canInstall=()=>!isStandalone()&&(!!deferredInstall||isIOS());
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredInstall=e; if(S.mscr==='main'&&$('#menu').classList.contains('show')) showMenu('main'); });
window.addEventListener('appinstalled',()=>{ deferredInstall=null; save.installed=1; persist(); toast(tx('Uygulama yüklendi! Ana ekrandan açabilirsin.','App installed! Open it from your home screen.')); if(S.mscr==='main') showMenu('main'); });
function installCard(){
  const head=`<div class="ishot"><img src="icons/icon-192.png" alt=""><div><b>Ladder Master</b><small>${tx('Ana ekrana ekle · tam ekran · internetsiz oyna','Home screen · full screen · plays offline')}</small></div></div>`;
  if(deferredInstall) return `<h3>${tx('Uygulamayı yüklemek ister misiniz?','Install the app?')}</h3>${head}
    <div class="brow"><button class="btn wide" id="iL">${tx('Daha sonra','Later')}</button><button class="btn pri wide" id="iY">${tx('Yükle','Install')}</button></div>`;
  return `<h3>${tx('Uygulamayı yüklemek ister misiniz?','Install the app?')}</h3>${head}
    <ol class="isteps"><li>${tx('Safari\'de alttaki <b>Paylaş</b> '+I('ios_share','sm')+' düğmesine dokun','Tap the <b>Share</b> '+I('ios_share','sm')+' button in Safari')}</li><li>${tx('<b>Ana Ekrana Ekle</b>\'yi seç','Choose <b>Add to Home Screen</b>')}</li><li>${tx('Sağ üstte <b>Ekle</b>\'ye dokun','Tap <b>Add</b> in the top right')}</li></ol>
    <div class="brow"><button class="btn pri wide" id="iL">${tx('Tamam','OK')}</button></div>`;
}
function installFlow(manual){
  if(isStandalone()){ if(manual) toast(tx('Uygulama zaten yüklü','The app is already installed')); return; }
  if(!deferredInstall&&!isIOS()){ if(manual) toast(tx('Tarayıcı menüsünden "Ana ekrana ekle"yi seç','Use "Add to Home screen" in the browser menu')); return; }
  card(installCard(),e=>{
    if(e.target.id==='iL'){ save.instAsk=Date.now(); persist(); $('#ovCard').classList.remove('show'); }
    if(e.target.id==='iY'&&deferredInstall){ const p=deferredInstall; deferredInstall=null; $('#ovCard').classList.remove('show');
      p.prompt(); (p.userChoice||Promise.resolve({})).then(r=>{ if(r.outcome!=='accepted'){ save.instAsk=Date.now(); persist(); } if(S.mscr==='main') showMenu('main'); }); }
  });
}
// otomatik sor: kurulmamışsa, en az 1 bölüm bitmişse ve son "daha sonra"dan 3 gün geçtiyse
function maybeAskInstall(){
  if(isStandalone()||!canInstall()||!save.intro) return;
  if(save.instAsk&&Date.now()-save.instAsk<3*864e5) return;
  if(points()<1) return;
  if($('#ovCard').classList.contains('show')||S.running) return;
  setTimeout(()=>{ if(!$('#ovCard').classList.contains('show')&&!S.running) installFlow(false); },900);
}
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); }); }

/* ---------- KONFETİ ---------- */
function confetti(){
  const c=document.createElement('canvas'); c.className='cnf'; const app=$('#app'); app.appendChild(c);
  const W=c.width=app.clientWidth*2, H=c.height=app.clientHeight*2, x=c.getContext('2d');
  const cols=['#39ff6a','#ffb020','#4da3ff','#ff4d4d','#c77dff','#ffffff'];
  const P=[...Array(140)].map(()=>({x:W/2+(Math.random()-.5)*W*.3,y:H*.38,vx:(Math.random()-.5)*28,vy:-Math.random()*34-12,r:Math.random()*10+6,a:Math.random()*6,va:(Math.random()-.5)*.4,c:cols[Math.floor(Math.random()*cols.length)]}));
  let t=0; (function f(){ t++; x.clearRect(0,0,W,H); for(const p of P){ p.vy+=1.1; p.vx*=.985; p.x+=p.vx; p.y+=p.vy; p.a+=p.va; x.save(); x.translate(p.x,p.y); x.rotate(p.a); x.globalAlpha=Math.max(0,1-t/110); x.fillStyle=p.c; x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); x.restore(); }
    if(t<110) requestAnimationFrame(f); else c.remove(); })();
}
