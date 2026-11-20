// Her bölümün referans çözümü, oyuncunun editörde gerçekten kurabileceği bir devre mi?
const fs=require('fs');
const code=['logic','gen','gen2'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
const M=new Function(code+';return {getLevel,COLS,OUTC,isOut,branchSpan,addrList,NOADDR,OPS,isTim,isCnt};')();
let bad=0; const N=+process.argv[2]||1200;
for(let id=0;id<N;id++){ const lv=M.getLevel(id); const errs=[];
  if(lv.sol.rungs.length>8) errs.push('8 satırdan fazla');
  lv.sol.rungs.forEach((rg,ri)=>{
    rg.c.forEach((row,r)=>row.forEach((c,ci)=>{ if(!c) return;
      if(!lv.pal.includes(c.t)) errs.push(`R${ri+1}: ${c.t} palette yok`);
      if(M.NOADDR.includes(c.t)){ if(c.a) errs.push(`R${ri+1}: ${c.t} adres almaz`); }
      else if(!M.addrList(lv,c.t).includes(c.a)) errs.push(`R${ri+1}: ${c.t} ${c.a} seçilemez`);
      if(c.src&&!M.addrList(lv,c.t,'src').includes(c.src)) errs.push(`R${ri+1}: ${c.t} kaynak ${c.src} seçilemez`);
      if(c.t==='CMP'&&(!M.OPS.includes(c.op)||!Number.isInteger(c.pv))) errs.push(`R${ri+1}: CMP ${c.op} ${c.pv} geçersiz`);
      if(['MOV','ADD','SUB','MUL','DIV','SHL','SHR','WAND','WOR'].includes(c.t)&&!c.src&&!(Number.isInteger(c.pv)&&c.pv>=-32768&&c.pv<=32767)) errs.push(`R${ri+1}: ${c.t} değer ${c.pv} geçersiz`);
      if((c.t==='SHL'||c.t==='SHR')&&!(c.pv>=1&&c.pv<=7)) errs.push(`R${ri+1}: kaydırma ${c.pv}`);
      if((c.t==='WAND'||c.t==='WOR')&&!(c.pv>=0&&c.pv<=255)) errs.push(`R${ri+1}: maske ${c.pv}`);
      if(M.isOut(c.t)&&(ci!==M.OUTC||r!==0)) errs.push(`R${ri+1}: çıkış yanlış sütunda`);
      if(!M.isOut(c.t)&&ci===M.OUTC) errs.push(`R${ri+1}: kontak çıkış sütununda`);
      if(r===1&&!rg.br) errs.push(`R${ri+1}: paralel kol kapalıyken alt satır dolu`);
      if(M.isTim(c.t)&&!(c.pv>=0.5&&c.pv<=30&&Math.abs(c.pv*2-Math.round(c.pv*2))<1e-9)) errs.push(`R${ri+1}: süre ${c.pv} ayarlanamaz`);
      if((c.t==='CTU'||c.t==='CTD')&&!(c.pv>=1&&c.pv<=20&&Number.isInteger(c.pv))) errs.push(`R${ri+1}: PV ${c.pv} ayarlanamaz`);
    }));
    if(!rg.c[0][M.OUTC]) errs.push(`R${ri+1}: çıkışsız satır`);
    const m=rg.c[0].slice(0,M.OUTC); const last=m.map(Boolean).lastIndexOf(true); for(let c=0;c<last;c++) if(!m[c]) errs.push(`R${ri+1}: ana hatta boşluk (soldan sağa kurulamaz)`);
    if(!m[0]) errs.push(`R${ri+1}: kontaksız çıkış`);
    if(rg.br&&rg.c[1]){ const b=rg.c[1].slice(0,M.OUTC).map(Boolean), f=b.indexOf(true), l=b.lastIndexOf(true); for(let c=f;c<l;c++) if(f>=0&&!b[c]) errs.push(`R${ri+1}: kolda boşluk`); }
  });
  if(errs.length){ bad++; if(bad<20) console.log(id+1, lv.title, '→', errs.join('; ')); }
}
console.log('kurulamayan çözüm:',bad,'/',N); process.exit(bad?1:0);
