'use strict';
/* ===== PLC LADDER BULMACA — MANTIK ÇEKİRDEĞİ ===== */
const COLS=5, OUTC=4, SCAN=0.02, BW=4, PIST_V=3;
const OUTT=['COIL','SET','RST','TON','TOF','CTU','CTD'];
const isOut=t=>OUTT.indexOf(t)>=0;
function parseCell(s){ if(!s) return null; const p=s.split(' '); const o={t:p[0],a:p[1]}; if(p[2]!==undefined) o.pv=parseFloat(p[2]); return o; }
function mkRung(){ return {br:false,c:[Array(COLS).fill(null),Array(COLS).fill(null)]}; }
function R(row0,row1){ const rg=mkRung(); rg.br=!!row1; row0.forEach((s,i)=>{rg.c[0][i]=parseCell(s);}); if(row1) row1.forEach((s,i)=>{rg.c[1][i]=parseCell(s);}); return rg; }
function countBlocks(p){ let n=0; for(const rg of p.rungs) for(const row of rg.c) for(const c of row) if(c) n++; return n; }
function branchSpan(rg){ let f=-1,t=-1; if(rg.br) for(let c=0;c<OUTC;c++) if(rg.c[1][c]){ if(f<0) f=c; t=c; } return f<0?null:{from:f,to:t}; }

/* ---------- PLC (sanal scan cycle) ---------- */
class PLC{
  constructor(){ this.reset(); }
  reset(){ this.b={}; this.T={}; this.C={}; this.res=[]; }
  rd(a){ const k=a[0]; if(k==='T') return !!(this.T[a]&&this.T[a].q); if(k==='C') return !!(this.C[a]&&this.C[a].q); return !!this.b[a]; }
  scan(prog,dt){ this.res=[]; for(const rg of prog.rungs) this.res.push(this.rung(rg,dt)); }
  rung(rg,dt){
    const Rs={in:[[],[]],out:[[],[]],outIn:false};
    const pass=(r,c)=>{ const x=rg.c[r][c]; if(!x||isOut(x.t)) return true; const v=this.rd(x.a); return x.t==='NC'?!v:v; };
    const sp=branchSpan(rg); let p=true,c=0;
    while(c<OUTC){
      if(sp&&c===sp.from){
        let pa=p,pb=p;
        for(let k=sp.from;k<=sp.to;k++){ Rs.in[0][k]=pa; pa=pa&&pass(0,k); Rs.out[0][k]=pa; Rs.in[1][k]=pb; pb=pb&&pass(1,k); Rs.out[1][k]=pb; }
        p=pa||pb; c=sp.to+1;
      } else { Rs.in[0][c]=p; p=p&&pass(0,c); Rs.out[0][c]=p; c++; }
    }
    Rs.outIn=p;
    const o=rg.c[0][OUTC]; if(o&&isOut(o.t)) this.exec(o,p,dt);
    return Rs;
  }
  exec(o,p,dt){
    const a=o.a;
    switch(o.t){
      case 'COIL': this.b[a]=p; break;
      case 'SET': if(p) this.b[a]=true; break;
      case 'RST': if(p){
        if(a[0]==='T'){ const t=this.T[a]; if(t){ t.et=0; t.q=false; } }
        else if(a[0]==='C'){ const c=this.C[a]; if(c){ c.cv=c.type==='CTD'?c.pv:0; c.q=c.type==='CTD'?c.cv<=0:c.cv>=c.pv; } }
        else this.b[a]=false; } break;
      case 'TON': { let t=this.T[a]; if(!t||t.type!=='TON') t=this.T[a]={type:'TON',et:0,q:false,pv:0};
        t.pv=(o.pv||2)*1000; if(p){ t.et=Math.min(t.et+dt,t.pv); t.q=t.et>=t.pv; } else { t.et=0; t.q=false; } break; }
      case 'TOF': { let t=this.T[a]; if(!t||t.type!=='TOF') t=this.T[a]={type:'TOF',et:0,q:false,pv:0};
        t.pv=(o.pv||2)*1000; if(p){ t.q=true; t.et=0; } else if(t.q){ t.et+=dt; if(t.et>=t.pv){ t.et=t.pv; t.q=false; } } break; }
      case 'CTU': case 'CTD': { let c=this.C[a]; const pv=o.pv||3;
        if(!c||c.type!==o.t) c=this.C[a]={type:o.t,cv:o.t==='CTD'?pv:0,pv:pv,q:false,pi:false};
        c.pv=pv; if(p&&!c.pi){ if(o.t==='CTU') c.cv=Math.min(c.cv+1,999); else c.cv=Math.max(c.cv-1,-99); } c.pi=p;
        c.q=o.t==='CTU'?c.cv>=c.pv:c.cv<=0; break; }
    }
  }
}

