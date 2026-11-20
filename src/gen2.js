/* ===== v1.1.2: YENİ KOMUT AİLELERİ — bölüm şablonları ===== */
CATS.push(
  I18({n:['Karşılaştırma','Compare'],s:['CMP · analog giriş (AIW)','CMP · analog input (AIW)'],ic:'CMP',c:'var(--blu)'}),
  I18({n:['Kenar & Özel Bitler','Edges & Special Bits'],s:['P · N · NOT · SM0.5','P · N · NOT · SM0.5'],ic:'P',c:'var(--amb)'}),
  I18({n:['Taşıma & Matematik','Move & Math'],s:['MOV · ADD · SUB · INC · DEC · DIV','MOV · ADD · SUB · INC · DEC · DIV'],ic:'MOV',c:'var(--pur)'}),
  I18({n:['Dönüştürme','Convert'],s:['SEG 7-segment gösterge','SEG 7-segment display'],ic:'SEG',c:'var(--neon)'}),
  I18({n:['Kaydırma','Shift'],s:['SHL · SHR yürüyen ışık','SHL · SHR running light'],ic:'SHL',c:'var(--amb)'}),
  I18({n:['Mantık İşlemleri','Logic Operations'],s:['WAND · WOR · INV byte','WAND · WOR · INV bytes'],ic:'WAND',c:'var(--blu)'}),
  I18({n:['Saat','Clock'],s:['READ_RTC · zaman planı','READ_RTC · time schedule'],ic:'RTC',c:'var(--pur)'}));

const ORDER=['NO','NC','P','N','NOT','CMP','COIL','SET','RST','TON','TOF','TONR','CTU','CTD','MOV','ADD','SUB','MUL','DIV','INC','DEC','SHL','SHR','WAND','WOR','INV','SEG','RTC'];
function palOf(sol,extra){ const s=new Set(['NO','NC','COIL','SET','RST'].concat(extra||[])); for(const rg of sol.rungs) for(const row of rg.c) for(const c of row) if(c) s.add(c.t); return ORDER.filter(t=>s.has(t)); }
const qb=(o,pre)=>{ let v=0; for(let i=0;i<8;i++) if(o[pre+i]) v|=1<<i; return v; };
const T2=(a,b)=>[a,b];
/* kural yardımcıları: (w,q,iv,dt,s) → hata metni ya da undefined */
const rises=sen=>(w,q,iv,dt,s)=>{ const on=w.sensorOn(sen); if(on&&!s.p) w.cnt.rises=(w.cnt.rises||0)+1; s.p=on; };
const follow=(exp,act,msg,tol)=>(w,q,iv,dt,s)=>{ if(w.t<0.06) return; if(!!exp(w,q,iv)!==!!act(w,q,iv)){ s.b=(s.b||0)+dt; if(s.b>(tol||0.15)) return msg; } else s.b=0; };
const timeIf=(f,cond,need)=>(w,q,iv,dt,s)=>{ if(cond(w,q,iv)){ s.t=(s.t||0)+dt; if(s.t>=need) w.f[f]=true; } };
const earlyLamp=(lamp,n,msg)=>(w,q)=>{ if(q[lamp]&&(w.cntRises||0)<n) return msg; };
const proc=(kind,a,o)=>Object.assign({kind,a,ai:'AIW0',v0:0.3,up:0.1,down:0.03,min:0.02,max:0.98,
  minMsg:kind==='tank'?tx('Hata: Tank boşaldı! Pompa zamanında çalışmadı.','Error: The tank ran dry! The pump did not start in time.'):tx('Hata: Fırın soğudu!','Error: The oven cooled down!'),
  maxMsg:kind==='tank'?tx('Hata: Tank taştı! Pompa durmalıydı.','Error: The tank overflowed! The pump should have stopped.'):tx('Hata: Fırın aşırı ısındı!','Error: The oven overheated!')},o);
const pct=v=>Math.round(v/320);

/* ===================== KARŞILAŞTIRMA ===================== */
const cmpCount=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'SAYAÇ_DOLU'}); const sp=spd(r,k), sx=ri(r,30,60), N=ri(r,3,6);
  const sol={rungs:[R(['NO '+A.sen,null,null,null,'CTU C1 20']),R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['CMP C1 >= '+N,null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:N+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,lampCount:{n:N},lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'SAYAÇ'}],
    rules:[(w,q,iv,dt,s)=>{ if((w.cntRises||0)>=N&&!q[A.lamp]){ s.b=(s.b||0)+dt; if(s.b>0.3) return tx(`Hata: Lamba ${N}. kutu geçer geçmez yanmalı (≥ kullan)!`,`Error: The lamp must light as soon as box #${N} passes (use ≥)!`); } else s.b=0; }]};
  return {title:tx(`Karşılaştır: C1 ≥ ${N}`,`Compare: C1 ≥ ${N}`),
    task:tx(`Şalter (${A.sw}) bandı çalıştırsın. Sensör (${A.sen}) kutuları CTU C1 ile saysın (PV 20 kalsın). Sayıcı değeri ${N} veya daha fazla olunca (CMP ≥) SAYAÇ lambası (${A.lamp}) yansın. ${N+1} kutu teslim et.`,
      `The switch (${A.sw}) runs the belt. The sensor (${A.sen}) counts boxes with CTU C1 (leave PV at 20). When the count is ${N} or more (CMP ≥) the COUNT lamp (${A.lamp}) lights. Deliver ${N+1} boxes.`),
    hint:tx(`Satır 3: karşılaştırma kontağı CMP — C1 ≥ ${N} → ${A.lamp}. CMP, sayıcının biti yerine DEĞERİNE bakar.`,`Rung 3: compare contact CMP — C1 ≥ ${N} → ${A.lamp}. CMP looks at the counter's VALUE, not its bit.`),
    io,M:0,T:0,C:1,pal:palOf(sol),scene:sc,goals:[{k:'lampCount'},{k:'deliver',n:N+1}],sol,bot:at([[0.5,A.sw]])};
};
const tankBasic=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw'],['pump']); const TH=16000;
  const sol={rungs:[R(['NO '+A.sw,'CMP AIW0 < '+TH,null,null,'COIL '+A.pump])]};
  const sc={noBelt:true,boxes:0,proc:proc('tank',A.pump,{v0:0.15,up:0.12,down:0.05}),
    rules:[(w,q,iv,dt,s)=>{ if(w.pv>0.42) s.r=1; if(s.r&&w.pv>0.35&&w.pv<0.65){ s.t=(s.t||0)+dt; w.cnt.keep=Math.floor(s.t); } }]};
  return {title:tx('Analog Seviye: %50 Altında Pompala','Analog Level: Pump Below 50%'),
    task:tx(`Tankın seviye sensörü analog giriş AIW0'a bağlı (0 = boş, 32000 = dolu). Şalter (${A.sw}) açıkken seviye ${TH}'ün (%50) ALTINDAYSA pompa (${A.pump}) çalışsın. Seviyeyi 8 sn %50 civarında tut.`,
      `The tank's level sensor is wired to analog input AIW0 (0 = empty, 32000 = full). While the switch (${A.sw}) is ON, the pump (${A.pump}) runs when the level is BELOW ${TH} (50%). Hold the level around 50% for 8 s.`),
    hint:tx(`Tek satır: ${A.sw} · CMP AIW0 < ${TH} → ${A.pump}.`,`One rung: ${A.sw} · CMP AIW0 < ${TH} → ${A.pump}.`),
    io,M:0,T:0,C:0,words:['AIW0'],wt:{AIW0:'SEVİYE'},pal:palOf(sol),scene:sc,goals:[{k:'cnt',f:'keep',n:8,l:T2('%50 seviyede (sn)','At 50% (s)')}],sol,bot:at([[0.5,A.sw]])};
};
const ovenRange=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw'],['heat','lamp'],{lamp:'HAZIR'}); const lo=pick(r,[14000,16000]), hi=pick(r,[22000,24000]);
  const sol={rungs:[R(['NO '+A.sw,null,null,null,'COIL '+A.heat]),R(['CMP AIW0 >= '+lo,'CMP AIW0 <= '+hi,null,null,'COIL '+A.lamp])]};
  const inR=(iv)=>iv.AIW0>=lo&&iv.AIW0<=hi;
  const sc={noBelt:true,boxes:0,proc:proc('oven',A.heat,{v0:0.1,up:0.09,down:0.03,min:-1}),lamps:[{a:A.lamp,c:'green',n:'HAZIR'}],
    rules:[follow((w,q,iv)=>inR(iv),(w,q)=>q[A.lamp],tx(`Hata: HAZIR lambası yalnızca sıcaklık ${lo}–${hi} arasındayken yanmalı!`,`Error: the READY lamp must be on only while the temperature is between ${lo} and ${hi}!`)),
      timeIf('rngOn',(w,q,iv)=>q[A.lamp]&&inR(iv),0.6),timeIf('rngOff',(w,q,iv)=>!q[A.lamp]&&iv.AIW0>hi,0.6)]};
  return {title:tx('Fırın: Sıcaklık Aralığı','Oven: Temperature Window'),
    task:tx(`Şalter (${A.sw}) ısıtıcıyı (${A.heat}) çalıştırsın. Sıcaklık sensörü AIW0'da. Sıcaklık ${lo} ile ${hi} ARASINDAYKEN HAZIR lambası (${A.lamp}) yansın; dışındayken sönsün.`,
      `The switch (${A.sw}) runs the heater (${A.heat}). The temperature sensor is on AIW0. While the temperature is BETWEEN ${lo} and ${hi} the READY lamp (${A.lamp}) is on; outside that range it is off.`),
    hint:tx(`İki karşılaştırmayı SERİ bağla (VE): CMP AIW0 ≥ ${lo} · CMP AIW0 ≤ ${hi} → ${A.lamp}.`,`Put two compares in SERIES (AND): CMP AIW0 ≥ ${lo} · CMP AIW0 ≤ ${hi} → ${A.lamp}.`),
    io,M:0,T:0,C:0,words:['AIW0'],wt:{AIW0:'SICAKLIK'},pal:palOf(sol),scene:sc,goals:[{k:'rngOn',l:T2('Aralıkta yanar','On in range')},{k:'rngOff',l:T2('Aralık dışı söner','Off out of range')}],sol,
    bot:once((w,P,t,st)=>{ if(!st.a&&t>0.5){ st.a=1; P(A.sw); } if(st.a===1&&w.pv>0.82){ st.a=2; P(A.sw); } })};
};
const hystRule=(pump,lo,hi)=>(w,q,iv,dt,s)=>{ const on=!!q[pump];
  if(on&&!s.p&&w.t>0.05&&w.pv>lo/32000+0.03) return tx(`Hata: Pompa erken çalıştı! Seviye ${lo}'e inmeden başlamamalı.`,`Error: The pump started early! It must wait until the level drops to ${lo}.`);
  if(!on&&s.p){ if(w.pv<hi/32000-0.03) return tx(`Hata: Pompa erken durdu! Seviye ${hi}'e ulaşana kadar çalışmalı (Set/Reset).`,`Error: The pump stopped early! It must run until the level reaches ${hi} (Set/Reset).`); w.cnt.cyc=(w.cnt.cyc||0)+1; }
  s.p=on; };
