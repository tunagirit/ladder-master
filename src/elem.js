/* ---------- ELEMAN TANITIMLARI ---------- */
// ex: mini örnek satır [[tip,adres],...]; BR/MEM sembolik elemanlar
const ELEM={
 NO:{t:['Açık Kontak  -| |-','NO Contact  -| |-'],
  d:['Adresi <b>1 (true)</b> olduğunda enerjiyi geçirir, 0 iken keser. Butona basmak, şalteri açmak ya da sensörün kutuyu görmesi kontağı kapatır.','Passes power when its address is <b>1 (true)</b>, blocks it when 0. Pressing a button, turning a switch on or a sensor seeing a box closes the contact.'],
  e:['Örnek: Şalter açıkken bant çalışsın.','Example: the belt runs while the switch is on.'],ex:[['NO','I0.0'],['COIL','Q0.0']]},
 NC:{t:['Kapalı Kontak  -|/|-','NC Contact  -|/|-'],
  d:['Açık kontağın tersi: adres <b>0</b> iken enerji geçirir, <b>1</b> olunca keser. STOP butonları ve “gördüğünde dur” sensörleri için kullanılır.','The opposite of NO: passes power while the address is <b>0</b>, blocks it when <b>1</b>. Used for STOP buttons and “stop when seen” sensors.'],
  e:['Örnek: Sensör kutuyu görünce bant durur.','Example: the belt stops when the sensor sees a box.'],ex:[['NO','I0.0'],['NC','I0.2'],['COIL','Q0.0']]},
 COIL:{t:['Bobin  -( )-','Coil  -( )-'],
  d:['Satırın sonunda durur. Önündeki hat enerjiliyse çıkışı <b>1</b> yapar, enerji kesilince hemen <b>0</b> olur. Motor, valf, lamba sürmek için kullanılır.','Sits at the end of a rung. Turns its output <b>1</b> while the rung is powered and <b>0</b> as soon as power is lost. Drives motors, valves and lamps.'],
  e:['Örnek: Bant motoru Q0.0.','Example: belt motor Q0.0.'],ex:[['NO','I0.0'],['COIL','Q0.0']]},
 SET:{t:['Set Bobini  -(S)-','Set Coil  -(S)-'],
  d:['Enerji <b>bir an</b> gelse bile çıkışı 1\'e <b>kilitler</b>; enerji gitse de 1 kalır. Kapatmak için aynı adrese bir <b>Reset</b> bobini gerekir. Kısa basılan butonlarla bir şeyi “açık bırakmak” için idealdir.','Even a <b>momentary</b> pulse <b>latches</b> the output to 1; it stays 1 after power is gone. A <b>Reset</b> coil on the same address turns it off. Ideal for keeping something on from a short button press.'],
  e:['Örnek: START\'a kısa bas → bant çalışmaya devam eder.','Example: tap START → the belt keeps running.'],ex:[['NO','I0.0'],['SET','Q0.0']]},
 RST:{t:['Reset Bobini  -(R)-','Reset Coil  -(R)-'],
  d:['Enerji geldiğinde adresi <b>0</b> yapar: Set ile kilitlenmiş çıkışı bırakır. Zamanlayıcı (T) veya sayıcı (C) adresine konursa onları <b>sıfırlar</b>.','When powered it forces the address to <b>0</b>: it releases an output latched by Set. On a timer (T) or counter (C) address it <b>resets</b> them.'],
  e:['Örnek: STOP\'a basınca Set edilmiş bant durur.','Example: pressing STOP releases the latched belt.'],ex:[['NO','I0.1'],['RST','Q0.0']]},
 TON:{t:['TON — Düz Zamanlayıcı','TON — On-Delay Timer'],
  d:['Girişi enerjili kaldığı sürece süreyi sayar; süre (PT) dolunca <b>T</b> biti 1 olur. Giriş arada kesilirse sayaç <b>sıfırlanır</b>. T bitini başka satırlarda kontak olarak kullanırsın.','Counts time while its input stays powered; when the preset (PT) elapses its <b>T</b> bit becomes 1. If the input drops, it <b>resets</b>. Use the T bit as a contact on other rungs.'],
  e:['Örnek: Kutu sensörde 2 sn bekleyince piston itsin: I0.2 → TON T1 (2 sn), sonra T1 → Q0.1.','Example: push 2 s after the box arrives: I0.2 → TON T1 (2 s), then T1 → Q0.1.'],ex:[['NO','I0.2'],['TON','T1']],ex2:[['NO','T1'],['COIL','Q0.1']]},
 TOF:{t:['TOF — Ters Zamanlayıcı','TOF — Off-Delay Timer'],
  d:['Giriş enerjiliyken <b>T</b> biti hemen 1 olur. Enerji <b>kesildikten sonra</b> süre (PT) boyunca 1 kalmaya devam eder, süre dolunca 0 olur. “Kapattıktan sonra biraz daha çalış” işleri için.','While the input is powered its <b>T</b> bit is 1 immediately. <b>After</b> power drops it stays 1 for the preset (PT), then turns 0. For “keep running a bit after switching off”.'],
  e:['Örnek: Boya bitince fan 3 sn daha çalışsın: Q0.3 → TOF T2 (3 sn), T2 → fan.','Example: fan runs 3 s more after painting: Q0.3 → TOF T2 (3 s), T2 → fan.'],ex:[['NO','Q0.3'],['TOF','T2']],ex2:[['NO','T2'],['COIL','Q0.2']]},
 CTU:{t:['CTU — Yukarı Sayıcı','CTU — Up Counter'],
  d:['Girişin her <b>yükselen kenarında</b> (0→1 geçişinde) değeri (CV) 1 artırır. CV hedefe (PV) ulaşınca <b>C</b> biti 1 olur. Reset bobini ile CV tekrar 0 olur.','Adds 1 to its count (CV) on every <b>rising edge</b> (0→1) of its input. When CV reaches the preset (PV) its <b>C</b> bit becomes 1. A Reset coil sets CV back to 0.'],
  e:['Örnek: Sensörden 3 kutu geçince lamba yansın: I0.2 → CTU C1 (3), C1 → lamba.','Example: lamp on after 3 boxes: I0.2 → CTU C1 (3), C1 → lamp.'],ex:[['NO','I0.2'],['CTU','C1']],ex2:[['NO','C1'],['COIL','Q0.2']]},
 CTD:{t:['CTD — Aşağı Sayıcı','CTD — Down Counter'],
  d:['Hedef değerden (PV) başlar ve her yükselen kenarda <b>1 azalır</b>. CV 0\'a inince <b>C</b> biti 1 olur. Reset bobini sayacı tekrar PV\'ye yükler. Kalan adet takibi için kullanışlıdır.','Starts at the preset (PV) and <b>counts down</b> by 1 on each rising edge. When CV reaches 0 its <b>C</b> bit becomes 1. A Reset coil reloads it to PV. Handy for “items left”.'],
  e:['Örnek: Palete 4 kutu sığar; 4 kutu geçince bant dursun.','Example: a pallet holds 4 boxes; stop the belt after 4.'],ex:[['NO','I0.2'],['CTD','C1']],ex2:[['NO','I0.0'],['NC','C1'],['COIL','Q0.0']]},
 BR:{t:['Paralel Kol (VEYA) ⑂','Parallel Branch (OR) ⑂'],
  d:['Satırın ⋮ menüsünden eklenir. Üst <b>veya</b> alt yoldan biri enerjiliyse enerji geçer. En önemli kullanımı <b>mühürleme</b>: START\'ın altına çıkışın kendi kontağını koyarsan butonu bırakınca da çıkış kendini tutar.','Added from the rung\'s ⋮ menu. Power passes if the upper <b>or</b> the lower path is powered. Its key use is the <b>seal-in</b>: put the output\'s own contact under START and the output holds itself after you release the button.'],
  e:['Örnek (mühürleme): (START ∥ Q0.0) · STOP → Q0.0','Example (seal-in): (START ∥ Q0.0) · STOP → Q0.0'],ex:[['NO','I0.0'],['NC','I0.1'],['COIL','Q0.0']],br:[['NO','Q0.0']]},
 MEM:{t:['Hafıza Biti (M)','Memory Bit (M)'],
  d:['M0.0 gibi adresler fiziksel bir çıkışa bağlı olmayan <b>ara rölelerdir</b>. Bir durumu (ör. “hat çalışıyor”) saklayıp başka satırlarda kontak olarak kullanırsın.','Addresses like M0.0 are <b>internal relays</b> with no physical output. Store a state (e.g. “line running”) and use it as a contact on other rungs.'],
  e:['Örnek: Mühürlü durum M0.0\'da, motor ondan bir zamanlayıcıyla sürülür.','Example: the sealed state lives in M0.0 and drives the motor through a timer.'],ex:[['NO','I0.0'],['NC','I0.1'],['COIL','M0.0']],br:[['NO','M0.0']]}
,
 P:{t:['Yükselen Kenar  -|P|-','Rising Edge  -|P|-'],
  d:['Önündeki enerji 0\'dan 1\'e <b>geçtiği tek taramada</b> enerji verir, sonra keser. Butona ne kadar uzun basılırsa basılsın <b>bir kez</b> çalışan komutlar için (sayma, aç/kapa, ADD/INC). Adres almaz.','Passes power only on the <b>single scan</b> where the power before it goes 0→1, then blocks. For actions that must run <b>once</b> however long the button is held (counting, toggling, ADD/INC). Takes no address.'],
  e:['Örnek: Her basışta VW0 bir artsın.','Example: VW0 goes up by one per press.'],ex:[['NO','I0.0'],['P',''],['INC','VW0']]},
 N:{t:['Düşen Kenar  -|N|-','Falling Edge  -|N|-'],
  d:['P\'nin tersi: önündeki enerji 1\'den 0\'a <b>düştüğü</b> tek taramada enerji verir. “Buton bırakılınca” ya da “kutu sensörden çıkınca” işleri için.','The opposite of P: passes power on the single scan where the power before it <b>drops</b> 1→0. For “when the button is released” or “when the box leaves the sensor”.'],
  e:['Örnek: START bırakılınca bant kalksın.','Example: the belt starts when START is released.'],ex:[['NO','I0.0'],['N',''],['SET','Q0.0']]},
 NOT:{t:['Tersleyici  -|NOT|-','Inverter  -|NOT|-'],
  d:['Önündeki enerjiyi <b>tersine çevirir</b>: enerji varsa keser, yoksa verir. Adres almaz.','<b>Inverts</b> the power flow before it: power becomes no power and vice versa. Takes no address.'],
  e:['Örnek: Bant dururken BEKLİYOR lambası yansın.','Example: the IDLE lamp is on while the belt is stopped.'],ex:[['NO','Q0.0'],['NOT',''],['COIL','Q0.1']]},
 CMP:{t:['Karşılaştırma Kontağı (CMP)','Compare Contact (CMP)'],
  d:['Bir <b>sayıyı</b> bir sınırla karşılaştırır (=, ≠, ≥, ≤, >, <). Koşul doğruysa kontak kapanır. Sayıcı değeri (C1), değişken (VW0) ya da analog giriş (AIW0) karşılaştırılabilir.','Compares a <b>number</b> with a limit (=, ≠, ≥, ≤, >, <). When the condition is true the contact closes. Works on counter values (C1), variables (VW0) or analog inputs (AIW0).'],
  e:['Örnek: Sayıcı 3 veya daha fazla olunca lamba yansın.','Example: lamp on when the counter is 3 or more.'],ex:[['CMP','C1 ≥ 3'],['COIL','Q0.1']]},
 TONR:{t:['TONR — Kalıcı Zamanlayıcı','TONR — Retentive Timer'],
  d:['TON gibi sayar ama giriş kesilince süreyi <b>sıfırlamaz, saklar</b>. Giriş tekrar gelince kaldığı yerden devam eder. Toplam süre PT\'ye ulaşınca T biti 1 olur. Sıfırlamak için Reset bobini gerekir.','Counts like TON but does <b>not reset, it keeps</b> the time when the input drops. It continues where it left off. When the total reaches PT the T bit turns 1. A Reset coil clears it.'],
  e:['Örnek: Motor toplam 5 sn çalışınca BAKIM lambası.','Example: SERVICE lamp after 5 s of total motor run time.'],ex:[['NO','Q0.0'],['TONR','T1']],ex2:[['NO','T1'],['COIL','Q0.1']]},
 MOV:{t:['MOV — Taşı','MOV — Move'],
  d:['Enerji geldiğinde bir <b>sayıyı</b> (sabit, AIW0, C1, IB0…) hedef değişkene yazar. Hedef bir değişken (VW0) ya da 8 çıkışlık bayt (QB0) olabilir.','When powered it writes a <b>number</b> (a constant, AIW0, C1, IB0…) into a target. The target can be a variable (VW0) or an 8-output byte (QB0).'],
  e:['Örnek: HIZLI butonu VW0\'a 30 yazsın.','Example: the FAST button writes 30 to VW0.'],ex:[['NO','I0.2'],['MOV','VW0←30']]},
 ADD:{t:['ADD / SUB / MUL / DIV — Tam Sayı Matematiği','ADD / SUB / MUL / DIV — Integer Math'],
  d:['Değişkenin üstüne bir sayı ekler, çıkarır, çarpar ya da böler. <b>Dikkat:</b> enerji geldiği <b>her taramada</b> (20 ms) tekrar çalışır; bir kez çalışsın istiyorsan önüne <b>P</b> koy.','Adds, subtracts, multiplies or divides the variable by a number. <b>Careful:</b> it runs again on <b>every scan</b> (20 ms) while powered; put a <b>P</b> before it to run once.'],
  e:['Örnek: Her kutuda 4 parça ekle.','Example: add 4 parts per box.'],ex:[['NO','I0.1'],['P',''],['ADD','VW0+4']]},
 INC:{t:['INC / DEC — Bir Artır / Azalt','INC / DEC — Increment / Decrement'],
  d:['Değişkeni 1 artırır (INC) ya da 1 azaltır (DEC). Sayıcı gibi kullanılabilir ama her taramada çalıştığı için önüne <b>P</b> koy.','Adds 1 (INC) or subtracts 1 (DEC). Can act like a counter, but since it runs on every scan, put a <b>P</b> before it.'],
  e:['Örnek: Her kutuda stok bir azalsın.','Example: stock goes down by one per box.'],ex:[['NO','I0.1'],['P',''],['DEC','VW0']]},
 SHL:{t:['SHL / SHR — Bit Kaydırma','SHL / SHR — Bit Shift'],
  d:['Bayttaki bütün bitleri sola (SHL) ya da sağa (SHR) kaydırır. QB0\'a bağlı lambalarda yanan ışık bir lamba ilerler: <b>yürüyen ışık</b>, sıralı istasyonlar.','Shifts every bit of the byte left (SHL) or right (SHR). With lamps on QB0, the lit lamp moves one place: a <b>running light</b>, sequential stations.'],
  e:['Örnek: Zamanlayıcı darbesiyle ışığı kaydır.','Example: shift the light on a timer pulse.'],ex:[['NO','T1'],['SHL','QB0 1']]},
 WAND:{t:['WAND / WOR / INV — Bayt Mantığı','WAND / WOR / INV — Byte Logic'],
  d:['8 biti birden işler. <b>WOR</b> maskede 1 olan bitleri yakar, <b>WAND</b> maskede 0 olan bitleri söndürür, <b>INV</b> tüm bitleri tersler. Diğer bitlere dokunmadan bir kısmını değiştirmek için.','Works on 8 bits at once. <b>WOR</b> sets the bits that are 1 in the mask, <b>WAND</b> clears the bits that are 0 in the mask, <b>INV</b> flips all bits. To change some bits without touching the rest.'],
  e:['Örnek: YAK butonu 1. ve 3. lambayı yaksın.','Example: LIGHT turns on lamps 1 and 3.'],ex:[['NO','I0.0'],['WOR','QB0 0101']]},
 SEG:{t:['SEG — 7-Segment Dönüştürme','SEG — 7-Segment Convert'],
  d:['0–9 (ve A–F) arası bir sayıyı, 7-segment göstergenin a–g segmentlerini yakan <b>bit desenine</b> çevirip bayta (QB1) yazar. Sayaç değerini ekranda göstermek için.','Converts a 0–9 (and A–F) number into the <b>bit pattern</b> that lights the a–g segments of a 7-segment display and writes it to a byte (QB1). To show a count on screen.'],
  e:['Örnek: C1 değerini göstergede göster.','Example: show C1 on the display.'],ex:[['NO','SM0.0'],['SEG','QB1←C1']]},
 RTC:{t:['READ_RTC — Saati Oku','READ_RTC — Read Clock'],
  d:['PLC\'nin içindeki gerçek zaman saatini okur ve <b>saati</b> (0–23) değişkene yazar. Sonra CMP ile “08:00–17:00 arası” gibi zaman planları kurarsın.','Reads the PLC\'s built-in real-time clock and writes the <b>hour</b> (0–23) to a variable. Then use CMP for schedules like “between 08:00 and 17:00”.'],
  e:['Örnek: Mesai saatinde lamba.','Example: lamp during shift hours.'],ex:[['NO','SM0.0'],['RTC','VW0']],ex2:[['CMP','VW0≥8'],['CMP','VW0<17'],['COIL','Q0.0']]},
 SM:{t:['Özel Bitler (SM)','Special Bits (SM)'],
  d:['PLC\'nin hazır bitleri: <b>SM0.0</b> her zaman 1, <b>SM0.1</b> yalnızca ilk taramada 1 (başlangıç değeri yazmak için), <b>SM0.5</b> 0,5 sn açık / 0,5 sn kapalı saat darbesi (yanıp sönme).','The PLC\'s built-in bits: <b>SM0.0</b> is always 1, <b>SM0.1</b> is 1 only on the first scan (to write start values), <b>SM0.5</b> is a 0.5 s on / 0.5 s off clock pulse (blinking).'],
  e:['Örnek: Arıza lambası yanıp sönsün.','Example: blink the fault lamp.'],ex:[['NO','I0.1'],['NO','SM0.5'],['COIL','Q0.1']]},
 VW:{t:['Değişken (VW) ve Analog Giriş (AIW)','Variable (VW) and Analog Input (AIW)'],
  d:['Bitler yalnızca 0/1 tutar; <b>VW0</b> gibi değişkenler −32768…32767 arası <b>sayı</b> tutar. <b>AIW0</b> analog sensörün (seviye, sıcaklık) 0–32000 arası ölçümüdür. <b>QB0/IB0</b> ise 8 çıkış/girişin tek sayı gibi okunmasıdır.','Bits hold only 0/1; variables like <b>VW0</b> hold a <b>number</b> from −32768 to 32767. <b>AIW0</b> is an analog sensor reading (level, temperature) from 0 to 32000. <b>QB0/IB0</b> read 8 outputs/inputs as one number.'],
  e:['Örnek: Seviye %50\'nin altındaysa pompa.','Example: pump when the level is below 50%.'],ex:[['CMP','AIW0<16000'],['COIL','Q0.0']]}};
