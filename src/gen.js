/* ===== BÖLÜM ÜRETİCİ: 3 kategori × 3 zorluk × 100 bölüm ===== */
const IN=(a,n,k)=>({a,n,k}), O=(a,n)=>({a,n});
const PAL_A=['NO','NC','COIL'], PAL_B=PAL_A.concat(['SET','RST']), PAL_C=PAL_B.concat(['TON','TOF']), PAL_D=PAL_C.concat(['CTU','CTD']);
const CATS=[
  {n:'Temel Mantık',s:'Kontak · Bobin · Mühürleme · Set/Reset',ic:'NO',c:'#4da3ff'},
  {n:'Zamanlayıcılar',s:'TON · TOF gecikmeleri',ic:'TON',c:'#ffb020'},
  {n:'Sayıcılar',s:'CTU · CTD sayma',ic:'CTU',c:'#c77dff'}];
const DIFFS=[
  {n:'Kolay',c:'#39ff6a',s:'Temel devreler, yavaş bant'},
  {n:'Orta',c:'#ffb020',s:'Mühürleme ve kombinasyonlar'},
  {n:'Zor',c:'#ff4d4d',s:'Çok satırlı, hızlı hat'}];
const PER=100, TOTAL=CATS.length*DIFFS.length*PER;

function mkRng(seed){ let s=(Math.imul(seed+1,2654435761))>>>0||1; return ()=>{ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function shuf(a,r){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const spd=(r,k)=>Math.round(18+k*9+ri(r,0,3));
const gp=k=>+(1.4-k*0.22).toFixed(2);
const tr=x=>String(x).replace('.',',');
const INDEF={start:['START','btn'],stop:['STOP','btn'],sw:['ŞALTER','sw'],sw2:['ŞALTER_2','sw'],gate:['ONAY_ANAH','sw'],ack:['ONAY','btn'],sen:['SENSÖR','sensor'],lim:['PİSTON_İLERİ','limit']};
const QDEF={motor:'BANT_MOTOR',pist:'PİSTON',lamp:'LAMBA',fan:'EGZOZ_FAN',valve:'VALF'};
function mkCtx(r,n,iN,qN,qt){
  const I=['I0.0','I0.1','I0.2','I0.3','I0.4','I0.5','I0.6','I0.7'], Q=['Q0.0','Q0.1','Q0.2','Q0.3','Q0.4','Q0.5'];
  if(n>=6){ shuf(I,r); shuf(Q,r); }
  const A={}; iN.forEach((k,i)=>A[k]=I[i]); qN.forEach((k,i)=>A[k]=Q[i]);
  const srt=(x,y)=>x.a<y.a?-1:1;
  const io={I:iN.map(k=>IN(A[k],INDEF[k][0],INDEF[k][1])).sort(srt),Q:qN.map(k=>O(A[k],(qt&&qt[k])||QDEF[k])).sort(srt)};
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
  if(sm){ sc.sensors=[{a:A.sen,x:sx}]; sc.endMsg='Hata: Kutu sensörde durmadı, bant sonuna ulaştı!'; } else sc.endDrop='deliver';
  if(mode==='and') sc.motorAnd=[A.sw,A.sw2]; if(mode==='or') sc.motorOr=[A.sw,A.sw2];
  if(sm===2){ sc.lampA=A.lamp; sc.lamps=[{a:A.lamp,c:'green',n:'ÇALIŞIYOR'}]; }
  const goals=sm?(sm===2?[{k:'lampRun'},{k:'park',s:A.sen,hold:1.5}]:[{k:'park',s:A.sen,hold:1.5}]):[{k:'deliver',n:nb}];
  if(mode==='and') goals.unshift({k:'andTest'}); if(mode==='or') goals.unshift({k:'orTest'});
  const T0={direct:'Şalter → Motor',and:'Çift Şalter (VE)',or:'Çift Şalter (VEYA)'}[mode]+(sm===1?' + Sensör':sm===2?' + Lamba':'');
  let task={direct:`Şalter (${A.sw}) açılınca bant motoru (${A.motor}) çalışsın.`,and:`İki şalter (${A.sw} ve ${A.sw2}) AYNI ANDA açıkken bant (${A.motor}) çalışsın.`,or:`Şalterlerden (${A.sw} veya ${A.sw2}) herhangi biri açıkken bant (${A.motor}) çalışsın.`}[mode];
  task+=sm?` Kutu sensöre (${A.sen}) gelince bant dursun.`:` ${nb} kutuyu depoya ulaştır.`;
  if(sm===2) task+=` Bant çalışırken lamba (${A.lamp}) yansın.`;
  if(mode==='and') task+=' Test: önce tek şalteri aç, bandın DURDUĞUNU göster.'; if(mode==='or') task+=' Test: her şalterin TEK BAŞINA bandı çalıştırdığını göster.';
  const hint={direct:`Açık kontak ${A.sw} → bobin ${A.motor}.`,and:`VE = seri bağlantı: iki açık kontağı yan yana koy.`,or:`VEYA = paralel bağlantı: ⋮ menüsünden paralel kol ekle, ${A.sw2} kontağını alt kola koy.`}[mode]
    +(sm?` Seriye KAPALI kontak ${A.sen} ekle.`:'')+(sm===2?` 2. satır: açık kontak ${A.motor} → bobin ${A.lamp}.`:'');
  const bot=mode==='and'?at([[0.5,A.sw],[1.6,A.sw2]]):mode==='or'?at([[0.5,A.sw],[1.2,A.sw],[1.2,A.sw2]]):at([[0.5,A.sw]]);
  return {title:T0,task,hint,io,M:0,T:0,C:0,pal:PAL_A,scene:sc,goals,sol,bot};
};
const mSeal=sm=>(r,k,n)=>{
  const iN=['start','stop']; if(sm) iN.push('sen'); const qN=['motor']; if(sm===2) qN.push('lamp');
  const {A,io}=mkCtx(r,n,iN,qN,{lamp:'ÇALIŞIYOR'}); const sp=spd(r,k), sx=ri(r,55,85), nb=ri(r,3,5);
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,sm?'NC '+A.sen:null,null,'COIL '+A.motor],['NO '+A.motor])]};
  if(sm===2) sol.rungs.push(R(['NO '+A.motor,null,null,null,'COIL '+A.lamp]));
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:sm?3:nb+3,startA:A.start,stopA:A.stop,startFirst:true};
  if(sm){ sc.sensors=[{a:A.sen,x:sx}]; sc.endMsg='Hata: Kutu sensörde durmadı, bant sonuna ulaştı!'; } else sc.endDrop='deliver';
  if(sm===2){ sc.lampA=A.lamp; sc.lamps=[{a:A.lamp,c:'green',n:'ÇALIŞIYOR'}]; }
  const goals=sm===0?[{k:'seal'},{k:'stop'},{k:'deliver',n:nb}]:sm===1?[{k:'seal'},{k:'park',s:A.sen,hold:1.5}]:[{k:'seal'},{k:'lampRun'},{k:'park',s:A.sen,hold:1.5}];
  let task=`START (${A.start}) kısa basınca bant (${A.motor}) çalışmaya devam etsin (mühür), STOP (${A.stop}) durdursun.`;
  task+=sm===0?` START → STOP → START ile ${nb} kutu teslim et.`:` Kutu sensöre (${A.sen}) gelince bant dursun.`; if(sm===2) task+=` Çalışırken lamba (${A.lamp}) yansın.`;
  const hint=`START ile paralel ${A.motor} kontağı (⋮ → Paralel kol), seriye KAPALI ${A.stop}`+(sm?` ve KAPALI ${A.sen}`:'')+'.'+(sm===2?` 2. satır: ${A.motor} → ${A.lamp}.`:'');
  const bot=sm===0?at([[0.5,A.start],[3,A.stop],[5,A.start]]):at([[0.5,A.start]]);
  return {title:['Start/Stop Mühürleme','Mühür + Sensör','Mühür + Sensör + Lamba'][sm],task,hint,io,M:2,T:0,C:0,pal:PAL_A,scene:sc,goals,sol,bot};
};
const mSR=sm=>(r,k,n)=>{
  const iN=sm?['start','sen']:['start','stop']; const {A,io}=mkCtx(r,n,iN,['motor']); const sp=spd(r,k), sx=ri(r,55,85), nb=ri(r,3,5);
  const sol={rungs:[R(['NO '+A.start,null,null,null,'SET '+A.motor]),R(['NO '+(sm?A.sen:A.stop),null,null,null,'RST '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:sm?3:nb+3,startA:A.start,startFirst:true};
  if(sm){ sc.sensors=[{a:A.sen,x:sx}]; sc.endMsg='Hata: Kutu hedef sensörde durmadı!'; } else { sc.stopA=A.stop; sc.endDrop='deliver'; }
  const goals=sm?[{k:'seal'},{k:'park',s:A.sen,hold:1.5}]:[{k:'seal'},{k:'stop'},{k:'deliver',n:nb}];
  const task=sm?`START (${A.start}) bandı Set etsin; kutu hedef sensöre (${A.sen}) gelince bant Reset ile dursun.`:`START (${A.start}) bandı kalıcı çalıştırsın (Set), STOP (${A.stop}) durdursun (Reset). START → STOP → START ile ${nb} kutu teslim et.`;
  const hint=`Satır 1: ${A.start} → (S) ${A.motor}. Satır 2: ${sm?A.sen:A.stop} → (R) ${A.motor}.`;
  return {title:sm?'Set/Reset: Hedefte Dur':'Set/Reset ile Çalıştır',task,hint,io,M:2,T:0,C:0,pal:PAL_B,scene:sc,goals,sol,bot:sm?at([[0.5,A.start]]):at([[0.5,A.start],[3,A.stop],[5,A.start]])};
};
const pistBot=(A,sp,sx)=>once((w,P,t,st)=>{ st.n=st.n||0; const per=sx/sp+1.6; if(t>=0.5+st.n*per){ st.n++; P(A.start); } });
const mPist=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','sen','lim'],['motor','pist']); const sp=spd(r,k), sx=ri(r,45,75), nd=ri(r,2,3);
  const sol={rungs:[R(['NO '+A.start,null,null,null,'SET '+A.motor]),R(['NO '+A.sen,null,null,null,'RST '+A.motor]),R(['NO '+A.sen,null,null,null,'SET '+A.pist]),R(['NO '+A.lim,null,null,null,'RST '+A.pist])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:nd+2,sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx,lim:A.lim}],startA:A.start,startFirst:true};
  return {title:'Pistonla Ayır (S/R)',task:`START (${A.start}) bandı başlatsın. Kutu sensöre (${A.sen}) gelince bant dursun, piston (${A.pist}) itsin; tam ilerleyince (${A.lim}) geri dönsün. ${nd} kutu ayır.`,
    hint:`${A.start}→(S)${A.motor} · ${A.sen}→(R)${A.motor} · ${A.sen}→(S)${A.pist} · ${A.lim}→(R)${A.pist}. Her kutu için START'a bas.`,io,M:2,T:0,C:0,pal:PAL_B,scene:sc,goals:[{k:'divert',n:nd}],sol,bot:pistBot(A,sp,sx)};
};
const hArriza=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','ack','sen'],['motor','lamp'],{lamp:'ARIZA'}); const sp=spd(r,k), sx=ri(r,60,85);
  const sol={rungs:[R(['NO '+A.start,null,null,null,'SET '+A.motor]),R(['NO '+A.sen,null,null,null,'RST '+A.motor]),R(['NO '+A.sen,null,null,null,'SET '+A.lamp]),R(['NO '+A.ack,null,null,null,'RST '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,sensors:[{a:A.sen,x:sx}],startA:A.start,startFirst:true,ackA:A.ack,lampA:A.lamp,lamps:[{a:A.lamp,c:'red',n:'ARIZA'}],endMsg:'Hata: Kutu uç sensörde durmadı!'};
  return {title:'Arıza Lambası',task:`START (${A.start}) ile başlat. Kutu uç sensöre (${A.sen}) gelince bant dursun ve ARIZA lambası (${A.lamp}) kalıcı yansın. ONAY (${A.ack}) lambayı söndürsün.`,
    hint:`4 satır: ${A.start}→(S)${A.motor} · ${A.sen}→(R)${A.motor} · ${A.sen}→(S)${A.lamp} · ${A.ack}→(R)${A.lamp}.`,io,M:2,T:0,C:0,pal:PAL_B,scene:sc,
    goals:[{k:'park',s:A.sen,hold:1},{k:'lampPark'},{k:'lampAck'}],sol,bot:at([[0.5,A.start],[0.5+sx/sp+3,A.ack]])};
};
const hPistLamp=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','sen','lim'],['motor','pist','lamp'],{lamp:'AYIRMA'}); const sp=spd(r,k), sx=ri(r,50,75), nd=ri(r,2,3);
  const sol={rungs:[R(['NO '+A.start,null,null,null,'SET '+A.motor]),R(['NO '+A.sen,null,null,null,'RST '+A.motor]),R(['NO '+A.sen,null,null,null,'SET '+A.pist]),R(['NO '+A.lim,null,null,null,'RST '+A.pist]),R(['NO '+A.pist,null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:nd+2,sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx,lim:A.lim}],startA:A.start,startFirst:true,lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'AYIRMA'}]};
  return {title:'Ayırıcı + İkaz Lambası',task:`START (${A.start}) bandı Set etsin. Kutu sensörde (${A.sen}) bant dursun, piston (${A.pist}) itsin, ${A.lim} ile geri dönsün. Piston çalışırken sarı lamba (${A.lamp}) yansın. ${nd} kutu ayır.`,
    hint:`Pistonla Ayır devresine 5. satır ekle: ${A.pist} → ${A.lamp}.`,io,M:2,T:0,C:0,pal:PAL_B,scene:sc,goals:[{k:'seal'},{k:'divert',n:nd},{k:'lampPush'}],sol,bot:pistBot(A,sp,sx)};
};
const hAckLatch=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop','ack','sen'],['motor','lamp'],{lamp:'ARIZA'}); const sp=spd(r,k), sx=ri(r,60,85);
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,'NC '+A.sen,null,'COIL '+A.motor],['NO '+A.motor]),R(['NO '+A.sen,null,null,null,'SET '+A.lamp]),R(['NO '+A.ack,null,null,null,'RST '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,sensors:[{a:A.sen,x:sx}],startA:A.start,stopA:A.stop,startFirst:true,ackA:A.ack,lampA:A.lamp,lamps:[{a:A.lamp,c:'red',n:'ARIZA'}],endMsg:'Hata: Kutu sensörde durmadı!'};
  return {title:'Mühür + Arıza Kilidi',task:`Mühürlü START (${A.start}) / STOP (${A.stop}) devresi kur. Kutu sensöre (${A.sen}) gelince bant dursun ve ARIZA (${A.lamp}) kilitlensin (Set). ONAY (${A.ack}) lambayı söndürsün.`,
    hint:`Satır 1: (START ∥ ${A.motor}) · KAPALI ${A.stop} · KAPALI ${A.sen} → ${A.motor}. Satır 2: ${A.sen} → (S) ${A.lamp}. Satır 3: ${A.ack} → (R) ${A.lamp}.`,io,M:2,T:0,C:0,pal:PAL_B,scene:sc,
    goals:[{k:'seal'},{k:'park',s:A.sen,hold:1},{k:'lampPark'},{k:'lampAck'}],sol,bot:at([[0.5,A.start],[0.5+sx/sp+3,A.ack]])};
};
const hGate=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','gate','sen'],['motor','pist']); const sp=spd(r,k), sx=ri(r,45,70);
  const sol={rungs:[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.sen,'NO '+A.gate,null,null,'COIL '+A.pist])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:6,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx}],divertIf:A.gate};
  return {title:'Onaylı Ayırıcı (VE)',task:`Bant şalterle (${A.sw}) çalışsın. ONAY anahtarı (${A.gate}) AÇIKKEN sensördeki (${A.sen}) kutuyu piston (${A.pist}) itsin; KAPALIYKEN kutular geçsin. 2 kutu ayır, sonra anahtarı kapatıp 2 kutu teslim et.`,
    hint:`Satır 2: açık ${A.sen} ile açık ${A.gate} seri → ${A.pist}.`,io,M:2,T:0,C:0,pal:PAL_B,scene:sc,goals:[{k:'divert',n:2},{k:'deliver',n:2}],sol,
    bot:once((w,P,t,st)=>{ if(!st.a&&t>0.5){ st.a=1; P(A.sw); P(A.gate); } if(st.a===1&&w.diverted>=2){ st.a=2; P(A.gate); } })};
};

