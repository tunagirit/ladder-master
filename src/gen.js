/* ===== BÖLÜM ÜRETİCİ: 3 kategori × 3 zorluk × 100 bölüm ===== */
const IN=(a,n,k)=>({a,n,k}), O=(a,n)=>({a,n});
const PAL_A=['NO','NC','COIL'], PAL_B=PAL_A.concat(['SET','RST']), PAL_C=PAL_B.concat(['TON','TOF']), PAL_D=PAL_C.concat(['CTU','CTD']);
const I18=(o)=>{ const r={}; for(const k in o){ const v=o[k]; if(Array.isArray(v)) Object.defineProperty(r,k,{get:()=>tx(v[0],v[1]),enumerable:true}); else r[k]=v; } return r; };
const CATS=[
  I18({n:['Temel Mantık','Basic Logic'],s:['Kontak · Bobin · Mühürleme · Set/Reset','Contact · Coil · Seal-in · Set/Reset'],ic:'NO',c:'var(--blu)'}),
  I18({n:['Zamanlayıcılar','Timers'],s:['TON · TOF gecikmeleri','TON · TOF delays'],ic:'TON',c:'var(--amb)'}),
  I18({n:['Sayıcılar','Counters'],s:['CTU · CTD sayma','CTU · CTD counting'],ic:'CTU',c:'var(--pur)'})];
const DIFFS=[
  I18({n:['Kolay','Easy'],c:'var(--neon)',s:['Temel devreler, yavaş bant','Basic circuits, slow belt']}),
  I18({n:['Orta','Medium'],c:'var(--amb)',s:['Mühürleme ve kombinasyonlar','Seal-ins and combinations']}),
  I18({n:['Zor','Hard'],c:'var(--red)',s:['Çok satırlı, hızlı hat','Multi-rung, fast line']})];
const ROAD=100000; // id = kategori*ROAD + yoldaki sıra (sonsuz yol)
const EXTRA_EVERY=10; // her 10. bölüm ekstra zor
const isExtra=i=>i%EXTRA_EVERY===EXTRA_EVERY-1;