const ELEM_ORDER=['NO','NC','COIL','BR','SET','RST','MEM','TON','TOF','CTU','CTD','VW','CMP','P','N','NOT','SM','TONR','MOV','ADD','INC','SEG','SHL','WAND','RTC'];
const ELEM_OF=t=>({SUB:'ADD',MUL:'ADD',DIV:'ADD',DEC:'INC',SHR:'SHL',WOR:'WAND',INV:'WAND'})[t]||t;
function brSym(){ return '<svg width="34" height="24" viewBox="0 0 34 24"><path d="M2 4H32M8 4V20H26V4"/></svg>'; }
function memSym(){ return '<svg width="34" height="24" viewBox="0 0 34 24"><rect x="4" y="2" width="26" height="20" rx="3"/><text x="17" y="16">M</text></svg>'; }
function wSym(l){ return `<svg width="34" height="24" viewBox="0 0 34 24"><rect x="2" y="2" width="30" height="20" rx="3"/><text x="17" y="15.5" font-size="8">${l}</text></svg>`; }
function elSym(k){ return k==='BR'?brSym():k==='MEM'?memSym():k==='SM'?wSym('SM'):k==='VW'?wSym('VW'):palSym(k); }
// örnek satırı SVG olarak çiz: main = [[tip,adr],...] (son eleman çıkış), br = ilk sütunun altına paralel kol
function rungSVG(main,br){
  const W=290, cw=56, x0=10, y=20, H=br?76:42, outX=W-38;
  let g=`<path class="w" d="M${x0} ${y}H${outX}"/>`, k=`<path class="rl" d="M4 4V${H-4}M${W-4} 4V${H-4}"/><path class="w" d="M${W-4} ${y}H${outX+34}"/>`;
  const sym=(t,a,x,yy)=>`<svg x="${x}" y="${yy-12}" width="34" height="24" viewBox="0 0 34 24">${palSym(t).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg><text class="ad" x="${x+17}" y="${yy+22}"${a.length>7?' style="font-size:7.5px"':''}>${a}</text>`;
  const n=main.length-1;
  main.forEach(([t,a],i)=>{ const x=i<n?x0+12+i*cw:outX; g+=`<rect class="bg" x="${x}" y="${y-12}" width="34" height="24"/>`+sym(t,a,x,y); });
  if(br){ const yb=y+36, xe=x0+12+br.length*cw-10; g+=`<path class="w" d="M${x0} ${y}V${yb}H${xe}V${y}"/>`;
    br.forEach(([t,a],i)=>{ const x=x0+12+i*cw; g+=`<rect class="bg" x="${x}" y="${yb-12}" width="34" height="24"/>`+sym(t,a,x,yb); }); }
  return `<svg class="rs" viewBox="0 0 ${W} ${H+8}" width="100%">${k}${g}</svg>`;
}
function elemHTML(k,full){
  const E=ELEM[k];
  let ex=rungSVG(E.ex,E.br); if(E.ex2) ex+=rungSVG(E.ex2);
  return `<div class="el"><div class="eh"><div class="pal sel" style="flex:0 0 54px;height:42px">${elSym(k)}</div><b>${tx(E.t[0],E.t[1])}</b></div>
   <p class="t">${tx(E.d[0],E.d[1])}</p>${full?`<div class="ex"><small>${tx(E.e[0],E.e[1])}</small>${ex}</div>`:''}</div>`;
}
// bölümde kullanılan elemanlar (çözüme göre)
function levelElems(lv){
  const s=new Set(); for(const rg of lv.sol.rungs){ if(rg.br&&rg.c[1].some(Boolean)) s.add('BR'); for(const row of rg.c) for(const c of row) if(c){ s.add(ELEM_OF(c.t)); const ad=[c.a,c.src].filter(Boolean);
    if(c.a&&c.a[0]==='M') s.add('MEM'); if(ad.some(a=>/^SM/.test(a))) s.add('SM'); if(ad.some(a=>/^(VW|AIW|QB|IB)/.test(a))) s.add('VW'); } }
  return ELEM_ORDER.filter(k=>s.has(k));
}
// yeni gösterilecek elemanlar: palette olan + çözümde geçen, henüz görülmemiş
function freshElems(lv){ const pool=new Set(lv.pal.map(ELEM_OF).concat(levelElems(lv))); return ELEM_ORDER.filter(k=>pool.has(k)&&!save.seen[k]); }
function showIntro(list,done){
  if(!list.length){ done&&done(); return; }
  let i=0;
  const draw=()=>card(`<div class="nwt">${I('new_releases','f sm')} ${tx('YENİ ELEMAN','NEW ELEMENT')}${list.length>1?` · ${i+1}/${list.length}`:''}</div>${elemHTML(list[i],true)}
    <div class="brow"><button class="btn pri wide" id="ok">${i<list.length-1?tx('Sonraki','Next'):tx('Anladım, başlayalım','Got it, let\'s go')}</button></div>`,e=>{
      if(e.target.id!=='ok') return; save.seen[list[i]]=1; persist(); Snd.click();
      if(++i<list.length) draw(); else { closeAll(); done&&done(); } });
  draw();
}
