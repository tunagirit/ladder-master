/*==UI==*/
const $=(s,r=document)=>r.querySelector(s);
const VERSION='v1.0.4';
const SKEY='ladderustasi_v2';
let save={done:{},draft:{},sound:true,unlock:false,intro:false,last:-1,theme:'auto',lang:null,seen:{}};
try{const s=JSON.parse(localStorage.getItem(SKEY)||'null'); if(s) save=Object.assign(save,s);}catch(e){}
delete save.unlock; if(!save.seen) save.seen={};
if(save.v!==3){ save.done={}; save.draft={}; save.last=-1; save.v=3; }  // v1.0.4: yeni yol haritası, eski bölüm numaraları geçersiz
const persist=()=>{try{localStorage.setItem(SKEY,JSON.stringify(save));}catch(e){}};
const S={id:0,lv:null,prog:null,tags:{},tool:null,running:false,speed:1,cw:70,view:false,redo:false,mscr:null};
let world=null,plc=new PLC(),LIVE=[];
const clone=o=>JSON.parse(JSON.stringify(o));
const points=()=>Object.keys(save.done).length;
const catDone=c=>Object.keys(save.done).filter(k=>Math.floor(k/ROAD)===c).length;
const extraDone=c=>Object.keys(save.done).filter(k=>Math.floor(k/ROAD)===c&&isExtra(k%ROAD)).length;
const frontier=c=>{ let i=0; while(save.done[c*ROAD+i]) i++; return i; };   // ilk çözülmemiş bölüm
const unlocked=id=>id%ROAD===0||!!save.done[id-1]||!!save.done[id];
