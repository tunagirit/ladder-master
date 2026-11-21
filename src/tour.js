/* ===== v1.1.8 TANITIM — PLC nedir, ladder nedir, kısa örnek, nasıl oynanır ===== */
const DEMO_LV={sol:{rungs:[R(['NO I0.0','COIL Q0.0'])]},io:{I:[{a:'I0.0',n:'START'}],Q:[{a:'Q0.0',n:'MOTOR'}]}};
const tFlow=()=>`<div class="tflow">
  <div class="tfc"><div class="tfi">${I('radio_button_unchecked')}${I('sensors')}</div><b>${tx('GİRİŞLER','INPUTS')}</b><small>${tx('buton, şalter, sensör','button, switch, sensor')}</small><code>I0.0 …</code></div>
  <span class="tfa">${I('arrow_forward')}</span>
  <div class="tfc plc"><div class="tfi">${I('memory')}</div><b>PLC</b><small>${tx('programı çalıştırır','runs the program')}</small></div>
  <span class="tfa">${I('arrow_forward')}</span>
  <div class="tfc"><div class="tfi">${I('settings')}${I('lightbulb')}</div><b>${tx('ÇIKIŞLAR','OUTPUTS')}</b><small>${tx('motor, lamba, valf','motor, lamp, valve')}</small><code>Q0.0 …</code></div></div>`;
const tDemo=()=>`<div class="tdemo" id="tdemo"><div class="solv">${solLadder(DEMO_LV)}</div>
  <div class="tdrow"><button class="btn pri" id="tdBtn">${I('touch_app')}${tx('START\'a basılı tut','Hold START')}</button><span class="tdm" id="tdM">${I('settings')}<b>MOTOR</b> <em>${tx('DURUYOR','STOPPED')}</em></span></div></div>`;
