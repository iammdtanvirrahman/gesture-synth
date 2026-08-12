const video = document.getElementById('camera');
const canvas = document.getElementById('tracking');
const ctx = canvas.getContext('2d');
const start = document.getElementById('start');
const welcome = document.getElementById('welcome');
const desktop = document.getElementById('desktop');
const dock = document.getElementById('dock');
const cursor = document.getElementById('cursor');
const toast = document.getElementById('toast');
const state = document.getElementById('trackingState');
const handCount = document.getElementById('handCount');
const fpsEl = document.getElementById('fps');
let hands, stream, running = false, lastFrame = performance.now(), pinch = false;
let dragTarget = null, dragDX = 0, dragDY = 0, lastPinch = 0, toastTimer;
const $ = id => document.getElementById(id);

function resize(){ canvas.width=innerWidth; canvas.height=innerHeight; }
addEventListener('resize',resize); resize();
function notify(text){ toast.textContent=text; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),1100); }
function setState(text,live=false){ state.innerHTML=`<i></i> ${text}`; state.parentElement.classList.toggle('live',live); }

async function boot(){
  if(running) return;
  start.disabled=true; start.textContent='Starting…';
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=stream; await video.play();
    hands=new window.Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:.62,minTrackingConfidence:.62});
    hands.onResults(onResults);
    welcome.classList.add('hidden'); desktop.classList.remove('hidden'); dock.classList.remove('hidden'); running=true; setState('LIVE',true); notify('VisionFlow ready'); loop(); cameraLoop();
  }catch(e){ console.error(e); start.disabled=false; start.textContent='Try Again →'; notify(e.name==='NotAllowedError'?'Camera permission denied':'Camera could not start'); }
}
async function cameraLoop(){ if(!running)return; try{await hands.send({image:video});}catch(e){console.warn(e)} requestAnimationFrame(cameraLoop); }
function loop(){ if(!running)return; const now=performance.now(); fpsEl.textContent=Math.round(1000/Math.max(1,now-lastFrame)); lastFrame=now; requestAnimationFrame(loop); }

function point(l){ return {x:(1-l.x)*innerWidth,y:l.y*innerHeight}; }
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function onResults(res){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const list=res.multiHandLandmarks||[]; handCount.textContent=list.length;
  if(!list.length){cursor.classList.remove('show','pinching'); setState('SEARCHING',false); pinch=false; if(dragTarget){dragTarget=null} return;}
  setState('TRACKING',true);
  const lm=list[0], p=point(lm[8]), thumb=point(lm[4]);
  cursor.style.left=p.x+'px'; cursor.style.top=p.y+'px'; cursor.classList.add('show');
  const isPinch=distance(p,thumb)<Math.min(innerWidth,innerHeight)*.055;
  cursor.classList.toggle('pinching',isPinch);
  drawHand(lm);
  if(isPinch&&!pinch){ lastPinch=performance.now(); handleDown(p); }
  if(isPinch&&pinch&&dragTarget){ dragTarget.style.left=(p.x-dragDX)+'px'; dragTarget.style.top=(p.y-dragDY)+'px'; }
  if(!isPinch&&pinch) handleUp(p);
  pinch=isPinch;
}
function drawHand(lm){
  ctx.save();ctx.scale(-1,1);ctx.translate(-canvas.width,0);ctx.strokeStyle='rgba(159,255,233,.2)';ctx.lineWidth=1;
  const links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  for(const [a,b] of links){ctx.beginPath();ctx.moveTo(lm[a].x*canvas.width,lm[a].y*canvas.height);ctx.lineTo(lm[b].x*canvas.width,lm[b].y*canvas.height);ctx.stroke();}
  for(const p of lm){ctx.beginPath();ctx.arc(p.x*canvas.width,p.y*canvas.height,2.3,0,Math.PI*2);ctx.fillStyle='rgba(159,255,233,.8)';ctx.fill();}ctx.restore();
}
function handleDown(p){
  const el=document.elementFromPoint(p.x,p.y)?.closest('.window,.dock-app');
  if(!el)return;
  if(el.classList.contains('dock-app')){openWindow(el.dataset.open);notify('Selected '+el.querySelector('span').textContent);return;}
  if(el.classList.contains('close')){el.closest('.window').style.display='none';notify('Window closed');return;}
  if(el.classList.contains('draggable')){dragTarget=el; const r=el.getBoundingClientRect(); dragDX=p.x-r.left; dragDY=p.y-r.top; notify('Dragging');}
}
function handleUp(){ if(dragTarget){dragTarget.style.transition='transform .25s,opacity .25s';dragTarget=null;notify('Released');} }
function openWindow(name){const el=document.querySelector(`[data-window="${name}"]`);if(!el)return;el.style.display='block';el.style.opacity='1';el.style.zIndex=15;document.querySelectorAll('.dock-app').forEach(b=>b.classList.toggle('active',b.dataset.open===name));}

document.querySelectorAll('.dock-app').forEach(b=>b.addEventListener('click',()=>openWindow(b.dataset.open)));
document.querySelectorAll('.close').forEach(b=>b.addEventListener('click',e=>e.currentTarget.closest('.window').style.display='none'));
$('help').onclick=()=>$('helpModal').classList.add('show'); $('closeHelp').onclick=()=>$('helpModal').classList.remove('show');
$('helpModal').addEventListener('click',e=>{if(e.target.id==='helpModal')e.currentTarget.classList.remove('show')});
start.onclick=boot;
addEventListener('beforeunload',()=>stream?.getTracks().forEach(t=>t.stop()));
