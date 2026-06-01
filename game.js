(function(){
const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const W=800,H=600,PS=24,ES=24,GS=14,PSPD=4.6,ESPD=2.8;
let active=true,win=false,lose=false,score=0,gems=[],enemies=[],frame=0,particles=[];
let player={x:W/2-PS/2,y:H/2-PS/2,w:PS,h:PS,speed:PSPD,trail:[]};
const keys={ArrowUp:0,ArrowDown:0,ArrowLeft:0,ArrowRight:0,w:0,s:0,a:0,d:0};

function rc(a,b){return!(b.x>a.x+a.w||b.x+b.w<a.x||b.y>a.y+a.h||b.y+b.h<a.y)}
function cl(e,w,h){e.x=Math.max(0,Math.min(w-e.w,e.x));e.y=Math.max(0,Math.min(h-e.h,e.y))}
function rr(a,b){return Math.floor(Math.random()*(b-a+1)+a)}
function spawnP(x,y,c,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:30+Math.random()*20,ml:50,c,s:2+Math.random()*3})}

function genGems(n){
let g=[],att=0;
while(g.length<n&&att<4000){att++;let gx=rr(10,W-GS-10),gy=rr(10,H-GS-10),c={x:gx,y:gy,w:GS,h:GS},ok=true;
if(rc(c,player))ok=false;for(let e of enemies)if(rc(c,e))ok=false;for(let g2 of g)if(rc(c,g2))ok=false;
if(ok)g.push(c)}
if(g.length<n){for(let i=g.length;i<n;i++){let p=false;for(let ty=60;ty<H-60&&!p;ty+=35)for(let tx=60;tx<W-60&&!p;tx+=35){let f={x:tx,y:ty,w:GS,h:GS},ok=true;if(rc(f,player))ok=false;for(let e of enemies)if(rc(f,e))ok=false;for(let g2 of g)if(rc(f,g2))ok=false;if(ok){g.push(f);p=true}}}}
return g;
}

function reset(){
active=true;win=false;lose=false;score=0;particles=[];
player.x=W/2-PS/2;player.y=H/2-PS/2;player.trail=[];cl(player,W,H);
enemies=[{x:120,y:480,w:ES,h:ES},{x:620,y:80,w:ES,h:ES}];
enemies.forEach(e=>{if(rc(e,player)){e.x=(e.x+70)%(W-ES);e.y=(e.y+50)%(H-ES)}cl(e,W,H)});
gems=genGems(8);gems=gems.filter(g=>!rc(g,player)&&!enemies.some(e=>rc(g,e)));
if(gems.length<8)gems.push(...genGems(8-gems.length));
gems=gems.slice(0,8);updUI();
}

function updUI(){
document.getElementById('scoreValue').textContent=score;
document.getElementById('gemsLeft').textContent=gems.length;
const s=document.getElementById('gameStatusText');
if(win){s.textContent='✨ 任务完成 ✨';s.className='value win'}
else if(lose){s.textContent='💀 任务失败 💀';s.className='value lose'}
else{s.textContent='任务进行中';s.className='value'}
}

function updPlayer(){
if(!active)return;let mx=0,my=0;
if(keys.ArrowUp||keys.w)my--;if(keys.ArrowDown||keys.s)my++;
if(keys.ArrowLeft||keys.a)mx--;if(keys.ArrowRight||keys.d)mx++;
if(mx||my){let l=Math.hypot(mx,my);player.x+=mx/l*PSPD;player.y+=my/l*PSPD;cl(player,W,H);
player.trail.push({x:player.x+PS/2,y:player.y+PS/2,a:1});if(player.trail.length>20)player.trail.shift()}
}

function updEnemies(){
if(!active)return;let px=player.x+PS/2,py=player.y+PS/2;
enemies.forEach(e=>{let dx=px-(e.x+ES/2),dy=py-(e.y+ES/2),l=Math.hypot(dx,dy);
if(l>.01){e.x+=dx/l*ESPD;e.y+=dy/l*ESPD}cl(e,W,H)});
}

function collectGems(){
if(!active)return;let hit=false;
for(let i=gems.length-1;i>=0;i--){if(rc(player,gems[i])){spawnP(gems[i].x+GS/2,gems[i].y+GS/2,'#fbbf24',12);gems.splice(i,1);score++;hit=true}}
if(hit){updUI();if(!gems.length){active=false;win=true;updUI()}}
}

function checkDeath(){
if(!active)return;
if(enemies.some(e=>rc(player,e))){active=false;lose=true;spawnP(player.x+PS/2,player.y+PS/2,'#ef4444',20);updUI()}
}

function updParticles(){
for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.96;p.vy*=.96;p.life--;if(p.life<=0)particles.splice(i,1)}
}