const tankHyst=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw'],['pump']); const lo=pick(r,[6000,8000,10000]), hi=pick(r,[24000,26000,28000]);
  const sol={rungs:[R(['NO '+A.sw,'CMP AIW0 <= '+lo,null,null,'SET '+A.pump]),R(['CMP AIW0 >= '+hi,null,null,null,'RST '+A.pump])]};
  const sc={noBelt:true,boxes:0,proc:proc('tank',A.pump,{v0:0.5,up:0.14,down:0.05}),rules:[hystRule(A.pump,lo,hi)]};
  return {title:tx(`Histerezis: ${lo} ↔ ${hi}`,`Hysteresis: ${lo} ↔ ${hi}`),
    task:tx(`Şalter (${A.sw}) açıkken: seviye (AIW0) ${lo} veya altına inince pompa (${A.pump}) çalışsın ve seviye ${hi}'e ulaşana kadar DURMASIN. ${hi}'e gelince dursun. 2 dolum döngüsü yap.`,
      `While the switch (${A.sw}) is ON: when the level (AIW0) drops to ${lo} or lower, the pump (${A.pump}) starts and must NOT stop until the level reaches ${hi}. Then it stops. Complete 2 fill cycles.`),
    hint:tx(`Tek bobin yetmez — Set/Reset kullan: ${A.sw} · CMP AIW0 ≤ ${lo} → (S) ${A.pump}; CMP AIW0 ≥ ${hi} → (R) ${A.pump}.`,`A plain coil is not enough — use Set/Reset: ${A.sw} · CMP AIW0 ≤ ${lo} → (S) ${A.pump}; CMP AIW0 ≥ ${hi} → (R) ${A.pump}.`),
    io,M:0,T:0,C:0,words:['AIW0'],wt:{AIW0:'SEVİYE'},pal:palOf(sol),scene:sc,goals:[{k:'cnt',f:'cyc',n:2,l:T2('Dolum döngüsü','Fill cycle')}],sol,bot:at([[0.3,A.sw]])};
};
const cmpStages=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp','lamp2'],{lamp:'YARIM',lamp2:'TAMAM'}); const sp=spd(r,k), sx=ri(r,30,55), h=ri(r,2,3), N=2*h;
  const sol={rungs:[R(['NO '+A.sen,null,null,null,'CTU C1 20']),R(['NO '+A.sw,'CMP C1 < '+N,null,null,'COIL '+A.motor]),R(['CMP C1 >= '+h,null,null,null,'COIL '+A.lamp]),R(['CMP C1 >= '+N,null,null,null,'COIL '+A.lamp2])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:N+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,batchN:N,lampA:A.lamp2,
    lamps:[{a:A.lamp,c:'amber',n:'YARIM'},{a:A.lamp2,c:'green',n:'TAMAM'}],
    rules:[earlyLamp(A.lamp,h,tx(`Hata: YARIM lambası ${h}. kutudan önce yandı!`,`Error: HALF lamp lit before box #${h}!`)),earlyLamp(A.lamp2,N,tx(`Hata: TAMAM lambası ${N}. kutudan önce yandı!`,`Error: DONE lamp lit before box #${N}!`)),
      (w,q)=>{ if(q[A.lamp]&&(w.cntRises||0)>=h) w.f.half=true; }]};
  return {title:tx(`Kademeli Sayım (${h} / ${N})`,`Staged Count (${h} / ${N})`),
    task:tx(`Şalter (${A.sw}) ile bant çalışsın, sensör (${A.sen}) CTU C1 ile saysın (PV 20). C1 ≥ ${h} olunca sarı YARIM lambası (${A.lamp}), C1 ≥ ${N} olunca bant dursun ve yeşil TAMAM lambası (${A.lamp2}) yansın.`,
      `The switch (${A.sw}) runs the belt, the sensor (${A.sen}) counts with CTU C1 (PV 20). At C1 ≥ ${h} the amber HALF lamp (${A.lamp}) lights; at C1 ≥ ${N} the belt stops and the green DONE lamp (${A.lamp2}) lights.`),
    hint:tx(`Bant: ${A.sw} · CMP C1 < ${N} → ${A.motor}. Lambalar: CMP C1 ≥ ${h} → ${A.lamp}, CMP C1 ≥ ${N} → ${A.lamp2}.`,`Belt: ${A.sw} · CMP C1 < ${N} → ${A.motor}. Lamps: CMP C1 ≥ ${h} → ${A.lamp}, CMP C1 ≥ ${N} → ${A.lamp2}.`),
    io,M:0,T:0,C:1,pal:palOf(sol),scene:sc,goals:[{k:'half',l:T2('Yarım lambası','Half lamp')},{k:'batch',n:1}],sol,bot:at([[0.5,A.sw]])};
};
const hHystLine=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['pump','lamp'],{lamp:'DOLUYOR'}); const lo=8000, hi=pick(r,[24000,26000,28000]);
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,null,null,'COIL M0.0'],['NO M0.0']),R(['NO M0.0','CMP AIW0 <= '+lo,null,null,'SET '+A.pump]),R(['CMP AIW0 >= '+hi,null,null,null,'RST '+A.pump],['NC M0.0']),R(['NO '+A.pump,null,null,null,'COIL '+A.lamp])]};
  const sc={noBelt:true,boxes:0,proc:proc('tank',A.pump,{v0:0.2,up:0.14,down:0.05}),lamps:[{a:A.lamp,c:'amber',n:'DOLUYOR'}],
    rules:[(w,q)=>{ if(q[A.pump]&&w.t<0.45) return tx('Hata: START\'a basılmadan pompa çalıştı!','Error: The pump ran before START was pressed!'); },hystRule(A.pump,lo,hi),
      follow((w,q)=>q[A.pump],(w,q)=>q[A.lamp],tx('Hata: DOLUYOR lambası pompa çalışırken yanmalı!','Error: the FILLING lamp must be on while the pump runs!'))]};
  return {title:tx('Mühürlü Tank Kontrolü','Sealed Tank Control'),
    task:tx(`START (${A.start}) / STOP (${A.stop}) ile M0.0'ı mühürle. Sistem açıkken seviye (AIW0) ${lo}'e inince pompa (${A.pump}) çalışsın, ${hi}'e gelince dursun. STOP pompayı da durdursun. Pompa çalışırken DOLUYOR lambası (${A.lamp}) yansın. 2 döngü.`,
      `Seal M0.0 with START (${A.start}) / STOP (${A.stop}). While the system is on, the pump (${A.pump}) starts when the level (AIW0) drops to ${lo} and stops at ${hi}. STOP also stops the pump. The FILLING lamp (${A.lamp}) is on while the pump runs. 2 cycles.`),
    hint:tx(`M0.0 mühür · M0.0 · CMP AIW0 ≤ ${lo} → (S) ${A.pump} · (CMP AIW0 ≥ ${hi} ∥ KAPALI M0.0) → (R) ${A.pump} · ${A.pump} → ${A.lamp}.`,`M0.0 seal-in · M0.0 · CMP AIW0 ≤ ${lo} → (S) ${A.pump} · (CMP AIW0 ≥ ${hi} ∥ NC M0.0) → (R) ${A.pump} · ${A.pump} → ${A.lamp}.`),
    io,M:1,T:0,C:0,words:['AIW0'],wt:{AIW0:'SEVİYE'},pal:palOf(sol),scene:sc,goals:[{k:'cnt',f:'cyc',n:2,l:T2('Dolum döngüsü','Fill cycle')}],sol,bot:at([[0.5,A.start]])};
};

/* ===================== KENAR & ÖZEL BİTLER ===================== */
const togRule=(btn,expFn,sen)=>(w,q,iv,dt,s)=>{ const b=!!iv[btn], m=!!w.motor, so=sen?w.sensorOn(sen):false;
  if(b&&!s.pb){ s.n=(s.n||0)+1; s.tp=w.t; s.ch=0; s.ok=false; }
  if(b&&m!==s.pm&&!so&&!s.ps) s.ch=(s.ch||0)+1;
  if(s.ch>1) return tx('Hata: Bant butona basılıyken titredi! Tek basış = tek değişim (P kenarı).','Error: The belt flickered while the button was held! One press = one change (P edge).');
  if(s.n&&!s.ok&&w.t-s.tp>0.4&&so===!!s.ps){ if(m!==expFn(w,s.n%2===1)) return tx('Hata: Her basışta bant durumu değişmeli (açıksa kapanmalı, kapalıysa açılmalı)!','Error: Each press must flip the belt (on → off, off → on)!'); s.ok=true; w.cnt.tog=(w.cnt.tog||0)+1; }
  s.pb=b; s.pm=m; s.ps=so; };
