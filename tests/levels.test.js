const fs=require('fs');
const code=['logic','mach','gen','gen2','gen3'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
const M=new Function(code+';return {PLC,World,getLevel,SCAN,ROAD,R,countBlocks,tplKey,LEN_115,ROAD_END};')();
function run(lv,prog,maxT=200){ const w=new M.World(lv),p=new M.PLC(),bot=lv.bot(); let t=0;
  for(;t<maxT;t+=M.SCAN){ bot(w,a=>w.press(a),t); const iv=w.sense(); for(const k in iv)p.b[k]=iv[k]; p.scan(prog,20); w.advance(p.b,M.SCAN); if(w.err||w.done)break; }
  return w; }
let bad=0,maxT=0; const fails={};
const A0=+(process.env.FROM||0), A1=+(process.env.TO||M.ROAD_END), ONLY=process.env.NEWONLY;
const IDS=[]; for(let i=A0;i<A1;i++){ if(ONLY){ const p=M.tplKey(i); if(!(p.c<M.LEN_115.length-1&&p.t>=M.LEN_115[p.c][p.pool])) continue; } IDS.push(i); }
for(const id of IDS){ const lv=M.getLevel(id); const w=run(lv,lv.sol);
  if(!(w.done&&!w.err)){ bad++; const key=id+' '+lv.title; if(Object.keys(fails).length<25) fails[key]=(w.err||'')+' | '+w.goalList().map(g=>g.l+(g.ok?'✔':'·')).join(' ')+' t='+w.t.toFixed(1);}
  maxT=Math.max(maxT,w.t);
  // boş program asla geçmemeli
  const e=run(lv,{rungs:[]},60); if(e.done){ bad++; console.log('EMPTY PASSES',id,lv.title); }
}
console.log('fails',bad,'maxSimT',maxT.toFixed(1)); for(const k in fails) console.log(k,'=>',fails[k]);
process.exit(bad?1:0);
