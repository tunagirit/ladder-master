/* ===== v1.1.6: BANT DIŞI SİSTEMLER — motorlar, kapılar, asansör, otopark, yıkama, pres, sera, alarm… ===== */
Object.assign(INDEF,{trip:['TERMİK','m'],reset:['RESET','btn'],fwd:['İLERİ','btn'],rev:['GERİ','btn'],open:['AÇ','btn'],close:['KAPAT','btn'],top:['ÜST_LİMİT','m'],botl:['ALT_LİMİT','m'],eye:['FOTOSEL','m'],
  call1:['ÇAĞRI_1','btn'],call2:['ÇAĞRI_2','btn'],f1:['KAT_1','m'],f2:['KAT_2','m'],pgate:['GİRİŞ_SENSÖR','m'],ppass:['GEÇİŞ','m'],pexit:['ÇIKIŞ','m'],car:['ARAÇ','m'],left:['SOL_EL','hold'],right:['SAĞ_EL','hold'],arm:['KURMA','sw'],door:['KAPI','m'],code:['ŞİFRE','btn']});
Object.assign(QDEF,{k1:'K1_ANA',k2:'K2_YILDIZ',k3:'K3_ÜÇGEN',km:'K1_MOTOR',kf:'K_İLERİ',kr:'K_GERİ',up:'MOTOR_YUKARI',dn:'MOTOR_AŞAĞI',lup:'YUKARI',ldn:'AŞAĞI',bar:'BARİYER',p1:'POMPA_1',p2:'POMPA_2',foam:'KÖPÜK',brush:'FIRÇA',dry:'KURUTMA',press:'PRES',siren:'SİREN'});
Object.assign(TAGEN,{'TERMİK':'THERMAL','RESET':'RESET','İLERİ':'FORWARD','GERİ':'REVERSE','AÇ':'OPEN','KAPAT':'CLOSE','ÜST_LİMİT':'TOP_LIMIT','ALT_LİMİT':'BOTTOM_LIMIT','FOTOSEL':'PHOTOCELL','ÇAĞRI_1':'CALL_1','ÇAĞRI_2':'CALL_2','KAT_1':'FLOOR_1','KAT_2':'FLOOR_2',
  'GİRİŞ_SENSÖR':'GATE_SENSOR','GEÇİŞ':'PASSED','ÇIKIŞ':'EXIT','ARAÇ':'CAR','SOL_EL':'LEFT_HAND','SAĞ_EL':'RIGHT_HAND','KURMA':'ARM','KAPI':'DOOR','ŞİFRE':'CODE','K1_ANA':'K1_MAIN','K2_YILDIZ':'K2_STAR','K3_ÜÇGEN':'K3_DELTA','K1_MOTOR':'K1_MOTOR',
  'K_İLERİ':'K_FWD','K_GERİ':'K_REV','MOTOR_YUKARI':'MOTOR_UP','MOTOR_AŞAĞI':'MOTOR_DOWN','YUKARI':'UP','AŞAĞI':'DOWN','BARİYER':'BARRIER','POMPA_1':'PUMP_1','POMPA_2':'PUMP_2','KÖPÜK':'FOAM','FIRÇA':'BRUSH','KURUTMA':'DRYER','PRES':'PRESS','SİREN':'SIREN','KURULU':'ARMED','KAT':'FLOOR','FAN':'FAN'});
const MB={noBelt:true,boxes:0};
const holdAt=list=>once((w,P,t,st)=>{ list.forEach((x,i)=>{ if(!st[i]&&t>=x[0]){ st[i]=1; w.hold[x[1]]=x[2]; } }); });
const offAfter=(cond,on,ms,tol)=>(w,q,iv,dt,s)=>{ if(cond(w,q,iv)&&on(w,q,iv)){ s.b=(s.b||0)+dt; if(s.b>(tol||0.3)) return ms; } else s.b=0; };