/* ---------- ZAMANLAYICILAR ---------- */
const tPush=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','pist']); const sp=spd(r,k), sx=ri(r,45,75), t=pick(r,[1,1.5,2,2.5,3,4]), nd=ri(r,2,4);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor]),R(['NO '+A.sen,null,null,null,'TON T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.pist])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:nd+2,sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx}],waitSensor:A.sen,waitRange:[t-0.2,t+0.8]};
  return {title:`TON: ${tr(t)} sn Gecikmeli İtme`,task:`Şalter (${A.sw}) açık: bant çalışsın. Kutu sensörde (${A.sen}) durunca ${tr(t)} sn bekle (TON), sonra piston (${A.pist}) itsin. ${nd} kutu ayır.`,
    hint:`Satır 1: ${A.sw} · KAPALI ${A.sen} → ${A.motor}. Satır 2: ${A.sen} → TON T1 (${tr(t)} sn). Satır 3: T1 → ${A.pist}.`,io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'divert',n:nd}],sol,bot:at([[0.5,A.sw]])};
};
const tLampDelay=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'HAZIR'}); const sp=spd(r,k), sx=ri(r,50,85), t=pick(r,[1,1.5,2,2.5,3,4,5]);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor]),R(['NO '+A.sen,null,null,null,'TON T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,sensors:[{a:A.sen,x:sx}],lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'HAZIR'}],lampDelay:{t,s:A.sen},endMsg:'Hata: Kutu sensörde durmadı!'};
  return {title:`TON: ${tr(t)} sn Sonra Lamba`,task:`Şalter (${A.sw}) açık: bant çalışsın, kutu sensörde (${A.sen}) dursun. Kutu durduktan ${tr(t)} sn sonra HAZIR lambası (${A.lamp}) yansın.`,
    hint:`Satır 2: ${A.sen} → TON T1 (${tr(t)} sn). Satır 3: T1 → ${A.lamp}.`,io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'park',s:A.sen,hold:1},{k:'lampDelay'}],sol,bot:at([[0.5,A.sw]])};
};
const tLampTof=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw'],['motor','lamp'],{lamp:'UYARI'}); const sp=spd(r,k), t=pick(r,[1,1.5,2,2.5,3,4]);
  const sol={rungs:[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.motor,null,null,null,'TOF T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:4,endDrop:'deliver',lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'UYARI'}],lampTof:{src:'motor',t}};
  return {title:`TOF: ${tr(t)} sn Uyarı`,task:`Şalter (${A.sw}) bandı (${A.motor}) çalıştırsın. UYARI lambası (${A.lamp}) bant çalışırken yansın ve bant durduktan ${tr(t)} sn sonra sönsün. Şalteri açıp kapat.`,
    hint:`Satır 2: ${A.motor} → TOF T1 (${tr(t)} sn). Satır 3: T1 → ${A.lamp}.`,io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'lampTof'}],sol,bot:at([[0.5,A.sw],[3.5,A.sw]])};
};
const sealM=A=>R(['NO '+A.start,'NC '+A.stop,null,null,'COIL M0.0'],['NO M0.0']);
const tStopDelay=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['motor']); const sp=spd(r,k), t=pick(r,[1.5,2,2.5,3,4,5]);
  const sol={rungs:[sealM(A),R(['NO M0.0',null,null,null,'TOF T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:6,endDrop:'deliver',startA:A.start,stopA:A.stop,startFirst:true,stopDelay:t};
  return {title:`TOF: ${tr(t)} sn Gecikmeli Durdurma`,task:`START (${A.start}) / STOP (${A.stop}) ile mühür biti M0.0 kur. Bant (${A.motor}) STOP'tan ${tr(t)} sn SONRA dursun (TOF).`,
    hint:`Satır 1: mühürlü devre → M0.0. Satır 2: M0.0 → TOF T1 (${tr(t)} sn). Satır 3: T1 → ${A.motor}.`,io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'seal'},{k:'stopDelay',t}],sol,bot:at([[0.5,A.start],[4,A.stop]])};
};
const tFill=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','valve'],{valve:'DOLUM_VALF'}); const sp=spd(r,k), sx=ri(r,40,65), t=pick(r,[1.5,2,2.5,3,4]), nf=ri(r,2,4);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor],[null,'NO T1']),R(['NO '+A.sen,null,null,null,'TON T1 '+t]),R(['NO '+A.sen,'NC T1',null,null,'COIL '+A.valve])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:nf+1,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],valves:[{a:A.valve,x:sx,fillTime:t,kind:'fill'}]};
  return {title:`Dolum İstasyonu (${tr(t)} sn)`,task:`Şişe sensörde (${A.sen}) dursun, valf (${A.valve}) ${tr(t)} sn dolum yapsın, sonra bant devam etsin. Dolum tam ${tr(t)} sn sürer. ${nf} şişe doldur.`,
    hint:`Bant: ${A.sw} · (KAPALI ${A.sen} ∥ AÇIK T1) → ${A.motor}. ${A.sen} → TON T1 (${tr(t)} sn). Valf: ${A.sen} · KAPALI T1 → ${A.valve}.`,io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'fill',n:nf,lb:'Dolu'}],sol,bot:at([[0.5,A.sw]])};
};
const tStartDelay=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['motor','lamp'],{lamp:'KALKIŞ_İKAZ'}); const sp=spd(r,k), t=pick(r,[1.5,2,2.5,3,4]);
  const sol={rungs:[sealM(A),R(['NO M0.0',null,null,null,'TON T1 '+t]),R(['NO M0.0','NC T1',null,null,'COIL '+A.lamp]),R(['NO T1',null,null,null,'COIL '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:4,endDrop:'deliver',startA:A.start,stopA:A.stop,startFirst:true,startDelay:t,lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'İKAZ'}]};
  return {title:`Gecikmeli Kalkış (${tr(t)} sn)`,task:`START (${A.start}) basılınca önce ikaz lambası (${A.lamp}) ${tr(t)} sn yansın, sonra lamba sönüp bant (${A.motor}) kalksın. STOP (${A.stop}) her şeyi durdursun.`,
    hint:`M0.0 mühür · M0.0 → TON T1 (${tr(t)} sn) · M0.0 · KAPALI T1 → ${A.lamp} · T1 → ${A.motor}.`,io,M:2,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'seal'},{k:'startDelay'}],sol,bot:at([[0.5,A.start]])};
};
const hBooth=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','fan','valve'],{valve:'BOYA_VALF'}); const sp=spd(r,k), sx=ri(r,38,58), t1=pick(r,[1.5,2,2.5,3]), h=pick(r,[2,2.5,3,3.5]);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor],[null,'NO T1']),R(['NO '+A.sen,null,null,null,'TON T1 '+t1]),R(['NO '+A.sen,'NC T1',null,null,'COIL '+A.valve]),R(['NO '+A.valve,null,null,null,'TOF T2 '+h]),R(['NO T2',null,null,null,'COIL '+A.fan])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],valves:[{a:A.valve,x:sx,fillTime:t1,kind:'spray'}],fan:{a:A.fan,spray:A.valve,hold:h}};
  return {title:'Boya Kabini (TON + TOF)',task:`Kutu kabinde (${A.sen}) durunca boya (${A.valve}) ${tr(t1)} sn püskürsün. Fan (${A.fan}) boya sırasında çalışsın ve püskürtme bittikten ${tr(h)} sn sonra dursun. 3 kutu boya.`,
    hint:`Dolum devresi (TON ${tr(t1)} sn) + ${A.valve} → TOF T2 (${tr(h)} sn) + T2 → ${A.fan}.`,io,M:2,T:2,C:0,pal:PAL_C,scene:sc,goals:[{k:'fill',n:3,lb:'Boyalı'},{k:'fanHold',t:h}],sol,bot:at([[0.5,A.sw]])};
};
const hDelays=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['motor','lamp'],{lamp:'KALKIŞ_İKAZ'}); const sp=spd(r,k), t1=pick(r,[1.5,2,2.5,3]), t2=pick(r,[1.5,2,2.5,3,4]);
  const sol={rungs:[sealM(A),R(['NO M0.0',null,null,null,'TON T1 '+t1]),R(['NO M0.0','NC T1',null,null,'COIL '+A.lamp]),R(['NO T1',null,null,null,'TOF T2 '+t2]),R(['NO T2',null,null,null,'COIL '+A.motor])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:8,endDrop:'deliver',startA:A.start,stopA:A.stop,startFirst:true,startDelay:t1,stopDelay:t2,lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'İKAZ'}]};
  return {title:'Gecikmeli Kalkış + Duruş',task:`START (${A.start}): ikaz lambası (${A.lamp}) ${tr(t1)} sn yansın, sonra bant (${A.motor}) kalksın. STOP (${A.stop}): bant ${tr(t2)} sn sonra dursun.`,
    hint:`M0.0 mühür · M0.0→TON T1 (${tr(t1)}) · M0.0·KAPALI T1→${A.lamp} · T1→TOF T2 (${tr(t2)}) · T2→${A.motor}.`,io,M:2,T:2,C:0,pal:PAL_C,scene:sc,
    goals:[{k:'seal'},{k:'startDelay'},{k:'stopDelay',t:t2}],sol,bot:at([[0.5,A.start],[0.5+t1+3,A.stop]])};
};
const hTonTof=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','pist','lamp'],{lamp:'AYIRMA'}); const sp=spd(r,k), sx=ri(r,45,70), t=pick(r,[1,1.5,2,2.5]), h=pick(r,[1.5,2,2.5,3]);
  const sol={rungs:[R(['NO '+A.sw,'NC '+A.sen,null,null,'COIL '+A.motor]),R(['NO '+A.sen,null,null,null,'TON T1 '+t]),R(['NO T1',null,null,null,'COIL '+A.pist]),R(['NO '+A.pist,null,null,null,'TOF T2 '+h]),R(['NO T2',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:3,sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx}],waitSensor:A.sen,waitRange:[t-0.2,t+0.8],lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'AYIRMA'}],lampTof:{src:A.pist,t:h}};
  return {title:'TON İtme + TOF Lamba',task:`Kutu sensörde (${A.sen}) dursun, ${tr(t)} sn sonra piston (${A.pist}) itsin. Sarı lamba (${A.lamp}) piston iterken yansın ve piston geri çekildikten ${tr(h)} sn sonra sönsün. 3 kutu ayır.`,
    hint:`TON itme devresi + ${A.pist} → TOF T2 (${tr(h)} sn) + T2 → ${A.lamp}.`,io,M:2,T:2,C:0,pal:PAL_C,scene:sc,goals:[{k:'divert',n:3},{k:'lampTof'}],sol,bot:at([[0.5,A.sw]])};
};