const togglePN=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['tog'],['motor']); const sp=spd(r,k);
  const sol={rungs:[R(['NO '+A.tog,'P',null,null,'COIL M0.0']),R(['NO M0.0','NC '+A.motor,null,null,'COIL '+A.motor],['NC M0.0','NO '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:12,endDrop:'deliver',rules:[togRule(A.tog,(w,on)=>on)]};
  return {title:tx('Tek Butonla Aç/Kapa (P)','One-Button On/Off (P)'),
    task:tx(`Tek bir AÇ/KAPA butonu (${A.tog}) var: her basışta bant (${A.motor}) durumunu değiştirsin (kapalıysa açılsın, açıksa kapansın). Butonu basılı tutmak bandı titretmemeli — yükselen kenar (P) ile tek atım al. 4 kez bas.`,
      `There is a single ON/OFF button (${A.tog}): each press flips the belt (${A.motor}) (off → on, on → off). Holding the button must not make the belt flicker — take a one-shot with a rising edge (P). Press it 4 times.`),
    hint:tx(`Satır 1: ${A.tog} · P → M0.0 (tek taramalık darbe). Satır 2: (M0.0 · KAPALI ${A.motor}) ∥ (KAPALI M0.0 · ${A.motor}) → ${A.motor}.`,`Rung 1: ${A.tog} · P → M0.0 (one-scan pulse). Rung 2: (M0.0 · NC ${A.motor}) ∥ (NC M0.0 · ${A.motor}) → ${A.motor}.`),
    io,M:1,T:0,C:0,pal:palOf(sol,['N']),scene:sc,goals:[{k:'cnt',f:'tog',n:4,l:T2('Aç/Kapa','On/Off')}],sol,bot:at([[0.5,A.tog],[2.5,A.tog],[4.5,A.tog],[6.5,A.tog]])};
};
const releaseN=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','sen'],['motor']); const sp=spd(r,k), sx=ri(r,55,85);
  const sol={rungs:[R(['NO '+A.start,'N',null,null,'SET '+A.motor]),R(['NO '+A.sen,null,null,null,'RST '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,sensors:[{a:A.sen,x:sx}],endMsg:tx('Hata: Kutu sensörde durmadı!','Error: Box did not stop at the sensor!'),
    rules:[(w,q,iv,dt,s)=>{ const b=!!iv[A.start];
      if(b&&w.motor) return tx('Hata: Bant butona basılıyken kalktı! Buton BIRAKILINCA kalkmalı (N kenarı).','Error: The belt started while the button was pressed! It must start when the button is RELEASED (N edge).');
      if(!b&&s.pb) s.ft=w.t;
      if(w.motor&&!s.pm){ if(s.ft!=null&&w.t-s.ft<=0.25) w.f.rel=true; else return tx('Hata: Bant butonu bırakınca kalkmalı!','Error: The belt must start when the button is released!'); }
      s.pb=b; s.pm=w.motor; }]};
  return {title:tx('Bırakınca Kalk (N)','Start on Release (N)'),
    task:tx(`Güvenlik kuralı: bant (${A.motor}) START (${A.start}) butonu BIRAKILDIĞI an kalksın (düşen kenar, N) ve çalışmaya devam etsin. Kutu sensöre (${A.sen}) gelince dursun.`,
      `Safety rule: the belt (${A.motor}) starts the moment START (${A.start}) is RELEASED (falling edge, N) and keeps running. When the box reaches the sensor (${A.sen}) it stops.`),
    hint:tx(`Satır 1: ${A.start} · N → (S) ${A.motor}. Satır 2: ${A.sen} → (R) ${A.motor}.`,`Rung 1: ${A.start} · N → (S) ${A.motor}. Rung 2: ${A.sen} → (R) ${A.motor}.`),
    io,M:0,T:0,C:0,pal:palOf(sol,['P']),scene:sc,goals:[{k:'rel',l:T2('Bırakınca kalkış','Start on release')},{k:'park',s:A.sen,hold:1.2}],sol,bot:at([[0.5,A.start]])};
};
const blinkRule=(lamp,sen)=>(w,q,iv,dt,s)=>{ const on=!!q[lamp], park=!w.motor&&w.sensorOn(sen);
  if(on&&!park&&w.t>0.1) return tx('Hata: Lamba yalnızca kutu sensörde beklerken yanıp sönmeli!','Error: The lamp must blink only while the box waits at the sensor!');
  if(park&&on!==s.p){ if(s.ts!=null&&s.k>=2){ const d=w.t-s.ts; if(d<0.35||d>0.7) return tx('Hata: Lamba 0,5 sn aralıklarla yanıp sönmeli (SM0.5)!','Error: The lamp must blink at 0.5 s intervals (SM0.5)!'); }
    s.k=(s.k||0)+1; s.ts=w.t; if(s.k>=6) w.f.blink=true; }
  if(park&&s.ts==null){ s.ts=w.t; s.k=0; }
  s.p=on; };
const blinkSM=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'ARIZA'}); const sp=spd(r,k), sx=ri(r,55,85);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor]),R(['NO '+A.sen,'NO SM0.5',null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,sensors:[{a:A.sen,x:sx}],lamps:[{a:A.lamp,c:'red',n:'ARIZA'}],endMsg:tx('Hata: Kutu sensörde durmadı!','Error: Box did not stop at the sensor!'),rules:[blinkRule(A.lamp,A.sen)]};
  return {title:tx('Yanıp Sönen İkaz (SM0.5)','Blinking Alarm (SM0.5)'),
    task:tx(`Şalter (${A.sw}) bandı çalıştırsın, kutu sensörde (${A.sen}) dursun. Kutu beklerken ARIZA lambası (${A.lamp}) yanıp sönsün. Hazır saat biti SM0.5 kendiliğinden 0,5 sn açık / 0,5 sn kapalı olur.`,
      `The switch (${A.sw}) runs the belt; the box stops at the sensor (${A.sen}). While it waits, the FAULT lamp (${A.lamp}) blinks. The built-in clock bit SM0.5 is 0.5 s on / 0.5 s off by itself.`),
    hint:tx(`Satır 2: ${A.sen} · SM0.5 → ${A.lamp}. SM bitleri kontak listesinde “ÖZEL (SM)” grubundadır.`,`Rung 2: ${A.sen} · SM0.5 → ${A.lamp}. SM bits are in the “SPECIAL (SM)” group of the contact list.`),
    io,M:0,T:0,C:0,SM:true,pal:palOf(sol),scene:sc,goals:[{k:'park',s:A.sen,hold:1},{k:'blink',l:T2('Yanıp sönme','Blinking')}],sol,bot:at([[0.5,A.sw]])};
};
const notLamp=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw'],['motor','lamp'],{lamp:'BEKLİYOR'}); const sp=spd(r,k);
  const sol={rungs:[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.motor,'NOT',null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:6,endDrop:'deliver',lamps:[{a:A.lamp,c:'amber',n:'BEKLİYOR'}],
    rules:[follow((w)=>!w.motor,(w,q)=>q[A.lamp],tx('Hata: BEKLİYOR lambası tam tersini göstermeli: bant dururken yanık, çalışırken sönük!','Error: The IDLE lamp must show the opposite: on while the belt is stopped, off while it runs!')),
      timeIf('nOn',(w,q)=>q[A.lamp]&&!w.motor,0.6),timeIf('nOff',(w,q)=>!q[A.lamp]&&w.motor,0.6)]};
  return {title:tx('Tersleyici (NOT)','Inverter (NOT)'),
    task:tx(`Şalter (${A.sw}) bandı (${A.motor}) çalıştırsın. BEKLİYOR lambası (${A.lamp}) bandın TERSİNİ göstersin: bant dururken yansın, çalışınca sönsün. Bunun için NOT elemanını dene.`,
      `The switch (${A.sw}) runs the belt (${A.motor}). The IDLE lamp (${A.lamp}) shows the OPPOSITE: on while the belt is stopped, off while it runs. Try the NOT element.`),
    hint:tx(`Satır 2: ${A.motor} · NOT → ${A.lamp}. NOT kendinden önceki enerjiyi tersler.`,`Rung 2: ${A.motor} · NOT → ${A.lamp}. NOT inverts the power flow before it.`),
    io,M:0,T:0,C:0,pal:palOf(sol,['P']),scene:sc,goals:[{k:'nOn',l:T2('Dururken yanık','On when stopped')},{k:'nOff',l:T2('Çalışırken sönük','Off when running')}],sol,bot:at([[1.2,A.sw]])};
};
const togStop=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['tog','sen'],['motor']); const sp=spd(r,k), sx=ri(r,70,88);
  const sol={rungs:[R(['NO '+A.tog,'P',null,null,'COIL M0.0']),R(['NO M0.0','NC M0.1',null,null,'COIL M0.1'],['NC M0.0','NO M0.1']),R(['NO M0.1','NC '+A.sen,null,null,'COIL '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:4,sensors:[{a:A.sen,x:sx}],endMsg:tx('Hata: Kutu sensörde durmadı!','Error: Box did not stop at the sensor!'),rules:[togRule(A.tog,(w,on)=>on&&!w.sensorOn(A.sen),A.sen)]};
  const per=0.5+Math.max(1.6,Math.min(2.6,(sx-14)/sp*0.6));
  return {title:tx('Aç/Kapa + Sensör Durdurma','On/Off + Sensor Stop'),
    task:tx(`AÇ/KAPA (${A.tog}) her basışta hat durumunu (M0.1) değiştirsin. Hat açıkken bant (${A.motor}) çalışsın ama kutu sensöre (${A.sen}) gelince dursun. 4 kez bas.`,
      `Each press of ON/OFF (${A.tog}) flips the line state (M0.1). While the line is on, the belt (${A.motor}) runs but stops when a box reaches the sensor (${A.sen}). Press 4 times.`),
    hint:tx(`${A.tog} · P → M0.0 · (M0.0 · KAPALI M0.1) ∥ (KAPALI M0.0 · M0.1) → M0.1 · M0.1 · KAPALI ${A.sen} → ${A.motor}.`,`${A.tog} · P → M0.0 · (M0.0 · NC M0.1) ∥ (NC M0.0 · M0.1) → M0.1 · M0.1 · NC ${A.sen} → ${A.motor}.`),
    io,M:2,T:0,C:0,pal:palOf(sol,['N']),scene:sc,goals:[{k:'cnt',f:'tog',n:4,l:T2('Aç/Kapa','On/Off')}],sol,bot:at([[0.5,A.tog],[0.5+per,A.tog],[0.5+2*per,A.tog],[0.5+3*per,A.tog]])};
};
const hTogBlink=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['tog'],['motor','lamp'],{lamp:'ÇALIŞIYOR'}); const sp=spd(r,k);
  const sol={rungs:[R(['NO '+A.tog,'P',null,null,'COIL M0.0']),R(['NO M0.0','NC '+A.motor,null,null,'COIL '+A.motor],['NC M0.0','NO '+A.motor]),R(['NO '+A.motor,'NO SM0.5',null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:12,endDrop:'deliver',lamps:[{a:A.lamp,c:'green',n:'ÇALIŞIYOR'}],
    rules:[togRule(A.tog,(w,on)=>on),(w,q,iv,dt,s)=>{ const on=!!q[A.lamp];
      if(on&&!w.motor) return tx('Hata: Lamba yalnızca bant çalışırken yanıp sönmeli!','Error: The lamp must blink only while the belt runs!');
      if(w.motor&&on!==s.p){ s.k=(s.k||0)+1; if(s.k>=5) w.f.blink=true; } s.p=on; }]};
  return {title:tx('Aç/Kapa + Yanıp Sönen Lamba','On/Off + Blinking Lamp'),
    task:tx(`AÇ/KAPA (${A.tog}) her basışta bandı (${A.motor}) açıp kapatsın (P). Bant çalışırken ÇALIŞIYOR lambası (${A.lamp}) SM0.5 ile yanıp sönsün. 4 kez bas.`,`Each press of ON/OFF (${A.tog}) flips the belt (${A.motor}) (P). While the belt runs the RUNNING lamp (${A.lamp}) blinks with SM0.5. Press 4 times.`),
    hint:tx(`Aç/kapa devresi (P + çapraz paralel kol) · ${A.motor} · SM0.5 → ${A.lamp}.`,`Toggle circuit (P + crossed parallel branch) · ${A.motor} · SM0.5 → ${A.lamp}.`),
    io,M:1,T:0,C:0,SM:true,pal:palOf(sol,['N','NOT']),scene:sc,goals:[{k:'cnt',f:'tog',n:4,l:T2('Aç/Kapa','On/Off')},{k:'blink',l:T2('Yanıp sönme','Blinking')}],sol,bot:at([[0.5,A.tog],[4,A.tog],[5.5,A.tog],[8,A.tog]])};
};

/* ===================== TAŞIMA & MATEMATİK ===================== */
const speedMov=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','slow','fast'],['motor']); const s1=pick(r,[10,12,15]), s2=pick(r,[30,35,40]);
  const sol={rungs:[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.slow,null,null,null,'MOV VW0 '+s1]),R(['NO '+A.fast,null,null,null,'MOV VW0 '+s2])]};
  const sc={motor:A.motor,speed:s1,speedW:'VW0',gap:1.1,boxes:14,endDrop:'deliver',
    rules:[(w,q,iv,dt,s)=>{ if(w.motor&&w.spd!==s1&&w.spd!==s2){ s.b=(s.b||0)+dt; if(s.b>1.2) return tx(`Hata: Bant hızı VW0 ile ayarlanmalı: YAVAŞ = ${s1}, HIZLI = ${s2}.`,`Error: Set the belt speed through VW0: SLOW = ${s1}, FAST = ${s2}.`); } else s.b=0; },
      timeIf('slow',(w)=>w.motor&&w.spd===s1,2),timeIf('fast',(w)=>w.motor&&w.spd===s2,2)]};
  return {title:tx('Hız Seçici (MOV)','Speed Selector (MOV)'),
    task:tx(`Bant hızı VW0 değişkeninden okunuyor. YAVAŞ (${A.slow}) VW0'a ${s1}, HIZLI (${A.fast}) VW0'a ${s2} yazsın (MOV). Şalter (${A.sw}) bandı çalıştırsın. Önce yavaş, sonra hızlı çalıştır.`,
      `The belt speed is read from variable VW0. SLOW (${A.slow}) writes ${s1} to VW0, FAST (${A.fast}) writes ${s2} (MOV). The switch (${A.sw}) runs the belt. Run it slow first, then fast.`),
    hint:tx(`${A.slow} → MOV VW0 ← ${s1} · ${A.fast} → MOV VW0 ← ${s2} · ${A.sw} → ${A.motor}.`,`${A.slow} → MOV VW0 ← ${s1} · ${A.fast} → MOV VW0 ← ${s2} · ${A.sw} → ${A.motor}.`),
    io,M:0,T:0,C:0,words:['VW0'],wt:{VW0:'HIZ'},pal:palOf(sol,['ADD']),scene:sc,goals:[{k:'slow',l:T2('Yavaş çalış','Run slow')},{k:'fast',l:T2('Hızlı çalış','Run fast')}],sol,bot:at([[0.3,A.slow],[0.7,A.sw],[3.6,A.fast]])};
};
const incCount=add=>(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'TAMAM'}); const sp=spd(r,k), sx=ri(r,30,60), N=ri(r,3,5), K=add?pick(r,[3,4,5,6]):1, TT=N*K;
  const op=add?'ADD VW0 '+K:'INC VW0';
  const sol={rungs:[R(['NO '+A.sen,'P',null,null,op]),R(['NO '+A.sw,'CMP VW0 < '+TT,null,null,'COIL '+A.motor]),R(['CMP VW0 >= '+TT,null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:N+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,batchN:N,lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'TAMAM'}],
    rules:[earlyLamp(A.lamp,N,tx('Hata: Çok hızlı saydı! P kenarı olmadan ADD/INC her taramada (20 ms) tekrar çalışır.','Error: It counted too fast! Without a P edge ADD/INC runs again on every scan (20 ms).'))]};
  return {title:add?tx(`Parça Toplamı (ADD +${K})`,`Part Total (ADD +${K})`):tx('Sayıcısız Sayma (INC)','Counting without a Counter (INC)'),
    task:add?tx(`Her kutuda ${K} parça var. Kutu sensöre (${A.sen}) her GİRDİĞİNDE VW0'a ${K} ekle (ADD, P kenarıyla). Toplam ${TT} parçaya ulaşınca bant (${A.motor}) dursun, TAMAM lambası (${A.lamp}) yansın.`,`Each box holds ${K} parts. Every time a box ENTERS the sensor (${A.sen}) add ${K} to VW0 (ADD, with a P edge). When the total reaches ${TT} parts the belt (${A.motor}) stops and the DONE lamp (${A.lamp}) lights.`)
      :tx(`Sayıcı kullanmadan say: kutu sensöre (${A.sen}) her girdiğinde VW0 bir artsın (INC). Dikkat: INC enerji geldiği HER TARAMADA çalışır, önüne P koy. VW0 = ${N} olunca bant (${A.motor}) dursun, TAMAM lambası (${A.lamp}) yansın.`,`Count without a counter: every time a box enters the sensor (${A.sen}) VW0 goes up by one (INC). Careful: INC runs on EVERY SCAN while powered, so put a P before it. At VW0 = ${N} the belt (${A.motor}) stops and the DONE lamp (${A.lamp}) lights.`),
    hint:tx(`${A.sen} · P → ${add?'ADD VW0 +'+K:'INC VW0'} · ${A.sw} · CMP VW0 < ${TT} → ${A.motor} · CMP VW0 ≥ ${TT} → ${A.lamp}.`,`${A.sen} · P → ${add?'ADD VW0 +'+K:'INC VW0'} · ${A.sw} · CMP VW0 < ${TT} → ${A.motor} · CMP VW0 ≥ ${TT} → ${A.lamp}.`),
    io,M:0,T:0,C:0,words:['VW0'],wt:{VW0:add?'PARÇA':'SAYI'},pal:palOf(sol,add?['SUB','MUL']:['DEC']),scene:sc,goals:[{k:'batch',n:1}],sol,bot:at([[0.5,A.sw]])};
};
const stockDec=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'STOK_BİTTİ'}); const sp=spd(r,k), sx=ri(r,30,60), S0=ri(r,3,6);
  const sol={rungs:[R(['NO SM0.1',null,null,null,'MOV VW0 '+S0]),R(['NO '+A.sen,'P',null,null,'DEC VW0']),R(['NO '+A.sw,'CMP VW0 > 0',null,null,'COIL '+A.motor]),R(['CMP VW0 <= 0',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:S0+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,batchN:S0,lampA:A.lamp,lamps:[{a:A.lamp,c:'red',n:'STOK_BİTTİ'}],
    rules:[earlyLamp(A.lamp,S0,tx('Hata: Stok erken bitti! İlk taramada (SM0.1) VW0\'a başlangıç stoğunu yaz, DEC için P kullan.','Error: Stock ran out early! Write the starting stock to VW0 on the first scan (SM0.1) and use P for DEC.'))]};
  return {title:tx(`Stok Takibi (DEC, ${S0} adet)`,`Stock Tracking (DEC, ${S0} units)`),
    task:tx(`Depoda ${S0} kutuluk yer var. İlk taramada (SM0.1) VW0'a ${S0} yaz (MOV). Sensörden (${A.sen}) her kutu geçince VW0 bir azalsın (DEC + P). VW0 > 0 iken şalter (${A.sw}) bandı çalıştırsın; 0 olunca bant dursun ve STOK_BİTTİ (${A.lamp}) yansın.`,
      `The store has room for ${S0} boxes. On the first scan (SM0.1) write ${S0} to VW0 (MOV). Each box passing the sensor (${A.sen}) decreases VW0 by one (DEC + P). While VW0 > 0 the switch (${A.sw}) runs the belt; at 0 the belt stops and NO_STOCK (${A.lamp}) lights.`),
    hint:tx(`SM0.1 → MOV VW0 ← ${S0} · ${A.sen} · P → DEC VW0 · ${A.sw} · CMP VW0 > 0 → ${A.motor} · CMP VW0 ≤ 0 → ${A.lamp}.`,`SM0.1 → MOV VW0 ← ${S0} · ${A.sen} · P → DEC VW0 · ${A.sw} · CMP VW0 > 0 → ${A.motor} · CMP VW0 ≤ 0 → ${A.lamp}.`),
    io,M:0,T:0,C:0,SM:true,words:['VW0'],wt:{VW0:'STOK'},pal:palOf(sol,['INC','SUB']),scene:sc,goals:[{k:'batch',n:1}],sol,bot:at([[0.5,A.sw]])};
};
const scalePct=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw'],['pump','lamp'],{lamp:'DOLU'}); const X=pick(r,[70,75,80]);
  const sol={rungs:[R(['NO SM0.0',null,null,null,'MOV VW0 AIW0']),R(['NO SM0.0',null,null,null,'DIV VW0 320']),R(['NO '+A.sw,null,null,null,'COIL '+A.pump]),R(['CMP VW0 >= '+X,null,null,null,'COIL '+A.lamp])]};
  const sc={noBelt:true,boxes:0,proc:proc('tank',A.pump,{v0:0.3,up:0.1,down:0.025}),lamps:[{a:A.lamp,c:'green',n:'DOLU'}],
    rules:[follow((w,q,iv)=>Math.trunc(iv.AIW0/320)>=X,(w,q)=>q[A.lamp],tx(`Hata: DOLU lambası seviye %${X} ve üstündeyken yanmalı! (VW0 = AIW0 ÷ 320 = yüzde)`,`Error: The FULL lamp must be on at ${X}% and above! (VW0 = AIW0 ÷ 320 = percent)`)),
      timeIf('pOn',(w,q)=>q[A.lamp],0.6),timeIf('pOff',(w,q)=>!q[A.lamp],1)]};
  return {title:tx(`Yüzdeye Çevir (÷320, %${X})`,`Convert to Percent (÷320, ${X}%)`),
    task:tx(`AIW0 ham değer verir (0–32000). Her taramada (SM0.0) VW0'a AIW0'ı taşı (MOV), sonra 320'ye böl (DIV) — VW0 artık yüzde (0–100). Şalter (${A.sw}) pompayı (${A.pump}) çalıştırsın. VW0 ≥ ${X} olunca DOLU lambası (${A.lamp}) yansın.`,
      `AIW0 gives a raw value (0–32000). On every scan (SM0.0) move AIW0 into VW0 (MOV), then divide by 320 (DIV) — VW0 is now a percentage (0–100). The switch (${A.sw}) runs the pump (${A.pump}). At VW0 ≥ ${X} the FULL lamp (${A.lamp}) lights.`),
    hint:tx(`SM0.0 → MOV VW0 ← AIW0 · SM0.0 → DIV VW0 ÷ 320 · ${A.sw} → ${A.pump} · CMP VW0 ≥ ${X} → ${A.lamp}. MOV'da kaynak olarak AIW0'ı seç.`,`SM0.0 → MOV VW0 ← AIW0 · SM0.0 → DIV VW0 ÷ 320 · ${A.sw} → ${A.pump} · CMP VW0 ≥ ${X} → ${A.lamp}. Pick AIW0 as the MOV source.`),
    io,M:0,T:0,C:0,SM:true,words:['VW0','AIW0'],wt:{VW0:'YÜZDE',AIW0:'SEVİYE'},pal:palOf(sol,['MUL','ADD']),scene:sc,goals:[{k:'pOff',l:T2(`%${X} altı sönük`,`Off below ${X}%`)},{k:'pOn',l:T2(`%${X} üstü yanık`,`On at ${X}%+`)}],sol,
    bot:once((w,P,t,st)=>{ if(!st.a&&t>0.5){ st.a=1; P(A.sw); } if(st.a===1&&w.pv>X/100+0.07){ st.a=2; P(A.sw); } })};
};
const speedRamp=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'TAMAM'}); const sx=ri(r,30,55), v0=10, st=5, N=ri(r,3,4), vm=v0+st*N;
  const sol={rungs:[R(['NO SM0.1',null,null,null,'MOV VW0 '+v0]),R(['NO '+A.sen,'P',null,null,'ADD VW0 '+st]),R(['NO '+A.sw,'CMP VW0 < '+vm,null,null,'COIL '+A.motor]),R(['CMP VW0 >= '+vm,null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:v0,speedW:'VW0',gap:1.3,boxes:N+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,batchN:N,lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'TAMAM'}],
    rules:[(w,q,iv,dt,s)=>{ if(w.motor&&w.spd!==v0+st*(w.cntRises||0)){ s.b=(s.b||0)+dt; if(s.b>0.4) return tx(`Hata: Hız ${v0}'dan başlamalı ve her kutuda ${st} artmalı!`,`Error: Speed must start at ${v0} and rise by ${st} per box!`); } else s.b=0; },
      earlyLamp(A.lamp,N,tx('Hata: Lamba erken yandı!','Error: The lamp lit too early!'))]};
  return {title:tx('Hızlanan Hat','Accelerating Line'),
    task:tx(`Bant hızı VW0'dan okunuyor. İlk taramada (SM0.1) hızı ${v0} yap. Sensöre (${A.sen}) her kutu girişinde hızı ${st} artır (ADD + P). Hız ${vm}'e ulaşınca bant dursun ve TAMAM lambası (${A.lamp}) yansın. Şalter (${A.sw}) hattı açar.`,
      `The belt speed is read from VW0. On the first scan (SM0.1) set it to ${v0}. Each time a box enters the sensor (${A.sen}) add ${st} (ADD + P). When the speed reaches ${vm} the belt stops and the DONE lamp (${A.lamp}) lights. The switch (${A.sw}) enables the line.`),
    hint:tx(`SM0.1 → MOV VW0 ← ${v0} · ${A.sen} · P → ADD VW0 +${st} · ${A.sw} · CMP VW0 < ${vm} → ${A.motor} · CMP VW0 ≥ ${vm} → ${A.lamp}.`,`SM0.1 → MOV VW0 ← ${v0} · ${A.sen} · P → ADD VW0 +${st} · ${A.sw} · CMP VW0 < ${vm} → ${A.motor} · CMP VW0 ≥ ${vm} → ${A.lamp}.`),
    io,M:0,T:0,C:0,SM:true,words:['VW0'],wt:{VW0:'HIZ'},pal:palOf(sol,['SUB','INC']),scene:sc,goals:[{k:'batch',n:1}],sol,bot:at([[0.5,A.sw]])};
};
const tonrMaint=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['motor','lamp'],{lamp:'BAKIM'}); const sp=spd(r,k), X=pick(r,[4,4.5,5,5.5]);
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,null,null,'COIL '+A.motor],['NO '+A.motor]),R(['NO '+A.motor,null,null,null,'TONR T1 '+X]),R(['NO T1',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:20,endDrop:'deliver',startA:A.start,stopA:A.stop,startFirst:true,lamps:[{a:A.lamp,c:'amber',n:'BAKIM'}],
    rules:[(w,q,iv,dt,s)=>{ if(w.motor) s.c=(s.c||0)+dt; const c=s.c||0;
      if(q[A.lamp]&&c<X-0.2) return tx(`Hata: BAKIM lambası toplam ${fx(X)} sn çalışmadan yandı!`,`Error: The SERVICE lamp lit before ${X} s of total run time!`);
      if(q[A.lamp]) w.f.maint=true;
      if(!q[A.lamp]&&c>X+0.6) return tx(`Hata: Toplam çalışma ${fx(X)} sn'yi geçti ama lamba yanmadı! TON durunca sıfırlanır; TONR toplamı saklar.`,`Error: Total run time passed ${X} s but the lamp is off! TON resets when stopped; TONR keeps the total.`); }]};
  return {title:tx(`Bakım Sayacı (TONR ${fx(X)} sn)`,`Service Timer (TONR ${X} s)`),
    task:tx(`Mühürlü START (${A.start}) / STOP (${A.stop}) ile bant çalışsın. Bant arada dursa bile TOPLAM ${fx(X)} sn çalışınca BAKIM lambası (${A.lamp}) yansın. Kalıcı zamanlayıcı TONR durunca süreyi unutmaz.`,
      `A sealed START (${A.start}) / STOP (${A.stop}) runs the belt. Even with stops in between, after a TOTAL of ${X} s of running the SERVICE lamp (${A.lamp}) lights. The retentive timer TONR keeps its time when stopped.`),
    hint:tx(`Mühür · ${A.motor} → TONR T1 (${fx(X)} sn) · T1 → ${A.lamp}.`,`Seal-in · ${A.motor} → TONR T1 (${X} s) · T1 → ${A.lamp}.`),
    io,M:0,T:1,C:0,pal:palOf(sol,['TON','TOF']),scene:sc,goals:[{k:'seal'},{k:'maint',l:T2('Bakım lambası','Service lamp')}],sol,bot:at([[0.5,A.start],[3,A.stop],[4,A.start],[6.5,A.stop],[7.5,A.start]])};
};

