/* ===== v1.1.6 MAKİNE ÇİZİMLERİ (bant dışı sahneler) ===== */
const MLbl=(t,x,y,P,c,f)=>{ ctx.fillStyle=c||P.txt; ctx.font=f||'700 9px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText(t,x,y); };
function mMotor(cx,cy,r,ang,spd,on,P,lbl){
  ctx.fillStyle=P.metal; rr(cx-r*1.15,cy+r*0.7,r*2.3,r*0.45,4); ctx.fill();
  ctx.fillStyle=on?P.pri:P.binBg; ctx.strokeStyle=P.edge; ctx.lineWidth=2.5; if(on&&Math.abs(spd)>0.5){ ctx.shadowColor=P.pri; ctx.shadowBlur=12; }
  ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
  for(let i=0;i<8;i++){ const a=i*Math.PI/4; ctx.strokeStyle=P.dim; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); ctx.lineTo(cx+Math.cos(a)*(r+4),cy+Math.sin(a)*(r+4)); ctx.stroke(); }
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(ang); ctx.strokeStyle=on?P.bg1:P.strong; ctx.lineWidth=3;
  for(let i=0;i<3;i++){ ctx.rotate(Math.PI*2/3); ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(r*0.35,-r*0.3,r*0.15,-r*0.72); ctx.stroke(); } ctx.restore();
  ctx.fillStyle=P.strong; ctx.beginPath(); ctx.arc(cx,cy,3.5,0,7); ctx.fill();
  if(lbl) MLbl(lbl,cx,cy+r*1.15+16,P,P.strong,'800 10px system-ui');
}
function mK(x,y,a,n,on,P){ ctx.fillStyle=on?P.pri:P.binBg; ctx.strokeStyle=on?P.pri:P.dim; ctx.lineWidth=2; rr(x,y,40,30,6); ctx.fill(); ctx.stroke();
  MLbl(n,x+20,y+13,P,on?P.bg1:P.strong,'800 10px system-ui'); MLbl(a,x+20,y+24,P,on?P.bg1:P.txt,'700 8px ui-monospace,monospace'); }
function mIn(x,y,a,on,P,c){ c=c||'#ffb020'; ctx.fillStyle=on?c:P.binBg; ctx.strokeStyle=P.dim; ctx.lineWidth=1.5; if(on){ ctx.shadowColor=c; ctx.shadowBlur=10; } ctx.beginPath(); ctx.arc(x,y,5,0,7); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
  MLbl(a,x,y+15,P,P.txt,'700 8px ui-monospace,monospace'); }
