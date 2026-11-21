// yeni sistemlerde yanlış çözümler geçmemeli: her satırı tek tek sil, her paralel kolu sil, her KAPALI kontağı AÇIK yap
const fs=require('fs');
const code=['logic','mach','gen','gen2','gen3'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
const M=new Function(code+';return {PLC,World,getLevel,SCAN,tplKey,LEN_115,ROAD_END};')();
function run(lv,prog,maxT=120){ const w=new M.World(lv),p=new M.PLC(),bot=lv.bot(); let t=0;
  for(;t<maxT;t+=M.SCAN){ bot(w,a=>w.press(a),t); const iv=w.sense(); for(const k in iv)p.b[k]=iv[k]; p.scan(prog,20); w.advance(p.b,M.SCAN); if(w.err||w.done)break; } return w; }
const J=o=>JSON.parse(JSON.stringify(o)); const seen={}; let bad=0, tot=0;
const ALL=process.env.ALL;  // ALL=1: tüm şablonlar (yeni sistemlerle sınırlı kalmadan)
for(let i=0;i<(ALL?3000:M.ROAD_END);i++){ const p=M.tplKey(i); if(!ALL&&!(p.c<M.LEN_115.length-1&&p.t>=M.LEN_115[p.c][p.pool])) continue;
  const lv=M.getLevel(i), key=lv.title.replace(/\(.*\)/,''); seen[key]=(seen[key]||0)+1; if(seen[key]>3) continue;
  const muts=[]; const R=lv.sol.rungs;
  R.forEach((_,k)=>{ const s=J(lv.sol); s.rungs.splice(k,1); muts.push(['drop R'+(k+1),s]); });
  R.forEach((rg,k)=>{ if(rg.br){ const s=J(lv.sol); s.rungs[k].br=false; s.rungs[k].c[1]=s.rungs[k].c[1].map(()=>null); muts.push(['nobranch R'+(k+1),s]); } });
  R.forEach((rg,k)=>rg.c.forEach((row,r)=>row.forEach((c,j)=>{ if(c&&c.t==='NC'){ const s=J(lv.sol); s.rungs[k].c[r][j].t='NO'; muts.push(['NC→NO R'+(k+1)+' '+c.a,s]); } })));
  for(const [n,s] of muts){ tot++; const w=run(lv,s); if(w.done&&!w.err){ bad++; console.log('PASSES WRONG',i,lv.title,'::',n); } }
}
console.log('mutants',tot,'wrongly passing',bad); process.exit(bad?1:0);