const TOUR=[
  {ic:'waving_hand',t:['Hoş geldin!','Welcome!'],b:()=>tx(
    `<p class="t">Ladder Master'da fabrikalardaki gerçek makineleri — bantları, motorları, kapıları, asansörleri — <b>PLC</b> ile programlayarak bulmaca çözersin.</p><p class="t">Hiç bilmiyorsan sorun yok: 1 dakikada temelini öğrenelim.</p>`,
    `<p class="t">In Ladder Master you solve puzzles by programming real factory machines — belts, motors, doors, lifts — with a <b>PLC</b>.</p><p class="t">No experience? No problem: let's learn the basics in one minute.</p>`)},
  {ic:'memory',t:['PLC nedir?','What is a PLC?'],b:()=>tx(
    `<p class="t"><b>PLC</b>, fabrikadaki makineleri yöneten küçük, dayanıklı bir bilgisayardır.</p>${tFlow()}<p class="t">Sürekli aynı şeyi yapar: <b>girişlere bakar</b> (butona basıldı mı, sensör bir şey gördü mü?), <b>programına göre karar verir</b> ve <b>çıkışları açıp kapatır</b> (motoru çalıştır, lambayı yak).</p>`,
    `<p class="t">A <b>PLC</b> is a small, rugged computer that controls the machines in a factory.</p>${tFlow()}<p class="t">It repeats the same loop: it <b>reads the inputs</b> (was a button pressed, did a sensor see something?), <b>decides using its program</b> and <b>switches the outputs</b> (run the motor, light the lamp).</p>`)},
  {ic:'stairs',t:['Ladder (merdiven) diyagramı','The ladder diagram'],b:()=>tx(
    `<p class="t">PLC programı bir <b>merdivene</b> benzer. Soldaki dikey çizgi elektriğin geldiği yer, her yatay basamak bir <b>satır</b>dır.</p>
     <div class="tlist"><div><div class="pal sel">${elSym('NO')}</div><span><b>Kontak</b> — bir anahtar gibidir. Şartı sağlanınca kapanır ve akımı geçirir.</span></div><div><div class="pal sel">${elSym('COIL')}</div><span><b>Bobin</b> — satırın sonundadır. Akım ona ulaşırsa çıkışı (motoru, lambayı) çalıştırır.</span></div></div>
     <p class="t">Yani bir satır şunu söyler: <b>"Bu şartlar sağlanınca şu çalışsın."</b></p>`,
    `<p class="t">A PLC program looks like a <b>ladder</b>. The vertical line on the left is where power comes from; each horizontal step is a <b>rung</b>.</p>
     <div class="tlist"><div><div class="pal sel">${elSym('NO')}</div><span><b>Contact</b> — works like a switch. When its condition is true it closes and lets power through.</span></div><div><div class="pal sel">${elSym('COIL')}</div><span><b>Coil</b> — sits at the end of the rung. If power reaches it, it switches the output (motor, lamp) on.</span></div></div>
     <p class="t">So a rung says: <b>"When these conditions are true, switch this on."</b></p>`)},
  {ic:'science',t:['Kısa bir örnek','A quick example'],b:()=>tx(
    `<p class="t">Görev: <b>START butonuna basınca motor çalışsın.</b> Çözüm tek satır: START'ın açık kontağı (I0.0) → MOTOR bobini (Q0.0).</p>${tDemo()}<p class="t" style="font-size:12.5px;color:var(--dim)">Butona basılı tut: kontak kapanır, hat yeşil yanar, motor döner. Bırakınca durur.</p>`,
    `<p class="t">Task: <b>run the motor while START is pressed.</b> The solution is one rung: START's open contact (I0.0) → MOTOR coil (Q0.0).</p>${tDemo()}<p class="t" style="font-size:12.5px;color:var(--dim)">Hold the button: the contact closes, the line turns green, the motor runs. Let go and it stops.</p>`)},
  {ic:'sports_esports',t:['Nasıl oynanır?','How to play'],b:()=>tx(
    `<div class="tsteps"><div><i>1</i><span><b>Görevi oku.</b> Hangi giriş neyi çalıştırmalı, yazıyor.</span></div>
     <div><i>2</i><span><b>Satır Oluştur</b>, sonra alttaki bloğu <b>sürükle</b> (ya da bloğa dokun, sonra kutuya dokun). Bloklar soldan sağa dizilir. Yerleşik bloğu taşımak için kısa <b>basılı tut</b>, sonra sürükle.</span></div>
     <div><i>3</i><span>Açılan pencerede <b>adresi seç</b>: I giriş, Q çıkış.</span></div>
     <div><i>4</i><span><b>RUN</b>'a bas, sahnedeki butonlarla dene. Hedefler tamamlanınca <b>+1 puan</b>!</span></div>
     <div><i>${I('lightbulb','sm')}</i><span>Takılırsan <b>ampul</b> butonu ipucu ve çözüm verir.</span></div></div>`,
    `<div class="tsteps"><div><i>1</i><span><b>Read the task.</b> It says which input should switch what.</span></div>
     <div><i>2</i><span>Tap <b>Create Rung</b>, then <b>drag</b> a block from the bottom (or tap the block, then the cell). Blocks go left to right. To move a placed block, <b>press and hold</b> briefly, then drag.</span></div>
     <div><i>3</i><span>In the popup <b>pick the address</b>: I input, Q output.</span></div>
     <div><i>4</i><span>Press <b>RUN</b> and try the buttons in the scene. Finish the goals for <b>+1 point</b>!</span></div>
     <div><i>${I('lightbulb','sm')}</i><span>Stuck? The <b>bulb</b> button gives hints and the solution.</span></div></div>`)},
  {ic:'rocket_launch',t:['Hazırsın!','You\'re ready!'],b:()=>tx(
    `<p class="t">Yeni elemanları (zamanlayıcı, sayıcı, karşılaştırma…) bölümlerde ilk kez kullanacağın zaman tek tek anlatacağız.</p><p class="t">Bu tanıtıma <b>Nasıl Oynanır</b> menüsünden her zaman dönebilirsin.</p>`,
    `<p class="t">New elements (timers, counters, compare…) are explained one by one the first time a level needs them.</p><p class="t">You can always come back to this from <b>How to Play</b>.</p>`)}
];
function demoWire(root){ const b=root.querySelector('#tdBtn'), d=root.querySelector('#tdemo'), m=root.querySelector('#tdM'); if(!b) return;
  const set=on=>{ d.classList.toggle('live',on); m.classList.toggle('on',on); m.querySelector('em').textContent=on?tx('ÇALIŞIYOR','RUNNING'):tx('DURUYOR','STOPPED'); if(on){ try{ Snd.init(); Snd.click(); Hap.tap(); }catch(_){} } };
  b.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ b.setPointerCapture(e.pointerId); }catch(_){} set(true); });
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>set(false))); }
function showTour(i,done){ i=i||0; const p=TOUR[i], last=i===TOUR.length-1;
  card(`<div class="tour"><div class="thd"><span class="tic">${I(p.ic)}</span><button class="tsk" id="tSkip">${last?'':tx('Atla','Skip')}</button></div>
    <h3>${tx(p.t[0],p.t[1])}</h3><div class="tbody">${p.b()}</div>
    <div class="tdots">${TOUR.map((_,k)=>`<i class="${k===i?'on':k<i?'dn':''}"></i>`).join('')}</div>
    <div class="brow">${i?`<button class="btn wide" id="tPrev">${I('arrow_back')}${tx('Geri','Back')}</button>`:''}<button class="btn pri wide" id="tNext">${last?tx('Başlayalım','Let\'s go')+I('play_arrow'):tx('İleri','Next')+I('arrow_forward')}</button></div></div>`,e=>{
    const id=e.target.closest('button')&&e.target.closest('button').id;
    if(id==='tNext'){ if(last){ closeAll(); done&&done(); } else showTour(i+1,done); }
    else if(id==='tPrev') showTour(i-1,done);
    else if(id==='tSkip'){ closeAll(); done&&done(); } });
  demoWire($('#card')); }
/* Nasıl Oynanır menüsü: aynı içerik tek sayfada + elemanlar */
const HOW_PAGE=()=>`<button class="btn pri wide" data-go="tour" style="width:100%;margin-bottom:12px;height:48px">${I('school')}${tx('Tanıtımı baştan izle','Watch the intro again')}</button>`+
  TOUR.slice(1,5).map((p,k)=>`<div class="hstep tsec"><h4><i>${k+1}</i>${tx(p.t[0],p.t[1])}</h4>${p.b()}</div>`).join('')+
  `<div class="cat">${tx('MODÜLLER — ELEMAN REHBERİ','MODULES — ELEMENT GUIDE')}</div><p class="t" style="font-size:12.5px;color:var(--dim);margin:0 4px 8px">${tx('Her eleman bir PLC komutudur. Aşağıda oyundaki tüm elemanlar, ne işe yaradıkları ve örnekleriyle var. Bölümlerde de ilk kullanımda ayrıca anlatılır.','Each element is a PLC instruction. Below are all elements in the game, what they do and an example. Levels also explain each one when it first appears.')}</p>`+
  ELEM_ORDER.map(k=>`<div class="gcard">${elemHTML(k,true)}</div>`).join('');