function mkRng(seed){ let s=(Math.imul(seed+1,2654435761))>>>0||1; return ()=>{ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function shuf(a,r){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const spd=(r,k)=>Math.round(18+k*9+ri(r,0,3));
const gp=k=>+(1.4-k*0.22).toFixed(2);
const INDEF={start:['START','btn'],stop:['STOP','btn'],sw:['ŞALTER','sw'],sw2:['ŞALTER_2','sw'],gate:['ONAY_ANAH','sw'],ack:['ONAY','btn'],sen:['SENSÖR','sensor'],lim:['PİSTON_İLERİ','limit'],
  tog:['AÇ/KAPA','btn'],slow:['YAVAŞ','btn'],fast:['HIZLI','btn'],on:['YAK','btn'],off:['SÖNDÜR','btn'],test:['TEST','btn'],s1:['ANAH_1','sw'],s2:['ANAH_2','sw'],s3:['ANAH_3','sw'],s4:['ANAH_4','sw']};
const QDEF={motor:'BANT_MOTOR',pist:'PİSTON',lamp:'LAMBA',lamp2:'LAMBA_2',fan:'EGZOZ_FAN',valve:'VALF',pump:'POMPA',heat:'ISITICI',l0:'LAMBA_1',l1:'LAMBA_2',l2:'LAMBA_3',l3:'LAMBA_4'};
const TAGEN={'ŞALTER':'SWITCH','ŞALTER_2':'SWITCH_2','ONAY_ANAH':'APPROVE_KEY','ONAY':'ACK','SENSÖR':'SENSOR','PİSTON_İLERİ':'PISTON_FWD','BANT_MOTOR':'BELT_MOTOR','PİSTON':'PISTON','LAMBA':'LAMP','EGZOZ_FAN':'EXHAUST_FAN','VALF':'VALVE',
 'ÇALIŞIYOR':'RUNNING','ARIZA':'FAULT','AYIRMA':'DIVERT','HAZIR':'READY','UYARI':'WARNING','KALKIŞ_İKAZ':'START_WARN','İKAZ':'WARN','DOLUM_VALF':'FILL_VALVE','BOYA_VALF':'PAINT_VALVE','PARTİ_TAMAM':'BATCH_DONE','PARTİ':'BATCH','SAYAÇ_DOLU':'COUNT_DONE','SAYAÇ':'COUNT','PALET_DOLU':'PALLET_FULL','PALET':'PALLET','AYIRMA_LAMBA':'DIVERT_LAMP',
 'AÇ/KAPA':'ON/OFF','YAVAŞ':'SLOW','HIZLI':'FAST','YAK':'LIGHT','SÖNDÜR':'CLEAR','TEST':'TEST','ANAH_1':'KEY_1','ANAH_2':'KEY_2','ANAH_3':'KEY_3','ANAH_4':'KEY_4','POMPA':'PUMP','ISITICI':'HEATER',
 'LAMBA_1':'LAMP_1','LAMBA_2':'LAMP_2','LAMBA_3':'LAMP_3','LAMBA_4':'LAMP_4','YARIM':'HALF','TAMAM':'DONE','BEKLİYOR':'IDLE','DOLUYOR':'FILLING','MESAİ':'SHIFT','GECE':'NIGHT','BAKIM':'SERVICE','STOK_BİTTİ':'NO_STOCK',
 'SEVİYE':'LEVEL','SICAKLIK':'TEMP','HIZ':'SPEED','PARÇA':'PARTS','STOK':'STOCK','GÖSTERGE':'DISPLAY','SAAT':'HOUR','SAYI':'COUNT','DOLU':'FULL','LAMBALAR':'LAMPS','ANAHTARLAR':'KEYS','YÜZDE':'PERCENT','DÖNGÜ':'CYCLE'};
const tg=n=>LANG==='en'?(TAGEN[n]||n):n;
let CTX_MAP=null;
function mkCtx(r,n,iN,qN,qt){
  // v1.1.2: adresler sıralı (I0.0, I0.1… / Q0.0, Q0.1…). Eski karışık düzen yalnızca kayıtları taşımak için hesaplanır.
  const I=['I0.0','I0.1','I0.2','I0.3','I0.4','I0.5','I0.6','I0.7'], Q=['Q0.0','Q0.1','Q0.2','Q0.3','Q0.4','Q0.5'];
  const Io=I.slice(), Qo=Q.slice(); if(n>=6){ shuf(Io,r); shuf(Qo,r); }
  const A={}, amap={}; iN.forEach((k,i)=>{ A[k]=I[i]; amap[Io[i]]=I[i]; }); qN.forEach((k,i)=>{ A[k]=Q[i]; amap[Qo[i]]=Q[i]; }); CTX_MAP=amap;
  const srt=(x,y)=>x.a<y.a?-1:1;
  const io={I:iN.map(k=>IN(A[k],tg(INDEF[k][0]),INDEF[k][1])).sort(srt),Q:qN.map(k=>O(A[k],tg((qt&&qt[k])||QDEF[k]))).sort(srt)};
  return {A,io};
}
const once=(fn)=>()=>{ const st={}; return (w,P,t)=>fn(w,P,t,st); };
const at=(list)=>once((w,P,t,st)=>{ list.forEach((x,i)=>{ if(!st[i]&&t>=x[0]){ st[i]=1; P(x[1]); } }); });

/* ---------- TEMEL MANTIK ---------- */
const easyLogic=(mode,sm)=>(r,k,n)=>{
  const iN=mode==='direct'?['sw']:['sw','sw2']; if(sm) iN.push('sen');
  const qN=['motor']; if(sm===2) qN.push('lamp');
  const {A,io}=mkCtx(r,n,iN,qN,{lamp:'ÇALIŞIYOR'});
  const sp=spd(r,k), sx=ri(r,50,85), nb=ri(r,2,5)+(k>0.6?1:0);
  const row0=[null,null,null,null,'COIL '+A.motor]; let row1=null, c=1;
  row0[0]='NO '+A.sw;
  if(mode==='and'){ row0[1]='NO '+A.sw2; c=2; } else if(mode==='or') row1=['NO '+A.sw2];
  if(sm) row0[c]='NC '+A.sen;
  const sol={rungs:[R(row0,row1)]}; if(sm===2) sol.rungs.push(R(['NO '+A.motor,null,null,null,'COIL '+A.lamp]));
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:sm?3:nb+1};
  if(sm){ sc.sensors=[{a:A.sen,x:sx}]; sc.endMsg=tx('Hata: Kutu sensörde durmadı, bant sonuna ulaştı!','Error: Box did not stop at the sensor and reached the end of the belt!'); } else sc.endDrop='deliver';
  if(mode==='and') sc.motorAnd=[A.sw,A.sw2]; if(mode==='or') sc.motorOr=[A.sw,A.sw2];
  if(sm===2){ sc.lampA=A.lamp; sc.lamps=[{a:A.lamp,c:'green',n:'ÇALIŞIYOR'}]; }
  const goals=sm?(sm===2?[{k:'lampRun'},{k:'park',s:A.sen,hold:1.5}]:[{k:'park',s:A.sen,hold:1.5}]):[{k:'deliver',n:nb}];
  if(mode==='and') goals.unshift({k:'andTest'}); if(mode==='or') goals.unshift({k:'orTest'});
  const T0=tx({direct:'Şalter → Motor',and:'Çift Şalter (VE)',or:'Çift Şalter (VEYA)'}[mode]+(sm===1?' + Sensör':sm===2?' + Lamba':''),{direct:'Switch → Motor',and:'Two Switches (AND)',or:'Two Switches (OR)'}[mode]+(sm===1?' + Sensor':sm===2?' + Lamp':''));
  let task=tx({direct:`Şalter (${A.sw}) açılınca bant motoru (${A.motor}) çalışsın.`,and:`İki şalter (${A.sw} ve ${A.sw2}) AYNI ANDA açıkken bant (${A.motor}) çalışsın.`,or:`Şalterlerden (${A.sw} veya ${A.sw2}) herhangi biri açıkken bant (${A.motor}) çalışsın.`}[mode],{direct:`When the switch (${A.sw}) is ON, the belt motor (${A.motor}) runs.`,and:`The belt (${A.motor}) runs only when BOTH switches (${A.sw} and ${A.sw2}) are ON.`,or:`The belt (${A.motor}) runs when EITHER switch (${A.sw} or ${A.sw2}) is ON.`}[mode]);
  task+=tx(sm?` Kutu sensöre (${A.sen}) gelince bant dursun.`:` ${nb} kutuyu depoya ulaştır.`,sm?` When a box reaches the sensor (${A.sen}), the belt stops.`:` Deliver ${nb} boxes to the store.`);
  if(sm===2) task+=tx(` Bant çalışırken lamba (${A.lamp}) yansın.`,` The lamp (${A.lamp}) is on while the belt runs.`);
  if(mode==='and') task+=tx(' Test: önce tek şalteri aç, bandın DURDUĞUNU göster.',' Test: turn on one switch only and show that the belt STAYS STOPPED.'); if(mode==='or') task+=tx(' Test: her şalterin TEK BAŞINA bandı çalıştırdığını göster.',' Test: show that EACH switch ALONE runs the belt.');
  const hint=tx({direct:`Açık kontak ${A.sw} → bobin ${A.motor}.`,and:`VE = seri bağlantı: iki açık kontağı yan yana koy.`,or:`VEYA = paralel bağlantı: ⋮ menüsünden paralel kol ekle, ${A.sw2} kontağını alt kola koy.`}[mode],{direct:`NO contact ${A.sw} → coil ${A.motor}.`,and:`AND = series: put two NO contacts side by side.`,or:`OR = parallel: add a branch from the ⋮ menu and put ${A.sw2} on the lower branch.`}[mode])
    +tx((sm?` Seriye KAPALI kontak ${A.sen} ekle.`:''),(sm?` Add NC contact ${A.sen} in series.`:''))+tx((sm===2?` 2. satır: açık kontak ${A.motor} → bobin ${A.lamp}.`:''),(sm===2?` Rung 2: NO contact ${A.motor} → coil ${A.lamp}.`:''));
  const bot=mode==='and'?at([[0.5,A.sw],[1.6,A.sw2]]):mode==='or'?at([[0.5,A.sw],[1.2,A.sw],[1.2,A.sw2]]):at([[0.5,A.sw]]);
  return {title:T0,task,hint,io,M:0,T:0,C:0,pal:PAL_A,scene:sc,goals,sol,bot};
};
const mSeal=sm=>(r,k,n)=>{
  const iN=['start','stop']; if(sm) iN.push('sen'); const qN=['motor']; if(sm===2) qN.push('lamp');
  const {A,io}=mkCtx(r,n,iN,qN,{lamp:'ÇALIŞIYOR'}); const sp=spd(r,k), sx=ri(r,55,85), nb=ri(r,3,5);
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,sm?'NC '+A.sen:null,null,'COIL '+A.motor],['NO '+A.motor])]};
  if(sm===2) sol.rungs.push(R(['NO '+A.motor,null,null,null,'COIL '+A.lamp]));
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:sm?3:nb+3,startA:A.start,stopA:A.stop,startFirst:true};
  if(sm){ sc.sensors=[{a:A.sen,x:sx}]; sc.endMsg=tx('Hata: Kutu sensörde durmadı, bant sonuna ulaştı!','Error: Box did not stop at the sensor and reached the end of the belt!'); } else sc.endDrop='deliver';
  if(sm===2){ sc.lampA=A.lamp; sc.lamps=[{a:A.lamp,c:'green',n:'ÇALIŞIYOR'}]; }
  const goals=sm===0?[{k:'seal'},{k:'stop'},{k:'deliver',n:nb}]:sm===1?[{k:'seal'},{k:'park',s:A.sen,hold:1.5}]:[{k:'seal'},{k:'lampRun'},{k:'park',s:A.sen,hold:1.5}];
  let task=tx(`START (${A.start}) kısa basınca bant (${A.motor}) çalışmaya devam etsin (mühür), STOP (${A.stop}) durdursun.`,`A short press of START (${A.start}) keeps the belt (${A.motor}) running (seal-in); STOP (${A.stop}) stops it.`);
  task+=tx(sm===0?` START → STOP → START ile ${nb} kutu teslim et.`:` Kutu sensöre (${A.sen}) gelince bant dursun.`,sm===0?` Deliver ${nb} boxes using START → STOP → START.`:` When a box reaches the sensor (${A.sen}), the belt stops.`); if(sm===2) task+=tx(` Çalışırken lamba (${A.lamp}) yansın.`,` The lamp (${A.lamp}) is on while running.`);
  const hint=tx(`START ile paralel ${A.motor} kontağı (⋮ → Paralel kol), seriye KAPALI ${A.stop}`+(sm?` ve KAPALI ${A.sen}`:'')+'.'+(sm===2?` 2. satır: ${A.motor} → ${A.lamp}.`:''),`${A.motor} contact parallel to START (⋮ → Parallel branch), NC ${A.stop} in series`+(sm?` and NC ${A.sen}`:'')+'.'+(sm===2?` Rung 2: ${A.motor} → ${A.lamp}.`:''));
  const bot=sm===0?at([[0.5,A.start],[3,A.stop],[5,A.start]]):at([[0.5,A.start]]);
  return {title:tx(['Start/Stop Mühürleme','Mühür + Sensör','Mühür + Sensör + Lamba'][sm],['Start/Stop Seal-in','Seal-in + Sensor','Seal-in + Sensor + Lamp'][sm]),task,hint,io,M:2,T:0,C:0,pal:PAL_A,scene:sc,goals,sol,bot};
};
const mSR=sm=>(r,k,n)=>{
  const iN=sm?['start','sen']:['start','stop']; const {A,io}=mkCtx(r,n,iN,['motor']); const sp=spd(r,k), sx=ri(r,55,85), nb=ri(r,3,5);
  const sol={rungs:[R(['NO '+A.start,null,null,null,'SET '+A.motor]),R(['NO '+(sm?A.sen:A.stop),null,null,null,'RST '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:sm?3:nb+3,startA:A.start,startFirst:true};
  if(sm){ sc.sensors=[{a:A.sen,x:sx}]; sc.endMsg=tx('Hata: Kutu hedef sensörde durmadı!','Error: Box did not stop at the target sensor!'); } else { sc.stopA=A.stop; sc.endDrop='deliver'; }
  const goals=sm?[{k:'seal'},{k:'park',s:A.sen,hold:1.5}]:[{k:'seal'},{k:'stop'},{k:'deliver',n:nb}];
  const task=tx(sm?`START (${A.start}) bandı Set etsin; kutu hedef sensöre (${A.sen}) gelince bant Reset ile dursun.`:`START (${A.start}) bandı kalıcı çalıştırsın (Set), STOP (${A.stop}) durdursun (Reset). START → STOP → START ile ${nb} kutu teslim et.`,sm?`START (${A.start}) Sets the belt; when the box reaches the target sensor (${A.sen}) the belt is Reset.`:`START (${A.start}) latches the belt on (Set), STOP (${A.stop}) stops it (Reset). Deliver ${nb} boxes using START → STOP → START.`);
  const hint=tx(`Satır 1: ${A.start} → (S) ${A.motor}. Satır 2: ${sm?A.sen:A.stop} → (R) ${A.motor}.`,`Rung 1: ${A.start} → (S) ${A.motor}. Rung 2: ${sm?A.sen:A.stop} → (R) ${A.motor}.`);
  return {title:tx(sm?'Set/Reset: Hedefte Dur':'Set/Reset ile Çalıştır',sm?'Set/Reset: Stop at Target':'Run with Set/Reset'),task,hint,io,M:2,T:0,C:0,pal:PAL_B,scene:sc,goals,sol,bot:sm?at([[0.5,A.start]]):at([[0.5,A.start],[3,A.stop],[5,A.start]])};
};
const pistBot=(A,sp,sx)=>once((w,P,t,st)=>{ st.n=st.n||0; const per=sx/sp+1.6; if(t>=0.5+st.n*per){ st.n++; P(A.start); } });
const mPist=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','sen','lim'],['motor','pist']); const sp=spd(r,k), sx=ri(r,45,75), nd=ri(r,2,3);
  const sol={rungs:[R(['NO '+A.start,null,null,null,'SET '+A.motor]),R(['NO '+A.sen,null,null,null,'RST '+A.motor]),R(['NO '+A.sen,null,null,null,'SET '+A.pist]),R(['NO '+A.lim,null,null,null,'RST '+A.pist])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:nd+2,sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx,lim:A.lim}],startA:A.start,startFirst:true};
  return {title:tx('Pistonla Ayır (S/R)','Divert with Piston (S/R)'),task:tx(`START (${A.start}) bandı başlatsın. Kutu sensöre (${A.sen}) gelince bant dursun, piston (${A.pist}) itsin; tam ilerleyince (${A.lim}) geri dönsün. Her kutu için START'a yeniden bas. ${nd} kutu ayır.`,`START (${A.start}) starts the belt. When a box reaches the sensor (${A.sen}) the belt stops and the piston (${A.pist}) pushes; at full stroke (${A.lim}) it retracts. Press START again for each box. Divert ${nd} boxes.`),
    hint:tx(`${A.start}→(S)${A.motor} · ${A.sen}→(R)${A.motor} · ${A.sen}→(S)${A.pist} · ${A.lim}→(R)${A.pist}. Her kutu için START'a bas.`,`${A.start}→(S)${A.motor} · ${A.sen}→(R)${A.motor} · ${A.sen}→(S)${A.pist} · ${A.lim}→(R)${A.pist}. Press START for each box.`),io,M:2,T:0,C:0,pal:PAL_B,scene:sc,goals:[{k:'divert',n:nd}],sol,bot:pistBot(A,sp,sx)};
};
const hArriza=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','ack','sen'],['motor','lamp'],{lamp:'ARIZA'}); const sp=spd(r,k), sx=ri(r,60,85);
  const sol={rungs:[R(['NO '+A.start,null,null,null,'SET '+A.motor]),R(['NO '+A.sen,null,null,null,'RST '+A.motor]),R(['NO '+A.sen,null,null,null,'SET '+A.lamp]),R(['NO '+A.ack,null,null,null,'RST '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,sensors:[{a:A.sen,x:sx}],startA:A.start,startFirst:true,ackA:A.ack,lampA:A.lamp,lamps:[{a:A.lamp,c:'red',n:'ARIZA'}],endMsg:tx('Hata: Kutu uç sensörde durmadı!','Error: Box did not stop at the end sensor!')};
  return {title:tx('Arıza Lambası','Fault Lamp'),task:tx(`START (${A.start}) ile başlat. Kutu uç sensöre (${A.sen}) gelince bant dursun ve ARIZA lambası (${A.lamp}) kalıcı yansın. ONAY (${A.ack}) lambayı söndürsün.`,`Start with START (${A.start}). When the box reaches the end sensor (${A.sen}) the belt stops and the FAULT lamp (${A.lamp}) latches on. ACK (${A.ack}) turns it off.`),
    hint:tx('4 satır: ','4 rungs: ')+`${A.start}→(S)${A.motor} · ${A.sen}→(R)${A.motor} · ${A.sen}→(S)${A.lamp} · ${A.ack}→(R)${A.lamp}.`,io,M:2,T:0,C:0,pal:PAL_B,scene:sc,
    goals:[{k:'park',s:A.sen,hold:1},{k:'lampPark'},{k:'lampAck'}],sol,bot:at([[0.5,A.start],[0.5+sx/sp+3,A.ack]])};
};
const hPistLamp=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','sen','lim'],['motor','pist','lamp'],{lamp:'AYIRMA'}); const sp=spd(r,k), sx=ri(r,50,75), nd=ri(r,2,3);
  const sol={rungs:[R(['NO '+A.start,null,null,null,'SET '+A.motor]),R(['NO '+A.sen,null,null,null,'RST '+A.motor]),R(['NO '+A.sen,null,null,null,'SET '+A.pist]),R(['NO '+A.lim,null,null,null,'RST '+A.pist]),R(['NO '+A.pist,null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:nd+2,sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx,lim:A.lim}],startA:A.start,startFirst:true,lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'AYIRMA'}]};
  return {title:tx('Ayırıcı + İkaz Lambası','Diverter + Warning Lamp'),task:tx(`START (${A.start}) bandı Set etsin. Kutu sensörde (${A.sen}) bant dursun, piston (${A.pist}) itsin, ${A.lim} ile geri dönsün. Piston çalışırken sarı lamba (${A.lamp}) yansın. Her kutu için START'a yeniden bas. ${nd} kutu ayır.`,`START (${A.start}) Sets the belt. At the sensor (${A.sen}) the belt stops, the piston (${A.pist}) pushes and retracts on ${A.lim}. The amber lamp (${A.lamp}) is on while the piston works. Press START again for each box. Divert ${nd} boxes.`),
    hint:tx(`5 satır: ${A.start}→(S)${A.motor} · ${A.sen}→(R)${A.motor} · ${A.sen}→(S)${A.pist} · ${A.lim}→(R)${A.pist} · ${A.pist}→${A.lamp}. Set/Reset bandı ve pistonu kilitler; lamba pistonu izler.`,`5 rungs: ${A.start}→(S)${A.motor} · ${A.sen}→(R)${A.motor} · ${A.sen}→(S)${A.pist} · ${A.lim}→(R)${A.pist} · ${A.pist}→${A.lamp}. Set/Reset latch the belt and piston; the lamp follows the piston.`),io,M:2,T:0,C:0,pal:PAL_B,scene:sc,goals:[{k:'seal'},{k:'divert',n:nd},{k:'lampPush'}],sol,bot:pistBot(A,sp,sx)};
};
const hAckLatch=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop','ack','sen'],['motor','lamp'],{lamp:'ARIZA'}); const sp=spd(r,k), sx=ri(r,60,85);
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,'NC '+A.sen,null,'COIL '+A.motor],['NO '+A.motor]),R(['NO '+A.sen,null,null,null,'SET '+A.lamp]),R(['NO '+A.ack,null,null,null,'RST '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,sensors:[{a:A.sen,x:sx}],startA:A.start,stopA:A.stop,startFirst:true,ackA:A.ack,lampA:A.lamp,lamps:[{a:A.lamp,c:'red',n:'ARIZA'}],endMsg:tx('Hata: Kutu sensörde durmadı!','Error: Box did not stop at the sensor!')};
  return {title:tx('Mühür + Arıza Kilidi','Seal-in + Fault Latch'),task:tx(`Mühürlü START (${A.start}) / STOP (${A.stop}) devresi kur. Kutu sensöre (${A.sen}) gelince bant dursun ve ARIZA (${A.lamp}) kilitlensin (Set). ONAY (${A.ack}) lambayı söndürsün.`,`Build a sealed START (${A.start}) / STOP (${A.stop}) circuit. When a box reaches the sensor (${A.sen}) the belt stops and FAULT (${A.lamp}) latches (Set). ACK (${A.ack}) clears the lamp.`),
    hint:tx(`Satır 1: (START ∥ ${A.motor}) · KAPALI ${A.stop} · KAPALI ${A.sen} → ${A.motor}. Satır 2: ${A.sen} → (S) ${A.lamp}. Satır 3: ${A.ack} → (R) ${A.lamp}.`,`Rung 1: (START ∥ ${A.motor}) · NC ${A.stop} · NC ${A.sen} → ${A.motor}. Rung 2: ${A.sen} → (S) ${A.lamp}. Rung 3: ${A.ack} → (R) ${A.lamp}.`),io,M:2,T:0,C:0,pal:PAL_B,scene:sc,
    goals:[{k:'seal'},{k:'park',s:A.sen,hold:1},{k:'lampPark'},{k:'lampAck'}],sol,bot:at([[0.5,A.start],[0.5+sx/sp+3,A.ack]])};
};
const hGate=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','gate','sen'],['motor','pist']); const sp=spd(r,k), sx=ri(r,45,70);
  const sol={rungs:[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.sen,'NO '+A.gate,null,null,'COIL '+A.pist])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:6,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx}],divertIf:A.gate};
  return {title:tx('Onaylı Ayırıcı (VE)','Approved Diverter (AND)'),task:tx(`Bant şalterle (${A.sw}) çalışsın. ONAY anahtarı (${A.gate}) AÇIKKEN sensördeki (${A.sen}) kutuyu piston (${A.pist}) itsin; KAPALIYKEN kutular geçsin. 2 kutu ayır, sonra anahtarı kapatıp 2 kutu teslim et.`,`The switch (${A.sw}) runs the belt. While the APPROVE key (${A.gate}) is ON, the piston (${A.pist}) pushes the box at the sensor (${A.sen}); while OFF, boxes pass. Divert 2 boxes, then turn the key off and deliver 2.`),
    hint:tx(`Satır 2: açık ${A.sen} ile açık ${A.gate} seri → ${A.pist}.`,`Rung 2: NO ${A.sen} in series with NO ${A.gate} → ${A.pist}.`),io,M:2,T:0,C:0,pal:PAL_B,scene:sc,goals:[{k:'divert',n:2},{k:'deliver',n:2}],sol,
    bot:once((w,P,t,st)=>{ if(!st.a&&t>0.5){ st.a=1; P(A.sw); P(A.gate); } if(st.a===1&&w.diverted>=2){ st.a=2; P(A.gate); } })};
};