/* ---------- MOTOR: doğrudan yol verme ---------- */
const motorDOL=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['km','lamp'],{lamp:'ÇALIŞIYOR'});
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,'COIL '+A.km],['NO '+A.km]),R(['NO '+A.km,'COIL '+A.lamp])]};
  const sc=Object.assign({},MB,{mach:{kind:'motor',k:A.km},lamps:[{a:A.lamp,c:'green',n:'ÇALIŞIYOR'}],
    rules:[(w,q)=>{ if(q[A.km]&&w.t<0.45) return tx('Hata: START\'a basılmadan motor çalıştı!','Error: The motor ran before START was pressed!'); },
      follow((w,q)=>q[A.km],(w,q)=>q[A.lamp],tx('Hata: ÇALIŞIYOR lambası motorla birlikte yanıp sönmeli!','Error: The RUNNING lamp must follow the motor!')),
      (w,q,iv,dt,s)=>{ if(iv[A.start]) s.p=1; if(s.p&&!iv[A.start]&&q[A.km]){ s.t=(s.t||0)+dt; if(s.t>1) w.f.run=true; }
        if(iv[A.stop]) s.st=w.t; if(s.st!=null&&q[A.km]&&w.t-s.st>0.3&&!iv[A.start]) return tx('Hata: STOP\'a basıldı ama motor durmadı!','Error: STOP was pressed but the motor kept running!');
        if(s.st!=null&&w.f.run&&!q[A.km]) w.f.stopped=true; }]});
  return {title:tx('Motor Yol Verme','Motor Starter'),
    task:tx(`Bir pompa motorunu doğrudan yol vererek çalıştır: START (${A.start}) kısa basınca kontaktör K1 (${A.km}) çeksin ve mühürlensin, STOP (${A.stop}) bıraksın. Motor çalışırken ÇALIŞIYOR lambası (${A.lamp}) yansın.`,
      `Start a pump motor direct-on-line: a short press of START (${A.start}) pulls in contactor K1 (${A.km}) and seals it; STOP (${A.stop}) drops it. The RUNNING lamp (${A.lamp}) is on while the motor runs.`),
    hint:tx(`(${A.start} ∥ ${A.km}) · KAPALI ${A.stop} → ${A.km} · ${A.km} → ${A.lamp}.`,`(${A.start} ∥ ${A.km}) · NC ${A.stop} → ${A.km} · ${A.km} → ${A.lamp}.`),
    io,M:0,T:0,C:0,pal:PAL_B,scene:sc,goals:[{k:'run',l:T2('Mühürlü çalış','Sealed run')},{k:'stopped',l:T2('STOP ile dur','Stop with STOP')}],sol,bot:at([[0.5,A.start],[3.5,A.stop]])};
};
/* ---------- MOTOR: termik arıza ---------- */
const motorFault=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop','trip','reset'],['km','lamp','lamp2'],{lamp:'ÇALIŞIYOR',lamp2:'ARIZA'});
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,'NC M0.0','COIL '+A.km],['NO '+A.km]),R(['NO '+A.trip,'SET M0.0']),R(['NO '+A.reset,'RST M0.0']),R(['NO M0.0','COIL '+A.lamp2]),R(['NO '+A.km,'COIL '+A.lamp])]};
  const sc=Object.assign({},MB,{mach:{kind:'motor',k:A.km,trip:A.trip,tripAt:2.4},lamps:[{a:A.lamp,c:'green',n:'ÇALIŞIYOR'},{a:A.lamp2,c:'red',n:'ARIZA'}],
    rules:[follow((w,q)=>q[A.km],(w,q)=>q[A.lamp],tx('Hata: ÇALIŞIYOR lambası motoru izlemeli!','Error: The RUNNING lamp must follow the motor!')),
      (w,q,iv,dt,s)=>{ if(iv[A.trip]&&s.tt==null){ s.tt=w.t; s.l=true; } if(iv[A.reset]&&s.l){ s.l=false; s.rt=w.t; }
        if(s.tt!=null&&s.l&&q[A.km]&&w.t-s.tt>0.3) return tx('Hata: Termik attı ama motor durmadı!','Error: The thermal relay tripped but the motor kept running!');
        const exp=!!s.l; if(s.tt!=null&&!!q[A.lamp2]!==exp&&w.t-(exp?s.tt:s.rt)>0.3) return exp?tx('Hata: Arıza lambası RESET\'e kadar yanık kalmalı (kilitlenmeli)!','Error: The FAULT lamp must stay on (latched) until RESET!'):tx('Hata: RESET\'ten sonra arıza lambası sönmeli!','Error: The FAULT lamp must go off after RESET!');
        if(s.tt==null&&q[A.lamp2]&&w.t>0.1) return tx('Hata: Arıza yokken ARIZA lambası yandı!','Error: The FAULT lamp lit with no fault!');
        if(s.tt!=null&&s.l&&!q[A.km]&&q[A.lamp2]&&w.t-s.tt>0.5) w.f.tripOk=true;
        if(s.rt!=null&&q[A.km]){ s.k=(s.k||0)+dt; if(s.k>0.8) w.f.resetRun=true; } }]});
  return {title:tx('Termik Arıza Kilidi','Thermal Fault Latch'),
    task:tx(`START (${A.start}) / STOP (${A.stop}) ile motor (${A.km}) çalışsın. Motor ısınınca termik röle (${A.trip}) atar: motor hemen dursun, ARIZA lambası (${A.lamp2}) kilitlensin ve RESET (${A.reset}) basılana kadar START motoru çalıştıramasın. ÇALIŞIYOR lambası (${A.lamp}) motoru göstersin.`,
      `START (${A.start}) / STOP (${A.stop}) run the motor (${A.km}). When the motor overheats the thermal relay (${A.trip}) trips: the motor stops at once, the FAULT lamp (${A.lamp2}) latches, and START cannot run the motor until RESET (${A.reset}) is pressed. The RUNNING lamp (${A.lamp}) shows the motor.`),
    hint:tx(`(START ∥ ${A.km}) · KAPALI STOP · KAPALI M0.0 → ${A.km} · ${A.trip} → (S) M0.0 · ${A.reset} → (R) M0.0 · M0.0 → ${A.lamp2} · ${A.km} → ${A.lamp}.`,`(START ∥ ${A.km}) · NC STOP · NC M0.0 → ${A.km} · ${A.trip} → (S) M0.0 · ${A.reset} → (R) M0.0 · M0.0 → ${A.lamp2} · ${A.km} → ${A.lamp}.`),
    io,M:1,T:0,C:0,pal:PAL_B,scene:sc,goals:[{k:'tripOk',l:T2('Arızada dur','Stop on fault')},{k:'resetRun',l:T2('RESET sonrası çalış','Run after RESET')}],sol,bot:at([[0.5,A.start],[5,A.start],[6,A.reset],[6.8,A.start]])};
};
/* ---------- YILDIZ-ÜÇGEN ---------- */
const starDelta=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['start','stop'],['k1','k2','k3']); const t=pick(r,[2,2.5,3,4]);
  const sol={rungs:[R(['NO '+A.start,'NC '+A.stop,'COIL '+A.k1],['NO '+A.k1]),R(['NO '+A.k1,'TON T1 '+t]),R(['NO '+A.k1,'NC T1','NC '+A.k3,'COIL '+A.k2]),R(['NO T1','NC '+A.k2,'COIL '+A.k3])]};
  const sc=Object.assign({},MB,{mach:{kind:'stardelta',k1:A.k1,k2:A.k2,k3:A.k3},
    rules:[(w,q,iv,dt,s)=>{ const k1=!!q[A.k1],k2=!!q[A.k2],k3=!!q[A.k3];
      if(k1&&!s.k1){ s.t1=w.t; } s.k1=k1;
      if(k1&&s.t1!=null){ const d=w.t-s.t1;
        if(d>0.25&&d<t-0.35&&!k2) return tx('Hata: Motor önce YILDIZ (K2) bağlı kalkmalı!','Error: The motor must start in STAR (K2) first!');
        if(k3&&!s.k3){ if(Math.abs(d-t)>0.35) return tx(`Hata: Üçgene geçiş ${fx(t)} sn sonra olmalı (şu an ${fx(d.toFixed(1))} sn)!`,`Error: Switch to delta after ${t} s (now ${d.toFixed(1)} s)!`); w.f.delta=true; }
        if(d>0.5&&k2) w.f.star=true; }
      s.k3=k3; if(iv[A.stop]) s.st=w.t;
      if(s.st!=null&&(k1||k2||k3)&&w.t-s.st>0.3&&!iv[A.start]) return tx('Hata: STOP her şeyi kapatmalı!','Error: STOP must switch everything off!');
      if(s.st!=null&&w.f.delta&&!k1&&!k2&&!k3) w.f.stop=true;
      if(w.t<0.45&&(k1||k2||k3)) return tx('Hata: START\'a basılmadan kontaktör çekti!','Error: A contactor pulled in before START!'); }]});
  return {title:tx(`Yıldız-Üçgen Yol Verme (${fx(t)} sn)`,`Star-Delta Starter (${t} s)`),
    task:tx(`Büyük motor yıldız-üçgen kalkar: START (${A.start}) ile ana kontaktör K1 (${A.km||A.k1}) ve YILDIZ K2 (${A.k2}) çeksin. ${fx(t)} sn sonra K2 bıraksın, ÜÇGEN K3 (${A.k3}) çeksin. K2 ve K3 asla aynı anda çekmemeli (kısa devre!). STOP (${A.stop}) hepsini kapatsın.`,
      `A big motor starts star-delta: START (${A.start}) pulls in the main contactor K1 (${A.k1}) and STAR K2 (${A.k2}). After ${t} s K2 drops and DELTA K3 (${A.k3}) pulls in. K2 and K3 must never be on together (short circuit!). STOP (${A.stop}) switches everything off.`),
    hint:tx(`(START ∥ ${A.k1}) · KAPALI STOP → ${A.k1} · ${A.k1} → TON T1 (${fx(t)}) · ${A.k1} · KAPALI T1 · KAPALI ${A.k3} → ${A.k2} · T1 · KAPALI ${A.k2} → ${A.k3}. KAPALI kontaklarla karşılıklı kilitleme yap.`,`(START ∥ ${A.k1}) · NC STOP → ${A.k1} · ${A.k1} → TON T1 (${t}) · ${A.k1} · NC T1 · NC ${A.k3} → ${A.k2} · T1 · NC ${A.k2} → ${A.k3}. Interlock with NC contacts.`),
    io,M:0,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'star',l:T2('Yıldız kalkış','Star start')},{k:'delta',l:T2('Üçgene geçiş','Switch to delta')},{k:'stop',l:T2('STOP','STOP')}],sol,bot:at([[0.5,A.start],[0.5+t+2,A.stop]])};
};
/* ---------- İLERİ-GERİ ---------- */
const reverseMotor=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['fwd','rev','stop'],['kf','kr']);
  const sol={rungs:[R(['NO '+A.fwd,'NC '+A.stop,'NC '+A.kr,'COIL '+A.kf],['NO '+A.kf]),R(['NO '+A.rev,'NC '+A.stop,'NC '+A.kf,'COIL '+A.kr],['NO '+A.kr])]};
  const sc=Object.assign({},MB,{mach:{kind:'reverse',kf:A.kf,kr:A.kr},
    rules:[(w,q,iv,dt,s)=>{ const f=!!q[A.kf], rv=!!q[A.kr];
      if(f){ s.f=(s.f||0)+dt; if(s.f>1) w.f.fwd=true; }
      if(iv[A.rev]&&f) s.lt=w.t; if(s.lt!=null&&f&&!rv&&w.t-s.lt>0.5) w.f.lock=true;
      if(iv[A.stop]) s.sp=w.t; if(s.pf&&!f&&rv&&(s.sp==null||w.t-s.sp>1.5)) return tx('Hata: Motor durmadan yön değiştirdi! Önce STOP\'a basılmalı.','Error: The motor reversed without stopping! STOP must come first.');
      if(rv&&w.f.lock){ s.r=(s.r||0)+dt; if(s.r>1) w.f.rev=true; }
      if(iv[A.stop]&&(f||rv)){ s.sb=(s.sb||0)+dt; if(s.sb>0.3) return tx('Hata: STOP motoru durdurmalı!','Error: STOP must stop the motor!'); } else s.sb=0;
      s.pf=f; }]});
  return {title:tx('İleri-Geri Motor (Kilitlemeli)','Forward-Reverse Motor (Interlocked)'),
    task:tx(`Vinç motoru iki yöne döner. İLERİ (${A.fwd}) K_İLERİ'yi (${A.kf}), GERİ (${A.rev}) K_GERİ'yi (${A.kr}) mühürlü çeksin, STOP (${A.stop}) durdursun. İki kontaktör asla aynı anda çekmesin: motor ileri dönerken GERİ'ye basmak hiçbir şey yapmamalı (kilitleme).`,
      `A hoist motor turns both ways. FORWARD (${A.fwd}) seals K_FWD (${A.kf}), REVERSE (${A.rev}) seals K_REV (${A.kr}), STOP (${A.stop}) stops it. The two contactors must never be on together: pressing REVERSE while running forward does nothing (interlock).`),
    hint:tx(`(İLERİ ∥ ${A.kf}) · KAPALI STOP · KAPALI ${A.kr} → ${A.kf} · (GERİ ∥ ${A.kr}) · KAPALI STOP · KAPALI ${A.kf} → ${A.kr}.`,`(FWD ∥ ${A.kf}) · NC STOP · NC ${A.kr} → ${A.kf} · (REV ∥ ${A.kr}) · NC STOP · NC ${A.kf} → ${A.kr}.`),
    io,M:0,T:0,C:0,pal:PAL_B,scene:sc,goals:[{k:'fwd',l:T2('İleri','Forward')},{k:'lock',l:T2('Kilitleme testi','Interlock test')},{k:'rev',l:T2('Geri','Reverse')}],sol,bot:at([[0.5,A.fwd],[2,A.rev],[3,A.stop],[3.6,A.rev]])};
};
/* ---------- GARAJ KAPISI ---------- */
const garage=eye=>(r,k,n)=>{
  const iN=['open','close','top','botl']; if(eye) iN.push('eye');
  const {A,io}=mkCtx(r,n,iN,['up','dn']);
  const rs=eye?[R(['NO '+A.open,'COIL M0.0'],['NO '+A.eye]),R(['NO M0.0','NC '+A.top,'NC '+A.dn,'COIL '+A.up],['NO '+A.up]),R(['NO '+A.close,'NC '+A.botl,'NC '+A.up,'NC '+A.eye,'COIL '+A.dn],['NO '+A.dn])]
             :[R(['NO '+A.open,'NC '+A.top,'NC '+A.dn,'COIL '+A.up],['NO '+A.up]),R(['NO '+A.close,'NC '+A.botl,'NC '+A.up,'COIL '+A.dn],['NO '+A.dn])];
  const sc=Object.assign({},MB,{mach:{kind:'garage',up:A.up,dn:A.dn,top:A.top,bot:A.botl,eye:eye?A.eye:null,v:0.3},
    rules:[(w,q)=>{ if((q[A.up]||q[A.dn])&&w.t<0.45) return tx('Hata: Butona basılmadan kapı hareket etti!','Error: The door moved before a button was pressed!'); }]});
  const goals=[{k:'opened',l:T2('Tam açıldı','Fully open')}]; if(eye) goals.push({k:'rev',l:T2('Fotoselde geri aç','Reopen on photocell')}); goals.push({k:'closed',l:T2('Tam kapandı','Fully closed')});
  return {title:eye?tx('Garaj Kapısı + Fotosel','Garage Door + Photocell'):tx('Garaj Kapısı','Garage Door'),
    task:tx(`AÇ (${A.open}) kapıyı yukarı (${A.up}), KAPAT (${A.close}) aşağı (${A.dn}) mühürlü sürsün. Kapı ÜST_LİMİT (${A.top}) ve ALT_LİMİT (${A.botl}) şalterlerinde kendiliğinden dursun. Motor aynı anda iki yöne sürülmesin.`+(eye?` Kapanırken FOTOSEL (${A.eye}) engel görürse kapı hemen dursun ve tekrar AÇILSIN.`:''),
      `OPEN (${A.open}) seals the door motor up (${A.up}), CLOSE (${A.close}) seals it down (${A.dn}). The door stops by itself at TOP_LIMIT (${A.top}) and BOTTOM_LIMIT (${A.botl}). Never drive both directions.`+(eye?` If the PHOTOCELL (${A.eye}) sees an obstacle while closing, the door stops at once and OPENS again.`:'')),
    hint:eye?tx(`(AÇ ∥ FOTOSEL) → M0.0 · (M0.0 ∥ ${A.up}) · KAPALI ÜST · KAPALI ${A.dn} → ${A.up} · (KAPAT ∥ ${A.dn}) · KAPALI ALT · KAPALI ${A.up} · KAPALI FOTOSEL → ${A.dn}.`,`(OPEN ∥ PHOTOCELL) → M0.0 · (M0.0 ∥ ${A.up}) · NC TOP · NC ${A.dn} → ${A.up} · (CLOSE ∥ ${A.dn}) · NC BOTTOM · NC ${A.up} · NC PHOTOCELL → ${A.dn}.`)
      :tx(`(AÇ ∥ ${A.up}) · KAPALI ÜST_LİMİT · KAPALI ${A.dn} → ${A.up} · (KAPAT ∥ ${A.dn}) · KAPALI ALT_LİMİT · KAPALI ${A.up} → ${A.dn}.`,`(OPEN ∥ ${A.up}) · NC TOP_LIMIT · NC ${A.dn} → ${A.up} · (CLOSE ∥ ${A.dn}) · NC BOTTOM_LIMIT · NC ${A.up} → ${A.dn}.`),
    io,M:eye?1:0,T:0,C:0,pal:PAL_B,scene:sc,goals,sol:{rungs:rs},
    bot:once((w,P,t,st)=>{ if(!st.a&&t>0.5){ st.a=1; P(A.open); } if(st.a===1&&w.ms.pos>=0.995){ st.a=2; st.t=t; } if(st.a===2&&t>st.t+0.6){ st.a=3; P(A.close); }
      if(eye&&st.a===3&&w.f.rev&&w.ms.pos>=0.995){ st.a=4; st.t=t; } if(st.a===4&&t>st.t+0.6){ st.a=5; P(A.close); } })};
};
/* ---------- ASANSÖR ---------- */
const lift=seg=>(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['call1','call2','f1','f2'],['lup','ldn']);
  const rs=[R(['NO '+A.call2,'NC '+A.f2,'NC '+A.ldn,'COIL '+A.lup],['NO '+A.lup]),R(['NO '+A.call1,'NC '+A.f1,'NC '+A.lup,'COIL '+A.ldn],['NO '+A.ldn])];
  if(seg) rs.push(R(['NO '+A.f1,'MOV VW0 1']),R(['NO '+A.f2,'MOV VW0 2']),R(['NO SM0.0','SEG QB1 VW0']));
  const sc=Object.assign({},MB,{mach:{kind:'lift',up:A.lup,dn:A.ldn,f1:A.f1,f2:A.f2,v:0.35},seg:seg?{pre:'Q1.'}:null,
    rules:[(w,q)=>{ if((q[A.lup]||q[A.ldn])&&w.t<0.45) return tx('Hata: Çağrı yokken asansör hareket etti!','Error: The lift moved with no call!'); }]});
  if(seg) sc.rules.push((w,q,iv,dt,s)=>{ if(w.ms.pos<=0.005) s.fl=1; if(w.ms.pos>=0.995) s.fl=2; if(!s.fl) return; const want=SEGT[s.fl], got=qb(q,'Q1.')&127;
    if(want!==got){ s.b=(s.b||0)+dt; if(s.b>0.3) return tx(`Hata: Kat göstergesi ${s.fl} göstermeli!`,`Error: The floor display must show ${s.fl}!`); } else s.b=0; });
  return {title:seg?tx('Asansör + Kat Göstergesi','Lift + Floor Display'):tx('2 Katlı Asansör','Two-Floor Lift'),
    task:tx(`ÇAĞRI_2 (${A.call2}) kabini yukarı (${A.lup}), ÇAĞRI_1 (${A.call1}) aşağı (${A.ldn}) götürsün; kabin KAT_2 (${A.f2}) / KAT_1 (${A.f1}) sensöründe dursun. Motor aynı anda iki yöne sürülmesin.`+(seg?' Kabinin bulunduğu kat QB1\'deki 7-segment göstergede yazsın.':''),
      `CALL_2 (${A.call2}) takes the cabin up (${A.lup}), CALL_1 (${A.call1}) takes it down (${A.ldn}); the cabin stops at the FLOOR_2 (${A.f2}) / FLOOR_1 (${A.f1}) sensor. Never drive both directions.`+(seg?' Show the current floor on the 7-segment display on QB1.':'')),
    hint:tx(`(ÇAĞRI_2 ∥ ${A.lup}) · KAPALI KAT_2 · KAPALI ${A.ldn} → ${A.lup} · (ÇAĞRI_1 ∥ ${A.ldn}) · KAPALI KAT_1 · KAPALI ${A.lup} → ${A.ldn}`+(seg?' · KAT_1 → MOV VW0 ← 1 · KAT_2 → MOV VW0 ← 2 · SM0.0 → SEG QB1 ← VW0.':'.'),`(CALL_2 ∥ ${A.lup}) · NC FLOOR_2 · NC ${A.ldn} → ${A.lup} · (CALL_1 ∥ ${A.ldn}) · NC FLOOR_1 · NC ${A.lup} → ${A.ldn}`+(seg?' · FLOOR_1 → MOV VW0 ← 1 · FLOOR_2 → MOV VW0 ← 2 · SM0.0 → SEG QB1 ← VW0.':'.')),
    io,M:0,T:0,C:0,SM:!!seg,words:seg?['VW0','QB1']:[],wt:seg?{VW0:'KAT',QB1:'GÖSTERGE'}:{},pal:seg?palOf({rungs:rs}):PAL_B,scene:sc,goals:[{k:'up2',l:T2('2. kata çık','Go up to 2')},{k:'down1',l:T2('1. kata in','Come down to 1')}],sol:{rungs:rs},
    bot:once((w,P,t,st)=>{ if(!st.a&&t>0.5){ st.a=1; P(A.call2); } if(st.a===1&&w.f.up2){ st.a=2; st.t=t; } if(st.a===2&&t>st.t+0.8){ st.a=3; P(A.call1); } })};
};
/* ---------- OTOPARK ---------- */
const parking=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['pgate','ppass','pexit'],['bar','lamp'],{lamp:'DOLU'}); const cap=pick(r,[3,4]);
  const sol={rungs:[R(['NO '+A.ppass,'P','INC VW0']),R(['NO '+A.pexit,'P','DEC VW0']),R(['NO '+A.pgate,'CMP VW0 < '+cap,'COIL '+A.bar]),R(['CMP VW0 >= '+cap,'COIL '+A.lamp])]};
  const sc=Object.assign({},MB,{mach:{kind:'parking',gate:A.pgate,pass:A.ppass,exit:A.pexit,bar:A.bar,cap},lamps:[{a:A.lamp,c:'red',n:'DOLU'}],
    rules:[follow(w=>w.ms.parked>=cap,(w,q)=>q[A.lamp],tx(`Hata: DOLU lambası ${cap} araç içerdeyken yanmalı!`,`Error: The FULL lamp must be on while ${cap} cars are inside!`),0.35)]});
  return {title:tx(`Otopark Bariyeri (${cap} yer)`,`Car Park Barrier (${cap} spaces)`),
    task:tx(`Otoparkta ${cap} yer var. Araç bariyer önüne gelince GİRİŞ_SENSÖR (${A.pgate}) görür; içerde yer varsa BARİYER (${A.bar}) açılsın. Giren aracı GEÇİŞ (${A.ppass}), çıkanı ÇIKIŞ (${A.pexit}) sensörü verir: VW0'da say (INC/DEC + P). İçerde ${cap} araç varken DOLU (${A.lamp}) yansın ve bariyer açılmasın.`,
      `The car park has ${cap} spaces. When a car reaches the barrier, GATE_SENSOR (${A.pgate}) sees it; if there is space the BARRIER (${A.bar}) opens. PASSED (${A.ppass}) reports a car going in, EXIT (${A.pexit}) a car leaving: count in VW0 (INC/DEC + P). With ${cap} cars inside, FULL (${A.lamp}) lights and the barrier stays shut.`),
    hint:tx(`GEÇİŞ · P → INC VW0 · ÇIKIŞ · P → DEC VW0 · GİRİŞ_SENSÖR · CMP VW0 < ${cap} → ${A.bar} · CMP VW0 ≥ ${cap} → ${A.lamp}.`,`PASSED · P → INC VW0 · EXIT · P → DEC VW0 · GATE_SENSOR · CMP VW0 < ${cap} → ${A.bar} · CMP VW0 ≥ ${cap} → ${A.lamp}.`),
    io,M:0,T:0,C:0,words:['VW0'],wt:{VW0:'SAYI'},pal:palOf(sol,['ADD','SUB']),scene:sc,goals:[{k:'refused',l:T2('Doluyken beklet','Hold when full')},{k:'cnt',f:'parked',n:cap+1,l:T2('Giren araç','Cars in')}],sol,bot:()=>()=>{}};
};
/* ---------- DÖNÜŞÜMLÜ POMPALAR ---------- */
const pumpsAlt=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,[],['p1','p2']); const lo=pick(r,[8000,10000]), hi=pick(r,[24000,26000]);
  const rs=[R(['CMP AIW0 <= '+lo,'SET M0.0']),R(['CMP AIW0 >= '+hi,'RST M0.0']),R(['NO M0.0','P','COIL M0.2']),R(['NO M0.2','NC M0.1','COIL M0.1'],['NC M0.2','NO M0.1']),R(['NO M0.0','NC M0.1','COIL '+A.p1]),R(['NO M0.0','NO M0.1','COIL '+A.p2])];
  const sc=Object.assign({},MB,{proc:proc('tank',[A.p1,A.p2],{v0:0.5,up:0.14,down:0.05}),pumps:{a:[A.p1,A.p2]},
    rules:[(w,q,iv,dt,s)=>{ const a=!!q[A.p1], b=!!q[A.p2]; if(a&&b) return tx('Hata: İki pompa aynı anda çalışmamalı!','Error: Both pumps must not run together!');
      const on=a||b; if(on&&!s.on){ if(w.pv>lo/32000+0.03) return tx(`Hata: Pompa erken çalıştı! Seviye ${lo}'e inmeli.`,`Error: A pump started early! Wait for ${lo}.`);
        const which=a?1:2; if(s.last===which) return tx('Hata: Pompalar sırayla çalışmalı — bu sefer DİĞER pompa çalışmalıydı!','Error: The pumps must alternate — the OTHER pump should run this time!'); s.last=which; }
      if(!on&&s.on){ if(w.pv<hi/32000-0.03) return tx(`Hata: Pompa erken durdu! ${hi}'e kadar doldurmalı.`,`Error: The pump stopped early! Fill up to ${hi}.`); w.cnt.cyc=(w.cnt.cyc||0)+1; }
      s.on=on; }]});
  return {title:tx('Dönüşümlü Pompa İstasyonu','Alternating Pump Station'),
    task:tx(`İki pompa (${A.p1}, ${A.p2}) eşit yıpransın diye SIRAYLA çalışsın. Seviye (AIW0) ${lo}'e inince bir dolum başlasın, ${hi}'e gelince dursun (histerezis). Her yeni dolumda diğer pompa çalışsın. 3 döngü.`,
      `Two pumps (${A.p1}, ${A.p2}) take TURNS so they wear evenly. When the level (AIW0) drops to ${lo} a fill starts, at ${hi} it stops (hysteresis). Each new fill uses the other pump. 3 cycles.`),
    hint:tx(`CMP ≤ ${lo} → (S) M0.0 · CMP ≥ ${hi} → (R) M0.0 · M0.0 · P → M0.2 · (M0.2 · KAPALI M0.1) ∥ (KAPALI M0.2 · M0.1) → M0.1 (sıra biti) · M0.0 · KAPALI M0.1 → ${A.p1} · M0.0 · M0.1 → ${A.p2}.`,`CMP ≤ ${lo} → (S) M0.0 · CMP ≥ ${hi} → (R) M0.0 · M0.0 · P → M0.2 · (M0.2 · NC M0.1) ∥ (NC M0.2 · M0.1) → M0.1 (turn bit) · M0.0 · NC M0.1 → ${A.p1} · M0.0 · M0.1 → ${A.p2}.`),
    io,M:3,T:0,C:0,words:['AIW0'],wt:{AIW0:'SEVİYE'},pal:palOf({rungs:rs}),scene:sc,goals:[{k:'cnt',f:'cyc',n:3,l:T2('Dolum döngüsü','Fill cycle')}],sol:{rungs:rs},bot:()=>()=>{}};
};
/* ---------- OTO YIKAMA ---------- */
const carWash=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['car'],['foam','brush','dry']); const a=pick(r,[1.5,2]), b=pick(r,[2,2.5,3]), c=pick(r,[1.5,2]);
  const rs=[R(['NO '+A.car,'NC T3','COIL M0.0']),R(['NO M0.0','TON T1 '+a]),R(['NO T1','TON T2 '+b]),R(['NO T2','TON T3 '+c]),R(['NO M0.0','NC T1','COIL '+A.foam]),R(['NO T1','NC T2','COIL '+A.brush]),R(['NO T2','COIL '+A.dry])];
  const D={[A.foam]:a,[A.brush]:b,[A.dry]:c}, NX={[A.foam]:A.brush,[A.brush]:A.dry,[A.dry]:null};
  const sc=Object.assign({},MB,{mach:{kind:'wash',car:A.car,foam:A.foam,brush:A.brush,dry:A.dry,n:2},
    rules:[(w,q,iv,dt,s)=>{ const on=[A.foam,A.brush,A.dry].find(x=>q[x])||null;
      if(iv[A.car]&&!s.car) s.ct=w.t; s.car=!!iv[A.car];
      if(s.car&&!on&&!s.c&&w.t-s.ct>0.35) return tx('Hata: Araç bölmeye girince köpükleme başlamalı!','Error: Foaming must start when the car enters the bay!');
      if(on===(s.c||null)) return;
      if(s.c){ const d=w.t-s.ts; if(Math.abs(d-D[s.c])>0.35) return tx(`Hata: Süreler yanlış! Köpük ${fx(a)} sn, fırça ${fx(b)} sn, kurutma ${fx(c)} sn.`,`Error: Wrong timing! Foam ${a} s, brush ${b} s, dry ${c} s.`);
        if(on!==NX[s.c]) return tx('Hata: Sıra KÖPÜK → FIRÇA → KURUTMA olmalı!','Error: The order must be FOAM → BRUSH → DRY!'); }
      else if(on!==A.foam) return tx('Hata: Yıkama KÖPÜK ile başlamalı!','Error: The wash must start with FOAM!');
      s.c=on; s.ts=w.t; }]});
  return {title:tx('Oto Yıkama Sırası','Car Wash Sequence'),
    task:tx(`Araç bölmeye girince ARAÇ (${A.car}) sensörü görür. Sırayla: KÖPÜK (${A.foam}) ${fx(a)} sn → FIRÇA (${A.brush}) ${fx(b)} sn → KURUTMA (${A.dry}) ${fx(c)} sn. Aynı anda tek istasyon çalışsın; bitince araç çıkar, sıradaki gelir. 2 araç yıka.`,
      `When a car enters the bay the CAR (${A.car}) sensor sees it. In order: FOAM (${A.foam}) ${a} s → BRUSH (${A.brush}) ${b} s → DRY (${A.dry}) ${c} s. One station at a time; when done the car leaves and the next arrives. Wash 2 cars.`),
    hint:tx(`ARAÇ · KAPALI T3 → M0.0 · M0.0 → TON T1 (${fx(a)}) · T1 → TON T2 (${fx(b)}) · T2 → TON T3 (${fx(c)}) · M0.0 · KAPALI T1 → KÖPÜK · T1 · KAPALI T2 → FIRÇA · T2 → KURUTMA.`,`CAR · NC T3 → M0.0 · M0.0 → TON T1 (${a}) · T1 → TON T2 (${b}) · T2 → TON T3 (${c}) · M0.0 · NC T1 → FOAM · T1 · NC T2 → BRUSH · T2 → DRY.`),
    io,M:1,T:3,C:0,pal:PAL_C,scene:sc,goals:[{k:'cnt',f:'washed',n:2,l:T2('Yıkanan araç','Cars washed')}],sol:{rungs:rs},bot:()=>()=>{}};
};
/* ---------- ÇİFT EL EMNİYETLİ PRES ---------- */
const twoHand=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['left','right'],['press']);
  const rs=[R(['NO '+A.left,'TON T1 0.5'],['NO '+A.right]),R(['NO '+A.left,'NO '+A.right,'NC T1','COIL '+A.press],[null,null,'NO '+A.press])];
  const sc=Object.assign({},MB,{mach:{kind:'press',p:A.press,l:A.left,r:A.right},
    rules:[(w,q,iv,dt,s)=>{ const L=!!iv[A.left], Rr=!!iv[A.right], p=!!q[A.press];
      if(L&&!s.L) s.tl=w.t; if(Rr&&!s.R) s.tr=w.t; s.L=L; s.R=Rr;
      if(p&&!s.p){ if(!(L&&Rr)) return tx('Hata: Pres iki el basılı değilken indi!','Error: The press came down without both hands!');
        if(Math.abs(s.tl-s.tr)>0.6) return tx('Hata: İki buton 0,5 sn içinde basılmalı — bir eli sabitleyip hile yapılamaz!','Error: Both buttons must be pressed within 0.5 s — no tying one down!'); }
      if(p&&!(L&&Rr)){ s.u=(s.u||0)+dt; if(s.u>0.12) return tx('Hata: El çekilince pres hemen durmalı!','Error: The press must stop the moment a hand is released!'); } else s.u=0;
      if(L&&Rr&&Math.abs(s.tl-s.tr)>0.8&&!p){ s.k=(s.k||0)+dt; if(s.k>0.6) w.f.tie=true; } else s.k=0;
      s.p=p; }]});
  return {title:tx('Çift El Emniyetli Pres','Two-Hand Safety Press'),
    task:tx(`Pres (${A.press}) yalnızca iki el butonu (${A.left}, ${A.right}) BİRLİKTE basılıyken insin. Butonlar 0,5 sn içinde basılmazsa (biri önceden bantlanmışsa) pres hiç çalışmasın. Bir el çekilince pres hemen dursun. Butonları basılı tutarak dene.`,
      `The press (${A.press}) comes down only while BOTH hand buttons (${A.left}, ${A.right}) are held. If they are not pressed within 0.5 s of each other (one taped down), the press must not run. Releasing a hand stops it at once. Hold the buttons to try it.`),
    hint:tx(`(SOL ∥ SAĞ) → TON T1 (0,5 sn) · SOL · SAĞ · (KAPALI T1 ∥ ${A.press}) → ${A.press}. T1, ilk butondan sonra 0,5 sn'lik pencereyi ölçer.`,`(LEFT ∥ RIGHT) → TON T1 (0.5 s) · LEFT · RIGHT · (NC T1 ∥ ${A.press}) → ${A.press}. T1 measures the 0.5 s window after the first button.`),
    io,M:0,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'cnt',f:'stroke',n:1,l:T2('İlk basış','First stroke')},{k:'tie',l:T2('Hile testi','Tie-down test')},{k:'cnt',f:'stroke',n:2,l:T2('Basış','Strokes')}],sol:{rungs:rs},
    bot:holdAt([[0.5,A.left,true],[0.6,A.right,true],[2.5,A.left,false],[2.5,A.right,false],[3,A.right,true],[4.2,A.left,true],[5.2,A.left,false],[5.2,A.right,false],[5.8,A.left,true],[5.9,A.right,true],[7.6,A.left,false],[7.6,A.right,false]])};
};
/* ---------- SERA İKLİMİ ---------- */
const greenhouse=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,[],['heat','fan'],{fan:'FAN'}); const lo=pick(r,[12000,13000]), hi=pick(r,[19000,20000]);
  const rs=[R(['CMP AIW0 < '+lo,'COIL '+A.heat]),R(['CMP AIW0 > '+hi,'COIL '+A.fan])];
  const sc=Object.assign({},MB,{proc:proc('green',A.heat,{v0:0.5,up:0.1,down:0,out:A.fan,outRate:0.1,drift:0.12,dw:0.55,min:0.15,max:0.85,
      minMsg:tx('Hata: Sera çok soğudu, bitkiler dondu!','Error: The greenhouse got too cold, the plants froze!'),maxMsg:tx('Hata: Sera aşırı ısındı, bitkiler kurudu!','Error: The greenhouse overheated, the plants dried out!')}),
    rules:[follow((w,q,iv)=>iv.AIW0<lo,(w,q)=>q[A.heat],tx(`Hata: Isıtıcı sıcaklık ${lo}'ün altındayken çalışmalı!`,`Error: The heater must run below ${lo}!`)),
      follow((w,q,iv)=>iv.AIW0>hi,(w,q)=>q[A.fan],tx(`Hata: Fan sıcaklık ${hi}'ün üstündeyken çalışmalı!`,`Error: The fan must run above ${hi}!`)),
      timeIf('hOn',(w,q)=>q[A.heat],0.5),timeIf('fOn',(w,q)=>q[A.fan],0.5)]});
  return {title:tx('Sera İklim Kontrolü','Greenhouse Climate'),
    task:tx(`Gün boyu sera ısınıp soğuyor (AIW0 = sıcaklık). Sıcaklık ${lo}'ün altına düşünce ISITICI (${A.heat}), ${hi}'ün üstüne çıkınca FAN (${A.fan}) çalışsın. Bitkileri hem soğuktan hem sıcaktan koru.`,
      `The greenhouse warms and cools during the day (AIW0 = temperature). Below ${lo} the HEATER (${A.heat}) runs, above ${hi} the FAN (${A.fan}) runs. Protect the plants from both cold and heat.`),
    hint:tx(`CMP AIW0 < ${lo} → ${A.heat} · CMP AIW0 > ${hi} → ${A.fan}.`,`CMP AIW0 < ${lo} → ${A.heat} · CMP AIW0 > ${hi} → ${A.fan}.`),
    io,M:0,T:0,C:0,words:['AIW0'],wt:{AIW0:'SICAKLIK'},pal:palOf({rungs:rs}),scene:sc,goals:[{k:'fOn',l:T2('Fan ile soğut','Cool with fan')},{k:'hOn',l:T2('Isıtıcı ile ısıt','Warm with heater')}],sol:{rungs:rs},bot:()=>()=>{}};
};
/* ---------- ALARM ---------- */
const alarmSys=(r,k,n)=>{
  const {A,io}=mkCtx(r,n,['arm','door','code'],['siren','lamp'],{lamp:'KURULU'}); const t=pick(r,[2,2.5,3]); const d1=2, d2=2+t+3;
  const rs=[R(['NO '+A.arm,'COIL '+A.lamp]),R(['NO '+A.arm,'NO '+A.door,'SET M0.0']),R(['NO '+A.code,'RST M0.0']),R(['NO M0.0','TON T1 '+t]),R(['NO T1','COIL '+A.siren])];
  const sc=Object.assign({},MB,{mach:{kind:'alarm',door:A.door,arm:A.arm,doors:[d1,d2]},lamps:[{a:A.siren,c:'red',n:'SİREN'},{a:A.lamp,c:'amber',n:'KURULU'}],
    rules:[follow((w)=>!!w.sw[A.arm],(w,q)=>q[A.lamp],tx('Hata: KURULU lambası alarm kuruluyken yanmalı!','Error: The ARMED lamp must be on while armed!')),
      (w,q,iv,dt,s)=>{ if(iv[A.door]&&!s.d&&w.sw[A.arm]&&!s.trig){ s.trig=true; s.tt=w.t; } s.d=!!iv[A.door];
        if(iv[A.code]&&s.trig){ s.trig=false; if(!q[A.siren]) w.f.disarm=true; }
        const exp=!!s.trig&&w.t-s.tt>=t; if(!!q[A.siren]!==exp){ s.b=(s.b||0)+dt; if(s.b>0.3) return exp?tx(`Hata: Şifre girilmedi — siren ${fx(t)} sn sonra çalmalıydı!`,`Error: No code entered — the siren should sound after ${t} s!`):tx(`Hata: Siren yanlış zamanda çaldı! Kapı açıldıktan ${fx(t)} sn sonra ve şifre girilmediyse çalmalı.`,`Error: The siren sounded at the wrong time! It sounds ${t} s after the door opens, unless the code is entered.`); } else s.b=0;
        if(q[A.siren]){ s.sr=(s.sr||0)+dt; if(s.sr>0.6) w.f.siren=true; } }]});
  return {title:tx(`Ev Alarmı (${fx(t)} sn giriş gecikmesi)`,`Home Alarm (${t} s entry delay)`),
    task:tx(`KURMA (${A.arm}) anahtarı alarmı kursun, KURULU lambası (${A.lamp}) yansın. Kuruluyken KAPI (${A.door}) açılırsa alarm tetiklensin; ${fx(t)} sn içinde ŞİFRE (${A.code}) girilmezse SİREN (${A.siren}) çalsın. Şifre alarmı susturur.`,
      `The ARM (${A.arm}) key arms the alarm and the ARMED lamp (${A.lamp}) lights. If the DOOR (${A.door}) opens while armed, the alarm triggers; if the CODE (${A.code}) is not entered within ${t} s the SIREN (${A.siren}) sounds. The code silences it.`),
    hint:tx(`KURMA → ${A.lamp} · KURMA · KAPI → (S) M0.0 · ŞİFRE → (R) M0.0 · M0.0 → TON T1 (${fx(t)}) · T1 → ${A.siren}.`,`ARM → ${A.lamp} · ARM · DOOR → (S) M0.0 · CODE → (R) M0.0 · M0.0 → TON T1 (${t}) · T1 → ${A.siren}.`),
    io,M:1,T:1,C:0,pal:PAL_C,scene:sc,goals:[{k:'disarm',l:T2('Şifreyle sustur','Disarm with code')},{k:'siren',l:T2('Hırsıza siren','Siren on intruder')}],sol:{rungs:rs},bot:at([[0.5,A.arm],[d1+t/2,A.code]])};
};

/* ---------- yol haritasına dağıt (havuzların sonuna eklenir; v1.1.5 uzunlukları kayıt taşıma için saklanır) ---------- */
const LEN_115=TPL.map(p=>p.map(x=>x.length));
TPL[0][1].push(motorDOL,reverseMotor,garage(false),lift(false));
TPL[0][2].push(motorFault,garage(true));
TPL[1][1].push(starDelta,twoHand,alarmSys);
TPL[1][2].push(carWash);
TPL[3][1].push(greenhouse); TPL[3][2].push(pumpsAlt);
TPL[5][1].push(parking);
TPL[6][2].push(lift(true));
const MACH_SLOTS=[]; TPL.forEach((p,c)=>{ if(c<LEN_115.length-1) p.forEach((l,pool)=>{ for(let t=LEN_115[c][pool];t<l.length;t++) MACH_SLOTS.push({c,pool,t}); }); });
const ROAD_END=10000;   // yol 10.000 bölümde biter
