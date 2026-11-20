function rungMenu(i){
  const rg=S.prog.rungs[i], n=S.prog.rungs.length;
  const sh=$('#sheet'); sh.innerHTML=`<h3>${tx('Satır','Rung')} ${i+1}</h3><p class="t" style="margin-top:0">${tx('PLC satırları yukarıdan aşağıya taranır.','The PLC scans rungs from top to bottom.')}</p>
  <button class="mi" data-a="br">${I('call_split')}${rg.br?tx('Paralel kolu kaldır','Remove parallel branch'):tx('Paralel kol ekle (OR)','Add parallel branch (OR)')}</button>
  <button class="mi" data-a="up" ${i===0?'disabled style="opacity:.4"':''}>${I('arrow_upward')}${tx('Yukarı taşı','Move up')}</button>
  <button class="mi" data-a="dn" ${i===n-1?'disabled style="opacity:.4"':''}>${I('arrow_downward')}${tx('Aşağı taşı','Move down')}</button>
  <button class="mi" data-a="del" style="color:var(--redt)">${I('delete')}${tx('Satırı sil','Delete rung')}</button>
  <button class="mi" data-a="x">${I('close')}${tx('Kapat','Close')}</button>`;
  openSheet();
  sh.onclick=e=>{ const b=e.target.closest('.mi'); if(!b||b.disabled) return; const a=b.dataset.a; const rs=S.prog.rungs;
    if(a==='br'){ rg.br=!rg.br; if(!rg.br) rg.c[1]=Array(COLS).fill(null); }
    else if(a==='up'&&i>0){ [rs[i-1],rs[i]]=[rs[i],rs[i-1]]; }
    else if(a==='dn'&&i<n-1){ [rs[i+1],rs[i]]=[rs[i],rs[i+1]]; }
    else if(a==='del'){ rs.splice(i,1); }
    Snd.click(); saveProg(); renderLadder(); closeAll(); };
}
const GLBL=()=>({I:tx('GİRİŞLER (I)','INPUTS (I)'),Q:tx('ÇIKIŞLAR (Q)','OUTPUTS (Q)'),M:tx('HAFIZA (M)','MEMORY (M)'),SM:tx('ÖZEL BİTLER (SM)','SPECIAL BITS (SM)'),T:tx('ZAMANLAYICI (T)','TIMERS (T)'),C:tx('SAYICI (C)','COUNTERS (C)'),
  CV:tx('SAYICI DEĞERİ (C)','COUNTER VALUE (C)'),VW:tx('DEĞİŞKEN (VW)','VARIABLE (VW)'),AIW:tx('ANALOG GİRİŞ (AIW)','ANALOG INPUT (AIW)'),QB:tx('ÇIKIŞ BAYTI (QB)','OUTPUT BYTE (QB)'),IB:tx('GİRİŞ BAYTI (IB)','INPUT BYTE (IB)')});