/* ---------- SAYICILAR ---------- */
const cBatch=ctd=>(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'PARTİ_TAMAM'}); const sp=spd(r,k), sx=ri(r,40,70), N=ri(r,2,4)+Math.round(k*4);
  const typ=ctd?'CTD':'CTU';
  const sol={rungs:[R(['NO '+A.sen,null,null,null,typ+' C1 '+N]),R(['NO '+A.sw,'NC C1',null,null,'COIL '+A.motor]),R(['NO C1',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:N+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,batchN:N,lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'PARTİ'}]};
  return {title:`${typ}: ${N} Kutu Say`,task:ctd?`Şalter (${A.sw}) açık: bant çalışsın. ${typ} sayıcı ${N}'den geri saysın; sensörden (${A.sen}) ${N} kutu geçince (0) bant dursun ve PARTİ lambası (${A.lamp}) yansın.`
      :`Şalter (${A.sw}) açık: bant çalışsın. Sensörden (${A.sen}) ${N} kutu geçince (CTU) bant dursun ve PARTİ lambası (${A.lamp}) yansın.`,
    hint:`Satır 1: ${A.sen} → ${typ} C1 (${N}). Satır 2: ${A.sw} · KAPALI C1 → ${A.motor}. Satır 3: C1 → ${A.lamp}.`,io,M:2,T:0,C:1,pal:PAL_D,scene:sc,goals:[{k:'batch',n:1}],sol,bot:at([[0.5,A.sw]])};
};
const cLampCount=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen'],['motor','lamp'],{lamp:'SAYAÇ_DOLU'}); const sp=spd(r,k), sx=ri(r,30,60), N=ri(r,2,4)+Math.round(k*4);
  const sol={rungs:[R(['NO '+A.sen,null,null,null,'CTU C1 '+N]),R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO C1',null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:gp(k),boxes:N+3,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],countSensor:A.sen,lampCount:{n:N},lampA:A.lamp,lamps:[{a:A.lamp,c:'green',n:'SAYAÇ'}]};
  return {title:`CTU: ${N}. Kutuda Lamba`,task:`Şalter (${A.sw}) bandı çalıştırsın (bant durmasın). Sensörden (${A.sen}) ${N} kutu geçince SAYAÇ lambası (${A.lamp}) yansın. ${N+1} kutuyu teslim et.`,
    hint:`${A.sen} → CTU C1 (${N}) · ${A.sw} → ${A.motor} · C1 → ${A.lamp}.`,io,M:2,T:0,C:1,pal:PAL_D,scene:sc,goals:[{k:'lampCount'},{k:'deliver',n:N+1}],sol,bot:at([[0.5,A.sw]])};
};
const mDivert=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['sw','sen','lim'],['motor','pist']); const sp=spd(r,k), sx=ri(r,45,70), N=ri(r,2,3)+Math.round(k*2);
  const sol={rungs:[R(['NO '+A.sw,null,null,null,'COIL '+A.motor]),R(['NO '+A.sen,null,null,null,'CTU C1 '+N]),R(['NO C1',null,null,null,'COIL '+A.pist]),R(['NO '+A.lim,null,null,null,'RST C1'])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:2*N+1,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx,lim:A.lim}],divertEvery:N};
  return {title:`CTU: Her ${N}. Kutuyu Ayır`,task:`Bant şalterle (${A.sw}) çalışsın. Her ${N}. kutuyu piston (${A.pist}) ayırsın; piston tam ilerleyince (${A.lim}) sayıcıyı Reset et. 2 kutu ayır.`,
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
  return {title:stop?`CTD: Mühürlü Palet (${N})`:`CTD: Palet Geri Sayımı (${N})`,task:`START (${A.start}) bandı mühürlü başlatsın${stop?`, STOP (${A.stop}) durdursun`:''}. Palet ${N} kutu alınca (CTD sıfıra iner) bant dursun, PALET lambası (${A.lamp}) yansın. START sayacı yeniden yüklesin. 2 parti tamamla.`,
    hint:`${A.sen}→CTD C1 (${N}) · (START ∥ ${A.motor})${stop?` · KAPALI ${A.stop}`:''} · KAPALI C1 → ${A.motor} · C1→${A.lamp} · ${A.start}→(R) C1.`,io,M:2,T:0,C:1,pal:PAL_D,scene:sc,
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
  return {title:seal?'Mühürlü Otomatik Parti Hattı':`Otomatik Parti (${N} kutu / ${tr(t)} sn)`,
    task:(seal?`START (${A.start}) / STOP (${A.stop}) mühürlü hat (M0.0). `:`Şalter (${A.sw}) açık. `)+`${N} kutu sayılınca bant dursun, PARTİ lambası (${A.lamp}) yansın; ${tr(t)} sn bekleyip sayıcı kendini sıfırlasın ve bant yeniden kalksın. 2 parti tamamla.`,
    hint:(seal?'M0.0 mühür · ':'')+`${A.sen}→CTU C1 (${N}) · ${run} · KAPALI C1 → ${A.motor} · C1→TON T1 (${tr(t)}) · T1→(R) C1 · C1→${A.lamp}.`,io,M:2,T:1,C:1,pal:PAL_D,scene:sc,
    goals:seal?[{k:'seal'},{k:'batch',n:2},{k:'restart'}]:[{k:'batch',n:2},{k:'restart'}],sol:{rungs:rs},bot:at([[0.5,seal?A.start:A.sw]])};
};
const hFinal=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop','sen','lim'],['motor','pist','lamp'],{lamp:'AYIRMA'}); const sp=spd(r,k), sx=ri(r,45,70), N=ri(r,3,4)+Math.round(k*3);
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,null,null,'COIL '+A.motor],['NO '+A.motor]),R(['NO '+A.sen,null,null,null,'CTU C1 '+N]),R(['NO C1',null,null,null,'COIL '+A.pist]),R(['NO '+A.lim,null,null,null,'RST C1']),R(['NO '+A.pist,null,null,null,'COIL '+A.lamp])]};
  const sc={motor:A.motor,speed:sp,gap:Math.max(1.15,gp(k)),boxes:2*N+2,endDrop:'deliver',sensors:[{a:A.sen,x:sx}],pistons:[{a:A.pist,x:sx,lim:A.lim}],divertEvery:N,startA:A.start,stopA:A.stop,startFirst:true,lampA:A.lamp,lamps:[{a:A.lamp,c:'amber',n:'AYIRMA'}]};
  return {title:`Otomatik Hat: Her ${N}. Kutu`,task:`Mühürlü START (${A.start}) / STOP (${A.stop}) ile bant çalışsın. Her ${N}. kutuyu piston (${A.pist}) ayırsın, ${A.lim} ile sayıcı sıfırlansın, ayırma sırasında lamba (${A.lamp}) yansın. 2 kutu ayır.`,
    hint:`Mühürlü motor · ${A.sen}→CTU C1 (${N}) · C1→${A.pist} · ${A.lim}→(R) C1 · ${A.pist}→${A.lamp}.`,io,M:2,T:0,C:1,pal:PAL_D,scene:sc,goals:[{k:'seal'},{k:'divert',n:2},{k:'lampPush'}],sol,bot:at([[0.5,A.start]])};
};