/* ---------- FABRİKA DÜNYASI ---------- */
class World{
  constructor(lv){ this.lv=lv; const s=lv.scene;
    this.sc=Object.assign({speed:20,gap:1.2,sensors:[],pistons:[],valves:[],lamps:[],endDrop:'err'},s); this.reset(); }
  mk(id){ return {id,x:0,st:'belt',py:0,fill:0,wait:0,ft:0,chk:false}; }
  reset(){
    this.t=0; this.boxes=[this.mk(1)]; this.nid=1; this.spawnT=0; this.err=null; this.done=false;
    this.delivered=0; this.diverted=0; this.filled=0; this.cntRises=0; this.batches=0;
    this.sw={}; this.pulse={}; this.ext={}; this.f={}; this.gd=this.lv.goals.map(()=>false); this.iv={};
    this.sc.pistons.forEach(p=>{this.ext[p.a]=0;});
    this.motor=false; this.pm=false; this.beltOff=0; this.fanAng=0; this.idleT=0; this.spill=0; this.nofan=0;
    this.startPressed=false; this.startFall=null; this.pS=false; this.noStart=0; this.pP=false; this.stopWatch=0; this.stopPressT=null;
    this.pc=false; this.pendB=null; this.parkT=0; this.lpT=0; this.pA=false; this.ackSeen=false; this.pl=false;
    this.lrT=0; this.loT=0; this.andT=0; this.orT=0; this.atT=0; this.oa=0; this.ob=0; this.pkS=null; this.pLd=false; this.pSrc=false; this.srcFall=null; this.pLt=false; this.pLc=false; this.startAt=null; this.sdLamp=0; this.mFall=null; this.prevSp=false; this.prevFan=false; this.sprayOffT=null; this.q={}; this.shake=0;
  }
  fail(m){ if(!this.err&&!this.done) this.err=m; return false; }
  press(a){ const d=this.lv.io.I.find(x=>x.a===a); if(!d) return; if(d.k==='btn') this.pulse[a]=0.3; else if(d.k==='sw') this.sw[a]=!this.sw[a]; }
  sensorOn(a){ const s=this.sc.sensors.find(s=>s.a===a); if(!s) return false; return this.boxes.some(b=>b.st==='belt'&&Math.abs(b.x-s.x)<=BW); }
  sense(){
    const iv={};
    for(const d of this.lv.io.I){
      if(d.k==='btn') iv[d.a]=(this.pulse[d.a]||0)>0;
      else if(d.k==='sw') iv[d.a]=!!this.sw[d.a];
      else if(d.k==='sensor') iv[d.a]=this.sensorOn(d.a);
      else if(d.k==='limit'){ const p=this.sc.pistons.find(p=>p.lim===d.a); iv[d.a]=!!p&&this.ext[p.a]>=0.98; }
    }
    this.iv=iv; return iv;
  }
  advance(q,dt){
    if(this.err||this.done) return;
    const sc=this.sc; this.q=q; this.t+=dt;
    for(const k in this.pulse) if(this.pulse[k]>0) this.pulse[k]=Math.max(0,this.pulse[k]-dt);
    this.motor=!!q[sc.motor];
    for(const p of sc.pistons){ const tg=q[p.a]?1:0, e=this.ext[p.a], d=tg-e, st=PIST_V*dt; this.ext[p.a]=Math.abs(d)<=st?tg:e+Math.sign(d)*st; }
    if(this.motor){ this.beltOff=(this.beltOff+sc.speed*dt)%1000; for(const b of this.boxes) if(b.st==='belt') b.x+=sc.speed*dt; }
    if(sc.fan&&q[sc.fan.a]) this.fanAng+=dt*14;
    // piston itme
    for(const p of sc.pistons){ if(this.ext[p.a]>0.3){ for(const b of this.boxes){ if(b.st==='belt'&&Math.abs(b.x-p.x)<=6){
      b.st='pushed'; b.py=0;
      if(sc.divertIf&&!this.iv[sc.divertIf]) return this.fail('Hata: Onay anahtarı kapalıyken kutu ayrıldı!');
      if(sc.divertEvery&&b.id%sc.divertEvery!==0) return this.fail('Hata: Yanlış kutu ayrıldı! Yalnızca her '+sc.divertEvery+'. kutu ayrılmalı.');
      if(sc.waitRange){ if(b.wait<sc.waitRange[0]) return this.fail('Hata: Piston çok erken itti! Kutu sensörde ~2 sn beklemeliydi.'); if(b.wait>sc.waitRange[1]) return this.fail('Hata: Kutu sensörde çok uzun bekletildi!'); }
    } } } }
    for(const b of this.boxes){
      if(b.st==='pushed'){ const e=Math.max(...sc.pistons.map(p=>this.ext[p.a]),0); b.py=Math.min(1,Math.max(b.py+4*dt,e)); if(b.py>=1){ b.st='bin'; b.ft=0; this.diverted++; } }
      else if(b.st==='bin'||b.st==='end'||b.st==='removed') b.ft+=dt;
    }
    this.boxes=this.boxes.filter(b=>!((b.st==='end'&&b.ft>0.8)||(b.st==='removed'&&b.ft>0.6)||(b.st==='bin'&&b.ft>1.8)));
    // bekleme süresi
    if(sc.waitSensor){ const s=sc.sensors.find(s=>s.a===sc.waitSensor); for(const b of this.boxes) if(b.st==='belt'&&Math.abs(b.x-s.x)<=BW) b.wait+=dt; }
    // bant sonu
    for(const b of this.boxes){ if(b.st==='belt'&&b.x>=100){
      if(sc.divertEvery&&b.id%sc.divertEvery===0) return this.fail('Hata: '+b.id+'. kutu ayrılmadan bant sonuna ulaştı!');
      if(sc.divertIf&&this.iv[sc.divertIf]) return this.fail('Hata: Onay anahtarı açıkken kutu ayrılmadı!');
      if(sc.endDrop==='deliver'){ b.st='end'; b.ft=0; this.delivered++; if(b.fill>=0.95) this.filled++; }
      else return this.fail(sc.endMsg||'Hata: Kutu ayrılmadan bant sonuna ulaştı!');
    } }
    // valfler
    for(const v of sc.valves){
      if(q[v.a]){ const tg=this.boxes.find(b=>b.st==='belt'&&Math.abs(b.x-v.x)<=6);
        if(tg){ tg.fill+=dt/v.fillTime; this.spill=0; if(tg.fill>1.3) return this.fail(v.kind==='spray'?'Hata: Fazla boya sıkıldı!':'Hata: Şişe taştı! Valf çok uzun açık kaldı.'); }
        else { this.spill+=dt; if(this.spill>0.6) return this.fail(v.kind==='spray'?'Hata: Boş kabine boya püskürtüldü!':'Hata: Valf boşta açıldı, sıvı döküldü!'); } }
      else this.spill=0;
      for(const b of this.boxes) if(b.st==='belt'&&b.x>v.x+6&&b.fill<0.95&&!b.chk){ b.chk=true; return this.fail(v.kind==='spray'?'Hata: Kutu boyanmadan kabinden çıktı!':'Hata: Şişe dolmadan istasyondan geçti!'); }
    }
    // spawn
    if(this.nid<sc.boxes){ this.spawnT+=dt; if(this.spawnT>=sc.gap&&!this.boxes.some(b=>b.st==='belt'&&b.x<14)){ this.boxes.push(this.mk(++this.nid)); this.spawnT=0; } }
    if(!this.checks(q,dt)) return;
    this.pm=this.motor;
    // hedefler
    const gl=this.goalList(); gl.forEach((g,i)=>{ if(g.ok) this.gd[i]=true; });
    if(this.gd.every(Boolean)){ this.done=true; return; }
    const active=this.boxes.some(b=>b.st==='belt'||b.st==='pushed');
    if(this.nid>=sc.boxes&&!active){ this.idleT+=dt; if(this.idleT>4.5) return this.fail('Hedefe ulaşılamadı: kutular bitti. Programı gözden geçir.'); } else this.idleT=0;
    if(this.t>240) this.fail('Zaman aşımı: görev süresi doldu.');
  }
  checks(q,dt){
    const sc=this.sc, iv=this.iv||{}, goals=this.lv.goals;
    if(sc.startA){
      const s=!!iv[sc.startA];
      if(s&&!this.pS){ this.startPressed=true; this.startFall=null; this.stopPressT=null; this.startAt=this.t; this.sdLamp=0; }
      if(!s&&this.pS) this.startFall=this.t;
      this.pS=s;
      if(sc.startFirst&&!this.startPressed&&this.motor){ this.noStart+=dt; if(this.noStart>0.4) return this.fail('Hata: START\'a basılmadan bant çalıştı!'); }
      if(this.startPressed&&!s&&this.startFall!==null&&this.t-this.startFall>=0.8&&this.motor) this.f.seal=true;
    }
    if(sc.stopA){
      const s=!!iv[sc.stopA];
      if(s&&!this.pP){ this.stopWatch=this.pm?0.6:0; this.stopPressT=this.pm?this.t:null; }
      this.pP=s;
      if(this.stopWatch>0){ this.stopWatch-=dt; if(!this.motor){ this.f.stop=true; this.stopWatch=0; } }
    }
    if(sc.stopDelay&&this.pm&&!this.motor&&this.stopPressT!==null){
      const td=sc.stopDelay===true?3:sc.stopDelay, d=this.t-this.stopPressT; this.stopPressT=null;
      if(d>=td-0.4&&d<=td+0.6) this.f.stopDelay=true; else return this.fail('Hata: Bant STOP\'tan '+d.toFixed(1)+' sn sonra durdu. Gecikme ≈'+String(td).replace('.',',')+' sn olmalı!');
    }
    if(sc.countSensor){
      if(this.motor&&!this.pm) this.cntRises=0;
      const on=this.sensorOn(sc.countSensor); if(on&&!this.pc) this.cntRises++; this.pc=on;
      if(this.motor&&this.cntRises>sc.batchN) return this.fail('Hata: Bant '+sc.batchN+' kutudan sonra durmadı!');
      if(!this.motor&&this.pm&&this.cntRises===sc.batchN) this.pendB=0.5;
    }
    if(this.pendB!==null){ this.pendB-=dt; if(this.pendB<=0){ this.pendB=null; if(q[sc.lampA]) this.batches++; else return this.fail('Hata: Parti tamamlandı ama lamba yanmadı!'); } }
    const pk=goals.find(g=>g.k==='park');
    if(pk){ if(!this.motor&&this.sensorOn(pk.s)) this.parkT+=dt; else this.parkT=0; }
    if(sc.lampA&&pk){ if(this.parkT>0&&q[sc.lampA]) this.lpT+=dt; if(this.lpT>=0.8) this.f.lampPark=true; }
    if(sc.ackA){
      const a=!!iv[sc.ackA];
      if(a&&!this.pA){ if(this.pl) this.ackSeen=true;
        const s=sc.sensors[0]; if(!this.motor) for(const b of this.boxes) if(b.st==='belt'&&Math.abs(b.x-s.x)<=BW){ b.st='removed'; b.ft=0; } }
      this.pA=a;
      if(this.pl&&!q[sc.lampA]&&this.ackSeen&&this.f.lampPark) this.f.lampAck=true;
      this.pl=!!q[sc.lampA];
    }
    if(goals.some(g=>g.k==='lampRun')){
      if(this.motor&&q[sc.lampA]) this.lrT+=dt;
      if(!this.motor&&this.parkT>0.2&&!q[sc.lampA]) this.loT+=dt;
      if(this.lrT>=1&&this.loT>=0.5) this.f.lampRun=true;
    }
    if(goals.some(g=>g.k==='lampPush')){ const e=Math.max(...sc.pistons.map(p=>this.ext[p.a]),0); if(q[sc.lampA]&&e>0.4) this.f.lampPush=true; }
    if(sc.fan){
      const sp=!!q[sc.fan.spray], fn=!!q[sc.fan.a];
      if(sp&&!fn){ this.nofan+=dt; if(this.nofan>0.15) return this.fail('Hata: Egzoz fanı kapalıyken boya püskürtüldü!'); } else this.nofan=0;
      if(this.prevSp&&!sp) this.sprayOffT=this.t;
      if(this.prevFan&&!fn&&this.sprayOffT!==null){ const d=this.t-this.sprayOffT;
        const h=sc.fan.hold||3; if(d<h-0.4) return this.fail('Hata: Fan çok erken durdu! Buhar için '+String(h).replace('.',',')+' sn beklemeli.'); if(d<=h+0.6) this.f.fanHold=true; }
      this.prevSp=sp; this.prevFan=fn;
    }
    if(sc.motorAnd){ if(this.motor&&!sc.motorAnd.every(a=>iv[a])){ this.andT+=dt; if(this.andT>0.3) return this.fail('Hata: Bant yalnızca iki şalter de açıkken çalışmalı!'); } else this.andT=0; }
    if(sc.motorAnd){ const on=sc.motorAnd.filter(a=>iv[a]).length; if(on===1&&!this.motor){ this.atT+=dt; if(this.atT>=0.8) this.f.andTest=true; } }
    if(sc.motorOr){ const [a,b]=sc.motorOr; if(this.motor&&iv[a]&&!iv[b]) this.oa+=dt; if(this.motor&&iv[b]&&!iv[a]) this.ob+=dt; if(this.oa>=0.5&&this.ob>=0.5) this.f.orTest=true; }
    if(sc.motorOr){ const any=sc.motorOr.some(a=>iv[a]), sOn=sc.sensors.some(s=>this.sensorOn(s.a)); if(any&&!this.motor&&!sOn){ this.orT+=dt; if(this.orT>0.5) return this.fail('Hata: Şalterlerden herhangi biri açıkken bant çalışmalı!'); } else this.orT=0; }
    if(sc.lampDelay){ const par=!this.motor&&this.sensorOn(sc.lampDelay.s); if(par&&this.pkS===null) this.pkS=this.t; if(!par) this.pkS=null;
      const lp=!!q[sc.lampA]; if(lp&&!this.pLd){ const T=sc.lampDelay.t; if(this.pkS===null) return this.fail('Hata: Lamba kutu sensörde beklerken yanmalı!'); const d=this.t-this.pkS;
        if(d>=T-0.25&&d<=T+0.6) this.f.lampDelay=true; else return this.fail('Hata: Lamba '+d.toFixed(1)+' sn sonra yandı, '+String(T).replace('.',',')+' sn olmalı!'); } this.pLd=lp; }
    if(sc.lampTof){ const sv=sc.lampTof.src==='motor'?this.motor:!!q[sc.lampTof.src]; if(this.pSrc&&!sv) this.srcFall=this.t; this.pSrc=sv;
      const lp=!!q[sc.lampA]; if(this.pLt&&!lp&&this.srcFall!==null){ const d=this.t-this.srcFall, T=sc.lampTof.t; if(d>=T-0.4&&d<=T+0.6) this.f.lampTof=true; else return this.fail('Hata: Lamba '+d.toFixed(1)+' sn sonra söndü, '+String(T).replace('.',',')+' sn olmalı!'); } this.pLt=lp; }
    if(sc.startDelay){ if(this.startAt!==null&&!this.motor&&q[sc.lampA]) this.sdLamp+=dt;
      if(this.motor&&!this.pm&&this.startAt!==null){ const d=this.t-this.startAt, T=sc.startDelay; this.startAt=null;
        if(d<T-0.3||d>T+0.8) return this.fail('Hata: Bant START\'tan '+d.toFixed(1)+' sn sonra kalktı, '+String(T).replace('.',',')+' sn olmalı!');
        if(this.sdLamp<T-0.6) return this.fail('Hata: Bekleme süresince ikaz lambası yanmalı!'); this.f.startDelay=true; } }
    if(sc.lampCount){ const lp=!!q[sc.lampA]; if(lp&&!this.pLc){ if(this.cntRises>=sc.lampCount.n) this.f.lampCount=true; else return this.fail('Hata: Lamba '+sc.lampCount.n+'. kutudan önce yandı!'); } this.pLc=lp; }
    if(sc.restartAfter){ if(this.pm&&!this.motor) this.mFall=this.t;
      if(!this.pm&&this.motor&&this.mFall!==null){ const d=this.t-this.mFall, T=sc.restartAfter; this.mFall=null;
        if(d>=T-0.3&&d<=T+0.8) this.f.restart=true; else return this.fail('Hata: Bant '+d.toFixed(1)+' sn sonra yeniden kalktı, '+String(T).replace('.',',')+' sn olmalı!'); } }
    return true;
  }
  goalList(){
    const LB={seal:'Mühürleme',stop:'STOP ile durdur',lampPark:'Arıza lambası',lampAck:'Onayla söndür',lampRun:'Çalışıyor lambası',lampPush:'Ayırma lambası',
      lampDelay:'Gecikmeli lamba',lampTof:'Lamba gecikmeli söner',startDelay:'Gecikmeli kalkış',lampCount:'Sayaç lambası',restart:'Otomatik yeniden kalkış',andTest:'Tek şalter testi',orTest:'İki şalter ayrı ayrı'};
    const tr=x=>String(x).replace('.',',');
    return this.lv.goals.map((g,i)=>{ let l,ok;
      switch(g.k){
        case 'deliver': l='Teslim '+Math.min(this.delivered,g.n)+'/'+g.n; ok=this.delivered>=g.n; break;
        case 'divert': l='Ayrılan '+Math.min(this.diverted,g.n)+'/'+g.n; ok=this.diverted>=g.n; break;
        case 'fill': l=(g.lb||'Dolum')+' '+Math.min(this.filled,g.n)+'/'+g.n; ok=this.filled>=g.n; break;
        case 'batch': l='Parti '+Math.min(this.batches,g.n)+'/'+g.n; ok=this.batches>=g.n; break;
        case 'park': l='Sensörde dur'; ok=this.parkT>=g.hold; break;
        case 'stopDelay': l=tr(g.t||3)+' sn gecikmeli dur'; ok=!!this.f.stopDelay; break;
        case 'fanHold': l='Fan '+tr(g.t||3)+' sn nöbet'; ok=!!this.f.fanHold; break;
        default: l=LB[g.k]||g.k; ok=!!this.f[g.k];
      }
      if(this.gd[i]) ok=true; return {l,ok}; });
  }
}