/* ---------- ZAMANLAYICILAR ---------- */
const tPush=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','pist']); const sp=spd(r,k), sx=ri(r,45,75), t=pick(r,[1,1.5,2,2.5,3,4]), nd=ri(r,2,4);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor]),R(['NO '+A.sen,null,null,null,'TON T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.pist])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:nd+2,sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx}],waitSensor:A.sen,waitRange:[t-0.2,t+0.8]};
  return {title:tx(`TON: ${fx(t)} sn Gecikmeli İtme`,`TON: ${fx(t)} s Delayed Push`),task:tx(`Şalter (${A.sw}) açık: bant çalışsın. Kutu sensörde (${A.sen}) durunca ${fx(t)} sn bekle (TON), sonra piston (${A.pist}) itsin. ${nd} kutu ayır.`,`Switch (${A.sw}) ON: belt runs. When a box stops at the sensor (${A.sen}) wait ${fx(t)} s (TON), then the piston (${A.pist}) pushes. Divert ${nd} boxes.`),
    hint:tx(`Satır 1: ${A.sw} · KAPALI ${A.sen} → ${A.motor}. Satır 2: ${A.sen} → TON T1 (${fx(t)} sn). Satır 3: T1 → ${A.pist}.`,`Rung 1: ${A.sw} · NC ${A.sen} → ${A.motor}. Rung 2: ${A.sen} → TON T1 (${fx(t)} s). Rung 3: T1 → ${A.pist}.`),io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'divert',n:nd}],sol,bot:at([[0.5,A.sw]])};
};
const tLampDelay=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'HAZIR'}); const sp=spd(r,k), sx=ri(r,50,85), t=pick(r,[1,1.5,2,2.5,3,4,5]);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor]),R(['NO '+A.sen,null,null,null,'TON T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,sensors:[{a:A.sen,x:sx}],lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'HAZIR'}],lampDelay:{t,s:A.sen},endMsg:tx('Hata: Kutu sensörde durmadı!','Error: Box did not stop at the sensor!')};
  return {title:tx(`TON: ${fx(t)} sn Sonra Lamba`,`TON: Lamp after ${fx(t)} s`),task:tx(`Şalter (${A.sw}) açık: bant çalışsın, kutu sensörde (${A.sen}) dursun. Kutu durduktan ${fx(t)} sn sonra HAZIR lambası (${A.lamp}) yansın.`,`Switch (${A.sw}) ON: belt runs, box stops at the sensor (${A.sen}). ${fx(t)} s after the box stops, the READY lamp (${A.lamp}) lights.`),
    hint:tx(`Satır 2: ${A.sen} → TON T1 (${fx(t)} sn). Satır 3: T1 → ${A.lamp}.`,`Rung 2: ${A.sen} → TON T1 (${fx(t)} s). Rung 3: T1 → ${A.lamp}.`),io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'park',s:A.sen,hold:1},{k:'lampDelay'}],sol,bot:at([[0.5,A.sw]])};
};
const tLampTof=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw'],['motor','lamp'],{lamp:'UYARI'}); const sp=spd(r,k), t=pick(r,[1,1.5,2,2.5,3,4]);
  const sol={rungs:[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.motor,null,null,null,'TOF T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:4,endDrop:'deliver',lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'UYARI'}],lampTof:{src:'motor',t}};
  return {title:tx(`TOF: ${fx(t)} sn Uyarı`,`TOF: ${fx(t)} s Warning`),task:tx(`Şalter (${A.sw}) bandı (${A.motor}) çalıştırsın. UYARI lambası (${A.lamp}) bant çalışırken yansın ve bant durduktan ${fx(t)} sn sonra sönsün. Şalteri açıp kapat.`,`The switch (${A.sw}) runs the belt (${A.motor}). The WARNING lamp (${A.lamp}) is on while the belt runs and goes off ${fx(t)} s after it stops. Turn the switch on, then off.`),
    hint:tx(`Satır 2: ${A.motor} → TOF T1 (${fx(t)} sn). Satır 3: T1 → ${A.lamp}.`,`Rung 2: ${A.motor} → TOF T1 (${fx(t)} s). Rung 3: T1 → ${A.lamp}.`),io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'lampTof'}],sol,bot:at([[0.5,A.sw],[3.5,A.sw]])};
};
const sealM=A=>R(['NO '+A.start,'NC '+A.stop,null,null,'COIL M0.0'],['NO M0.0']);
const tStopDelay=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['motor']); const sp=spd(r,k), t=pick(r,[1.5,2,2.5,3,4,5]);
  const sol={rungs:[sealM(A),R(['NO M0.0',null,null,null,'TOF T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:6,endDrop:'deliver',startA:A.start,stopA:A.stop,startFirst:true,stopDelay:t};
  return {title:tx(`TOF: ${fx(t)} sn Gecikmeli Durdurma`,`TOF: ${fx(t)} s Delayed Stop`),task:tx(`START (${A.start}) / STOP (${A.stop}) ile mühür biti M0.0 kur. Bant (${A.motor}) STOP'tan ${fx(t)} sn SONRA dursun (TOF).`,`Use START (${A.start}) / STOP (${A.stop}) to seal memory bit M0.0. The belt (${A.motor}) stops ${fx(t)} s AFTER STOP (TOF).`),
    hint:tx(`Satır 1: (${A.start} ∥ M0.0) · KAPALI ${A.stop} → M0.0. Satır 2: M0.0 → TOF T1 (${fx(t)} sn). Satır 3: T1 → ${A.motor}.`,`Rung 1: (${A.start} ∥ M0.0) · NC ${A.stop} → M0.0. Rung 2: M0.0 → TOF T1 (${fx(t)} s). Rung 3: T1 → ${A.motor}.`),io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'seal'},{k:'stopDelay',t}],sol,bot:at([[0.5,A.start],[4,A.stop]])};
};
const tFill=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','valve'],{valve:'DOLUM_VALF'}); const sp=spd(r,k), sx=ri(r,40,65), t=pick(r,[1.5,2,2.5,3,4]), nf=ri(r,2,4);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor],[null,'NO T1']),R(['NO '+A.sen,null,null,null,'TON T1 '+t]),R(['NO '+A.sen,'NC T1',null,null,'COIL '+A.valve])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:nf+1,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],valves:[{a:A.valve,x:sx,fillTime:t,kind:'fill'}]};
  return {title:tx(`Dolum İstasyonu (${fx(t)} sn)`,`Filling Station (${fx(t)} s)`),task:tx(`Şişe sensörde (${A.sen}) dursun, valf (${A.valve}) ${fx(t)} sn dolum yapsın, sonra bant devam etsin. Dolum tam ${fx(t)} sn sürer. ${nf} şişe doldur.`,`The bottle stops at the sensor (${A.sen}), the valve (${A.valve}) fills for ${fx(t)} s, then the belt continues. Filling takes exactly ${fx(t)} s. Fill ${nf} bottles.`),
    hint:tx(`Bant: ${A.sw} · (KAPALI ${A.sen} ∥ AÇIK T1) → ${A.motor}. ${A.sen} → TON T1 (${fx(t)} sn). Valf: ${A.sen} · KAPALI T1 → ${A.valve}.`,`Belt: ${A.sw} · (NC ${A.sen} ∥ NO T1) → ${A.motor}. ${A.sen} → TON T1 (${fx(t)} s). Valve: ${A.sen} · NC T1 → ${A.valve}.`),io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'fill',n:nf,lb:tx('Dolu','Filled')}],sol,bot:at([[0.5,A.sw]])};
};
const tStartDelay=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['motor','lamp'],{lamp:'KALKIŞ_İKAZ'}); const sp=spd(r,k), t=pick(r,[1.5,2,2.5,3,4]);
  const sol={rungs:[sealM(A),R(['NO M0.0',null,null,null,'TON T1 '+t]),R(['NO M0.0','NC T1',null,null,'COIL '+A.lamp]),R(['NO T1',null,null,null,'COIL '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:4,endDrop:'deliver',startA:A.start,stopA:A.stop,startFirst:true,startDelay:t,lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'İKAZ'}]};
  return {title:tx(`Gecikmeli Kalkış (${fx(t)} sn)`,`Delayed Start (${fx(t)} s)`),task:tx(`START (${A.start}) basılınca önce ikaz lambası (${A.lamp}) ${fx(t)} sn yansın, sonra lamba sönüp bant (${A.motor}) kalksın. STOP (${A.stop}) her şeyi durdursun.`,`When START (${A.start}) is pressed, the warning lamp (${A.lamp}) lights for ${fx(t)} s, then it goes off and the belt (${A.motor}) starts. STOP (${A.stop}) stops everything.`),
    hint:tx(`M0.0 mühür · M0.0 → TON T1 (${fx(t)} sn) · M0.0 · KAPALI T1 → ${A.lamp} · T1 → ${A.motor}.`,`M0.0 seal-in · M0.0 → TON T1 (${fx(t)} s) · M0.0 · NC T1 → ${A.lamp} · T1 → ${A.motor}.`),io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'seal'},{k:'startDelay'}],sol,bot:at([[0.5,A.start]])};
};
const hBooth=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','fan','valve'],{valve:'BOYA_VALF'}); const sp=spd(r,k), sx=ri(r,38,58), t1=pick(r,[1.5,2,2.5,3]), h=pick(r,[2,2.5,3,3.5]);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor],[null,'NO T1']),R(['NO '+A.sen,null,null,null,'TON T1 '+t1]),R(['NO '+A.sen,'NC T1',null,null,'COIL '+A.valve]),R(['NO '+A.valve,null,null,null,'TOF T2 '+h]),R(['NO T2',null,null,null,'COIL '+A.fan])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],valves:[{a:A.valve,x:sx,fillTime:t1,kind:'spray'}],fan:{a:A.fan,spray:A.valve,hold:h}};
  return {title:tx('Boya Kabini (TON + TOF)','Paint Booth (TON + TOF)'),task:tx(`Kutu kabinde (${A.sen}) durunca boya (${A.valve}) ${fx(t1)} sn püskürsün. Fan (${A.fan}) boya sırasında çalışsın ve püskürtme bittikten ${fx(h)} sn sonra dursun. 3 kutu boya.`,`When the box stops in the booth (${A.sen}), paint (${A.valve}) sprays for ${fx(t1)} s. The fan (${A.fan}) runs while painting and stops ${fx(h)} s after spraying ends. Paint 3 boxes.`),
    hint:tx(`5 satır: ${A.sw} · (KAPALI ${A.sen} ∥ T1) → ${A.motor} · ${A.sen} → TON T1 (${fx(t1)} sn) · ${A.sen} · KAPALI T1 → ${A.valve} · ${A.valve} → TOF T2 (${fx(h)} sn) · T2 → ${A.fan}.`,`5 rungs: ${A.sw} · (NC ${A.sen} ∥ T1) → ${A.motor} · ${A.sen} → TON T1 (${fx(t1)} s) · ${A.sen} · NC T1 → ${A.valve} · ${A.valve} → TOF T2 (${fx(h)} s) · T2 → ${A.fan}.`),io,M:2,T:2,C:0,pal:PAL_C,scene:sc,goals:[{k:'fill',n:3,lb:tx('Boyalı','Painted')},{k:'fanHold',t:h}],sol,bot:at([[0.5,A.sw]])};
};
const hDelays=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['motor','lamp'],{lamp:'KALKIŞ_İKAZ'}); const sp=spd(r,k), t1=pick(r,[1.5,2,2.5,3]), t2=pick(r,[1.5,2,2.5,3,4]);
  const sol={rungs:[sealM(A),R(['NO M0.0',null,null,null,'TON T1 '+t1]),R(['NO M0.0','NC T1',null,null,'COIL '+A.lamp]),R(['NO T1',null,null,null,'TOF T2 '+t2]),R(['NO T2',null,null,null,'COIL '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:8,endDrop:'deliver',startA:A.start,stopA:A.stop,startFirst:true,startDelay:t1,stopDelay:t2,lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'İKAZ'}]};
  return {title:tx('Gecikmeli Kalkış + Duruş','Delayed Start + Stop'),task:tx(`START (${A.start}): ikaz lambası (${A.lamp}) ${fx(t1)} sn yansın, sonra bant (${A.motor}) kalksın. STOP (${A.stop}): bant ${fx(t2)} sn sonra dursun.`,`START (${A.start}): the warning lamp (${A.lamp}) lights for ${fx(t1)} s, then the belt (${A.motor}) starts. STOP (${A.stop}): the belt stops ${fx(t2)} s later.`),
    hint:tx(`M0.0 mühür · M0.0→TON T1 (${fx(t1)}) · M0.0·KAPALI T1→${A.lamp} · T1→TOF T2 (${fx(t2)}) · T2→${A.motor}.`,`M0.0 seal-in · M0.0→TON T1 (${fx(t1)}) · M0.0·NC T1→${A.lamp} · T1→TOF T2 (${fx(t2)}) · T2→${A.motor}.`),io,M:2,T:2,C:0,pal:PAL_C,scene:sc,
    goals:[{k:'seal'},{k:'startDelay'},{k:'stopDelay',t:t2}],sol,bot:at([[0.5,A.start],[0.5+t1+3,A.stop]])};
};
const hTonTof=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','pist','lamp'],{lamp:'AYIRMA'}); const sp=spd(r,k), sx=ri(r,45,70), t=pick(r,[1,1.5,2,2.5]), h=pick(r,[1.5,2,2.5,3]);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor]),R(['NO '+A.sen,null,null,null,'TON T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.pist]),R(['NO '+A.pist,null,null,null,'TOF T2 '+h]),R(['NO T2',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:3,sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx}],waitSensor:A.sen,waitRange:[t-0.2,t+0.8],lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'AYIRMA'}],lampTof:{src:A.pist,t:h}};
  return {title:tx('TON İtme + TOF Lamba','TON Push + TOF Lamp'),task:tx(`Kutu sensörde (${A.sen}) dursun, ${fx(t)} sn sonra piston (${A.pist}) itsin. Sarı lamba (${A.lamp}) piston iterken yansın ve piston geri çekildikten ${fx(h)} sn sonra sönsün. 3 kutu ayır.`,`The box stops at the sensor (${A.sen}); ${fx(t)} s later the piston (${A.pist}) pushes. The amber lamp (${A.lamp}) is on while pushing and goes off ${fx(h)} s after the piston retracts. Divert 3 boxes.`),
    hint:tx(`5 satır: ${A.sw} · KAPALI ${A.sen} → ${A.motor} · ${A.sen} → TON T1 (${fx(t)} sn) · T1 → ${A.pist} · ${A.pist} → TOF T2 (${fx(h)} sn) · T2 → ${A.lamp}.`,`5 rungs: ${A.sw} · NC ${A.sen} → ${A.motor} · ${A.sen} → TON T1 (${fx(t)} s) · T1 → ${A.pist} · ${A.pist} → TOF T2 (${fx(h)} s) · T2 → ${A.lamp}.`),io,M:2,T:2,C:0,pal:PAL_C,scene:sc,goals:[{k:'divert',n:3},{k:'lampTof'}],sol,bot:at([[0.5,A.sw]])};
};

