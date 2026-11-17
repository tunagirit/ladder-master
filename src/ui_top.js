/*==UI==*/
const $=(s,r=document)=>r.querySelector(s);
const VERSION='v1.1.0';
const I=(n,c)=>'<span class="ms'+(c?' '+c.split(' ').map(x=>x==='f'?'f':'ms-'+x).join(' '):'')+'">'+n+'</span>';  // Material Symbols ikon
const SKEY='ladderustasi_v2';
let save={done:{},draft:{},sound:true,unlock:false,intro:false,last:-1,theme:'auto',lang:null,seen:{}};
try{const s=JSON.parse(localStorage.getItem(SKEY)||'null'); if(s) save=Object.assign(save,s);}catch(e){}
delete save.unlock; if(!save.seen) save.seen={};
if(save.v!==4){ save.done={}; save.draft={}; save.last=-1; save.v=4; }  // v1.0.5: tek birleşik yol, eski bölüm numaraları geçersiz
const persist=()=>{try{localStorage.setItem(SKEY,JSON.stringify(save));}catch(e){}};
const S={id:0,lv:null,prog:null,tags:{},tool:null,running:false,speed:1,cw:70,view:false,redo:false,mscr:null};
let world=null,plc=new PLC(),LIVE=[];
const clone=o=>JSON.parse(JSON.stringify(o));
const points=()=>Object.keys(save.done).length;
const extraDone=()=>Object.keys(save.done).filter(k=>isExtra(+k)).length;
const frontier=()=>{ let i=0; while(save.done[i]) i++; return i; };   // ilk çözülmemiş bölüm
const topicDone=c=>Object.keys(save.done).filter(k=>getLevel(+k).cat===c).length;
const unlocked=id=>id===0||!!save.done[id-1]||!!save.done[id];