/* ===================== DÖNÜŞTÜRME (SEG) ===================== */
const segRule=(exp,n)=>(w,q,iv,dt,s)=>{ if(w.t<0.06) return; const v=exp(w), want=SEGT[v&15], got=qb(q,'Q1.')&127;
  if(got!==want){ s.b=(s.b||0)+dt; if(s.b>0.2) return tx(`Hata: Gösterge ${v} göstermeli! SEG, sayıyı 7-segment desenine çevirir.`,`Error: The display must show ${v}! SEG turns a number into a 7-segment pattern.`); }
  else { s.b=0; if(!s.seen) s.seen={}; if(!s.seen[v]){ s.seen[v]=1; w.cnt.shown=Object.keys(s.seen).length-1; } } };
const segCount=inc=>(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor']); const sp=spd(r,k), sx=ri(r,30,55), N=ri(r,4,7);
  const rs=inc?[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.sen,'P',null,null,'INC VW0']),R(['NO SM0.0',null,null,null,'SEG QB1 VW0'])]
             :[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.sen,null,null,null,'CTU C1 20']),R(['NO SM0.0',null,null,null,'SEG QB1 C1'])];
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:N+1,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],seg:{pre:'Q1.'},rules:[rises(A.sen),segRule(w=>w.cnt.rises||0)]};
  return {title:inc?tx('Göstergeli Sayaç (INC + SEG)','Display Counter (INC + SEG)'):tx('7-Segment Gösterge (SEG)','7-Segment Display (SEG)'),
    task:tx(`Şalter (${A.sw}) bandı çalıştırsın. Sensörden (${A.sen}) geçen kutuları ${inc?'VW0\'da INC + P ile':'CTU C1 ile (PV 20)'} say. Sayıyı QB1'e bağlı 7-segment göstergede göster: her taramada (SM0.0) SEG ile ${inc?'VW0':'C1'} → QB1. ${N} kutu say.`,
      `The switch (${A.sw}) runs the belt. Count the boxes passing the sensor (${A.sen}) ${inc?'in VW0 with INC + P':'with CTU C1 (PV 20)'}. Show the count on the 7-segment display wired to QB1: on every scan (SM0.0) SEG ${inc?'VW0':'C1'} → QB1. Count ${N} boxes.`),
    hint:tx(`SM0.0 → SEG QB1 ← ${inc?'VW0':'C1'}. SEG, 0–9 arası sayıyı göstergenin a–g segmentlerine çevirir.`,`SM0.0 → SEG QB1 ← ${inc?'VW0':'C1'}. SEG turns a 0–9 number into the display's a–g segments.`),
    io,M:0,T:0,C:inc?0:1,SM:true,words:inc?['VW0','QB1']:['QB1'],wt:{QB1:'GÖSTERGE',VW0:'SAYI'},pal:palOf({rungs:rs},inc?['MOV']:['MOV']),scene:sc,goals:[{k:'cnt',f:'shown',n:N,l:T2('Gösterilen sayı','Numbers shown')}],sol:{rungs:rs},bot:at([[0.5,A.sw]])};
};
const segDown=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor']); const sp=spd(r,k), sx=ri(r,30,55), N=ri(r,4,7);
  const rs=[R(['NO '+A.sen,null,null,null,'CTD C1 '+N]),R(['NO '+A.sw,'NC C1',null,null,'COIL '+A.motor]),R(['NO SM0.0',null,null,null,'SEG QB1 C1'])];
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:N+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],seg:{pre:'Q1.'},
    rules:[rises(A.sen),segRule(w=>Math.max(0,N-(w.cnt.rises||0))),(w)=>{ if(w.motor&&(w.cnt.rises||0)>N) return tx('Hata: Bant 0\'da durmadı!','Error: The belt did not stop at 0!'); },
      timeIf('zero',(w)=>!w.motor&&(w.cnt.rises||0)>=N,1)]};
  return {title:tx(`Geri Sayım Göstergesi (${N})`,`Countdown Display (${N})`),
    task:tx(`Palete ${N} kutu sığar. CTD C1 ${N}'den geri saysın ve kalan sayı QB1 göstergesinde görünsün (SEG). Kalan 0 olunca bant (${A.motor}) dursun. Şalter (${A.sw}) hattı açar.`,
      `The pallet holds ${N} boxes. CTD C1 counts down from ${N} and the remaining number appears on the QB1 display (SEG). At 0 the belt (${A.motor}) stops. The switch (${A.sw}) enables the line.`),
    hint:tx(`${A.sen} → CTD C1 (${N}) · ${A.sw} · KAPALI C1 → ${A.motor} · SM0.0 → SEG QB1 ← C1.`,`${A.sen} → CTD C1 (${N}) · ${A.sw} · NC C1 → ${A.motor} · SM0.0 → SEG QB1 ← C1.`),
    io,M:0,T:0,C:1,SM:true,words:['QB1'],wt:{QB1:'GÖSTERGE'},pal:palOf({rungs:rs},['CTU']),scene:sc,goals:[{k:'cnt',f:'shown',n:N,l:T2('Gösterilen sayı','Numbers shown')},{k:'zero',l:T2('0\'da dur','Stop at 0')}],sol:{rungs:rs},bot:at([[0.5,A.sw]])};
};
const hSegBatch=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'PARTİ'}); const sp=spd(r,k), sx=ri(r,35,60), N=ri(r,3,5), t=pick(r,[1.5,2,2.5]);
  const rs=[R(['NO '+A.sen,null,null,null,'CTU C1 '+N]),R(['NO '+A.sw,'NC C1',null,null,'COIL '+A.motor]),R(['NO C1',null,null,null,'TON T1 '+t]),R(['NO T1',null,null,null,'RST C1']),R(['NO C1',null,null,null,'COIL '+A.lamp]),R(['NO SM0.0',null,null,null,'SEG QB1 C1'])];
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:2*N+2,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,batchN:N,restartAfter:t,lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'PARTİ'}],seg:{pre:'Q1.'},
    rules:[rises(A.sen),(w,q,iv,dt,s)=>{ if(!w.motor&&s.pm) s.st=true; if(w.motor&&!s.pm&&s.st){ w.cnt.base=(w.cnt.base||0)+N; s.st=false; } s.pm=w.motor; },segRule(w=>(w.cnt.rises||0)-(w.cnt.base||0))]};
  return {title:tx('Göstergeli Parti Hattı','Batch Line with Display'),
    task:tx(`Şalter (${A.sw}) açık. ${N} kutu sayılınca (CTU C1) bant dursun, PARTİ lambası (${A.lamp}) yansın; ${fx(t)} sn sonra sayıcı sıfırlansın ve bant yeniden kalksın. Sayaç değeri her an QB1 göstergesinde görünsün (SEG). 2 parti.`,
      `Switch (${A.sw}) ON. After ${N} boxes (CTU C1) the belt stops and the BATCH lamp (${A.lamp}) lights; ${t} s later the counter resets and the belt restarts. The count is always shown on the QB1 display (SEG). 2 batches.`),
    hint:tx(`${A.sen}→CTU C1 (${N}) · ${A.sw}·KAPALI C1→${A.motor} · C1→TON T1 (${fx(t)}) · T1→(R) C1 · C1→${A.lamp} · SM0.0→SEG QB1 ← C1.`,`${A.sen}→CTU C1 (${N}) · ${A.sw}·NC C1→${A.motor} · C1→TON T1 (${t}) · T1→(R) C1 · C1→${A.lamp} · SM0.0→SEG QB1 ← C1.`),
    io,M:0,T:1,C:1,SM:true,words:['QB1'],wt:{QB1:'GÖSTERGE'},pal:palOf({rungs:rs}),scene:sc,goals:[{k:'batch',n:2},{k:'restart'}],sol:{rungs:rs},bot:at([[0.5,A.sw]])};
};

