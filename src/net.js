/* ---------- HESAP & LİDERLİK TABLOSU (Supabase REST) ---------- */
// Supabase proje ayarları (Project Settings → API). Boşsa çevrimiçi özellikler kapalı.
const SB_URL='https://uqjhhyuwgrqkhvdkqezm.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxamhoeXV3Z3Jxa2h2ZGtxZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MzUwMTgsImV4cCI6MjExMDQxMTAxOH0.tbRbfqYHlijk6KrmrjgHxC0RJX_wsGstfABezToGTAI';
const NET={ok:!!(SB_URL&&SB_KEY), sess:null, busy:false, lastPush:0};
const MAILDOM='@users.laddermaster.app';
try{ NET.sess=JSON.parse(localStorage.getItem('lm_sess')||'null'); }catch(e){}
const saveSess=()=>{ try{ NET.sess?localStorage.setItem('lm_sess',JSON.stringify(NET.sess)):localStorage.removeItem('lm_sess'); }catch(e){} };
const me=()=>NET.sess&&NET.sess.user;
const validUser=u=>/^[A-Za-z0-9_]{3,16}$/.test(u);
function errMsg(j,st){
  const m=((j&&(j.msg||j.message||j.error_description||j.error))||'')+'';
  if(/already registered|already exists|duplicate|23505/i.test(m+(j&&j.code))) return tx('Bu kullanıcı adı alınmış','This username is taken');
  if(/invalid login|invalid_grant|credentials/i.test(m)) return tx('Kullanıcı adı veya şifre hatalı','Wrong username or password');
  if(/password/i.test(m)) return tx('Şifre en az 6 karakter olmalı','Password must be at least 6 characters');
  if(/confirm/i.test(m)) return tx('E-posta onayı açık — Supabase\'de kapatılmalı','Email confirmation is on — disable it in Supabase');
  if(st===0) return tx('Bağlantı yok','No connection');
  return m||tx('Bir hata oluştu','Something went wrong');
}
async function sb(path,{method='GET',body,auth=true,headers={}}={}){
  if(!NET.ok) throw {msg:'offline'};
  const h=Object.assign({'apikey':SB_KEY,'Content-Type':'application/json'},headers);
  h.Authorization='Bearer '+((auth&&NET.sess&&NET.sess.access_token)||SB_KEY);
  let r; try{ r=await fetch(SB_URL+path,{method,headers:h,body:body?JSON.stringify(body):undefined}); }catch(e){ throw {msg:errMsg(null,0)}; }
  if(r.status===401&&auth&&NET.sess&&!headers._retry){ if(await refreshSess()) return sb(path,{method,body,auth,headers:Object.assign({},headers,{_retry:1})}); }
  const txt=await r.text(); let j=null; try{ j=txt?JSON.parse(txt):null; }catch(e){}
  if(!r.ok) throw {msg:errMsg(j,r.status),status:r.status};
  return {j,r};
}
async function refreshSess(){
  try{ const r=await fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'apikey':SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:NET.sess.refresh_token})});
    if(!r.ok){ NET.sess=null; saveSess(); return false; }
    const j=await r.json(); NET.sess={access_token:j.access_token,refresh_token:j.refresh_token,user:NET.sess.user}; saveSess(); return true;
  }catch(e){ return false; }
}
function setSess(j,username){ NET.sess={access_token:j.access_token,refresh_token:j.refresh_token,user:{id:j.user.id,username}}; saveSess(); }
async function register(u,p){
  if(!validUser(u)) throw {msg:tx('Kullanıcı adı 3-16 karakter: harf, rakam, _','Username: 3-16 chars, letters, digits, _')};
  if(p.length<6) throw {msg:tx('Şifre en az 6 karakter olmalı','Password must be at least 6 characters')};
  const {j}=await sb('/auth/v1/signup',{method:'POST',auth:false,body:{email:u.toLowerCase()+MAILDOM,password:p,data:{username:u}}});
  if(!j||!j.access_token) throw {msg:errMsg({msg:'confirm'})};
  setSess(j,u);
  try{ await sb('/rest/v1/profiles',{method:'POST',body:{id:j.user.id,username:u,points:points()},headers:{Prefer:'return=minimal'}}); }
  catch(e){ NET.sess=null; saveSess(); throw e.status===409?{msg:tx('Bu kullanıcı adı alınmış','This username is taken')}:e; }
  await pushProgress(true);
}
async function login(u,p){
  if(!validUser(u)) throw {msg:tx('Kullanıcı adı veya şifre hatalı','Wrong username or password')};
  const {j}=await sb('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email:u.toLowerCase()+MAILDOM,password:p}});
  setSess(j,(j.user&&j.user.user_metadata&&j.user.user_metadata.username)||u);
  await pullProgress();
}
function logout(){ NET.sess=null; saveSess(); }
// bulut ile yerel ilerlemeyi birleştir (her iki taraftaki tamamlananlar korunur)
async function pullProgress(){
  if(!me()) return;
  const {j}=await sb(`/rest/v1/progress?id=eq.${me().id}&select=data`);
  const remote=(j&&j[0]&&j[0].data&&j[0].data.done)||{};
  let added=0; for(const k in remote) if(!save.done[k]){ save.done[k]=remote[k]; delete save.draft[k]; added++; }
  persist(); await pushProgress(true); return added;
}
let pushT=null;
function schedulePush(){ if(!me()) return; clearTimeout(pushT); pushT=setTimeout(()=>pushProgress().catch(()=>{}),1500); }
async function pushProgress(now){
  if(!me()) return; const id=me().id, ts=new Date().toISOString();
  await sb('/rest/v1/profiles?on_conflict=id',{method:'POST',body:{id,username:me().username,points:points(),updated_at:ts},headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
  await sb('/rest/v1/progress?on_conflict=id',{method:'POST',body:{id,data:{done:save.done},updated_at:ts},headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
  NET.lastPush=Date.now();
}
async function fetchBoard(){
  const {j}=await sb('/rest/v1/profiles?select=id,username,points&order=points.desc,updated_at.asc&limit=50',{auth:false});
  let rank=null; if(me()){ const i=j.findIndex(x=>x.id===me().id); if(i>=0) rank=i+1; else {
    const {r}=await sb(`/rest/v1/profiles?select=id&points=gt.${points()}`,{auth:false,method:'HEAD',headers:{Prefer:'count=exact'}});
    const cr=r.headers.get('content-range')||''; const tot=+cr.split('/')[1]; if(!isNaN(tot)) rank=tot+1; } }
  return {list:j||[],rank};
}
