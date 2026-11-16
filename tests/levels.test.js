const fs=require('fs');
const code=fs.readFileSync(__dirname+'/../src/logic.js','utf8')+fs.readFileSync(__dirname+'/../src/gen.js','utf8');
const M=new Function(code+';return {PLC,World,getLevel,SCAN,TOTAL,R,countBlocks};')();
function run(lv,prog,maxT=200){ const w=new M.World(lv),p=new M.PLC(),bot=lv.bot(); let t=0;
  for(;t<maxT;t+=M.SCAN){ bot(w,a=>w.press(a),t); const iv=w.sense(); for(const k in iv)p.b[k]=iv[k]; p.scan(prog,20); w.advance(p.b,M.SCAN); if(w.err||w.done)break; }
  return w; }
let bad=0,maxT=0; const fails={};
for(let id=0;id<M.TOTAL;id++){ const lv=M.getLevel(id); const w=run(lv,lv.sol);
  if(!(w.done&&!w.err)){ bad++; const key=id+' '+lv.title; if(Object.keys(fails).length<25) fails[key]=(w.err||'')+' | '+w.goalList().map(g=>g.l+(g.ok?'✔':'·')).join(' ')+' t='+w.t.toFixed(1);}
  maxT=Math.max(maxT,w.t);
  // boş program asla geçmemeli
  const e=run(lv,{rungs:[]},60); if(e.done){ bad++; console.log('EMPTY PASSES',id,lv.title); }
}
console.log('fails',bad,'maxSimT',maxT.toFixed(1)); for(const k in fails) console.log(k,'=>',fails[k]);
process.exit(bad?1:0);