const MQ=a=>!!world.q[a], MI=a=>!!(world.iv&&world.iv[a]);
const MDRAW={
  motor:{w:220,h:130,f(x,y,w,h,P,m,s){ mMotor(x+60,y+52,34,s.ang,s.spd,MQ(m.k),P,'M 3~');
    mK(x+128,y+14,m.k,'K1',MQ(m.k),P);
    if(m.trip){ const t=s.trip>0||s.tripped; ctx.fillStyle=t?'#ff3b30':P.binBg; ctx.strokeStyle=P.dim; ctx.lineWidth=2; if(t){ ctx.shadowColor='#ff3b30'; ctx.shadowBlur=14; } rr(x+128,y+56,40,30,6); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
      MLbl(tx('TERMİK','THERM'),x+148,y+69,P,t?'#fff':P.strong,'800 8.5px system-ui'); MLbl(m.trip,x+148,y+80,P,t?'#fff':P.txt,'700 8px ui-monospace,monospace');
      if(MQ(m.k)){ const p=Math.min(1,s.run/m.tripAt); ctx.fillStyle=P.binBg; rr(x+128,y+92,40,6,3); ctx.fill(); ctx.fillStyle=p>0.8?'#ff3b30':'#ffb020'; rr(x+128,y+92,40*p,6,3); ctx.fill(); MLbl('°C',x+178,y+98,P); } } }},
  stardelta:{w:250,h:130,f(x,y,w,h,P,m,s){ const k1=MQ(m.k1),k2=MQ(m.k2),k3=MQ(m.k3);
    mMotor(x+56,y+52,34,s.ang,s.spd,k1,P,k3?'Δ  '+tx('ÜÇGEN','DELTA'):k2?'Y  '+tx('YILDIZ','STAR'):'M 3~');
    mK(x+120,y+8,m.k1,'K1',k1,P); mK(x+120,y+46,m.k2,'K2 Y',k2,P); mK(x+170,y+46,m.k3,'K3 Δ',k3,P);
    ctx.strokeStyle=P.dim; ctx.lineWidth=1.5; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(x+160,y+61); ctx.lineTo(x+170,y+61); ctx.stroke(); ctx.setLineDash([]); MLbl('⟂',x+165,y+92,P,P.err,'800 12px system-ui');
    const p=Math.round(s.spd*1480); MLbl(p+' rpm',x+165,y+112,P,P.strong,'800 10px ui-monospace,monospace'); }},
  reverse:{w:240,h:130,f(x,y,w,h,P,m,s){ const f=MQ(m.kf), r=MQ(m.kr);
    mMotor(x+56,y+52,34,s.ang,s.spd,f||r,P,f?'⟳ '+tx('İLERİ','FWD'):r?'⟲ '+tx('GERİ','REV'):'M 3~');
    mK(x+120,y+20,m.kf,'K →',f,P); mK(x+170,y+20,m.kr,'K ←',r,P);
    // vinç kancası
    const hy=y+70+Math.sin(s.ang*0.05)*0; ctx.strokeStyle=P.metal; ctx.lineWidth=2; const ly=y+64+((s.ang*2)%30+30)%30; ctx.beginPath(); ctx.moveTo(x+165,y+56); ctx.lineTo(x+165,ly); ctx.stroke();
    ctx.strokeStyle=P.strong; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x+165,ly+6,6,-Math.PI/2,Math.PI); ctx.stroke(); }},
  garage:{w:230,h:150,f(x,y,w,h,P,m,s){ const gx=x+40, gw=120, gy=y+10, gh=120;
    ctx.fillStyle=P.binBg; ctx.strokeStyle=P.edge; ctx.lineWidth=3; ctx.fillRect(gx-8,gy-8,gw+16,gh+8); ctx.strokeRect(gx-8,gy-8,gw+16,gh+8);
    ctx.fillStyle=P.bg2; ctx.fillRect(gx,gy,gw,gh);
    const dh=gh*(1-s.pos), ns=Math.max(1,Math.ceil(dh/16)); for(let i=0;i<ns;i++){ const py=gy+dh-(i+1)*16; ctx.fillStyle=i%2?P.metal:P.dim; ctx.fillRect(gx,Math.max(gy,py),gw,Math.min(16,py+16-gy)); }
    ctx.fillStyle=P.strong; ctx.fillRect(gx,gy+dh-3,gw,3);
    mIn(gx+gw+20,gy+4,m.top,MI(m.top),P,'#34e05a'); mIn(gx+gw+20,gy+gh-6,m.bot,MI(m.bot),P,'#34e05a');
    const u=MQ(m.up), d=MQ(m.dn); MLbl(u?'▲':d?'▼':'■',gx-24,gy+gh/2,P,u||d?P.pri:P.dim,'800 18px system-ui'); MLbl(u?m.up:d?m.dn:'',gx-24,gy+gh/2+14,P);
    if(m.eye){ const e=s.eye>0; ctx.strokeStyle=e?'#ff3b30':'rgba(255,60,48,.35)'; ctx.lineWidth=e?3:1.5; ctx.setLineDash(e?[]:[4,4]); ctx.beginPath(); ctx.moveTo(gx,gy+gh-14); ctx.lineTo(gx+gw,gy+gh-14); ctx.stroke(); ctx.setLineDash([]);
      if(e){ ctx.fillStyle='#ffb020'; ctx.beginPath(); ctx.arc(gx+gw/2,gy+gh-14,9,0,7); ctx.fill(); MLbl('!',gx+gw/2,gy+gh-10,P,'#000','900 12px system-ui'); }
      MLbl(m.eye,gx-24,gy+gh-10,P,e?'#ff3b30':P.txt); } }},
  lift:{w:200,h:160,f(x,y,w,h,P,m,s){ const sx=x+60, sw=70, sy=y+8, sh=140, ch=46, cy=sy+sh-ch-(sh-ch)*s.pos;
    ctx.fillStyle=P.binBg; ctx.strokeStyle=P.edge; ctx.lineWidth=2.5; ctx.fillRect(sx,sy,sw,sh); ctx.strokeRect(sx,sy,sw,sh);
    ctx.strokeStyle=P.dim; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(sx+sw/2,sy); ctx.lineTo(sx+sw/2,cy); ctx.stroke();
    ctx.fillStyle=P.metal; ctx.strokeStyle=P.strong; ctx.lineWidth=2; rr(sx+6,cy,sw-12,ch,4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=P.bg2; ctx.fillRect(sx+12,cy+6,sw/2-14,ch-12); ctx.fillRect(sx+sw/2+2,cy+6,sw/2-14,ch-12);
    [[m.f2,sy+ch/2,'2'],[m.f1,sy+sh-ch/2,'1']].forEach(([a,yy,n])=>{ MLbl(n,sx-18,yy+5,P,P.strong,'800 16px system-ui'); mIn(sx+sw+16,yy,a,MI(a),P,'#34e05a'); });
    const u=MQ(m.up), d=MQ(m.dn); MLbl(u?'▲':d?'▼':'',sx+sw/2,cy+ch/2+5,P,P.pri,'800 14px system-ui');
    if(world.sc.seg){ const v=qb(world.q,'Q1.')&127; segDigit(x+w-34,y+24,44,v,P,'QB1'); } }},
  parking:{w:250,h:130,f(x,y,w,h,P,m,s){ const by=y+84, bx=x+120;
    ctx.fillStyle=P.dim; ctx.fillRect(x,by+18,w,4);
    ctx.fillStyle=P.metal; ctx.fillRect(bx-6,by-30,12,48); const a=-s.arm*Math.PI/2*0.95; ctx.save(); ctx.translate(bx,by-22); ctx.rotate(a);
    for(let i=0;i<6;i++){ ctx.fillStyle=i%2?'#ff3b30':'#fff'; ctx.fillRect(i*16,-4,16,8); } ctx.restore();
    if(s.car){ const cx=s.pass?bx-40+(1-s.pass/0.6)*130:bx-58; ctx.fillStyle='#4dd2ff'; rr(cx-24,by-6,48,20,6); ctx.fill(); ctx.fillStyle='#2a7fa8'; rr(cx-14,by-16,28,12,4); ctx.fill(); ctx.fillStyle='#222'; [cx-14,cx+14].forEach(wx=>{ ctx.beginPath(); ctx.arc(wx,by+15,5,0,7); ctx.fill(); }); }
    mIn(bx-30,by+38,m.gate,MI(m.gate),P); mIn(bx+40,by+38,m.pass,MI(m.pass),P); mIn(x+w-20,by+38,m.exit,MI(m.exit),P);
    ctx.fillStyle='#2d6cdf'; rr(x+w-60,y+4,52,44,8); ctx.fill(); MLbl('P',x+w-34,y+28,P,'#fff','900 20px system-ui'); MLbl(`${s.parked}/${m.cap}`,x+w-34,y+43,P,'#fff','800 10px ui-monospace,monospace');
    for(let i=0;i<m.cap;i++){ ctx.fillStyle=i<s.parked?'#4dd2ff':P.binBg; ctx.strokeStyle=P.dim; ctx.lineWidth=1.5; rr(x+6+i*24,y+8,20,28,3); ctx.fill(); ctx.stroke(); }
    MLbl(m.bar,bx,by-36,P,MQ(m.bar)?P.pri:P.txt); }},
  wash:{w:260,h:130,f(x,y,w,h,P,m,s){ const bx=x+50, bw=160, by=y+20, bh=86;
    ctx.strokeStyle=P.edge; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(bx,by+bh); ctx.lineTo(bx,by); ctx.lineTo(bx+bw,by); ctx.lineTo(bx+bw,by+bh); ctx.stroke(); ctx.fillStyle=P.dim; ctx.fillRect(x,by+bh,w,3);
    const cx=bx+bw/2+s.x*(bw/2+60); if(s.st){ ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip(); ctx.fillStyle='#e0533d'; rr(cx-40,by+bh-28,80,22,7); ctx.fill(); ctx.fillStyle='#a63a2a'; rr(cx-24,by+bh-44,48,18,6); ctx.fill(); ctx.fillStyle='#222'; [cx-24,cx+24].forEach(wx=>{ ctx.beginPath(); ctx.arc(wx,by+bh-4,7,0,7); ctx.fill(); }); ctx.restore(); }
    const st=[[m.foam,tx('KÖPÜK','FOAM'),'#f0f8ff'],[m.brush,tx('FIRÇA','BRUSH'),'#4dd2ff'],[m.dry,tx('KURUTMA','DRY'),'#ffb020']];
    st.forEach(([a,n,c],i)=>{ const sx=bx+28+i*52, on=MQ(a); ctx.fillStyle=on?c:P.metal; rr(sx-14,by+3,28,10,3); ctx.fill(); MLbl(n,sx,by-6,P,on?P.pri:P.txt,'800 8.5px system-ui'); MLbl(a,sx,by+28,P);
      if(on){ ctx.fillStyle=c; for(let k=0;k<7;k++){ const yy=by+16+((world.t*90+k*14)%(bh-30)); ctx.globalAlpha=.75; ctx.beginPath(); ctx.arc(sx-10+((k*7)%20),yy,i===0?4:2.5,0,7); ctx.fill(); } ctx.globalAlpha=1;
        if(i===1){ ctx.save(); ctx.translate(sx,by+bh-36); ctx.rotate(world.t*12); ctx.strokeStyle=c; ctx.lineWidth=3; for(let k=0;k<6;k++){ ctx.rotate(Math.PI/3); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,16); ctx.stroke(); } ctx.restore(); } } });
    mIn(bx+bw/2,by+bh+16,m.car,MI(m.car),P); MLbl(`${s.washed}/${m.n}`,x+w-20,y+14,P,P.strong,'800 11px ui-monospace,monospace'); }},
  press:{w:240,h:150,f(x,y,w,h,P,m,s){ const px=x+60, pw=90;
    ctx.fillStyle=P.metal; ctx.fillRect(px-10,y+4,pw+20,14); ctx.fillRect(px-10,y+4,12,130); ctx.fillRect(px+pw-2,y+4,12,130); ctx.fillRect(px-10,y+122,pw+20,14);
    const ry=y+20+s.pos*70; ctx.fillStyle=P.dim; ctx.fillRect(px+pw/2-6,y+18,12,ry-y-18); ctx.fillStyle=MQ(m.p)?P.pri:P.strong; rr(px+8,ry,pw-16,26,4); ctx.fill();
    ctx.fillStyle='#ffb020'; ctx.fillRect(px+20,y+112,pw-40,10); MLbl(m.p,px+pw/2,ry+17,P,P.bg1,'800 9px ui-monospace,monospace');
    [[m.l,x+20],[m.r,x+w-20]].forEach(([a,hx])=>{ const on=MI(a); ctx.fillStyle=on?'#34e05a':'#c0392b'; ctx.strokeStyle=P.edge; ctx.lineWidth=2; if(on){ ctx.shadowColor='#34e05a'; ctx.shadowBlur=14; } ctx.beginPath(); ctx.arc(hx,y+100,15,0,7); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
      MLbl('✋',hx,y+76,P,P.txt,'16px system-ui'); MLbl(a,hx,y+128,P); });
    MLbl(`${tx('Basış','Strokes')}: ${world.cnt.stroke||0}`,px+pw/2,y+148,P,P.strong,'800 10px system-ui'); }},
  alarm:{w:200,h:130,f(x,y,w,h,P,m,s){ const hx=x+40, hw=120, hy=y+46, hh=74;
    ctx.fillStyle=P.binBg; ctx.strokeStyle=P.edge; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(hx-8,hy); ctx.lineTo(hx+hw/2,y+8); ctx.lineTo(hx+hw+8,hy); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(hx,hy,hw,hh); ctx.strokeRect(hx,hy,hw,hh);
    const op=s.open>0, dx=hx+hw/2-14; ctx.fillStyle=P.bg2; ctx.fillRect(dx,hy+26,28,48); ctx.fillStyle='#8a5a32'; if(op){ ctx.beginPath(); ctx.moveTo(dx,hy+26); ctx.lineTo(dx+12,hy+30); ctx.lineTo(dx+12,hy+70); ctx.lineTo(dx,hy+74); ctx.fill(); } else ctx.fillRect(dx,hy+26,28,48);
    if(op){ MLbl('🚶',dx+20,hy+64,P,P.txt,'22px system-ui'); }
    ctx.fillStyle='#ffd34d'; ctx.globalAlpha=.6; ctx.fillRect(hx+10,hy+12,22,18); ctx.fillRect(hx+hw-32,hy+12,22,18); ctx.globalAlpha=1;
    mIn(dx+14,hy+16,m.door,MI(m.door),P,'#ff3b30');
    const ar=!!world.sw[m.arm]; MLbl(ar?'🔒 '+tx('KURULU','ARMED'):'🔓 '+tx('KAPALI','OFF'),hx+hw/2,y+h+4,P,ar?'#ffb020':P.txt,'800 10px system-ui'); }}
};
function machItem(P){ const m=world.sc.mach, d=m&&MDRAW[m.kind]; if(!d||!world.ms) return null;
  const sc=Math.min(1.7,(W-(world.sc.lamps.length*44)-24)/d.w, (H-24)/d.h);
  return {w:d.w*sc,h:d.h*sc,f:(x,y)=>{ ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc); d.f(0,0,d.w,d.h,P,m,world.ms); ctx.restore(); }}; }
