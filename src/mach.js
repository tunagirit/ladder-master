/* ===== v1.1.6 MAKİNELER — bant dışındaki sistemlerin fiziği ===== */
const clamp01=v=>Math.max(0,Math.min(1,v));
const MACH={
  /* doğrudan yol verme + termik röle */
  motor:{ init:()=>({spd:0,ang:0,run:0,trip:0,tripped:false}),
    sense:(w,m,s)=>{ if(m.trip) w.mv[m.trip]=s.trip>0; },
    step:(w,q,dt,m,s)=>{ const on=!!q[m.k]; s.spd=clamp01(s.spd+(on?1.4:-0.9)*dt); s.ang+=s.spd*dt*16; if(on) s.run+=dt;
      if(m.trip&&m.tripAt&&!s.tripped&&s.run>=m.tripAt){ s.tripped=true; s.trip=1.5; w.f.tripped=true; }
      if(s.trip>0) s.trip-=dt; } },
  /* yıldız-üçgen */
  stardelta:{ init:()=>({spd:0,ang:0}), sense:()=>{},
    step:(w,q,dt,m,s)=>{ const k1=!!q[m.k1],k2=!!q[m.k2],k3=!!q[m.k3];
      if(k2&&k3) return tx('KISA DEVRE! Yıldız (K2) ve üçgen (K3) kontaktörleri aynı anda çekti.','SHORT CIRCUIT! Star (K2) and delta (K3) contactors were on at the same time.');
      if((k2||k3)&&!k1){ s.nk=(s.nk||0)+dt; if(s.nk>0.15) return tx('Hata: Yıldız/üçgen kontaktörü ana kontaktör (K1) olmadan çekti!','Error: Star/delta contactor pulled in without the main contactor (K1)!'); } else s.nk=0;
      const tg=k1&&k3?1:k1&&k2?0.55:0; s.spd+=(tg-s.spd)*Math.min(1,dt*2.2); s.ang+=s.spd*dt*16; } },
  /* ileri-geri */
  reverse:{ init:()=>({spd:0,ang:0}), sense:()=>{},
    step:(w,q,dt,m,s)=>{ const f=!!q[m.kf], r=!!q[m.kr];
      if(f&&r) return tx('KISA DEVRE! İleri ve geri kontaktörleri aynı anda çekti — kilitleme (interlock) yok.','SHORT CIRCUIT! Forward and reverse contactors were on together — no interlock.');
      const tg=f?1:r?-1:0; s.spd+=(tg-s.spd)*Math.min(1,dt*3); s.ang+=s.spd*dt*14; } },
  /* garaj kapısı */
  garage:{ init:()=>({pos:0,eye:0,used:false,ot:0,ed:0,pd:false}),
    sense:(w,m,s)=>{ w.mv[m.top]=s.pos>=0.995; w.mv[m.bot]=s.pos<=0.005; if(m.eye) w.mv[m.eye]=s.eye>0; },
    step:(w,q,dt,m,s)=>{ const u=!!q[m.up], d=!!q[m.dn], v=m.v||0.3;
      if(u&&d) return tx('Hata: Kapı motoru aynı anda hem yukarı hem aşağı sürüldü!','Error: The door motor was driven up and down at the same time!');
      s.pos=clamp01(s.pos+((u?v:0)-(d?v:0))*dt);
      if((u&&s.pos>=0.995)||(d&&s.pos<=0.005)){ s.ot+=dt; if(s.ot>0.35) return tx('Hata: Kapı limit şaltere dayandı ama motor durmadı — kapı zorlanıyor!','Error: The door hit the limit switch but the motor kept running — the door is straining!'); } else s.ot=0;
      if(s.pos>=0.995) w.f.opened=true; if(w.f.opened&&s.pos<=0.005&&(!m.eye||w.f.rev)) w.f.closed=true;
      if(m.eye){ if(d&&!s.used&&s.pos<=0.5){ s.used=true; s.eye=1.3; s.et=w.t; }
        if(s.eye>0){ s.eye-=dt; if(d){ s.ed+=dt; if(s.ed>0.25) return tx('Hata: Fotosel engel gördü ama kapı inmeye devam etti!','Error: The photocell saw an obstacle but the door kept closing!'); } else s.ed=0; }
        if(s.used&&u&&w.t-s.et<0.8) w.f.rev=true; } } },
  /* 2 katlı asansör */
  lift:{ init:()=>({pos:0,ot:0}),
    sense:(w,m,s)=>{ w.mv[m.f1]=s.pos<=0.005; w.mv[m.f2]=s.pos>=0.995; },
    step:(w,q,dt,m,s)=>{ const u=!!q[m.up], d=!!q[m.dn], v=m.v||0.35;
      if(u&&d) return tx('Hata: Asansör motoru aynı anda yukarı ve aşağı sürüldü!','Error: The lift motor was driven up and down at the same time!');
      s.pos=clamp01(s.pos+((u?v:0)-(d?v:0))*dt);
      if((u&&s.pos>=0.995)||(d&&s.pos<=0.005)){ s.ot+=dt; if(s.ot>0.35) return tx('Hata: Kabin katta durmadı — kat sensörü motoru kesmeli!','Error: The cabin did not stop at the floor — the floor sensor must cut the motor!'); } else s.ot=0;
      if(s.pos>=0.995) w.f.up2=true; if(w.f.up2&&s.pos<=0.005) w.f.down1=true; } },
  /* otopark bariyeri */
  parking:{ init:m=>({parked:0,total:0,next:0.8,car:null,pass:0,pp:0,ep:0,ex:0,arm:0,refusedAt:-1}),
    sense:(w,m,s)=>{ w.mv[m.gate]=!!s.car&&!s.pass; w.mv[m.pass]=s.pp>0; w.mv[m.exit]=s.ep>0; },
    step:(w,q,dt,m,s)=>{ const bar=!!q[m.bar], cap=m.cap; s.arm=clamp01(s.arm+(bar?3:-3)*dt);
      if(s.pp>0) s.pp-=dt; if(s.ep>0) s.ep-=dt;
      if(!s.car){ s.next-=dt; if(s.next<=0){ s.car={wait:0}; s.next=1.3; } }
      else if(!s.pass){
        if(bar){ if(s.parked>=cap) return tx('Hata: Otopark doluyken bariyer açıldı!','Error: The barrier opened while the car park was full!'); s.pass=0.6; }
        else { s.car.wait+=dt;
          if(s.parked<cap&&s.car.wait>1.2) return tx('Hata: Boş yer varken araç kapıda bekletildi — bariyer açılmalıydı!','Error: A car was kept waiting although there was space — the barrier should open!');
          if(s.parked>=cap&&s.car.wait>=1.2&&!s.ex){ w.f.refused=true; s.ex=0.4; } } }
      else { s.pass-=dt; if(s.pass<=0){ s.pass=0; s.car=null; s.parked++; s.total++; s.pp=0.25; w.cnt.parked=s.total; } }
      if(s.ex>0){ s.ex-=dt; if(s.ex<=0){ s.ex=0; s.parked--; s.ep=0.25; } } } },
  /* oto yıkama */
  wash:{ init:()=>({st:1,x:-1,washed:0,was:false,wait:0}),
    sense:(w,m,s)=>{ w.mv[m.car]=s.st===2; },
    step:(w,q,dt,m,s)=>{ const on=[m.foam,m.brush,m.dry].filter(a=>q[a]);
      if(on.length>1) return tx('Hata: Yıkama adımları sırayla çalışmalı — aynı anda iki istasyon açık!','Error: Wash steps must run one at a time — two stations are on together!');
      if(on.length&&s.st!==2) return tx('Hata: Bölmede araç yokken yıkama çalıştı!','Error: The wash ran with no car in the bay!');
      if(s.st===1){ s.x=Math.min(0,s.x+dt*1.8); if(s.x>=0) s.st=2; }
      else if(s.st===2){ const d=!!q[m.dry]; if(s.was&&!d){ s.st=3; s.washed++; w.cnt.washed=s.washed; } s.was=d; }
      else if(s.st===3){ s.x+=dt*1.8; if(s.x>=1){ s.st=0; s.wait=0.8; s.was=false; } }
      else if(s.st===0&&s.washed<(m.n||3)){ s.wait-=dt; if(s.wait<=0){ s.st=1; s.x=-1; } } } },
  /* çift el emniyetli pres */
  press:{ init:()=>({pos:0,down:false}), sense:()=>{},
    step:(w,q,dt,m,s)=>{ const on=!!q[m.p]; s.pos=clamp01(s.pos+(on?0.9:-1.3)*dt);
      if(s.pos>=0.999&&!s.down){ s.down=true; w.cnt.stroke=(w.cnt.stroke||0)+1; } if(s.pos<=0.02) s.down=false; } },
  /* alarm sistemi */
  alarm:{ init:()=>({open:0,i:0}),
    sense:(w,m,s)=>{ w.mv[m.door]=s.open>0; },
    step:(w,q,dt,m,s)=>{ if(s.i<m.doors.length&&w.t>=m.doors[s.i]){ s.open=0.9; s.i++; } if(s.open>0) s.open-=dt; } },
  /* yalnız çizim için (fizik proc ile) */
  pumps:{ init:()=>({}), sense:()=>{}, step:()=>{} },
  green:{ init:()=>({}), sense:()=>{}, step:()=>{} }
};
