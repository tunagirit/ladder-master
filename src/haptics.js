/* ---------- TİTREŞİM (Haptics) ---------- */
// Android: navigator.vibrate · iPhone (iOS 18+ Safari): gizli "switch" kutusu tıklaması dokunsal geri bildirim verir
const Hap=(()=>{
  let sw=null;
  const ios=()=>!navigator.vibrate&&/iphone|ipad|ipod/i.test(navigator.userAgent);
  function iosTick(){ try{ if(!sw){ const l=document.createElement('label'); l.style.cssText='position:fixed;left:-99px;top:-99px;opacity:0;pointer-events:none'; l.innerHTML='<input type="checkbox" switch>'; document.body.appendChild(l); sw=l; } sw.click(); }catch(e){} }
  const on=()=>save.haptic!==false;
  function v(p){ if(!on()) return; if(navigator.vibrate){ try{ navigator.vibrate(p); }catch(e){} } else if(ios()){ iosTick(); if(Array.isArray(p)&&p.length>2) setTimeout(iosTick,Math.min(180,p[0]+p[1])); } }
  return { tap:()=>v(8), pick:()=>v(18), drop:()=>v([12,40,22]), place:()=>v([10,30,10]), err:()=>v([40,60,40,60,80]), win:()=>v([20,50,20,50,20,90,60]), sw:()=>v(14), info:()=>v(25) };
})();
