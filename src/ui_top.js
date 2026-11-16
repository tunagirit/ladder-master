/*==UI==*/
const $=(s,r=document)=>r.querySelector(s);
const VERSION='v1.0.3';
const SKEY='ladderustasi_v2';
let save={done:{},draft:{},sound:true,unlock:false,intro:false,last:-1,theme:'auto',lang:null,seen:{}};
try{const s=JSON.parse(localStorage.getItem(SKEY)||'null'); if(s) save=Object.assign(save,s);}catch(e){}
delete save.unlock; if(!save.seen) save.seen={};
const persist=()=>{try{localStorage.setItem(SKEY,JSON.stringify(save));}catch(e){}};
const S={id:0,lv:null,prog:null,tags:{},tool:null,running:false,speed:1,cw:70,view:false,redo:false,mscr:null};
let world=null,plc=new PLC(),LIVE=[];
const clone=o=>JSON.parse(JSON.stringify(o));
const points=()=>Object.keys(save.done).length;
const tierDone=(c,d)=>{ let k=0; for(let i=0;i<PER;i++) if(save.done[c*300+d*100+i]) k++; return k; };
const catDone=c=>tierDone(c,0)+tierDone(c,1)+tierDone(c,2);
const unlocked=id=>id%PER===0||!!save.done[id-1]||!!save.done[id];
