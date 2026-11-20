/* ===== v1.1.7 GERİ TUŞU — tarayıcı / telefon geri tuşu uygulama içinde bir adım geri gider ===== */
const NAV={exitAt:0};
function navBack(){
  if(document.body.classList.contains('dragging')){ dragClean(); return true; }
  if($('#ovSheet').classList.contains('show')){ $('#ovSheet').classList.remove('show'); S.tool=null; refreshTool(); return true; }
  if($('#ovCard').classList.contains('show')){ $('#ovCard').classList.remove('show'); return true; }
  if($('#menu').classList.contains('show')){
    const s=S.mscr;
    if(s==='set'&&S.setBack==='game'){ S.setBack=null; closeAll(); return true; }
    if(s&&s!=='main'){ showMenu('main'); return true; }
    return false;                                   // ana menüdeyiz
  }
  if(S.running) stopSim(true);                      // oyun ekranı → yol haritası
  showMenu('map'); return true;
}
try{
  history.replaceState({lm:0},''); history.pushState({lm:1},'');
  addEventListener('popstate',()=>{
    if(navBack()){ history.pushState({lm:1},''); return; }
    const now=Date.now();
    if(now-NAV.exitAt<2000) { history.back(); return; }   // iki kez üst üste → çık
    NAV.exitAt=now; toast(tx('Çıkmak için tekrar geri bas','Press back again to exit')); history.pushState({lm:1},'');
  });
}catch(_){}