const TPL=[
  [ [easyLogic('direct',0),easyLogic('direct',1),easyLogic('and',0),easyLogic('or',0),easyLogic('direct',2),easyLogic('and',1),easyLogic('or',1),easyLogic('and',2),easyLogic('or',2)],
    [mSeal(0),mSR(0),mSeal(1),mSR(1),mSeal(2),mPist],
    [hArriza,hPistLamp,hAckLatch,hGate] ],
  [ [tPush,tLampDelay,tLampTof],
    [tStopDelay,tFill,tStartDelay],
    [hBooth,hDelays,hTonTof] ],
  [ [cBatch(false),cLampCount,cBatch(true)],
    [mDivert,mCtdTwo(false),mRestart(false)],
    [hFinal,mCtdTwo(true),mRestart(true)] ]];
const LV_CACHE={};
function getLevel(id){
  if(LV_CACHE[id]) return LV_CACHE[id];
  const cat=Math.floor(id/300), diff=Math.floor(id/100)%3, n=id%100;
  const r=mkRng(id*7919+13), k=n/99, list=TPL[cat][diff];
  const lv=list[n%list.length](r,k,n);
  Object.assign(lv,{id,cat,diff,n}); lv.opt=countBlocks(lv.sol);
  return LV_CACHE[id]=lv;
}
