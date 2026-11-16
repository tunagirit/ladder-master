/* ---------- Ladder çizimi ---------- */
function calcCW(){ const w=$('#rungs').clientWidth-12-30-10; return Math.max(54,Math.min(84,Math.floor(w/COLS))); }
function cellSVG(cell,r,c,cw,inSpan,brEmpty){
  const m=cw/2,y=22; let s=`<svg width="${cw}" height="44" viewBox="0 0 ${cw} 44">`;
  const tag=cell&&S.tags[cell.a]?S.tags[cell.a]:'';
  if(!cell){
    if(c<OUTC){
      if(r===0||inSpan) s+=`<path class="wl" d="M0 ${y}H${m}"/><path class="wr" d="M${m} ${y}H${cw}"/>`;
      s+=`<path class="plus" d="M${m-4} ${y}H${m+4}M${m} ${y-4}V${y+4}"/>`;
    } else s+=`<path class="wl" d="M0 ${y}H${m-14}"/><path class="ph" d="M${m-5} 10Q${m-13} ${y} ${m-5} 34M${m+5} 10Q${m+13} ${y} ${m+5} 34"/>`;
    return s+'</svg>';
  }
  const t=cell.t;
  if(t==='NO'||t==='NC'){
    s+=`<path class="wl" d="M0 ${y}H${m-8}"/><path class="wr" d="M${m+8} ${y}H${cw}"/><path class="sym" d="M${m-8} 11V33M${m+8} 11V33"/>`;
    if(t==='NC') s+=`<path class="sym" d="M${m-10} 31L${m+10} 13"/>`;
    s+=`<text class="ad" x="${m}" y="9">${cell.a}</text><text class="tg" x="${m}" y="43">${tag.slice(0,12)}</text>`;
  } else if(t==='COIL'||t==='SET'||t==='RST'){
    s+=`<path class="wl" d="M0 ${y}H${m-13}"/><path class="wr" d="M${m+13} ${y}H${cw}"/><path class="sym" d="M${m-5} 10Q${m-14} ${y} ${m-5} 34M${m+5} 10Q${m+14} ${y} ${m+5} 34"/>`;
    if(t!=='COIL') s+=`<text class="cl" x="${m}" y="26">${t==='SET'?'S':'R'}</text>`;
    s+=`<text class="ad" x="${m}" y="9">${cell.a}</text><text class="tg" x="${m}" y="43">${tag.slice(0,12)}</text>`;
  } else {
    s+=`<path class="wl" d="M0 ${y}H${m-26}"/><path class="wr" d="M${m+26} ${y}H${cw}"/><rect class="bx" x="${m-26}" y="3" width="52" height="38" rx="4"/>`;
    s+=`<text class="bt" x="${m}" y="17">${t} ${cell.a}</text><text class="bv" x="${m}" y="33"></text>`;
  }
  return s+'</svg>';
}
function tvStatic(o){ return (o.t==='TON'||o.t==='TOF')?`PT ${o.pv.toFixed(1)}s`:`PV ${o.pv}`; }
function renderLadder(){
  const box=$('#rungs'); const sc=box.scrollTop; box.innerHTML=''; LIVE=[];
  const cw=S.cw=calcCW();
  S.prog.rungs.forEach((rg,i)=>{
    const rows=rg.br?2:1, sp=branchSpan(rg);
    const el=document.createElement('div'); el.className='rung'; el.dataset.i=i;
    el.innerHTML=`<div class="gut"><span class="rn">R${i+1}</span><button class="rm">⋮</button></div><div class="grid" style="width:${cw*COLS+8}px;height:${rows*44}px"><div class="rail" style="left:0"></div><div class="rail" style="left:${cw*COLS+4}px"></div></div>`;
    const g=el.querySelector('.grid'); const L={cells:[[],[]],vl:null,vr:null,grid:g};
    for(let r=0;r<rows;r++) for(let c=0;c<COLS;c++){
      if(r===1&&c===OUTC) continue;
      const cell=rg.c[r][c]; const inSp=!!sp&&c>=sp.from&&c<=sp.to;
      const d=document.createElement('div'); d.dataset.r=r; d.dataset.c=c;
      d.style.cssText=`left:${4+c*cw}px;top:${r*44}px;width:${cw}px`;
      d._b='cell'+(cell?' full':(c===OUTC?' eo':' ec')); d.className=d._b;
      d.innerHTML=cellSVG(cell,r,c,cw,inSp); d._cell=cell; d._tv=d.querySelector('.bv'); if(d._tv) d._tv.textContent=tvStatic(cell);
      g.appendChild(d); L.cells[r][c]=d;
    }
    if(sp){ for(const [k,x] of [['vl',sp.from*cw+4],['vr',(sp.to+1)*cw+4]]){ const v=document.createElement('div'); v.className='vw'; v.style.cssText=`left:${x-1.5}px;top:22px;height:44px`; g.appendChild(v); L[k]=v; } }
    box.appendChild(el); LIVE.push(L);
  });
  if(S.prog.rungs.length<8&&!S.view){ const b=document.createElement('button'); b.id='addr'; b.textContent='＋ Satır Ekle'; box.appendChild(b); }
  box.scrollTop=sc; refreshTool();
}
function updateLive(){
  const res=plc.res, live=res.length===S.prog.rungs.length&&(S.running||world.err||world.done);
  S.prog.rungs.forEach((rg,i)=>{ const L=LIVE[i]; if(!L) return; const R=res[i], rows=rg.br?2:1, sp=branchSpan(rg);
    L.grid.classList.toggle('on',!!live);
    for(let r=0;r<rows;r++) for(let c=0;c<COLS;c++){
      const el=L.cells[r][c]; if(!el) continue; let k=el._b;
      if(live&&R){ let lp,rp,ps=false;
        if(c<OUTC){ lp=!!(R.in[r]&&R.in[r][c]); rp=!!(R.out[r]&&R.out[r][c]); ps=!!el._cell&&rp; }
        else { lp=rp=R.outIn; ps=R.outIn&&!!el._cell; }
        if(lp) k+=' lp'; if(rp) k+=' rp'; if(ps) k+=' ps';
        const o=el._cell; if(o&&el._tv){ const st=(o.t==='TON'||o.t==='TOF')?plc.T[o.a]:plc.C[o.a];
          if(st&&st.q) k+=' qq';
          el._tv.textContent=(o.t==='TON'||o.t==='TOF')?`${(st?st.et/1000:0).toFixed(1)}/${o.pv.toFixed(1)}s`:`${st?st.cv:(o.t==='CTD'?o.pv:0)}/${o.pv}`; }
      } else if(el._tv&&el._cell) el._tv.textContent=tvStatic(el._cell);
      if(el.className!==k) el.className=k;
    }
    if(sp&&L.vl){ const on=live&&R&&(R.in[0][sp.from]); const on2=live&&R&&(R.out[0][sp.to]||R.out[1][sp.to]);
      L.vl.classList.toggle('on',!!on); L.vr.classList.toggle('on',!!on2); }
  });
}