/* ===================== KAYDIRMA (SHL / SHR) ===================== */
const chaseRule=(dir,tt,loop)=>(w,q,iv,dt,s)=>{ const v=qb(q,'Q0.')&15;
  if(v&&(v&(v-1))) return tx('Hata: Aynı anda yalnızca BİR lamba yanmalı!','Error: Only ONE lamp may be on at a time!');
  if(v&&v!==s.v){ const nx=dir>0?(s.v<<1)&15||(loop?1:0):(s.v>>1)||(loop?8:0);
    if(s.v&&v===nx){ const d=w.t-s.ts, mx=tt+0.3; if(s.k>=1&&(d<tt-0.15||d>mx)) return tx(`Hata: Işık her ${fx(tt)} sn'de bir adım kaymalı!`,`Error: The light must move one step every ${tt} s!`); s.k=(s.k||0)+1; w.cnt.step=s.k; }
    else if(s.v) return tx('Hata: Işık sırayla kaymalı!','Error: The light must move in order!');
    else s.k=s.k||0;
    s.v=v; s.ts=w.t; } };
const chase=(dir,loop)=>(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start'],['l0','l1','l2','l3']); const tt=pick(r,[0.5,1]), st=dir>0?1:8, op=dir>0?'SHL':'SHR';
  const rs=[R(['NO '+A.start,null,null,null,'MOV QB0 '+st]),R(['NC T1',null,null,null,'TON T1 '+tt]),R(['NO T1',null,null,null,op+' QB0 1'])];
  if(loop) rs.push(R([dir>0?'CMP QB0 >= 16':'CMP QB0 == 0',null,null,null,'MOV QB0 '+st]));
  const N=loop?7:3;
  const sc={noBelt:true,boxes:0,row:{pre:'Q0.',n:4},rules:[chaseRule(dir,tt,loop)]};
  if(loop) sc.rules.unshift((w,q,iv,dt,s)=>{ if(iv[A.start]) s.st=1; if(s.st&&w.t>1.2&&!(qb(q,'Q0.')&15)){ s.z=(s.z||0)+dt; if(s.z>0.25) return tx('Hata: Işık sona gelince başa dönmeli!','Error: When the light reaches the end it must wrap around!'); } else s.z=0; });
  return {title:loop?tx('Sonsuz Yürüyen Işık','Endless Running Light'):dir>0?tx(`Yürüyen Işık (SHL, ${fx(tt)} sn)`,`Running Light (SHL, ${tt} s)`):tx(`Ters Yürüyen Işık (SHR)`,`Reverse Running Light (SHR)`),
    task:loop?tx(`START (${A.start}) QB0'a ${st} yazsın. Her ${fx(tt)} sn'de ışık bir lamba ${dir>0?'sola (SHL)':'sağa (SHR)'} kaysın. Işık son lambadan çıkınca (QB0 ${dir>0?'≥ 16':'= 0'}) tekrar ${st} yaz ki sonsuza dek dönsün. 7 adım.`,`START (${A.start}) writes ${st} to QB0. Every ${tt} s the light moves one lamp ${dir>0?'left (SHL)':'right (SHR)'}. When it leaves the last lamp (QB0 ${dir>0?'≥ 16':'= 0'}) write ${st} again so it loops forever. 7 steps.`)
      :tx(`4 lamba QB0'a bağlı (Q0.0–Q0.3). START (${A.start}) QB0'a ${st} yazsın (MOV) — ${dir>0?'ilk':'son'} lamba yanar. T1 ile her ${fx(tt)} sn'de bir darbe üret ve QB0'ı 1 bit ${dir>0?'sola (SHL)':'sağa (SHR)'} kaydır.`,`4 lamps are wired to QB0 (Q0.0–Q0.3). START (${A.start}) writes ${st} to QB0 (MOV) — the ${dir>0?'first':'last'} lamp lights. Make a pulse every ${tt} s with T1 and shift QB0 by 1 bit ${dir>0?'left (SHL)':'right (SHR)'}.`),
    hint:tx(`${A.start} → MOV QB0 ← ${st} · KAPALI T1 → TON T1 (${fx(tt)} sn) — kendini sıfırlayan darbe · T1 → ${op} QB0 1`+(loop?` · CMP QB0 ${dir>0?'≥ 16':'= 0'} → MOV QB0 ← ${st}`:'')+'.',`${A.start} → MOV QB0 ← ${st} · NC T1 → TON T1 (${tt} s) — a self-resetting pulse · T1 → ${op} QB0 1`+(loop?` · CMP QB0 ${dir>0?'≥ 16':'= 0'} → MOV QB0 ← ${st}`:'')+'.'),
    io,M:0,T:1,C:0,words:['QB0'],wt:{QB0:'LAMBALAR'},pal:palOf({rungs:rs},dir>0?['SHR']:['SHL']),scene:sc,goals:[{k:'cnt',f:'step',n:N,l:T2('Adım','Step')}],sol:{rungs:rs},bot:at([[0.5,A.start]])};
};
const chaseSM=(r,k,n)=>{
  const {io}=mkCtx(r,n,[],['l0','l1','l2','l3']);
  const rs=[R(['NO SM0.1',null,null,null,'MOV QB0 1']),R(['NO SM0.5','P',null,null,'SHL QB0 1']),R(['CMP QB0 >= 16',null,null,null,'MOV QB0 1'])];
  const sc={noBelt:true,boxes:0,row:{pre:'Q0.',n:4},rules:[chaseRule(1,1,true),(w,q,iv,dt,s)=>{ if(!(qb(q,'Q0.')&15)&&w.t>0.06){ s.z=(s.z||0)+dt; if(s.z>0.5) return tx('Hata: Lambalardan biri hep yanmalı; ışık başa dönmeli!','Error: One lamp must always be on; the light must wrap around!'); } else s.z=0; }]};
  return {title:tx('Butonsuz Işık Zinciri','Button-free Light Chain'),
    task:tx('Hiç buton yok! İlk taramada (SM0.1) QB0\'a 1 yaz. SM0.5 saat bitinin her yükselen kenarında (1 sn\'de bir) ışığı sola kaydır (SHL). Işık Q0.3\'ten çıkınca (QB0 ≥ 16) yine 1 yaz. 6 adım.',
      'No buttons! On the first scan (SM0.1) write 1 to QB0. On every rising edge of clock bit SM0.5 (once per second) shift the light left (SHL). When it leaves Q0.3 (QB0 ≥ 16) write 1 again. 6 steps.'),
    hint:tx('SM0.1 → MOV QB0 ← 1 · SM0.5 · P → SHL QB0 1 · CMP QB0 ≥ 16 → MOV QB0 ← 1.','SM0.1 → MOV QB0 ← 1 · SM0.5 · P → SHL QB0 1 · CMP QB0 ≥ 16 → MOV QB0 ← 1.'),
    io,M:0,T:0,C:0,SM:true,words:['QB0'],wt:{QB0:'LAMBALAR'},pal:palOf({rungs:rs},['SHR','N']),scene:sc,goals:[{k:'cnt',f:'step',n:6,l:T2('Adım','Step')}],sol:{rungs:rs},bot:()=>()=>{}};
};