function allowed(t,f){ const L=GLBL(); return addrGroups(S.lv,t,f).map(([k,l])=>[L[k],l]); }
const NUMT=['CMP','ADD','SUB','MUL','DIV'];
function openEditor(i,r,c,cell,isNew){
  const t=cell.t, sh=$('#sheet');
  const place=nc=>{ S.prog.rungs[i].c[r][c]=nc; S.popCell=[i,r,c]; saveProg(); renderLadder(); Snd.place(); Hap.place(); closeAll(); };
  if(NOADDR.includes(t)){
    if(isNew){ place({t}); return; }
    sh.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><div class="pal sel" style="flex:0 0 62px;height:46px">${palSym(t)}</div><div><h3>${BN[t]}</h3><div style="font-size:11px;color:var(--dim)">${tx('Bu eleman adres almaz','This element takes no address')}</div></div></div>
      <p class="t">${tx(ELEM[t].d[0],ELEM[t].d[1])}</p><div class="brow"><button class="btn dan" id="mDel">${I('delete')}</button><button class="btn pri wide" id="mCan">${tx('Kapat','Close')}</button></div>`;
    openSheet(); sh.onclick=e=>{ if(e.target.closest('#mDel')){ S.prog.rungs[i].c[r][c]=null; if(r===0) compact(i); saveProg(); renderLadder(); Snd.click(); closeAll(); } else if(e.target.closest('#mCan')) closeAll(); }; return;
  }
  const groups=allowed(t); let sel=cell.a||(groups[0]&&groups[0][1][0]);
  const tm=isTim(t), ct=isCnt(t), sh7=t==='SHL'||t==='SHR', mk=t==='WAND'||t==='WOR', hasSrc=t==='MOV'||t==='SEG';
  const sgroups=hasSrc?allowed(t,'src'):[];
  let src=cell.src||(t==='SEG'?(sgroups[0]&&sgroups[0][1][0]):null), op=cell.op||'>=';
  let pv=cell.pv!==undefined?cell.pv:defPV(t);
  if(t==='CMP'&&cell.pv===undefined) pv=/^AIW/.test(sel||'')?16000:1;
  const isNum=()=>NUMT.includes(t)||(t==='MOV'&&!src);
  const stp=()=>(t==='CMP'&&/^AIW/.test(sel||''))?1000:1;
  const chips=(gs,cur,attr)=>gs.map(([n,l])=>`<div class="grp">${n}</div><div class="chips">${l.map(a=>`<button class="chip ${a===cur?'sel':''}" ${attr}="${a}">${a}<small>${S.tags[a]||'—'}</small></button>`).join('')}</div>`).join('');
  const draw=()=>{
    const isB=sel&&isByte(sel);
    sh.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><div class="pal sel" style="flex:0 0 62px;height:46px">${palSym(t)}</div><div><h3>${BN[t]}</h3><div style="font-size:11px;color:var(--dim)">${WORDOP.includes(t)||t==='CMP'?tx('Hedef / değer seç','Pick target / value'):tx('Adres seç ve istersen etiket yaz','Choose an address and optionally type a tag')}</div></div></div>`+
    (t==='CMP'?`<div class="grp">${tx('KARŞILAŞTIRILACAK DEĞER (IN1)','VALUE TO COMPARE (IN1)')}</div>`:WORDOP.includes(t)?`<div class="grp" style="color:var(--md-primary)">${t==='MOV'||t==='SEG'||t==='RTC'?tx('HEDEF (OUT)','TARGET (OUT)'):tx('DEĞİŞKEN (IN/OUT)','VARIABLE (IN/OUT)')}</div>`:'')+
    chips(groups,sel,'data-a')+
    (hasSrc?`<div class="grp" style="color:var(--md-primary)">${tx('KAYNAK (IN)','SOURCE (IN)')}</div><div class="chips">${t==='MOV'?`<button class="chip ${!src?'sel':''}" data-src="">${tx('Sabit sayı','Constant')}<small>#</small></button>`:''}${sgroups.map(([n,l])=>l.map(a=>`<button class="chip ${a===src?'sel':''}" data-src="${a}">${a}<small>${S.tags[a]||'—'}</small></button>`).join('')).join('')}</div>`:'')+
    (t==='CMP'?`<div class="grp">${tx('KOŞUL','CONDITION')}</div><div class="chips">${OPS.map(o=>`<button class="chip op ${o===op?'sel':''}" data-op="${o}" style="min-width:46px;font-size:17px">${OPSYM[o]}</button>`).join('')}</div>`:'')+
    `<div class="fld"><label>${tx('Etiket (Tag)','Tag')}</label><input id="tgIn" maxlength="14" placeholder="${tx('örn: Bant_Motor','e.g. Belt_Motor')}" value="${(S.tags[sel]||'').replace(/"/g,'')}"></div>`+
    (tm?`<div class="fld"><label>${tx('Süre','Time')}</label><div class="step"><button class="btn" data-s="-">${I('remove')}</button><b>${fx(pv.toFixed(1))} ${tx('sn','s')}</b><button class="btn" data-s="+">${I('add')}</button></div></div>`:'')+
    (ct?`<div class="fld"><label>${tx('Hedef (PV)','Preset (PV)')}</label><div class="step"><button class="btn" data-s="-">${I('remove')}</button><b>${pv}</b><button class="btn" data-s="+">${I('add')}</button></div></div>`:'')+
    (sh7?`<div class="fld"><label>${tx('Kaç bit','Bits')}</label><div class="step"><button class="btn" data-s="-">${I('remove')}</button><b>${pv}</b><button class="btn" data-s="+">${I('add')}</button></div></div>`:'')+
    (isNum()?`<div class="fld"><label>${t==='CMP'?tx('Sınır (IN2)','Limit (IN2)'):t==='MOV'?tx('Yazılacak sayı','Number to write'):tx('Sayı','Number')}</label><div class="step"><button class="btn" data-s="-">${I('remove')}</button><input id="pvIn" type="number" inputmode="numeric" value="${pv}" style="width:96px;text-align:center"><button class="btn" data-s="+">${I('add')}</button></div></div>`:'')+
    (mk?`<div class="fld"><label>${tx('Maske','Mask')} = ${pv}</label><div class="chips bits" style="flex-wrap:nowrap;gap:3px">${[7,6,5,4,3,2,1,0].map(b=>`<button class="chip ${pv&(1<<b)?'sel':''}" data-b="${b}" style="min-width:0;flex:1;padding:5px 0;justify-content:center;text-align:center">${pv&(1<<b)?1:0}<small>${isB?sel[0]+sel[2]+'.'+b:'b'+b}</small></button>`).join('')}</div></div>`:'')+
    `<div class="brow">${isNew?'':'<button class="btn dan" id="mDel">'+I('delete')+'</button>'}<button class="btn wide" id="mCan">${tx('İptal','Cancel')}</button><button class="btn pri wide" id="mOk">${tx('Tamam','OK')}</button></div>`;
  };
  const keep=()=>{ const tg=$('#tgIn'); if(tg&&sel) S.tags[sel]=tg.value.trim(); const pi=$('#pvIn'); if(pi){ const v=parseInt(pi.value,10); if(!isNaN(v)) pv=Math.max(-32768,Math.min(32767,v)); } };
  draw(); openSheet();
  sh.onclick=e=>{
    const ch=e.target.closest('[data-a]'); if(ch){ keep(); const was=sel; sel=ch.dataset.a; if(t==='CMP'&&cell.pv===undefined&&/^AIW/.test(sel)!==/^AIW/.test(was||'')) pv=/^AIW/.test(sel)?16000:1; Snd.click(); draw(); return; }
    const sc=e.target.closest('[data-src]'); if(sc){ keep(); src=sc.dataset.src||null; Snd.click(); draw(); return; }
    const oc=e.target.closest('[data-op]'); if(oc){ keep(); op=oc.dataset.op; Snd.click(); draw(); return; }
    const bc=e.target.closest('[data-b]'); if(bc){ keep(); pv^=1<<(+bc.dataset.b); Snd.click(); draw(); return; }
    const st=e.target.closest('[data-s]'); if(st){ keep(); const up=st.dataset.s==='+';
      if(tm) pv=Math.max(0.5,Math.min(30,pv+(up?0.5:-0.5))); else if(ct) pv=Math.max(1,Math.min(20,pv+(up?1:-1))); else if(sh7) pv=Math.max(1,Math.min(7,pv+(up?1:-1)));
      else pv=Math.max(-32768,Math.min(32767,pv+(up?stp():-stp())));
      Snd.click(); draw(); return; }
    if(e.target.closest('#mCan')){ closeAll(); return; }
    if(e.target.closest('#mDel')){ S.prog.rungs[i].c[r][c]=null; if(r===0) compact(i); saveProg(); renderLadder(); Snd.click(); closeAll(); return; }
    if(e.target.closest('#mOk')){ keep();
      if(!sel){ toast(tx('Bu blok için kullanılabilir adres yok','No available address for this block')); return; }
      if(t==='SEG'&&!src){ toast(tx('Kaynak seç','Pick a source')); return; }
      if(t==='DIV'&&!pv){ toast(tx('Sıfıra bölünemez','Cannot divide by zero')); return; }
      const nc={t,a:sel}; if(tm||ct||sh7||mk||isNum()) nc.pv=pv; if(t==='CMP') nc.op=op; if(hasSrc&&src) nc.src=src;
      place(nc); }
  };
}
function openSheet(){ $('#ovSheet').classList.add('show'); }
function closeAll(){ ['#ovSheet','#ovCard','#menu'].forEach(s=>$(s).classList.remove('show')); }
$('#ovSheet').addEventListener('click',e=>{ if(e.target.id==='ovSheet') closeAll(); });
function card(html,fn){ $('#card').innerHTML=html; $('#ovCard').classList.add('show'); $('#card').onclick=fn||null; }
