'use strict';
const $=id=>document.getElementById(id);
const BREEDS=[{id:'long',name:'긴 갈기 말',hair:0x683743},{id:'donkey',name:'당나귀',hair:0x414857},{id:'unicorn',name:'유니콘형',hair:0xfb91c4},{id:'pony',name:'조랑말',hair:0xefc393},{id:'paint',name:'얼룩무늬 말',hair:0x45404e},{id:'curly',name:'곱슬갈기 말',hair:0xf1d99b}];
const DEFAULTS=[{name:'번개',breed:'long',color:'#b87849'},{name:'바람',breed:'donkey',color:'#929cba'},{name:'별빛',breed:'unicorn',color:'#fff1e5'},{name:'초코',breed:'pony',color:'#dfad78'},{name:'구름',breed:'paint',color:'#c48991'}];
let runners=DEFAULTS.map(r=>({...r})),winMode='first',view='angle',panelOpen=true;
try{const savedMode=localStorage.getItem('horse-race-win-mode');if(savedMode==='first'||savedMode==='last')winMode=savedMode}catch{}
let engine=null,state='ready',countdownAt=0,lastFrame=0,uiAt=0,toastUntil=0,noticeIndex=0;
let pausedFrom=null,pausedAt=0;
let scene,camera,renderer,trackGroup,horseGroup,itemGroup,scenery,models=[],itemMeshes=new Map(),cameraCenter=0,cameraHeight=42;
const palette={cream:0xfff5de,grass:0x9fcd8c,rail:0xf3d6a0};
const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:.75,...opts});
function mesh(parent,geometry,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function ball(p,m,x,y,z,sx=1,sy=1,sz=1,r=1){return mesh(p,new THREE.SphereGeometry(r,20,14),m,x,y,z,sx,sy,sz)}
function box(p,m,x,y,z,w,h,d){return mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z)}
function tube(p,points,r,m){const c=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));return mesh(p,new THREE.TubeGeometry(c,20,r,8,false),m)}
function disposeGroup(g){if(!g)return;const geometries=new Set(),materials=new Set();g.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m))});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.remove(g)}
function laneY(i){return (runners.length-1-i)*6.4-(runners.length-1)*3.2}
function skyTexture(){const c=document.createElement('canvas');c.width=1024;c.height=1024;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,1024);g.addColorStop(0,'#76bede');g.addColorStop(.55,'#c4eaf1');g.addColorStop(1,'#eff4df');x.fillStyle=g;x.fillRect(0,0,1024,1024);const glow=x.createRadialGradient(810,170,20,810,170,230);glow.addColorStop(0,'#fff3c4');glow.addColorStop(.2,'#ffeec388');glow.addColorStop(1,'#ffeec300');x.fillStyle=glow;x.fillRect(570,0,454,420);return new THREE.CanvasTexture(c)}
// Faces are drawn on the visible cheek; the muzzle has separate 3D nostrils.
const faceTextures={};
function faceTexture(expression){
  if(faceTextures[expression])return faceTextures[expression];
  const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');
  const happy=expression==='happy',sad=expression==='sad',shock=expression==='shock';
  x.fillStyle='rgba(250,135,152,.52)';[58,198].forEach(px=>{x.beginPath();x.ellipse(px,153,24,13,0,0,Math.PI*2);x.fill()});
  [78,178].forEach((px,i)=>{
    x.fillStyle='#fffef3';x.beginPath();x.ellipse(px,101,30,37,0,0,Math.PI*2);x.fill();
    x.fillStyle='#263e49';x.beginPath();x.ellipse(px+4,108,15,happy?11:22,0,0,Math.PI*2);x.fill();
    x.fillStyle='white';x.beginPath();x.arc(px+9,99,6,0,Math.PI*2);x.fill();
    x.strokeStyle='#43525a';x.lineWidth=7;x.lineCap='round';x.beginPath();
    const incline=sad?(i===0?-1:1):shock?0:happy?0:(i===0?1:-1);x.moveTo(px-24,53-incline*8);x.quadraticCurveTo(px,42,px+24,53+incline*8);x.stroke();
    if(sad){x.fillStyle='#69cef6';x.beginPath();x.moveTo(px+25,130);x.bezierCurveTo(px+7,154,px+11,176,px+25,176);x.bezierCurveTo(px+41,173,px+37,149,px+25,130);x.fill()}
  });
  x.strokeStyle='#4b3a41';x.lineWidth=8;x.lineCap='round';
  if(happy){x.fillStyle='#553942';x.beginPath();x.moveTo(49,163);x.quadraticCurveTo(128,203,207,163);x.quadraticCurveTo(128,280,49,163);x.fill();x.fillStyle='#fff9ee';x.beginPath();x.moveTo(59,169);x.quadraticCurveTo(128,203,197,169);x.lineTo(188,187);x.quadraticCurveTo(128,221,68,187);x.fill()}
  else if(shock){x.fillStyle='#553942';x.beginPath();x.ellipse(128,193,20,27,0,0,Math.PI*2);x.fill()}
  else{x.beginPath();x.moveTo(sad?67:89,193);x.quadraticCurveTo(128,sad?146:220,sad?189:167,193);x.stroke()}
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;faceTextures[expression]=texture;return texture;
}
function setExpression(model,e){if(model.expression===e)return;model.expression=e;model.faceMat.map=faceTexture(e);model.faceMat.needsUpdate=true;Object.entries(model.mouths).forEach(([name,g])=>g.visible=name===e)}
function horseModel(r,i){
  const root=new THREE.Group(),h=new THREE.Group();root.add(h);
  const breed=BREEDS.find(b=>b.id===r.breed),pony=r.breed==='pony',donkey=r.breed==='donkey';
  const coat=mat(r.color),hair=mat(breed.hair),cream=mat(0xffead2),hoof=mat(0x394552),pink=mat(0xf3a5bb),tack=mat(0x466573),bodyParts=[],hairParts=[];
  bodyParts.push(ball(h,coat,-.3,0,0,1.35,pony?.78:.68,.65));
  const neck=ball(h,coat,.64,.63,0,.5,.82,.49);neck.rotation.z=-.25;bodyParts.push(neck);
  const head=new THREE.Group();head.position.set(1.16,1.04,.04);head.rotation.y=-.16;head.scale.setScalar(1.2);h.add(head);
  bodyParts.push(ball(head,coat,0,0,0,.89,.86,.74));
  ball(head,cream,.43,-.3,.08,.55,.38,.63);
  for(const side of [-1,1]){
    const ear=ball(head,coat,-.23,.86,side*.38,.19,donkey?.78:.35,.17);ear.rotation.x=side*.2;bodyParts.push(ear);
    const inner=ball(head,pink,-.18,.91,side*.39,.1,donkey?.56:.2,.1);inner.position.x+=.055;
  }
  const faceMat=new THREE.MeshBasicMaterial({map:faceTexture('normal'),transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
  const face=mesh(head,new THREE.PlaneGeometry(1.18,1.24),faceMat,.15,.03,.75);face.rotation.y=.08;
  for(const side of [-1,1])ball(head,mat(0x686073),.94,-.26,side*.25,.055,.035,.07);
  const mouths={},mouthInk=mat(0x493443),teeth=mat(0xfffdf3),tear=mat(0x56c9ee,{roughness:.25});
  for(const expression of ['normal','happy','sad','shock']){const g=new THREE.Group();head.add(g);g.visible=expression==='normal';mouths[expression]=g}
  ball(mouths.happy,mouthInk,.15,-.29,.9,.37,.23,.035);ball(mouths.happy,teeth,.15,-.19,.935,.29,.075,.012);ball(mouths.happy,pink,.15,-.42,.936,.14,.045,.01);
  tube(mouths.normal,[[-.04,-.27,.91],[.15,-.37,.93],[.34,-.27,.91]],.021,mouthInk);
  tube(mouths.sad,[[-.14,-.39,.91],[.15,-.2,.93],[.44,-.39,.91]],.03,mouthInk);
  for(const x of [-.27,.54])ball(mouths.sad,tear,x,-.04,.88,.068,.16,.026);
  ball(mouths.shock,mouthInk,.15,-.3,.91,.14,.21,.035);
  const mane=new THREE.Group();h.add(mane);
  const strands=r.breed==='long'?9:r.breed==='curly'?12:6;
  for(let j=0;j<strands;j++){
    const strand=ball(mane,hair,.72-j*.2,.92-j*.075,.0,.25,r.breed==='long'?.53:.27,.36);
    if(r.breed==='long'){strand.position.z=.32;strand.rotation.z=-.18-j*.035}hairParts.push(strand);
  }
  for(let j=0;j<4;j++)hairParts.push(ball(head,hair,-.35+j*.14,.55,.26,.2,.29,.31));
  const tail=new THREE.Group();tail.position.set(-1.5,.12,0);h.add(tail);
  for(let j=0;j<4;j++){const strand=ball(tail,hair,-.15-j*.15,-j*.18,0,.26,.43,.25);strand.rotation.z=-.6;hairParts.push(strand)}
  const legs=[];
  for(const [x,z] of [[-.95,-.43],[.63,-.43],[-.95,.43],[.63,.43]]){
    const leg=new THREE.Group();leg.position.set(x,-.39,z);h.add(leg);
    bodyParts.push(ball(leg,coat,0,-.45,0,.16,pony?.4:.48,.17));
    bodyParts.push(ball(leg,coat,.04,-.99,0,.12,.32,.14));
    box(leg,hoof,.15,-1.25,0,.4,.22,.3);legs.push(leg);
  }
  const saddle=ball(h,tack,-.35,.58,0,.62,.15,.66);
  ball(h,mat(0xffdd89),-.34,.59,.65,.15,.15,.055);
  if(r.breed==='paint')for(let j=0;j<5;j++){const spot=ball(h,cream,-1.1+j*.46,.14+Math.sin(j)*.28,.57,.23,.25,.08);bodyParts.push(spot)}
  let horn=null;
  if(r.breed==='unicorn'){horn=mesh(head,new THREE.ConeGeometry(.19,.92,14),mat(0xffe6a4,{metalness:.2,roughness:.35}),.32,1.02,0);horn.rotation.z=-.25}
  const wheels=new THREE.Group();h.add(wheels);wheels.visible=false;
  for(const x of [-.95,.63]){const ring=mesh(wheels,new THREE.TorusGeometry(.5,.075,8,24),mat(0x64e4ff,{emissive:0x338dd6,emissiveIntensity:.8,transparent:true,opacity:.8}),x,-1.2,.56);ring.userData.wheel=true}
  const trails=new THREE.Group();root.add(trails);trails.visible=false;
  for(let j=0;j<8;j++)box(trails,mat(j%2?0xffefad:0x72e9ff,{emissive:0x3985bb,emissiveIntensity:.4,transparent:true,opacity:.7}),-2-j*.28,(j%4)*.38-.5,.3+j*.07,.8+(j%3)*.4,.055,.04);
  const splashes=new THREE.Group();root.add(splashes);splashes.visible=false;
  for(let j=0;j<10;j++)ball(splashes,mat(0x70c9ee,{transparent:true,opacity:.85}),0,0,0,.1,.2,.1);
  const swirl=new THREE.Group();root.add(swirl);swirl.visible=false;
  const spiral=[];for(let j=0;j<65;j++){const f=j/64,a=f*Math.PI*5;spiral.push([Math.cos(a)*1.8,-1+f*3.3,Math.sin(a)*.9])}tube(swirl,spiral,.045,mat(0xbcfff1,{transparent:true,opacity:.75}));
  const sparkle=new THREE.Group();root.add(sparkle);sparkle.visible=false;
  for(let j=0;j<9;j++)mesh(sparkle,new THREE.OctahedronGeometry(.14),mat(0xffecc2,{emissive:0xe5b275,emissiveIntensity:.7}),Math.sin(j*2)*2,j/3-.5,Math.cos(j*2));
  const mudFeet=new THREE.Group();h.add(mudFeet);mudFeet.visible=false;
  for(const [x,z] of [[-.95,-.43],[.63,-.43],[-.95,.43],[.63,.43]])ball(mudFeet,mat(0xa17757),x,-1.58,z,.24,.1,.24);
  const model={root,h,head,coat,hair,legs,tail,saddle,bodyParts,hairParts,faceMat,mouths,expression:'normal',wheels,trails,splashes,swirl,sparkle,mudFeet,horn,wings:[],unicornVisual:false,pegasusVisual:false,baseScale:pony?.9:1};
  model.noseOffset=(1.16+1.015*1.2)*model.baseScale;h.scale.setScalar(model.baseScale);root.position.set(-model.noseOffset,laneY(i)+1.65,0);
  return model;
}
function addWings(model){
  const feather=mat(0xfffcf4),shade=mat(0xe0ddfa);
  for(const side of [-1,1]){
    const wing=new THREE.Group();wing.position.set(-.35,.42,side*.5);model.h.add(wing);
    ball(wing,shade,-.25,.34,side*.06,.56,.5,.18);
    for(let j=0;j<5;j++){const f=ball(wing,feather,-.22-j*.17,.64+j*.14,side*(.13+j*.06),.22,.5,.11);f.rotation.z=-.42-j*.08}
    model.wings.push(wing);
  }
}
function updateTransformation(m,h){
  const uni=h.unicornUntil>engine.time;
  if(h.pegasus&&!m.pegasusVisual){m.pegasusVisual=true;m.coat.color.set(0xffffff);m.hair.color.set(0xffffff);addWings(m)}
  if(uni!==m.unicornVisual){m.unicornVisual=uni;m.coat.color.set(uni?0xffffff:m.pegasusVisual?0xffffff:runners[h.id].color);m.hair.color.set(uni?0xff72bd:m.pegasusVisual?0xffffff:BREEDS.find(b=>b.id===runners[h.id].breed).hair);
    if(uni&&!m.horn){m.temporaryHorn=mesh(m.head,new THREE.ConeGeometry(.2,1,14),mat(0xffffff),.34,1.05,0);m.temporaryHorn.rotation.z=-.2}
    if(!uni&&m.temporaryHorn){m.head.remove(m.temporaryHorn);m.temporaryHorn.geometry.dispose();m.temporaryHorn.material.dispose();m.temporaryHorn=null}
  }
}
function buildTrack(){
  disposeGroup(trackGroup);trackGroup=new THREE.Group();scene.add(trackGroup);
  const edge=mat(palette.rail),dirt=mat(0xd9aa75),dirt2=mat(0xe0b581),post=mat(0x997457),stripe=mat(0xfff6df),dark=mat(0x415364);
  runners.forEach((r,i)=>{
    const y=laneY(i);box(trackGroup,i%2?dirt:dirt2,120,y,0,249,.38,3.3);
    for(const z of [-1.6,1.6]){box(trackGroup,edge,120,y+.22,z,249,.13,.12);for(let x=-3;x<246;x+=12){box(trackGroup,post,x,y+.42,z,.1,.62,.1)}}
    for(let x=0;x<240;x+=15)box(trackGroup,stripe,x,y+.2,0,.12,.04,2.9);
    for(let x=0;x<2;x++)for(let z=0;z<6;z++)box(trackGroup,(x+z)%2?stripe:dark,240+x*.4,y+.24,-1.3+z*.5,.4,.07,.5);
    const flagpole=box(trackGroup,post,240,y+1.5,-1.5,.12,3,.12);box(trackGroup,stripe,240.7,flagpole.position.y+1,-1.5,1.3,.75,.08);
  });
}
function buildScenery(){
  scenery=new THREE.Group();scene.add(scenery);
  const grass=mat(0xa0ce88),green=mat(0x76b591),pink=mat(0xeac0d1),trunk=mat(0x998064),cloud=mat(0xfffcf0),mountain=mat(0x93bdc0);
  for(let x=-60;x<330;x+=38){
    ball(scenery,grass,x,-15,-22,23,8,11);
    const peak=mesh(scenery,new THREE.ConeGeometry(15,24,7),mountain,x+10,-4,-45);peak.rotation.y=x*.1;
    ball(scenery,mat(0xd3e1d1),x+10,6,-45,2.7,3,2.7);
    const tree=new THREE.Group();tree.position.set(x,-9,-12);scenery.add(tree);
    mesh(tree,new THREE.CylinderGeometry(.3,.45,3.6,9),trunk,0,1.8,0);
    for(let j=0;j<4;j++)ball(tree,x%76===0?pink:green,Math.sin(j*2)*1.3,4+Math.cos(j*2)*.5,Math.cos(j)*.9,1.7,1.6,1.7);
    const puffGroup=new THREE.Group();puffGroup.position.set(x+4,17+Math.sin(x)*4,-28);scenery.add(puffGroup);
    for(let j=0;j<5;j++)ball(puffGroup,cloud,j*1.8,Math.sin(j)*.5,0,1.8,1.2+(j%2)*.5,1.2);
    for(let j=0;j<6;j++){const flowerMat=mat([0xffc6d4,0xffe9a0,0xd6c5ef][j%3]);ball(scenery,flowerMat,x-9+j*3,-8.5+Math.sin(j)*.6,-8,.2,.22,.2)}
  }
  const sun=mesh(camera,new THREE.SphereGeometry(3,24,16),new THREE.MeshBasicMaterial({color:0xffefb8}),20,24,-95);sun.castShadow=false;
}
function itemModel(type){
  const g=new THREE.Group(),yellow=mat(0xffdc52),orange=mat(0xff9a51),white=mat(0xfffcf4),cyan=mat(0x5cdfff,{emissive:0x258eab,emissiveIntensity:.3});
  if(type==='banana'){
    for(let j=0;j<3;j++){const a=j*Math.PI*2/3;const p=[[0,.55,0],[Math.cos(a)*.3,.22,Math.sin(a)*.3],[Math.cos(a)*.8,.1,Math.sin(a)*.8],[Math.cos(a)*1,.27,Math.sin(a)*1]];tube(g,p,.15,yellow)}
    mesh(g,new THREE.CylinderGeometry(.09,.12,.42,8),mat(0x846345),0,.66,0);
  }else if(type==='boost'){
    const shell=mesh(g,new THREE.ConeGeometry(.4,1.3,12),cyan);shell.rotation.z=-Math.PI/2;
    for(const z of [-.27,.27]){const fin=mesh(g,new THREE.ConeGeometry(.2,.55,8),mat(0x4378b8),-.3,-.25,z);fin.rotation.z=-.45}
    ball(g,orange,-.85,0,0,.38,.24,.24);
  }else if(type==='rock'){const rock=mesh(g,new THREE.DodecahedronGeometry(.75,0),mat(0x9298a6),0,.35,0,1,.6,.85);rock.rotation.set(.2,.3,.2)}
  else if(type==='rainbow'){
    [0xff797d,0xffbd65,0xffe99b,0x95d9a5,0x8bcdeb,0xb5a4e2].forEach((c,i)=>{const arc=mesh(g,new THREE.TorusGeometry(1.75-i*.18,.095,8,32,Math.PI),mat(c),0,0,0);arc.rotation.z=0});
    ball(g,white,-1.35,0,0,.55,.32,.35);ball(g,white,1.35,0,0,.55,.32,.35);
  }else if(type==='pegasus'){
    for(const s of [-1,1])for(let j=0;j<4;j++){const f=ball(g,white,s*(.25+j*.24),.15+j*.1,0,.17,.6,.15);f.rotation.z=-s*.5}
    const halo=mesh(g,new THREE.TorusGeometry(.35,.05,6,20),yellow,0,.9,0);halo.rotation.x=Math.PI/2;
  }else if(type==='mud'||type==='puddle'){
    ball(g,mat(type==='mud'?0x8a6252:0x68bce6,{roughness:type==='mud'?1:.2,metalness:.15}),0,.08,0,1.4,.09,1);
    for(let j=0;j<4;j++)ball(g,type==='mud'?mat(0xaf8270):cyan,-.6+j*.4,.18,Math.sin(j)*.4,.18,.1,.16);
  }else if(type==='spring'){
    box(g,mat(0x81c5a5),0,0,0,1.3,.2,1.2);const points=[];for(let j=0;j<90;j++){const a=j/89*Math.PI*8;points.push([Math.cos(a)*.4,.12+j/89*.9,Math.sin(a)*.4])}tube(g,points,.06,white);box(g,mat(0xffbbce),0,1.12,0,1.2,.16,1.1);
  }else if(type==='wind'){
    const points=[];for(let j=0;j<60;j++){const t=j/59,a=t*Math.PI*7;points.push([Math.cos(a)*(.15+t*.65),t*1.8,Math.sin(a)*(.15+t*.65)])}tube(g,points,.075,cyan);
  }else if(type==='carrot'){
    const carrot=mesh(g,new THREE.ConeGeometry(.35,1.15,12),orange,0,.5,0);carrot.rotation.z=Math.PI+.3;
    for(let j=0;j<3;j++){const leaf=ball(g,mat(0x64b980),-.3+j*.22,1.22,0,.12,.38,.1);leaf.rotation.z=(j-1)*.45}
  }
  return g;
}
function resetModels(){
  disposeGroup(horseGroup);disposeGroup(itemGroup);models=[];itemMeshes.clear();horseGroup=new THREE.Group();itemGroup=new THREE.Group();scene.add(horseGroup,itemGroup);
  runners.forEach((r,i)=>{const m=horseModel(r,i);models.push(m);horseGroup.add(m.root)});buildTrack();
  $('labels').replaceChildren();runners.forEach((r,i)=>{const el=document.createElement('div');el.className='horse-label';el.id=`label-${i}`;const rank=document.createElement('b'),name=document.createElement('span'),note=document.createElement('small');name.textContent=r.name;el.append(rank,name,note);$('labels').append(el);models[i].label=el;models[i].rankEl=rank;models[i].noteEl=note;const bubble=document.createElement('div');bubble.className='event-bubble';bubble.hidden=true;$('labels').append(bubble);models[i].bubble=bubble});
}
function setPanel(open){panelOpen=open;$('settingsPanel').classList.toggle('collapsed',!open);$('settingsPanel').inert=!open;$('settingsToggle').textContent=open?'설정 접기':'설정 열기';$('settingsToggle').setAttribute('aria-expanded',String(open))}
function setView(v){view=v;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('quickView').textContent=`시점: ${v==='angle'?'비스듬한 3D':'옆에서 보기'}`}
function updateRule(){document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===winMode));$('raceRule').textContent=`${winMode==='first'?'첫':'마지막'} 도착 우승 · 약 30초`}
function lockSettings(lock){document.querySelectorAll('#runnerList input,#runnerList select,#runnerList button,#modeButtons button').forEach(b=>b.disabled=lock);if(!lock&&runners.length<=2)document.querySelectorAll('#runnerList .remove').forEach(b=>b.disabled=true);$('addBtn').disabled=lock||runners.length>=10;$('resetBtn').disabled=lock;$('startBtn').disabled=lock}
function resetRace(){engine=null;state='ready';pausedFrom=null;pausedAt=0;noticeIndex=0;cameraCenter=0;resetModels();$('finishCard').hidden=true;$('againBtn').hidden=true;$('countdown').hidden=true;$('racePhase').textContent='출발 준비';$('clock').textContent='00.0';$('progressFill').style.width='0%';$('leaderText').textContent='선수들을 골라주세요';$('eventToast').classList.remove('visible');$('pauseBtn').disabled=true;$('pauseBtn').textContent='멈추기';$('pauseBtn').setAttribute('aria-pressed','false');lockSettings(false)}
function startRace(){if(state==='running'||state==='countdown'||state==='paused')return;resetRace();engine=new HorseRaceEngine(runners.length,winMode);state='countdown';countdownAt=performance.now();setPanel(false);lockSettings(true);$('pauseBtn').disabled=false;$('countdown').hidden=false;$('countdown').textContent='3';$('racePhase').textContent='출발 카운트다운'}
function togglePause(){
  const now=performance.now();
  if(state==='paused'){
    const pauseDuration=now-pausedAt;
    state=pausedFrom;if(state==='countdown'){countdownAt+=pauseDuration;$('countdown').hidden=false}
    if(toastUntil)toastUntil+=pauseDuration;
    pausedFrom=null;pausedAt=0;lastFrame=now;
    $('pauseBtn').textContent='멈추기';$('pauseBtn').setAttribute('aria-pressed','false');$('racePhase').textContent=state==='countdown'?'출발 카운트다운':'경주 재개';
  }else if(state==='running'||state==='countdown'){
    updateHUD();pausedFrom=state;pausedAt=now;state='paused';$('countdown').hidden=true;
    $('pauseBtn').textContent='계속 달리기';$('pauseBtn').setAttribute('aria-pressed','true');$('racePhase').textContent='일시정지';
  }
}
function finishRace(){state='finished';const winner=engine.winner;$('finishCard').hidden=false;$('winnerText').textContent=`${runners[winner].name} 우승!`;$('finishSummary').textContent=`${winMode==='first'?'첫 도착':'마지막 도착'} 우승 · ${engine.time.toFixed(2)}초\n선두 교체 ${engine.leaderChanges}회 · 이벤트 ${engine.eventCount}회`;
  $('finishList').replaceChildren();engine.ranking().forEach(h=>{const li=document.createElement('li');li.textContent=runners[h.id].name;const time=document.createElement('span');time.textContent=h.finish!==null?`${h.finish.toFixed(3)}초`:'경주 종료';li.append(time);$('finishList').append(li)});
  $('racePhase').textContent='경주 종료';$('leaderText').textContent=`${runners[winner].name} ${winMode==='first'?'첫 도착':'마지막 도착'} 우승!`;$('againBtn').hidden=false;$('pauseBtn').disabled=true;lockSettings(false);confettiAt=performance.now();
}
function renderSettings(){
  $('runnerList').replaceChildren();$('runnerCount').textContent=`${runners.length} / 10`;
  runners.forEach((r,i)=>{
    const row=document.createElement('div');row.className='runner';const num=document.createElement('span');num.className='num';num.textContent=i+1;num.style.color=r.color;
    const name=document.createElement('input');name.value=r.name;name.maxLength=12;name.setAttribute('aria-label',`${i+1}번 말 이름`);name.oninput=()=>{r.name=name.value||`말 ${i+1}`;models[i].label.querySelector('span').textContent=r.name};
    const remove=document.createElement('button');remove.className='remove';remove.textContent='×';remove.setAttribute('aria-label',`${i+1}번 말 삭제`);remove.disabled=runners.length<=2;remove.onclick=()=>{if(state==='running'||state==='countdown'||state==='paused'||runners.length<=2)return;runners.splice(i,1);renderSettings();resetRace()};
    const appearance=document.createElement('div');appearance.className='appearance';const select=document.createElement('select');select.setAttribute('aria-label',`${i+1}번 말 종류`);
    BREEDS.forEach(b=>{const option=document.createElement('option');option.value=b.id;option.textContent=b.name;select.append(option)});select.value=r.breed;select.onchange=()=>{r.breed=select.value;resetRace()};
    const color=document.createElement('input');color.type='color';color.value=r.color;color.setAttribute('aria-label',`${i+1}번 말 색상`);color.onchange=()=>{r.color=color.value;renderSettings();resetRace()};appearance.append(select,color);row.append(num,name,remove,appearance);$('runnerList').append(row);
  });$('addBtn').disabled=runners.length>=10;
}
function projectLabel(el,x,y,z){const p=new THREE.Vector3(x,y,z).project(camera);el.style.left=`${(p.x*.5+.5)*innerWidth}px`;el.style.top=`${(-p.y*.5+.5)*innerHeight}px`;el.style.visibility=Math.abs(p.x)>1.08||Math.abs(p.y)>1.1?'hidden':'visible'}
function updateHUD(){
  if(!engine)return;const order=engine.ranking();$('clock').textContent=engine.time.toFixed(1).padStart(4,'0');$('progressFill').style.width=`${Math.max(...engine.horses.map(h=>h.x))/engine.distance*100}%`;
  if(state==='running'){$('racePhase').textContent=order[0].x>206?'마지막 직선!':'순위 뒤집는 중';$('leaderText').textContent=`선두 ${runners[order[0].id].name} · 선두 교체 ${engine.leaderChanges}회`}
  order.forEach((h,rank)=>{const m=models[h.id];m.rankEl.textContent=`${rank+1}위`;m.noteEl.textContent=h.finish!==null?'도착':h.effect?HORSE_EVENTS.find(e=>e.id===h.effect).name:h.pegasus?'페가수스':'';m.label.classList.toggle('lead',rank===0);m.label.classList.toggle('last',rank===runners.length-1)});
  while(noticeIndex<engine.notices.length){const notice=engine.notices[noticeIndex++],m=models[notice.target],event=HORSE_EVENTS.find(e=>e.id===notice.type);m.bubble.textContent=notice.text;m.bubble.style.setProperty('--event',event.color);m.bubble.hidden=false;m.bubbleUntil=engine.time+1.6;$('eventToast').textContent=`${runners[notice.target].name} · ${notice.text}`;$('eventToast').classList.add('visible');toastUntil=performance.now()+1800}
}
let confettiAt=0,confetti=[];
function init(){
  scene=new THREE.Scene();scene.background=skyTexture();scene.fog=new THREE.Fog(0xc9e7e9,115,230);
  renderer=new THREE.WebGLRenderer({canvas:$('race3d'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  camera=new THREE.OrthographicCamera(-40,40,25,-25,.1,280);scene.add(camera);
  scene.add(new THREE.HemisphereLight(0xfff5de,0x84a3ba,2.3));const sunlight=new THREE.DirectionalLight(0xffefce,2.8);sunlight.position.set(18,35,25);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);sunlight.shadow.camera.left=-35;sunlight.shadow.camera.right=35;sunlight.shadow.camera.top=40;sunlight.shadow.camera.bottom=-40;sunlight.shadow.bias=-.001;sunlight.shadow.normalBias=.08;scene.add(sunlight,sunlight.target);scene.userData.sunlight=sunlight;
  buildScenery();for(let j=0;j<60;j++){const c=box(scene,mat([0xffdc8b,0xffa3c5,0x88d5e5,0xd9c3ff][j%4]),0,0,0,.11,.2,.035);c.visible=false;confetti.push(c)}
  resize();addEventListener('resize',resize);resetRace();requestAnimationFrame(animate);
}
function resize(){renderer.setSize(innerWidth,innerHeight,false)}
function animate(now){
  requestAnimationFrame(animate);const dt=lastFrame?Math.min((now-lastFrame)/1000,.1):0;lastFrame=now;
  if(state==='paused'){renderer.render(scene,camera);return}
  if(state==='countdown'){const elapsed=(now-countdownAt)/1000;$('countdown').textContent=elapsed>=2.6?'출발!':String(Math.max(1,3-Math.floor(elapsed)));if(elapsed>=3){state='running';$('countdown').hidden=true}}
  if(state==='running'){engine.step(dt);if(engine.done)finishRace()}
  const order=engine?engine.ranking():[],active=engine?engine.horses.filter(h=>h.finish===null):[];
  const ranks=new Map(order.map((h,rank)=>[h.id,rank]));
  const tracked=active.length?active:engine?engine.horses:[];
  const min=tracked.length?Math.min(...tracked.map(h=>h.x)):0,max=tracked.length?Math.max(...tracked.map(h=>h.x)):0;
  const center=(min+max)/2+3;
  cameraCenter+=(center-cameraCenter)*(1-Math.exp(-dt*3.6));const aspect=innerWidth/innerHeight;
  const wantedHeight=Math.max(runners.length*6.4+9,(max-min+22)/aspect,innerWidth<760?30:0);cameraHeight+=(wantedHeight-cameraHeight)*(1-Math.exp(-dt*2.5));
  camera.left=-cameraHeight*aspect/2;camera.right=cameraHeight*aspect/2;camera.top=cameraHeight/2;camera.bottom=-cameraHeight/2;camera.updateProjectionMatrix();
  const desiredX=view==='angle'?20:0,desiredY=view==='angle'?8:2.5;
  const current=camera.userData.offset||(camera.userData.offset=new THREE.Vector3(desiredX,desiredY,65));current.x+=(desiredX-current.x)*(1-Math.exp(-dt*5));current.y+=(desiredY-current.y)*(1-Math.exp(-dt*5));
  const shift=panelOpen&&innerWidth>760?-cameraHeight*aspect*.08:0;
  camera.position.set(cameraCenter+shift+current.x,1.5+current.y,65);camera.lookAt(cameraCenter+shift,1.5,0);camera.updateMatrixWorld();
  const light=scene.userData.sunlight;light.position.x=cameraCenter+18;light.target.position.x=cameraCenter;light.target.updateMatrixWorld();
  if(now-uiAt>80){updateHUD();uiAt=now}
  models.forEach((m,i)=>{
    const h=engine?.horses[i],time=engine?.time||0,effect=h?.effect,boost=effect==='boost',fall=effect==='banana',air=h&&h.flightUntil>time,blocked=h&&(h.stunUntil>time||fall),running=state==='running'&&h.finish===null;
    if(h){const rank=ranks.get(i),lastMode=engine.mode==='last';setExpression(m,state==='finished'&&engine.winner===i?'happy':rank===0?(lastMode?'sad':'happy'):rank===runners.length-1?(lastMode?'happy':'sad'):fall?'shock':'normal')}
    if(h)updateTransformation(m,h);m.root.position.x=(h?.x||0)-m.noseOffset;
    const cadence=boost?47:effect==='carrot'?22:running?13:2.2,phase=time*cadence+i*.9;
    m.legs.forEach((leg,j)=>{leg.rotation.z=running&&!blocked&&!air?Math.sin(phase+(j===0||j===3?0:Math.PI))*(boost?1.1:.65):0});
    let roll=0,bounce=running&&!blocked?Math.abs(Math.sin(phase*2))*.095:0;
    if(fall){const f=(time-h.fallStart)/.85;roll=f<.2?Math.PI*(f/.2):f<.65?Math.PI:Math.PI*(1-(f-.65)/.35);bounce=.1+Math.sin(roll/2)*.55}
    if(air){const duration=effect==='spring'?.8:.65;bounce+=Math.sin(Math.min(1,(time-h.flightStart)/duration)*Math.PI)*2.5}
    m.h.rotation.x=roll;m.h.rotation.z=effect==='wind'?Math.sin(time*26)*.18:0;m.h.rotation.y=effect==='wind'?Math.sin(time*18)*.42:0;
    m.root.position.y=laneY(i)+1.65+bounce;m.head.rotation.z=running?Math.sin(phase)*.035:Math.sin(now*.002+i)*.025;
    m.tail.rotation.x=Math.sin(now*.008+i)*.15;m.wheels.visible=boost&&running;m.wheels.children.forEach(o=>{o.rotation.z=time*45});m.trails.visible=running&&(boost||effect==='carrot');m.trails.scale.x=boost?1.3:.7;
    m.splashes.visible=effect==='puddle';m.splashes.children.forEach((drop,j)=>{const f=(time*3+j*.13)%1;drop.position.set(-1.2-f*1.5,-.8+Math.sin(f*Math.PI)*1.1,Math.sin(j*3)*(f+.2));drop.scale.setScalar(1-f*.7)});
    m.swirl.visible=effect==='wind';m.swirl.rotation.y=time*12;m.mudFeet.visible=effect==='mud';
    m.sparkle.visible=effect==='carrot'||h?.unicornUntil>time;m.sparkle.rotation.y=time*4;
    m.wings.forEach((wing,j)=>{wing.rotation.x=(j===0?-1:1)*(air?.5+Math.sin(time*25)*.55:.12+Math.sin(now*.003)*.1)});
    if(state==='finished'&&engine.winner===i)m.root.position.y+=Math.abs(Math.sin(now*.005))*.2;
    projectLabel(m.label,m.root.position.x+.2,m.root.position.y+2.9,0);
    if(!m.bubble.hidden){if(time>m.bubbleUntil)m.bubble.hidden=true;else projectLabel(m.bubble,m.root.position.x,m.root.position.y+4.35,0)}
  });
  if(engine)engine.items.forEach((item,index)=>{
    let g=itemMeshes.get(index);if(!g){g=itemModel(item.type);itemGroup.add(g);itemMeshes.set(index,g)}g.visible=!item.hit;
    if(g.visible){g.position.set(item.x,laneY(item.target)+(item.chase?2.1:.45),0);if(!['rock','banana','mud','puddle'].includes(item.type))g.rotation.y=now*.0016;g.scale.setScalar(item.chase?1:.9);}
  });
  if(toastUntil<now)$('eventToast').classList.remove('visible');
  confetti.forEach((c,j)=>{const t=(now-confettiAt)/1000;c.visible=state==='finished'&&t<3.5;if(c.visible){const winner=models[engine.winner];c.position.set(winner.root.position.x+Math.sin(j*4.2)*(2+t*2),winner.root.position.y+5+(j%7)*.45-t*2,.6+Math.cos(j)*2);c.rotation.set(t+j,t*2+j,t*3)}});
  renderer.render(scene,camera);
}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(state==='running'||state==='countdown'||state==='paused')return;winMode=b.dataset.mode;try{localStorage.setItem('horse-race-win-mode',winMode)}catch{}updateRule()});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$('quickView').onclick=()=>setView(view==='angle'?'side':'angle');$('settingsToggle').onclick=()=>setPanel(!panelOpen);
$('startBtn').onclick=startRace;$('replayBtn').onclick=startRace;$('againBtn').onclick=startRace;$('pauseBtn').onclick=togglePause;
$('editBtn').onclick=()=>{resetRace();setPanel(true)};
$('resetBtn').onclick=()=>{runners=DEFAULTS.map(r=>({...r}));renderSettings();resetRace()};
$('addBtn').onclick=()=>{if(runners.length>=10||state==='running'||state==='countdown'||state==='paused')return;const i=runners.length;runners.push({name:`말 ${i+1}`,breed:BREEDS[i%BREEDS.length].id,color:['#9dbfb0','#b9a3cb','#c8a282','#eeaeae','#94bbdb'][i%5]});renderSettings();resetRace()};
HORSE_EVENTS.forEach(e=>{const span=document.createElement('span');span.textContent=e.name;span.style.setProperty('--event',e.color);$('eventLegend').append(span)});
renderSettings();updateRule();init();