/* ===================== MANTIK İŞLEMLERİ (byte) ===================== */
const mirror=inv=>(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['s1','s2','s3','s4'],['l0','l1','l2','l3']);
  const rs=[R(['NO SM0.0',null,null,null,'MOV QB0 IB0'])]; if(inv) rs.push(R(['NO SM0.0',null,null,null,'INV QB0']));
  const exp=(w,q,iv)=>(inv?~qb(iv,'I0.'):qb(iv,'I0.'))&15;
  const sc={noBelt:true,boxes:0,row:{pre:'Q0.',n:4},
    rules:[(w,q,iv,dt,s)=>{ if(w.t<0.06) return; const e=exp(w,q,iv), g=qb(q,'Q0.')&15; if(e!==g){ s.b=(s.b||0)+dt; if(s.b>0.2) return inv?tx('Hata: Her lamba kendi anahtarının TERSİNİ göstermeli (INV)!','Error: Each lamp must show the OPPOSITE of its key (INV)!'):tx('Hata: Lambalar anahtarları birebir göstermeli: QB0 = IB0!','Error: The lamps must mirror the keys exactly: QB0 = IB0!'); } else { s.b=0; const ib=qb(iv,'I0.'); if(ib!==s.ib){ if(s.ib!=null) w.cnt.chg=(w.cnt.chg||0)+1; s.ib=ib; } } }]};
  return {title:inv?tx('Ters Pano (MOV + INV)','Inverted Panel (MOV + INV)'):tx('Ayna Pano (MOV QB0 ← IB0)','Mirror Panel (MOV QB0 ← IB0)'),
    task:inv?tx('4 anahtar (I0.0–I0.3 = IB0) ve 4 lamba (Q0.0–Q0.3 = QB0) var. Her lamba kendi anahtarının TERSİNİ göstersin: önce IB0\'ı QB0\'a taşı, sonra QB0\'ı tersle (INV). Anahtarları değiştir.','There are 4 keys (I0.0–I0.3 = IB0) and 4 lamps (Q0.0–Q0.3 = QB0). Each lamp shows the OPPOSITE of its key: move IB0 to QB0, then invert QB0 (INV). Flip the keys.')
      :tx('4 anahtar (I0.0–I0.3) birlikte IB0 baytını, 4 lamba (Q0.0–Q0.3) QB0 baytını oluşturur. Tek bir MOV ile tüm anahtarları lambalara kopyala: her taramada (SM0.0) QB0 ← IB0. Anahtarları değiştir.','4 keys (I0.0–I0.3) form byte IB0 and 4 lamps (Q0.0–Q0.3) form byte QB0. Copy all keys to the lamps with a single MOV: on every scan (SM0.0) QB0 ← IB0. Flip the keys.'),
    hint:tx('SM0.0 → MOV QB0 ← IB0'+(inv?' · SM0.0 → INV QB0':'')+'. Tek komut 8 biti birden taşır.','SM0.0 → MOV QB0 ← IB0'+(inv?' · SM0.0 → INV QB0':'')+'. One instruction moves all 8 bits at once.'),
    io,M:0,T:0,C:0,SM:true,words:['QB0','IB0'],wt:{QB0:'LAMBALAR',IB0:'ANAHTARLAR'},pal:palOf({rungs:rs},inv?['WAND']:['INV']),scene:sc,goals:[{k:'cnt',f:'chg',n:4,l:T2('Değişim','Change')}],sol:{rungs:rs},
    bot:at([[0.5,A.s1],[1.2,A.s3],[1.9,A.s1],[2.6,A.s4],[3.3,A.s2]])};
};
const worWand=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['on','off'],['l0','l1','l2','l3']); const init=10, om=5, am=254;
  const rs=[R(['NO SM0.1',null,null,null,'MOV QB0 '+init]),R(['NO '+A.on,null,null,null,'WOR QB0 '+om]),R(['NO '+A.off,null,null,null,'WAND QB0 '+am])];
  const sc={noBelt:true,boxes:0,row:{pre:'Q0.',n:4},
    rules:[(w,q,iv,dt,s)=>{ if(s.e==null) s.e=init; if(iv[A.on]&&!s.po){ s.e|=om; s.c='or'; s.tp=w.t; } if(iv[A.off]&&!s.pf){ s.e&=am; s.c='and'; s.tp=w.t; } s.po=!!iv[A.on]; s.pf=!!iv[A.off];
      if(w.t<0.06) return; const g=qb(q,'Q0.')&15;
      if(g!==(s.e&15)){ s.b=(s.b||0)+dt; if(s.b>0.2) return tx('Hata: Lambalar beklenen deseni göstermiyor! WOR yalnızca maskedeki bitleri yakar, WAND maskede 0 olan bitleri söndürür.','Error: The lamps do not show the expected pattern! WOR sets only the mask bits, WAND clears the bits that are 0 in the mask.'); }
      else { s.b=0; if(s.c&&w.t-s.tp>0.3){ w.f[s.c]=true; s.c=null; } } }]};
  return {title:tx('Maske ile Yak / Söndür (WOR, WAND)','Set / Clear with a Mask (WOR, WAND)'),
    task:tx(`Başlangıçta (SM0.1) QB0 = ${init} (2. ve 4. lamba yanık). YAK (${A.on}) yalnızca 1. ve 3. lambayı da yaksın, diğerlerine dokunmasın (WOR maske 0101). SÖNDÜR (${A.off}) yalnızca 1. lambayı söndürsün (WAND maske 1111 1110).`,
      `At start (SM0.1) QB0 = ${init} (lamps 2 and 4 on). LIGHT (${A.on}) also turns on lamps 1 and 3 without touching the others (WOR mask 0101). CLEAR (${A.off}) turns off only lamp 1 (WAND mask 1111 1110).`),
    hint:tx(`SM0.1 → MOV QB0 ← ${init} · ${A.on} → WOR QB0 0101 · ${A.off} → WAND QB0 11111110. Maske bitlerini düzenleyicide tek tek aç/kapa.`,`SM0.1 → MOV QB0 ← ${init} · ${A.on} → WOR QB0 0101 · ${A.off} → WAND QB0 11111110. Toggle the mask bits one by one in the editor.`),
    io,M:0,T:0,C:0,SM:true,words:['QB0'],wt:{QB0:'LAMBALAR'},pal:palOf({rungs:rs},['INV']),scene:sc,goals:[{k:'or',l:T2('WOR ile yak','Set with WOR')},{k:'and',l:T2('WAND ile söndür','Clear with WAND')}],sol:{rungs:rs},bot:at([[0.8,A.on],[2,A.off],[3.2,A.on]])};
};
const maskSel=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['s1','s2','s3','s4'],['l0','l1','l2','l3']); const m=pick(r,[3,5,6,9,12]);
  const rs=[R(['NO SM0.0',null,null,null,'MOV QB0 IB0']),R(['NO SM0.0',null,null,null,'WAND QB0 '+m])];
  const bits=[0,1,2,3].filter(i=>m&(1<<i)).map(i=>i+1).join(tx(' ve ',' and '));
  const sc={noBelt:true,boxes:0,row:{pre:'Q0.',n:4},
    rules:[(w,q,iv,dt,s)=>{ if(w.t<0.06) return; const e=qb(iv,'I0.')&m, g=qb(q,'Q0.')&15; if(e!==g){ s.b=(s.b||0)+dt; if(s.b>0.2) return tx(`Hata: Yalnızca ${bits}. anahtar lambaya yansımalı, diğer lambalar hep sönük!`,`Error: Only key ${bits} may reach the lamps; the other lamps stay off!`); } else { s.b=0; const ib=qb(iv,'I0.'); if(ib!==s.ib){ if(s.ib!=null) w.cnt.chg=(w.cnt.chg||0)+1; s.ib=ib; } } }]};
  return {title:tx('Maskeli Pano (MOV + WAND)','Masked Panel (MOV + WAND)'),
    task:tx(`Anahtarları (IB0) lambalara (QB0) kopyala ama yalnızca ${bits}. anahtar geçsin; diğer lambalar hep sönük kalsın. WAND maskesinde geçecek bitleri 1 yap.`,`Copy the keys (IB0) to the lamps (QB0) but let only key ${bits} through; the other lamps stay off. Set the bits that should pass to 1 in the WAND mask.`),
    hint:tx(`SM0.0 → MOV QB0 ← IB0 · SM0.0 → WAND QB0 ${m.toString(2).padStart(4,'0')}.`,`SM0.0 → MOV QB0 ← IB0 · SM0.0 → WAND QB0 ${m.toString(2).padStart(4,'0')}.`),
    io,M:0,T:0,C:0,SM:true,words:['QB0','IB0'],wt:{QB0:'LAMBALAR',IB0:'ANAHTARLAR'},pal:palOf({rungs:rs},['WOR','INV']),scene:sc,goals:[{k:'cnt',f:'chg',n:4,l:T2('Değişim','Change')}],sol:{rungs:rs},
    bot:at([[0.5,A.s1],[1.2,A.s2],[1.9,A.s3],[2.6,A.s4],[3.3,A.s1]])};
};
const hPanelTest=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['s1','s2','s3','s4','test'],['l0','l1','l2','l3']);
  const rs=[R(['NO SM0.0',null,null,null,'MOV QB0 IB0']),R(['NO SM0.0',null,null,null,'WAND QB0 7']),R(['NO '+A.test,null,null,null,'WOR QB0 15'])];
  const sc={noBelt:true,boxes:0,row:{pre:'Q0.',n:4},
    rules:[(w,q,iv,dt,s)=>{ if(w.t<0.06) return; const e=iv[A.test]?15:qb(iv,'I0.')&7, g=qb(q,'Q0.')&15; if(e!==g){ s.b=(s.b||0)+dt; if(s.b>0.2) return tx('Hata: Normalde 1–3. lambalar anahtarları göstermeli, 4. lamba sönük (4. anahtar bakım anahtarıdır, lambaya yansımaz); TEST basılıyken TÜM lambalar yanmalı!','Error: Normally lamps 1–3 mirror keys 1–3 and lamp 4 is off (key 4 is a maintenance key and must not reach the lamps); while TEST is held ALL lamps light!'); } else { s.b=0; if(iv[A.test]) w.f.test=true; const ib=qb(iv,'I0.')&15; if(ib!==s.ib){ if(s.ib!=null) w.cnt.chg=(w.cnt.chg||0)+1; s.ib=ib; } } }]};
  return {title:tx('Lamba Test Panosu','Lamp Test Panel'),
    task:tx(`Anahtar 1–3 (I0.0–I0.2) 1–3. lambaları göstersin. Anahtar 4 (I0.3) bakım anahtarıdır, lambaya YANSIMASIN; 4. lamba normalde sönük. TEST butonuna (${A.test}) basılıyken bütün lambalar yansın.`,
      `Keys 1–3 (I0.0–I0.2) show lamps 1–3. Key 4 (I0.3) is a maintenance key and must NOT reach the lamps; lamp 4 is normally off. While TEST (${A.test}) is held, all lamps light.`),
    hint:tx('SM0.0 → MOV QB0 ← IB0 · SM0.0 → WAND QB0 0111 (yalnızca 3 bit geçsin) · TEST → WOR QB0 1111.','SM0.0 → MOV QB0 ← IB0 · SM0.0 → WAND QB0 0111 (let only 3 bits through) · TEST → WOR QB0 1111.'),
    io,M:0,T:0,C:0,SM:true,words:['QB0','IB0'],wt:{QB0:'LAMBALAR',IB0:'ANAHTARLAR'},pal:palOf({rungs:rs},['INV']),scene:sc,goals:[{k:'cnt',f:'chg',n:4,l:T2('Değişim','Change')},{k:'test',l:T2('Lamba testi','Lamp test')}],sol:{rungs:rs},
    bot:at([[0.5,A.s1],[1.2,A.s4],[1.9,A.s3],[2.6,A.test],[3.3,A.s2]])};
};

