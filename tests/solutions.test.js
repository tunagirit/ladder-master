// Her bölümün referans çözümü, oyuncunun editörde gerçekten kurabileceği bir devre mi?
const fs=require('fs');
const code=fs.readFileSync(__dirname+'/../src/logic.js','utf8')+fs.readFileSync(__dirname+'/../src/gen.js','utf8');
const M=new Function(code+';return {getLevel,COLS,OUTC,isOut,branchSpan};')();
function allowed(lv,t){
  const I=lv.io.I.map(d=>d.a), Q=lv.io.Q.map(d=>d.a), Mm=[...Array(lv.M)].map((_,i)=>'M0.'+i), T=[...Array(lv.T)].map((_,i)=>'T'+(i+1)), C=[...Array(lv.C)].map((_,i)=>'C'+(i+1));
  if(t==='NO'||t==='NC') return [...I,...Q,...Mm,...T,...C];
  if(t==='COIL'||t==='SET') return [...Q,...Mm];
  if(t==='RST') return [...Q,...Mm,...T,...C];
  if(t==='TON'||t==='TOF') return T; return C;
}
let bad=0; const N=+process.argv[2]||1200;
for(let id=0;id<N;id++){ const lv=M.getLevel(id); const errs=[];
  if(lv.sol.rungs.length>8) errs.push('8 satırdan fazla');
  lv.sol.rungs.forEach((rg,ri)=>{
    rg.c.forEach((row,r)=>row.forEach((c,ci)=>{ if(!c) return;
      if(!lv.pal.includes(c.t)) errs.push(`R${ri+1}: ${c.t} palette yok`);
      if(!allowed(lv,c.t).includes(c.a)) errs.push(`R${ri+1}: ${c.t} ${c.a} seçilemez`);
      if(M.isOut(c.t)&&(ci!==M.OUTC||r!==0)) errs.push(`R${ri+1}: çıkış yanlış sütunda`);
      if(!M.isOut(c.t)&&ci===M.OUTC) errs.push(`R${ri+1}: kontak çıkış sütununda`);
      if(r===1&&!rg.br) errs.push(`R${ri+1}: paralel kol kapalıyken alt satır dolu`);
      if((c.t==='TON'||c.t==='TOF')&&!(c.pv>=0.5&&c.pv<=30&&Math.abs(c.pv*2-Math.round(c.pv*2))<1e-9)) errs.push(`R${ri+1}: süre ${c.pv} ayarlanamaz`);
      if((c.t==='CTU'||c.t==='CTD')&&!(c.pv>=1&&c.pv<=20&&Number.isInteger(c.pv))) errs.push(`R${ri+1}: PV ${c.pv} ayarlanamaz`);
    }));
    if(!rg.c[0][M.OUTC]) errs.push(`R${ri+1}: çıkışsız satır`);
  });
  if(errs.length){ bad++; if(bad<20) console.log(id+1, lv.title, '→', errs.join('; ')); }
}
console.log('kurulamayan çözüm:',bad,'/',N); process.exit(bad?1:0);