/* ---------- SAYICILAR ---------- */
const cBatch=ctd=>(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'PARTİ_TAMAM'}); const sp=spd(r,k), sx=ri(r,40,70), N=ri(r,2,4)+Math.round(k*4);
  const typ=ctd?'CTD':'CTU';
  const sol={rungs:[R(['NO '+A.sen,null,null,null,typ+' C1 '+N]),R(['NO '+A.sw,'NC C1',null,null,'COIL '+A.motor]),R(['NO C1',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:N+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,batchN:N,lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'PARTİ'}]};
  return {title:tx(`${typ}: ${N} Kutu Say`,`${typ}: Count ${N} Boxes`),task:tx(ctd?`Şalter (${A.sw}) açık: bant çalışsın. ${typ} sayıcı ${N}'den geri saysın; sensörden (${A.sen}) ${N} kutu geçince (0) bant dursun ve PARTİ lambası (${A.lamp}) yansın.`
      :`Şalter (${A.sw}) açık: bant çalışsın. Sensörden (${A.sen}) ${N} kutu geçince (CTU) bant dursun ve PARTİ lambası (${A.lamp}) yansın.`,ctd?`Switch (${A.sw}) ON: belt runs. The ${typ} counts down from ${N}; after ${N} boxes pass the sensor (${A.sen}) (0) the belt stops and the BATCH lamp (${A.lamp}) lights.`:`Switch (${A.sw}) ON: belt runs. After ${N} boxes pass the sensor (${A.sen}) (CTU) the belt stops and the BATCH lamp (${A.lamp}) lights.`),
    hint:tx(`Satır 1: ${A.sen} → ${typ} C1 (${N}). Satır 2: ${A.sw} · KAPALI C1 → ${A.motor}. Satır 3: C1 → ${A.lamp}.`,`Rung 1: ${A.sen} → ${typ} C1 (${N}). Rung 2: ${A.sw} · NC C1 → ${A.motor}. Rung 3: C1 → ${A.lamp}.`),io,M:2,T:0,C:1,pal:PAL_D,scene:sc,goals:[{k:'batch',n:1}],sol,bot:at([[0.5,A.sw]])};
};
const cLampCount=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'SAYAÇ_DOLU'}); const sp=spd(r,k), sx=ri(r,30,60), N=ri(r,2,4)+Math.round(k*4);
  const sol={rungs:[R(['NO '+A.sen,null,null,null,'CTU C1 '+N]),R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO C1',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:N+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,lampCount:{n:N},lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'SAYAÇ'}]};
  return {title:tx(`CTU: ${N}. Kutuda Lamba`,`CTU: Lamp at Box ${N}`),task:tx(`Şalter (${A.sw}) bandı çalıştırsın (bant durmasın). Sensörden (${A.sen}) ${N} kutu geçince SAYAÇ lambası (${A.lamp}) yansın. ${N+1} kutuyu teslim et.`,`The switch (${A.sw}) runs the belt (it must not stop). After ${N} boxes pass the sensor (${A.sen}) the COUNT lamp (${A.lamp}) lights. Deliver ${N+1} boxes.`),
    hint:`${A.sen} → CTU C1 (${N}) · ${A.sw} → ${A.motor} · C1 → ${A.lamp}.`,io,M:2,T:0,C:1,pal:PAL_D,scene:sc,goals:[{k:'lampCount'},{k:'deliver',n:N+1}],sol,bot:at([[0.5,A.sw]])};
};
const mDivert=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen','lim'],['motor','pist']); const sp=spd(r,k), sx=ri(r,45,70), N=ri(r,2,3)+Math.round(k*2);
  const sol={rungs:[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.sen,null,null,null,'CTU C1 '+N]),R(['NO C1',null,null,null,'COIL '+A.pist]),R(['NO '+A.lim,null,null,null,'RST C1'])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:2*N+1,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx,lim:A.lim}],divertEvery:N};
  return {title:tx(`CTU: Her ${N}. Kutuyu Ayır`,`CTU: Divert Every ${N}th Box`),task:tx(`Bant şalterle (${A.sw}) çalışsın. Her ${N}. kutuyu piston (${A.pist}) ayırsın; piston tam ilerleyince (${A.lim}) sayıcıyı Reset et. 2 kutu ayır.`,`The switch (${A.sw}) runs the belt. The piston (${A.pist}) diverts every ${N}th box; at full stroke (${A.lim}) Reset the counter. Divert 2 boxes.`),
    hint:`${A.sw}→${A.motor} · ${A.sen}→CTU C1 (${N}) · C1→${A.pist} · ${A.lim}→(R) C1.`,io,M:2,T:0,C:1,pal:PAL_D,scene:sc,goals:[{k:'divert',n:2},{k:'deliver',n:2*(N-1)}],sol,bot:at([[0.5,A.sw]])};
};
const twoBatchBot=A=>once((w,P,t,st)=>{ if(!st.a&&t>0.5){ st.a=1; P(A.start); } if(st.a===1&&w.batches>=1&&!w.motor){ st.a=2; st.t=t; } if(st.a===2&&t>st.t+0.6){ st.a=3; P(A.start); } });
const mCtdTwo=stop=>(r,k,n)=>{
  const iN=stop?['start','stop','sen']:['start','sen'];
  const {A,io}=mkCtx(r,n,iN,['motor','lamp'],{lamp:'PALET_DOLU'}); const sp=spd(r,k), sx=ri(r,40,65), N=ri(r,2,3)+Math.round(k*3);
  const row0=['NO '+A.start,'NC C1',null,null,'COIL '+A.motor]; if(stop){ row0[1]='NC '+A.stop; row0[2]='NC C1'; }
  const sol={rungs:[R(['NO '+A.sen,null,null,null,'CTD C1 '+N]),R(row0,['NO '+A.motor]),R(['NO C1',null,null,null,'COIL '+A.lamp]),R(['NO '+A.start,null,null,null,'RST C1'])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:2*N+2,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],startA:A.start,startFirst:true,countSensor:A.sen,batchN:N,lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'PALET'}]};
  if(stop) sc.stopA=A.stop;
  return {title:tx(stop?`CTD: Mühürlü Palet (${N})`:`CTD: Palet Geri Sayımı (${N})`,stop?`CTD: Sealed Pallet (${N})`:`CTD: Pallet Countdown (${N})`),task:tx(`START (${A.start}) bandı mühürlü başlatsın${stop?`, STOP (${A.stop}) durdursun`:''}. Palet ${N} kutu alınca (CTD sıfıra iner) bant dursun, PALET lambası (${A.lamp}) yansın. START sayacı yeniden yüklesin. 2 parti tamamla.`,`START (${A.start}) starts the belt with a seal-in${stop?`, STOP (${A.stop}) stops it`:''}. When the pallet gets ${N} boxes (CTD reaches zero) the belt stops and the PALLET lamp (${A.lamp}) lights. START reloads the counter. Complete 2 batches.`),
    hint:tx(`${A.sen}→CTD C1 (${N}) · (START ∥ ${A.motor})${stop?` · KAPALI ${A.stop}`:''} · KAPALI C1 → ${A.motor} · C1→${A.lamp} · ${A.start}→(R) C1.`,`${A.sen}→CTD C1 (${N}) · (START ∥ ${A.motor})${stop?` · NC ${A.stop}`:''} · NC C1 → ${A.motor} · C1→${A.lamp} · ${A.start}→(R) C1.`),io,M:2,T:0,C:1,pal:PAL_D,scene:sc,
    goals:stop?[{k:'seal'},{k:'batch',n:2}]:[{k:'batch',n:2}],sol,bot:twoBatchBot(A)};
};
const mRestart=seal=>(r,k,n)=>{
  const iN=seal?['start','stop','sen']:['sw','sen'];
  const {A,io}=mkCtx(r,n,iN,['motor','lamp'],{lamp:'PARTİ'}); const sp=spd(r,k), sx=ri(r,40,65), N=ri(r,2,3)+Math.round(k*3), t=pick(r,[1.5,2,2.5,3]);
  const run=seal?'M0.0':A.sw;
  const rs=[]; if(seal) rs.push(sealM(A));
  rs.push(R(['NO '+A.sen,null,null,null,'CTU C1 '+N]),R(['NO '+run,'NC C1',null,null,'COIL '+A.motor]),R(['NO C1',null,null,null,'TON T1 '+t]),R(['NO T1',null,null,null,'RST C1']),R(['NO C1',null,null,null,'COIL '+A.lamp]));
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:2*N+2,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,batchN:N,restartAfter:t,lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'PARTİ'}]};
  if(seal){ sc.startA=A.start; sc.stopA=A.stop; sc.startFirst=true; }
  return {title:tx(seal?'Mühürlü Otomatik Parti Hattı':`Otomatik Parti (${N} kutu / ${fx(t)} sn)`,seal?'Sealed Automatic Batch Line':`Automatic Batch (${N} boxes / ${fx(t)} s)`),
    task:tx((seal?`START (${A.start}) / STOP (${A.stop}) mühürlü hat (M0.0). `:`Şalter (${A.sw}) açık. `)+`${N} kutu sayılınca bant dursun, PARTİ lambası (${A.lamp}) yansın; ${fx(t)} sn bekleyip sayıcı kendini sıfırlasın ve bant yeniden kalksın. 2 parti tamamla.`,(seal?`START (${A.start}) / STOP (${A.stop}) sealed line (M0.0). `:`Switch (${A.sw}) ON. `)+`After ${N} boxes the belt stops and the BATCH lamp (${A.lamp}) lights; after ${fx(t)} s the counter resets itself and the belt restarts. Complete 2 batches.`),
    hint:tx((seal?'M0.0 mühür · ':'')+`${A.sen}→CTU C1 (${N}) · ${run} · KAPALI C1 → ${A.motor} · C1→TON T1 (${fx(t)}) · T1→(R) C1 · C1→${A.lamp}.`,(seal?'M0.0 seal-in · ':'')+`${A.sen}→CTU C1 (${N}) · ${run} · NC C1 → ${A.motor} · C1→TON T1 (${fx(t)}) · T1→(R) C1 · C1→${A.lamp}.`),io,M:2,T:1,C:1,pal:PAL_D,scene:sc,
    goals:seal?[{k:'seal'},{k:'batch',n:2},{k:'restart'}]:[{k:'batch',n:2},{k:'restart'}],sol:{rungs:rs},bot:at([[0.5,seal?A.start:A.sw]])};
};
const hFinal=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop','sen','lim'],['motor','pist','lamp'],{lamp:'AYIRMA'}); const sp=spd(r,k), sx=ri(r,45,70), N=ri(r,3,4)+Math.round(k*3);
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,null,null,'COIL '+A.motor],['NO '+A.motor]),R(['NO '+A.sen,null,null,null,'CTU C1 '+N]),R(['NO C1',null,null,null,'COIL '+A.pist]),R(['NO '+A.lim,null,null,null,'RST C1']),R(['NO '+A.pist,null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:2*N+2,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx,lim:A.lim}],divertEvery:N,startA:A.start,stopA:A.stop,startFirst:true,lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'AYIRMA'}]};
  return {title:tx(`Otomatik Hat: Her ${N}. Kutu`,`Automatic Line: Every ${N}th Box`),task:tx(`Mühürlü START (${A.start}) / STOP (${A.stop}) ile bant çalışsın. Her ${N}. kutuyu piston (${A.pist}) ayırsın, ${A.lim} ile sayıcı sıfırlansın, ayırma sırasında lamba (${A.lamp}) yansın. 2 kutu ayır.`,`A sealed START (${A.start}) / STOP (${A.stop}) runs the belt. The piston (${A.pist}) diverts every ${N}th box, ${A.lim} resets the counter, and the lamp (${A.lamp}) is on while diverting. Divert 2 boxes.`),
    hint:tx(`Mühürlü motor · ${A.sen}→CTU C1 (${N}) · C1→${A.pist} · ${A.lim}→(R) C1 · ${A.pist}→${A.lamp}.`,`Sealed motor · ${A.sen}→CTU C1 (${N}) · C1→${A.pist} · ${A.lim}→(R) C1 · ${A.pist}→${A.lamp}.`),io,M:2,T:0,C:1,pal:PAL_D,scene:sc,goals:[{k:'seal'},{k:'divert',n:2},{k:'lampPush'}],sol,bot:at([[0.5,A.start]])};
};