/* ===================== SAAT (READ_RTC) ===================== */
const clockRule=(fn,lampOrMotor,msg)=>(w,q,iv,dt,s)=>follow((w)=>fn(w.hour,w,iv),lampOrMotor,msg,0.25)(w,q,iv,dt,s);
const shiftLamp=night=>(r,k,n)=>{
  const {A,io}=mkCtx(r,n,[],['lamp'],{lamp:night?'GECE':'MESAİ'});
  const h1=night?pick(r,[19,20]):pick(r,[7,8,9]), h2=night?pick(r,[5,6]):pick(r,[16,17,18]);
  const inS=h=>night?(h>=h1||h<h2):(h>=h1&&h<h2);
  const rs=night?[R(['NO SM0.0',null,null,null,'RTC VW0']),R(['CMP VW0 >= '+h1,null,null,null,'COIL '+A.lamp],['CMP VW0 < '+h2])]
                :[R(['NO SM0.0',null,null,null,'RTC VW0']),R(['CMP VW0 >= '+h1,'CMP VW0 < '+h2,null,null,'COIL '+A.lamp])];
  const h0=night?h1-2:h1-2, rate=night?1/0.6:1/0.8;
  const sc={noBelt:true,boxes:0,clock:{h0,rate},lamps:[{a:A.lamp,c:night?'amber':'green',n:night?'GECE':'MESAİ'}],
    rules:[follow((w)=>inS(w.hour),(w,q)=>q[A.lamp],night?tx(`Hata: Gece lambası ${h1}:00 ile ${h2}:00 arasında yanmalı!`,`Error: The night lamp must be on from ${h1}:00 to ${h2}:00!`):tx(`Hata: MESAİ lambası ${h1}:00–${h2}:00 arasında yanmalı!`,`Error: The SHIFT lamp must be on from ${h1}:00 to ${h2}:00!`),0.3),
      timeIf('cOn',(w,q)=>q[A.lamp]&&inS(w.hour),1.2),(w,q)=>{ if(w.f.cOn&&!inS(w.hour)&&!q[A.lamp]) w.f.cOff=true; }]};
  return {title:night?tx('Gece Aydınlatması (RTC)','Night Lighting (RTC)'):tx(`Mesai Lambası ${h1}:00–${h2}:00`,`Shift Lamp ${h1}:00–${h2}:00`),
    task:night?tx(`Bahçe lambası (${A.lamp}) akşam ${h1}:00'dan sabah ${h2}:00'a kadar yansın. Saati PLC'nin iç saatinden READ_RTC ile VW0'a oku (her taramada). Gece yarısını geçtiği için iki karşılaştırmayı PARALEL (VEYA) bağla.`,`The garden lamp (${A.lamp}) is on from ${h1}:00 in the evening until ${h2}:00 in the morning. Read the hour from the PLC's clock into VW0 with READ_RTC (every scan). Because it crosses midnight, put two compares in PARALLEL (OR).`)
      :tx(`PLC'nin gerçek zaman saatini (RTC) her taramada VW0'a oku. Saat ${h1}:00 ile ${h2}:00 arasında MESAİ lambası (${A.lamp}) yansın. Oyunda saat hızlı akar.`,`Read the PLC's real-time clock (RTC) into VW0 on every scan. Between ${h1}:00 and ${h2}:00 the SHIFT lamp (${A.lamp}) is on. In the game the clock runs fast.`),
    hint:night?tx(`SM0.0 → RTC VW0 · (CMP VW0 ≥ ${h1} ∥ CMP VW0 < ${h2}) → ${A.lamp}.`,`SM0.0 → RTC VW0 · (CMP VW0 ≥ ${h1} ∥ CMP VW0 < ${h2}) → ${A.lamp}.`)
      :tx(`SM0.0 → RTC VW0 · CMP VW0 ≥ ${h1} · CMP VW0 < ${h2} → ${A.lamp}.`,`SM0.0 → RTC VW0 · CMP VW0 ≥ ${h1} · CMP VW0 < ${h2} → ${A.lamp}.`),
    io,M:0,T:0,C:0,SM:true,words:['VW0'],wt:{VW0:'SAAT'},pal:palOf({rungs:rs},['MOV']),scene:sc,goals:[{k:'cOn',l:T2('Zamanında yanar','On in time')},{k:'cOff',l:T2('Zamanında söner','Off in time')}],sol:{rungs:rs},bot:()=>()=>{}};
};
const shiftBelt=lunch=>(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw'],['motor']); const sp=spd(r,k), h1=pick(r,[8,9]), h2=pick(r,[16,17]), L=12;
  const inS=h=>h>=h1&&h<h2&&(!lunch||h!==L);
  const row=['NO '+A.sw,'CMP VW0 >= '+h1,'CMP VW0 < '+h2,lunch?'CMP VW0 <> '+L:null,'COIL '+A.motor];
  const rs=[R(['NO SM0.0',null,null,null,'RTC VW0']),R(row)];
  const sc={motor:A.motor,speed:sp,gap:1.2,boxes:60,endDrop:'deliver',clock:{h0:h1-2,rate:1/0.7},
    rules:[follow((w,q,iv)=>!!w.sw[A.sw]&&inS(w.hour),(w)=>w.motor,lunch?tx(`Hata: Bant ${h1}:00–${h2}:00 arası çalışmalı, ${L}:00–13:00 öğle molasında durmalı!`,`Error: The belt runs ${h1}:00–${h2}:00 and stops for lunch ${L}:00–13:00!`):tx(`Hata: Bant yalnızca mesai saatlerinde (${h1}:00–${h2}:00) çalışmalı!`,`Error: The belt may run only during shift hours (${h1}:00–${h2}:00)!`),0.3),
      timeIf('cOn',(w)=>w.motor,1.5),(w)=>{ if(w.f.cOn&&w.hour>=h2) w.f.cOff=true; },(w)=>{ if(lunch&&w.hour===L&&!w.motor&&w.f.cOn) w.f.lunch=true; }]};
  const goals=[{k:'cOn',l:T2('Mesaide çalış','Run in shift')}]; if(lunch) goals.push({k:'lunch',l:T2('Öğle molası','Lunch break')}); goals.push({k:'cOff',l:T2('Mesai sonu dur','Stop after shift')});
  return {title:lunch?tx('Mesai + Öğle Molası','Shift + Lunch Break'):tx(`Mesai Saatli Bant (${h1}–${h2})`,`Shift-Hour Belt (${h1}–${h2})`),
    task:tx(`Bant (${A.motor}) yalnızca şalter (${A.sw}) açıkken VE saat ${h1}:00–${h2}:00 arasındayken çalışsın`+(lunch?`; ${L}:00–13:00 öğle molasında dursun (CMP ≠ ${L})`:'')+`. Saati RTC ile VW0'a oku.`,
      `The belt (${A.motor}) runs only while the switch (${A.sw}) is ON AND the time is between ${h1}:00 and ${h2}:00`+(lunch?`; it stops for the ${L}:00–13:00 lunch break (CMP ≠ ${L})`:'')+`. Read the hour into VW0 with RTC.`),
    hint:tx(`SM0.0 → RTC VW0 · ${A.sw} · CMP VW0 ≥ ${h1} · CMP VW0 < ${h2}`+(lunch?` · CMP VW0 ≠ ${L}`:'')+` → ${A.motor}.`,`SM0.0 → RTC VW0 · ${A.sw} · CMP VW0 ≥ ${h1} · CMP VW0 < ${h2}`+(lunch?` · CMP VW0 ≠ ${L}`:'')+` → ${A.motor}.`),
    io,M:0,T:0,C:0,SM:true,words:['VW0'],wt:{VW0:'SAAT'},pal:palOf({rungs:rs},['MOV']),scene:sc,goals,sol:{rungs:rs},bot:at([[0.3,A.sw]])};
};


/* ===================== BONUS BÖLÜMLER (eğlenceli) ===================== */
CATS.push(I18({n:['Bonus','Bonus'],s:['Eğlenceli özel bölümler','Fun special levels'],ic:'★',c:'var(--amb)'}));
const traffic=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start'],['lamp','lamp2','lamp3'],{lamp:'KIRMIZI',lamp2:'SARI',lamp3:'YEŞİL'}); const g=pick(r,[2,2.5,3]), y=pick(r,[1,1.5]), rd=pick(r,[2,2.5,3]);
  const R_=A.lamp,Y=A.lamp2,G=A.lamp3;
  const rs=[R(['NO '+A.start,null,null,null,'COIL M0.0'],['NO M0.0']),R(['NO M0.0','NC T3',null,null,'TON T1 '+g]),R(['NO T1',null,null,null,'TON T2 '+y]),R(['NO T2',null,null,null,'TON T3 '+rd]),
    R(['NO M0.0','NC T1',null,null,'COIL '+G]),R(['NO T1','NC T2',null,null,'COIL '+Y]),R(['NO T2',null,null,null,'COIL '+R_])];
  const D={[G]:g,[Y]:y,[R_]:rd}, NX={[G]:Y,[Y]:R_,[R_]:G};
  const sc={noBelt:true,boxes:0,traffic:{r:R_,y:Y,g:G},
    rules:[(w,q,iv,dt,s)=>{ if(w.t<0.06) return; const on=[R_,Y,G].filter(a=>q[a]);
      if(on.length>1) return tx('Hata: Trafik lambasında aynı anda yalnızca BİR ışık yanmalı!','Error: Only ONE light may be on at a time!');
      const c=on[0]||null; if(c===s.c||(!c&&!s.c)) return;
      if(s.c&&!c) return tx('Hata: Işıklar sönmemeli; döngü kesintisiz dönmeli!','Error: The lights must not go dark; the cycle must loop without gaps!');
      if(s.c){ if(c!==NX[s.c]) return tx('Hata: Sıra YEŞİL → SARI → KIRMIZI → YEŞİL olmalı!','Error: The order must be GREEN → AMBER → RED → GREEN!');
        const d=w.t-s.ts; if(Math.abs(d-D[s.c])>0.35) return tx(`Hata: Süreler yanlış! Yeşil ${fx(g)} sn, sarı ${fx(y)} sn, kırmızı ${fx(rd)} sn yanmalı.`,`Error: Wrong timing! Green ${g} s, amber ${y} s, red ${rd} s.`);
        w.cnt.step=(w.cnt.step||0)+1; }
      else if(c!==G) return tx('Hata: Döngü YEŞİL ile başlamalı!','Error: The cycle must start with GREEN!');
      s.c=c; s.ts=w.t; }]};
  return {title:tx('🚦 Trafik Lambası','🚦 Traffic Light'),
    task:tx(`Kavşağın trafik lambasını programla! START (${A.start}) basınca döngü başlasın ve sonsuza dek dönsün: YEŞİL (${G}) ${fx(g)} sn → SARI (${Y}) ${fx(y)} sn → KIRMIZI (${R_}) ${fx(rd)} sn → tekrar yeşil. Aynı anda tek ışık yansın.`,
      `Program the junction's traffic light! START (${A.start}) starts a cycle that loops forever: GREEN (${G}) ${g} s → AMBER (${Y}) ${y} s → RED (${R_}) ${rd} s → green again. Only one light at a time.`),
    hint:tx(`M0.0 mühür · M0.0 · KAPALI T3 → TON T1 (${fx(g)}) · T1 → TON T2 (${fx(y)}) · T2 → TON T3 (${fx(rd)}) · M0.0 · KAPALI T1 → yeşil · T1 · KAPALI T2 → sarı · T2 → kırmızı. T3 dolunca zincir kendini sıfırlar.`,`M0.0 seal-in · M0.0 · NC T3 → TON T1 (${g}) · T1 → TON T2 (${y}) · T2 → TON T3 (${rd}) · M0.0 · NC T1 → green · T1 · NC T2 → amber · T2 → red. When T3 is done the chain resets itself.`),
    io,M:1,T:3,C:0,pal:palOf({rungs:rs},['TOF']),scene:sc,goals:[{k:'cnt',f:'step',n:5,l:T2('Işık değişimi','Light change')}],sol:{rungs:rs},bot:at([[0.5,A.start]])};
};
const safeLock=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['s1','s2','s3'],['lamp'],{lamp:'KASA_AÇIK'}); io.I.forEach((d,i)=>{ d.k='btn'; d.n=['A','B','C'][i]; });
  const rs=[R(['NO '+A.s1,null,null,null,'SET M0.0']),R(['NO '+A.s2,'NO M0.0',null,null,'SET '+A.lamp]),R(['NO '+A.s3,null,null,null,'RST M0.0']),R(['NO '+A.s3,null,null,null,'RST '+A.lamp])];
  const sc={noBelt:true,boxes:0,safe:{a:A.lamp},
    rules:[(w,q,iv,dt,s)=>{ const a=!!iv[A.s1],b=!!iv[A.s2],c=!!iv[A.s3];
      if(a&&!s.a) s.arm=true; if(c&&!s.c){ s.arm=false; s.open=false; if(s.wasOpen) w.f.relock=true; } if(b&&!s.b){ if(s.arm){ s.open=true; } else s.tried=true; }
      s.a=a; s.b=b; s.c=c; if(w.t<0.06) return;
      if(!!q[A.lamp]!==!!s.open){ s.bad=(s.bad||0)+dt; if(s.bad>0.2) return s.open?tx('Hata: Doğru şifre (önce A, sonra B) girildi ama kasa açılmadı!','Error: The right code (A, then B) was entered but the safe did not open!'):tx('Hata: Kasa yanlış şifreyle açıldı! Yalnızca önce A sonra B açar, C her şeyi sıfırlar.','Error: The safe opened with a wrong code! Only A then B opens it; C resets everything.'); }
      else { s.bad=0; if(s.open){ w.f.open=true; s.wasOpen=true; } } }]};
  return {title:tx('🔐 Şifreli Kasa','🔐 Code Safe'),
    task:tx(`Kasanın şifresi: önce A (${A.s1}), sonra B (${A.s2}). Doğru sırayla basılınca KASA_AÇIK (${A.lamp}) yansın. Önce B'ye basmak açmasın. C (${A.s3}) girilen şifreyi ve açık kasayı sıfırlasın.`,
      `The safe's code is A (${A.s1}) then B (${A.s2}). Pressed in the right order, SAFE_OPEN (${A.lamp}) lights. Pressing B first must not open it. C (${A.s3}) clears the entered code and closes the safe.`),
    hint:tx(`A → (S) M0.0 (şifrenin ilk hanesi hatırlansın) · B · M0.0 → (S) ${A.lamp} · C → (R) M0.0 · C → (R) ${A.lamp}.`,`A → (S) M0.0 (remember the first digit) · B · M0.0 → (S) ${A.lamp} · C → (R) M0.0 · C → (R) ${A.lamp}.`),
    io,M:1,T:0,C:0,pal:palOf({rungs:rs}),scene:sc,goals:[{k:'open',l:T2('Kasayı aç','Open the safe')},{k:'relock',l:T2('C ile kilitle','Lock with C')}],sol:{rungs:rs},
    bot:at([[0.5,A.s2],[1.1,A.s1],[1.7,A.s3],[2.3,A.s2],[2.9,A.s1],[3.5,A.s2],[4.4,A.s3]])};
};
const disco=(r,k,n)=>{
  const {io}=mkCtx(r,n,[],['l0','l1','l2','l3']); const st=pick(r,[5,10]);
  const rs=[R(['NO SM0.1',null,null,null,'MOV QB0 '+st]),R(['NO SM0.5','P',null,null,'INV QB0'])];
  const sc={noBelt:true,boxes:0,row:{pre:'Q0.',n:4},disco:true,
    rules:[(w,q,iv,dt,s)=>{ if(w.t<0.06) return; const v=qb(q,'Q0.')&15;
      if(v!==5&&v!==10){ s.b=(s.b||0)+dt; if(s.b>0.15) return tx('Hata: Lambalar dama gibi dönüşümlü yanmalı: 1-3 yanıkken 2-4 sönük, sonra tersi!','Error: The lamps must alternate like a checkerboard: 1-3 on with 2-4 off, then the opposite!'); return; }
      s.b=0; if(s.v!=null&&v!==s.v){ const d=w.t-s.ts; if(s.k>=1&&(d<0.8||d>1.25)) return tx('Hata: Desen her 1 sn\'de bir değişmeli!','Error: The pattern must flip once per second!'); s.k=(s.k||0)+1; w.cnt.flip=s.k; s.ts=w.t; }
      if(s.v==null) s.ts=w.t; s.v=v; }]};
  return {title:tx('🪩 Disko Işıkları','🪩 Disco Lights'),
    task:tx(`Parti zamanı! Butona gerek yok: ilk taramada (SM0.1) QB0'a ${st} yaz (${st===5?'0101':'1010'}: dama deseni). Sonra her saniye (SM0.5'in yükselen kenarı) tüm lambaları tersle (INV). Işıklar 1-3 / 2-4 diye dans etsin.`,
      `Party time! No buttons needed: on the first scan (SM0.1) write ${st} to QB0 (${st===5?'0101':'1010'}: a checkerboard). Then every second (rising edge of SM0.5) invert all lamps (INV). The lights dance 1-3 / 2-4.`),
    hint:tx(`SM0.1 → MOV QB0 ← ${st} · SM0.5 · P → INV QB0.`,`SM0.1 → MOV QB0 ← ${st} · SM0.5 · P → INV QB0.`),
    io,M:0,T:0,C:0,SM:true,words:['QB0'],wt:{QB0:'LAMBALAR'},pal:palOf({rungs:rs},['SHL','N']),scene:sc,goals:[{k:'cnt',f:'flip',n:6,l:T2('Dans adımı','Dance step')}],sol:{rungs:rs},bot:()=>()=>{}};
};
const turbo=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw'],['motor']); const N=8, T=7, vmin=40;
  const rs=[R(['NO SM0.1',null,null,null,'MOV VW0 50']),R(['NO '+A.sw,null,null,null,'COIL '+A.motor])];
  const sc={motor:A.motor,speed:20,speedW:'VW0',gap:0.55,boxes:N+2,endDrop:'deliver',timer:T,
    rules:[(w)=>{ if(w.t>T&&w.delivered<N) return tx(`Süre doldu! ${N} kutu ${T} sn'de yetişmedi — bandı hızlandır (VW0 ≥ ${vmin}).`,`Time's up! ${N} boxes didn't make it in ${T} s — speed the belt up (VW0 ≥ ${vmin}).`); }]};
  return {title:tx('🏁 Turbo Bant Rekoru','🏁 Turbo Belt Record'),
    task:tx(`Rekor denemesi! ${N} kutuyu ${T} saniye dolmadan depoya ulaştır. Bant hızı VW0'dan okunur (en fazla 60). İlk taramada (SM0.1) hızı yükselt, şalterle (${A.sw}) bandı çalıştır. Süre RUN'la başlar!`,
      `Record attempt! Get ${N} boxes to the store before ${T} seconds run out. The belt speed is read from VW0 (max 60). Raise the speed on the first scan (SM0.1) and run the belt with the switch (${A.sw}). The clock starts with RUN!`),
    hint:tx(`SM0.1 → MOV VW0 ← 50 · ${A.sw} → ${A.motor}. Hız en az ${vmin} olmalı.`,`SM0.1 → MOV VW0 ← 50 · ${A.sw} → ${A.motor}. The speed must be at least ${vmin}.`),
    io,M:0,T:0,C:0,SM:true,words:['VW0'],wt:{VW0:'HIZ'},pal:palOf({rungs:rs},['ADD']),scene:sc,goals:[{k:'deliver',n:N}],sol:{rungs:rs},bot:at([[0.3,A.sw]])};
};
const BONUS=[safeLock,traffic,turbo,disco], BONUS_MIN=[10,18,68,103];   // her bonus, gereken konular öğretildikten sonra gelir
/* ===================== YOL HARİTASI ===================== */
const TPL=[
  [ [easyLogic('direct',0),easyLogic('direct',1),easyLogic('and',0),easyLogic('or',0),easyLogic('direct',2),easyLogic('and',1),easyLogic('or',1),easyLogic('and',2),easyLogic('or',2)],
    [mSeal(0),mSR(0),mSeal(1),mSR(1),mSeal(2),mPist],
    [hArriza,hPistLamp,hAckLatch,hGate] ],
  [ [tPush,tLampDelay,tLampTof],
    [tStopDelay,tFill,tStartDelay,tonrMaint],
    [hBooth,hDelays,hTonTof] ],
  [ [cBatch(false),cLampCount,cBatch(true)],
    [mDivert,mCtdTwo(false),mRestart(false)],
    [hFinal,mCtdTwo(true),mRestart(true)] ],
  [ [cmpCount,tankBasic,ovenRange], [tankHyst,cmpStages], [hHystLine] ],
  [ [togglePN,releaseN,blinkSM,notLamp], [togStop], [hTogBlink] ],
  [ [speedMov,incCount(false),incCount(true)], [stockDec,scalePct], [speedRamp] ],
  [ [segCount(false),segCount(true)], [segDown], [hSegBatch] ],
  [ [chase(1,false),chase(-1,false)], [chase(1,true)], [chaseSM] ],
  [ [mirror(false),worWand,mirror(true)], [maskSel], [hPanelTest] ],
  [ [shiftLamp(false),shiftLamp(true)], [shiftBelt(false)], [shiftBelt(true)] ],
  [ BONUS, BONUS, BONUS ]];