// ---- DRAW ----
function drawBg(){
let grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#0f172a');grd.addColorStop(1,'#1e1b4b');ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
// grid
ctx.strokeStyle='rgba(59,130,246,0.06)';ctx.lineWidth=1;
for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
// nebula blobs
ctx.globalAlpha=.08;
ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.arc(200+Math.sin(frame*.005)*30,150,80,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#06d6a0';ctx.beginPath();ctx.arc(600+Math.cos(frame*.007)*20,400,60,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#f472b6';ctx.beginPath();ctx.arc(400,300+Math.sin(frame*.004)*40,70,0,Math.PI*2);ctx.fill();
ctx.globalAlpha=1;
}

function drawPlayer(){
// trail
player.trail.forEach((t,i)=>{let a=i/player.trail.length*.3;ctx.globalAlpha=a;ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.arc(t.x,t.y,PS/3,0,Math.PI*2);ctx.fill()});
ctx.globalAlpha=1;
let px=player.x,py=player.y;
// glow
ctx.shadowColor='#3b82f6';ctx.shadowBlur=15;
ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.roundRect(px,py,PS,PS,4);ctx.fill();
ctx.shadowBlur=0;
// inner
ctx.fillStyle='#60a5fa';ctx.beginPath();ctx.roundRect(px+3,py+3,PS-6,PS-6,2);ctx.fill();
// eyes
ctx.fillStyle='#fff';ctx.fillRect(px+5,py+6,4,4);ctx.fillRect(px+PS-9,py+6,4,4);
ctx.fillStyle='#1e3a5f';ctx.fillRect(px+6,py+7,2,2);ctx.fillRect(px+PS-8,py+7,2,2);
// helm
ctx.fillStyle='#fbbf24';ctx.fillRect(px+2,py,PS-4,4);
}

function drawEnemy(e){
ctx.shadowColor='#ef4444';ctx.shadowBlur=12;
ctx.fillStyle='#991b1b';ctx.beginPath();ctx.roundRect(e.x,e.y,ES,ES,4);ctx.fill();
ctx.shadowBlur=0;
ctx.fillStyle='#dc2626';ctx.beginPath();ctx.roundRect(e.x+3,e.y+3,ES-6,ES-6,2);ctx.fill();
ctx.fillStyle='#ff5e5e';ctx.fillRect(e.x+4,e.y+7,4,3);ctx.fillRect(e.x+ES-8,e.y+7,4,3);
ctx.fillStyle='#450a0a';ctx.fillRect(e.x+3,e.y+5,ES-6,2);
// horns
ctx.fillStyle='#7f1d1d';ctx.beginPath();ctx.moveTo(e.x+3,e.y);ctx.lineTo(e.x+7,e.y-5);ctx.lineTo(e.x+11,e.y);ctx.fill();
ctx.beginPath();ctx.moveTo(e.x+ES-11,e.y);ctx.lineTo(e.x+ES-7,e.y-5);ctx.lineTo(e.x+ES-3,e.y);ctx.fill();
}

function drawGem(g){
let t=frame*.08,bob=Math.sin(t+g.x)*2;
ctx.shadowColor='#fbbf24';ctx.shadowBlur=10+Math.sin(t)*4;
ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(g.x+GS/2,g.y+GS/2+bob,GS/2,0,Math.PI*2);ctx.fill();
ctx.shadowBlur=0;
ctx.fillStyle='#fef3c7';ctx.beginPath();ctx.arc(g.x+GS/2,g.y+GS/2+bob,GS/4,0,Math.PI*2);ctx.fill();
// sparkle
ctx.fillStyle='#fff';ctx.globalAlpha=.5+Math.sin(t*2+g.y)*.5;
ctx.fillRect(g.x+GS/2-1,g.y+bob-2,2,GS+4);ctx.fillRect(g.x-2,g.y+GS/2+bob-1,GS+4,2);
ctx.globalAlpha=1;
}

function drawParticles(){
particles.forEach(p=>{ctx.globalAlpha=p.life/p.ml;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s*(p.life/p.ml),0,Math.PI*2);ctx.fill()});
ctx.globalAlpha=1;
}

function drawOverlay(){
if(win){ctx.fillStyle='rgba(6,214,160,0.1)';ctx.fillRect(0,0,W,H);
ctx.font='bold 32px Orbitron,sans-serif';ctx.fillStyle='#06d6a0';ctx.textAlign='center';
ctx.fillText('MISSION COMPLETE',W/2,H/2-30);ctx.font='16px Rajdhani,sans-serif';ctx.fillStyle='#a7f3d0';ctx.fillText('点击重新开始按钮继续',W/2,H/2+10);ctx.textAlign='left'}
if(lose){ctx.fillStyle='rgba(239,68,68,0.1)';ctx.fillRect(0,0,W,H);
ctx.font='bold 32px Orbitron,sans-serif';ctx.fillStyle='#ef4444';ctx.textAlign='center';
ctx.fillText('MISSION FAILED',W/2,H/2-30);ctx.font='16px Rajdhani,sans-serif';ctx.fillStyle='#fca5a5';ctx.fillText('点击重新开始按钮继续',W/2,H/2+10);ctx.textAlign='left'}
}

function render(){
drawBg();gems.forEach(drawGem);enemies.forEach(drawEnemy);drawPlayer();drawParticles();drawOverlay();
ctx.font='bold 13px Orbitron,sans-serif';ctx.fillStyle='rgba(148,163,184,0.5)';ctx.fillText('STARDUST HUNTER',16,24);
ctx.fillStyle='rgba(251,191,36,0.7)';ctx.fillText('⭐ '+score+' / 8',16,44);
}

function loop(){frame++;if(active&&!win&&!lose){updPlayer();updEnemies();collectGems();checkDeath()}updParticles();render();requestAnimationFrame(loop)}

function kd(e){if(keys.hasOwnProperty(e.key)){e.preventDefault();keys[e.key]=true}if(e.key==='r'||e.key==='R')reset()}
function ku(e){if(keys.hasOwnProperty(e.key)){e.preventDefault();keys[e.key]=false}}
function rk(){for(let k in keys)keys[k]=false}

reset();
window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);window.addEventListener('blur',rk);
document.getElementById('resetButton').addEventListener('click',reset);
loop();
})();
