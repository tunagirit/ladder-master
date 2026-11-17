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
};
const ELEM_ORDER=['NO','NC','COIL','BR','SET','RST','MEM','TON','TOF','CTU','CTD'];
function brSym(){ return '<svg width="34" height="24" viewBox="0 0 34 24"><path d="M2 4H32M8 4V20H26V4"/></svg>'; }
function memSym(){ return '<svg width="34" height="24" viewBox="0 0 34 24"><rect x="4" y="2" width="26" height="20" rx="3"/><text x="17" y="16">M</text></svg>'; }
function elSym(k){ return k==='BR'?brSym():k==='MEM'?memSym():palSym(k); }
// örnek satırı SVG olarak çiz: main = [[tip,adr],...] (son eleman çıkış), br = ilk sütunun altına paralel kol
function rungSVG(main,br){
  const W=290, cw=56, x0=10, y=20, H=br?76:42, outX=W-38;
  let g=`<path class="w" d="M${x0} ${y}H${outX}"/>`, k=`<path class="rl" d="M4 4V${H-4}M${W-4} 4V${H-4}"/><path class="w" d="M${W-4} ${y}H${outX+34}"/>`;
  const sym=(t,a,x,yy)=>`<svg x="${x}" y="${yy-12}" width="34" height="24" viewBox="0 0 34 24">${palSym(t).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg><text class="ad" x="${x+17}" y="${yy+22}">${a}</text>`;
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
  const s=new Set(); for(const rg of lv.sol.rungs){ if(rg.br&&rg.c[1].some(Boolean)) s.add('BR'); for(const row of rg.c) for(const c of row) if(c){ s.add(c.t); if(c.a&&c.a[0]==='M') s.add('MEM'); } }
  return ELEM_ORDER.filter(k=>s.has(k));
}
// yeni gösterilecek elemanlar: palette olan + çözümde geçen, henüz görülmemiş
function freshElems(lv){ const pool=new Set(lv.pal.concat(levelElems(lv))); return ELEM_ORDER.filter(k=>pool.has(k)&&!save.seen[k]); }
function showIntro(list,done){
  if(!list.length){ done&&done(); return; }
  let i=0;
  const draw=()=>card(`<div class="nwt">${I('new_releases','f sm')} ${tx('YENİ ELEMAN','NEW ELEMENT')}${list.length>1?` · ${i+1}/${list.length}`:''}</div>${elemHTML(list[i],true)}
    <div class="brow"><button class="btn pri wide" id="ok">${i<list.length-1?tx('Sonraki','Next'):tx('Anladım, başlayalım','Got it, let\'s go')}</button></div>`,e=>{
      if(e.target.id!=='ok') return; save.seen[list[i]]=1; persist(); Snd.click();
      if(++i<list.length) draw(); else { closeAll(); done&&done(); } });
  draw();
}