const LV_CACHE={};
// TEK YOL: tüm konular bir arada. Konular sırayla tanıtılır, sonra karışık gelir.
const TOPIC_START=[0,15,35,45,55,65,80,90,100,110];
const NEW_FROM=45;                                   // bu bölümden önce yol v1.1.1 ile birebir aynı
const OLD_LEN=[[9,6,4],[3,3,3],[3,3,3]];
const NC_=TOPIC_START.length, BONUS_C=NC_;
// bonus: ~15 bölümde bir (ekstra zordan nadir), konu tanıtımlarına ve ekstra zorlara denk gelmez
const isBonus=i=>i>=10&&i%15===12&&!isExtra(i)&&!intro(i,false);
function tplLen(c,pool,i,old){ return (old||i<NEW_FROM)&&c<3?OLD_LEN[c][pool]:TPL[c][pool].length; }
function intro(i,old){ const n=old?3:NC_; for(let c=0;c<n;c++){ const k=i-TOPIC_START[c]; if(k>=0&&k<TPL[c][0].length&&(c===0||c>=3||k<3)) return {c,pool:0,t:k}; } return null; }
function pickTpl(i,old){
  const r=mkRng(i*104729+17); const n=old?3:NC_;
  const open=[...Array(n).keys()].filter(c=>i>=TOPIC_START[c]+Math.min(3,TPL[c][0].length));   // tanıtımı bitmiş konular
  if(isExtra(i)){ const c=open[Math.floor(r()*open.length)]; return {c,pool:2,t:Math.floor(r()*tplLen(c,2,i,old))}; }
  const fx=intro(i,old); if(fx) return fx;
  const w=open.map(c=>i-TOPIC_START[c]<28?2:1);                       // yeni açılan konu ilk bölümlerinde biraz daha sık gelsin
  let x=r()*w.reduce((a,b)=>a+b,0), c=open[0]; for(let j=0;j<open.length;j++){ x-=w[j]; if(x<0){ c=open[j]; break; } }
  const pm=Math.max(0,Math.min(0.85,(i-TOPIC_START[c]-6)/50));       // konu içinde orta seviye olasılığı zamanla artar
  const pool=r()<pm?1:0;
  return {c,pool,t:Math.floor(r()*tplLen(c,pool,i,old))};
}
function tplKey(n,old){
  if(!old&&isBonus(n)){ const av=BONUS.map((_,j)=>j).filter(j=>n>=BONUS_MIN[j]); return {c:BONUS_C,pool:0,t:av[Math.floor(n/15)%av.length]}; }
  let p=pickTpl(n,old);
  if(n>0&&!isExtra(n)){ const q=tplKey(n-1,old); if(q.c===p.c&&q.pool===p.pool&&q.t===p.t){ const L=tplLen(p.c,p.pool,n,old); p=Object.assign({},p,{t:(p.t+1)%L}); } }
  return p;
}
function getLevel(id){
  if(LV_CACHE[id]) return LV_CACHE[id];
  const n=id, p=tplKey(n);
  const r=mkRng(id*7919+13);
  const k=isExtra(n)?Math.min(1,0.45+n/200):Math.min(1,n/160);
  CTX_MAP=null;
  const lv=TPL[p.c][p.pool][p.t](r,k,n);
  lv.amap=CTX_MAP||{};
  if(isExtra(n)&&!lv.scene.noBelt) lv.scene.speed=Math.round(lv.scene.speed*1.15);
  Object.assign(lv,{id,cat:p.c,diff:p.pool,n,extra:isExtra(n),bonus:p.c===BONUS_C}); lv.opt=countBlocks(lv.sol);
  return LV_CACHE[id]=lv;
}
/* v1.1.1 kayıtlarını taşı: aynı şablon → adresleri yeni sıraya çevir; değişen bölüm → çözüm gösterimi düşer, puan kalır */
function sameTpl(id){ const a=tplKey(id,true), b=tplKey(id,false); return a.c===b.c&&a.pool===b.pool&&a.t===b.t; }
function remapProg(id,rec){
  if(!rec) return rec; const lv=getLevel(id), m=lv.amap||{};
  const rungs=rec.rungs||(rec.prog&&rec.prog.rungs); if(!rungs) return rec;
  for(const rg of rungs) for(const row of rg.c) for(const c of row) if(c&&c.a&&m[c.a]) c.a=m[c.a];
  if(rec.tags){ const t={}; for(const a in rec.tags) t[m[a]||a]=rec.tags[a]; rec.tags=t; }
  return rec;
}
function migrateDone(done){ const o={}; for(const k in done){ const id=+k; o[k]=sameTpl(id)?remapProg(id,done[k]):{prog:null,tags:{}}; } return o; }
/* hangi adresler hangi alana konabilir (editör ve test ortak) */
function addrGroups(lv,t,field){
  const I=lv.io.I.map(d=>d.a), Q=lv.io.Q.map(d=>d.a), M=[...Array(lv.M)].map((_,i)=>'M0.'+i), T=[...Array(lv.T)].map((_,i)=>'T'+(i+1)), C=[...Array(lv.C)].map((_,i)=>'C'+(i+1));
  const SM=lv.SM?['SM0.0','SM0.1','SM0.5']:[], W=lv.words||[];
  const VW=W.filter(a=>/^VW/.test(a)), AI=W.filter(a=>/^AIW/.test(a)), QB=W.filter(a=>/^QB/.test(a)), IB=W.filter(a=>/^IB/.test(a));
  const g=[]; const add=(k,l)=>{ if(l.length) g.push([k,l]); };
  if(field==='src'){ if(t==='MOV'){ add('AIW',AI); add('IB',IB); add('CV',C); add('VW',VW); } else if(t==='SEG'){ add('CV',C); add('VW',VW); } return g; }
  switch(t){
    case 'NO': case 'NC': add('I',I); add('Q',Q); add('M',M); add('SM',SM); add('T',T); add('C',C); break;
    case 'COIL': case 'SET': add('Q',Q); add('M',M); break;
    case 'RST': add('Q',Q); add('M',M); add('T',T); add('C',C); break;
    case 'TON': case 'TOF': case 'TONR': add('T',T); break;
    case 'CTU': case 'CTD': add('C',C); break;
    case 'CMP': add('AIW',AI); add('CV',C); add('VW',VW); add('QB',QB); add('IB',IB); break;
    case 'MOV': add('VW',VW); add('QB',QB); break;
    case 'ADD': case 'SUB': case 'MUL': case 'DIV': case 'INC': case 'DEC': add('VW',VW); break;
    case 'SHL': case 'SHR': case 'WAND': case 'WOR': case 'INV': add('QB',QB); add('VW',VW); break;
    case 'SEG': add('QB',QB); break;
    case 'RTC': add('VW',VW); break;
  }
  return g;
}
const addrList=(lv,t,f)=>addrGroups(lv,t,f).reduce((a,g)=>a.concat(g[1]),[]);
