function rungMenu(i){
  const rg=S.prog.rungs[i], n=S.prog.rungs.length;
  const sh=$('#sheet'); sh.innerHTML=`<h3>${tx('Satır','Rung')} ${i+1}</h3><p class="t" style="margin-top:0">${tx('PLC satırları yukarıdan aşağıya taranır.','The PLC scans rungs from top to bottom.')}</p>
  <button class="mi" data-a="br">${rg.br?tx('⑂ Paralel kolu kaldır','⑂ Remove parallel branch'):tx('⑂ Paralel kol ekle (OR)','⑂ Add parallel branch (OR)')}</button>
  <button class="mi" data-a="up" ${i===0?'disabled style="opacity:.4"':''}>${tx('▲ Yukarı taşı','▲ Move up')}</button>
  <button class="mi" data-a="dn" ${i===n-1?'disabled style="opacity:.4"':''}>${tx('▼ Aşağı taşı','▼ Move down')}</button>
  <button class="mi" data-a="del" style="color:var(--redt)">${tx('🗑 Satırı sil','🗑 Delete rung')}</button>
  <button class="mi" data-a="x">${tx('Kapat','Close')}</button>`;
  openSheet();
  sh.onclick=e=>{ const b=e.target.closest('.mi'); if(!b||b.disabled) return; const a=b.dataset.a; const rs=S.prog.rungs;
    if(a==='br'){ rg.br=!rg.br; if(!rg.br) rg.c[1]=Array(COLS).fill(null); }
    else if(a==='up'&&i>0){ [rs[i-1],rs[i]]=[rs[i],rs[i-1]]; }
    else if(a==='dn'&&i<n-1){ [rs[i+1],rs[i]]=[rs[i],rs[i+1]]; }
    else if(a==='del'){ rs.splice(i,1); if(!rs.length) rs.push(mkRung()); }
    Snd.click(); saveProg(); renderLadder(); closeAll(); };
}
function allowed(t){
  const GI=tx('GİRİŞLER (I)','INPUTS (I)'),GQ=tx('ÇIKIŞLAR (Q)','OUTPUTS (Q)'),GM=tx('HAFIZA (M)','MEMORY (M)'),GT=tx('ZAMANLAYICI (T)','TIMERS (T)'),GC=tx('SAYICI (C)','COUNTERS (C)');
  const lv=S.lv, g=[]; const I=lv.io.I.map(d=>d.a), Q=lv.io.Q.map(d=>d.a);
  const M=[...Array(lv.M)].map((_,i)=>'M0.'+i), T=[...Array(lv.T)].map((_,i)=>'T'+(i+1)), C=[...Array(lv.C)].map((_,i)=>'C'+(i+1));
  const add=(n,l)=>{ if(l.length) g.push([n,l]); };
  if(t==='NO'||t==='NC'){ add(GI,I); add(GQ,Q); add(GM,M); add(GT,T); add(GC,C); }
  else if(t==='COIL'||t==='SET'){ add(GQ,Q); add(GM,M); }
  else if(t==='RST'){ add(GQ,Q); add(GM,M); add(GT,T); add(GC,C); }
  else if(t==='TON'||t==='TOF') add('ZAMANLAYICI (T)',T);
  else add('SAYICI (C)',C);
  return g;
}
function openEditor(i,r,c,cell,isNew){
  const t=cell.t, groups=allowed(t); let sel=cell.a||(groups[0]&&groups[0][1][0]); let pv=cell.pv;
  const tm=(t==='TON'||t==='TOF'), ct=(t==='CTU'||t==='CTD');
  const sh=$('#sheet');
  const draw=()=>{
    sh.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><div class="pal sel" style="flex:0 0 62px;height:46px">${palSym(t)}</div><div><h3>${BN[t]}</h3><div style="font-size:11px;color:var(--dim)">${tx('Adres seç ve istersen etiket yaz','Choose an address and optionally type a tag')}</div></div></div>`+
    groups.map(([n,l])=>`<div class="grp">${n}</div><div class="chips">${l.map(a=>`<button class="chip ${a===sel?'sel':''}" data-a="${a}">${a}<small>${S.tags[a]||'—'}</small></button>`).join('')}</div>`).join('')+
    `<div class="fld"><label>${tx('Etiket (Tag)','Tag')}</label><input id="tgIn" maxlength="14" placeholder="${tx('örn: Bant_Motor','e.g. Belt_Motor')}" value="${(S.tags[sel]||'').replace(/"/g,'')}"></div>`+
    (tm?`<div class="fld"><label>${tx('Süre','Time')}</label><div class="step"><button class="btn" data-s="-">−</button><b>${pv.toFixed(1)} ${tx('sn','s')}</b><button class="btn" data-s="+">＋</button></div></div>`:'')+
    (ct?`<div class="fld"><label>${tx('Hedef (PV)','Preset (PV)')}</label><div class="step"><button class="btn" data-s="-">−</button><b>${pv}</b><button class="btn" data-s="+">＋</button></div></div>`:'')+
    `<div class="brow">${isNew?'':'<button class="btn dan" id="mDel">'+tx('🗑 Sil','🗑 Delete')+'</button>'}<button class="btn wide" id="mCan">${tx('İptal','Cancel')}</button><button class="btn pri wide" id="mOk">${tx('✓ Tamam','✓ OK')}</button></div>`;
  };
  draw(); openSheet();
  sh.onclick=e=>{
    const ch=e.target.closest('.chip'); if(ch){ const tg=$('#tgIn'); if(tg) S.tags[sel]=tg.value.trim()||S.tags[sel]||''; sel=ch.dataset.a; Snd.click(); draw(); return; }
    const st=e.target.closest('[data-s]'); if(st){ const up=st.dataset.s==='+'; if(tm) pv=Math.max(0.5,Math.min(30,pv+(up?0.5:-0.5))); else pv=Math.max(1,Math.min(20,pv+(up?1:-1))); const tg=$('#tgIn'); if(tg) S.tags[sel]=tg.value.trim(); Snd.click(); draw(); return; }
    if(e.target.id==='mCan'){ closeAll(); return; }
    if(e.target.id==='mDel'){ S.prog.rungs[i].c[r][c]=null; saveProg(); renderLadder(); Snd.click(); closeAll(); return; }
    if(e.target.id==='mOk'){ if(!sel){ toast(tx('Bu blok için kullanılabilir adres yok','No available address for this block')); return; }
      const tg=$('#tgIn'); if(tg) S.tags[sel]=tg.value.trim();
      const nc={t:t,a:sel}; if(tm||ct) nc.pv=pv; S.prog.rungs[i].c[r][c]=nc; saveProg(); renderLadder(); Snd.place(); closeAll(); }
  };
}
function openSheet(){ $('#ovSheet').classList.add('show'); }
function closeAll(){ ['#ovSheet','#ovCard','#menu'].forEach(s=>$(s).classList.remove('show')); }
$('#ovSheet').addEventListener('click',e=>{ if(e.target.id==='ovSheet') closeAll(); });
function card(html,fn){ $('#card').innerHTML=html; $('#ovCard').classList.add('show'); $('#card').onclick=fn||null; }
