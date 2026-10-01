(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  function fail(message){$('#error').style.display='block';$('#error').textContent=message;}
  if(!window.THREE){fail('3D 엔진을 읽지 못했습니다. index.html, game.js, three.min.js를 같은 폴더에 두고 다시 열어주세요.');return;}
  const T=THREE, scene=new T.Scene();
  scene.background=new T.Color('#a1c6ca');scene.fog=new T.FogExp2('#a1c6ca',.012);
  let renderer;
  try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){fail('WebGL을 시작할 수 없습니다. Chrome 또는 Edge에서 이 파일을 열어주세요.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  document.body.prepend(renderer.domElement);
  const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,240);
  scene.add(new T.HemisphereLight('#c3e4ff','#557044',2.3));
  const sun=new T.DirectionalLight('#ffdfac',3.4);sun.position.set(-18,36,16);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:100});
  sun.shadow.normalBias=.05;sun.shadow.bias=-.00015;scene.add(sun);
  const mat=(color,roughness=.85,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const grass=mat('#609277'),sand=mat('#d5c492'),rockMat=mat('#7d9690'),trunk=mat('#806454'),leaf=mat('#386e62');
  const mapRadius=178,mapScale=76/180,treeColliders=[];
  let glideMode=false,gliding=false;
  let travelling=false,travelRegion=null,travelAltitude=35,travelVisibility=null;
  function groundAt(x,z){
    if(travelling)return travelRegion.ground(x,z);
    if(Math.abs(x)<=12&&z<=-148&&z>=-172)return 12;
    if(Math.abs(x)<=6&&z<=-100&&z>-148)return Math.min(12,(Math.floor((-100-z)/2)+1)*.5);
    return 0;
  }
  function resolveTrees(position,radius=.7,height=2){
    for(let pass=0;pass<5;pass++)for(const tree of (travelling?travelRegion.trees:treeColliders)){
      if(position.y>tree.top||position.y+height<tree.bottom)continue;
      const dx=position.x-tree.x,dz=position.z-tree.z,d=Math.hypot(dx,dz),clearance=tree.radius+radius;
      if(d<clearance){const nx=d>1e-6?dx/d:1,nz=d>1e-6?dz/d:0;position.x=tree.x+nx*(clearance+.001);position.z=tree.z+nz*(clearance+.001);}
    }
  }
  function moveThroughTrees(position,delta,radius,height){
    const steps=Math.max(1,Math.ceil(delta.length()/.2));
    for(let i=0;i<steps;i++){const previous=position.clone(),oldGround=groundAt(position.x,position.z);position.addScaledVector(delta,1/steps);
      const nextGround=groundAt(position.x,position.z);
      if(nextGround>Math.max(oldGround+.51,position.y))position.copy(previous);
      else if(position.y<=oldGround+.6&&!(travelling&&glideMode&&nextGround<oldGround-.6))position.y=nextGround+.18;
      resolveTrees(position,radius,height);}
  }
  const jade=mat('#329d91',.42,.12),jadeLight=mat('#68c8ae',.4),belly=mat('#e0d5a1',.7),horn=mat('#fff0ca',.45);
  const dark=mat('#10272c',.22),iris=mat('#ffbc56',.25),wingMat=mat('#317c87',.55);
  wingMat.side=T.DoubleSide;
  function mesh(geo,material,parent,pos=[0,0,0],scale=[1,1,1]){
    const m=new T.Mesh(geo,material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  const ball=new T.SphereGeometry(1,24,16),rough=new T.IcosahedronGeometry(1,1),cone=new T.ConeGeometry(1,1,12);
  function orb(parent,material,pos,scale){return mesh(ball,material,parent,pos,scale);}
  function rod(parent,a,b,r,material,r2=r){
    const v=new T.Vector3(...a),w=new T.Vector3(...b),d=w.clone().sub(v);
    const m=mesh(new T.CylinderGeometry(r2,r,d.length(),9),material,parent);m.position.copy(v.add(w).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;
  }
  let seed=493;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  // A sculpted island with a shallow beach and distant mountain silhouettes.
  mesh(new T.CylinderGeometry(180,182,3,96),sand,scene,[0,-1.55,0]);
  mesh(new T.CylinderGeometry(179,180,1.1,96),grass,scene,[0,-.58,0]);
  const water=new T.Mesh(new T.PlaneGeometry(900,900,110,110),new T.MeshStandardMaterial({color:'#3899ab',roughness:.24,metalness:.4,transparent:true,opacity:.9}));
  water.rotation.x=-Math.PI/2;water.position.y=-1.15;water.receiveShadow=true;scene.add(water);
  const waterBase=water.geometry.attributes.position.array.slice();
  const foamMat=new T.MeshBasicMaterial({color:'#d1fff0',transparent:true,opacity:.23,side:T.DoubleSide});
  for(let i=0;i<3;i++){const ring=mesh(new T.RingGeometry(180.5+i*.9,180.65+i*.9,100),foamMat,scene,[0,-1.02,0]);ring.rotation.x=-Math.PI/2;}
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=230+random()*50;mesh(cone,mat(i%2?'#809da2':'#94adb0'),scene,[Math.cos(a)*r,-3,Math.sin(a)*r],[8+random()*11,15+random()*24,9+random()*11]);}
  for(let i=0;i<520;i++){
    const a=random()*Math.PI*2,r=7+random()*168,x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(Math.hypot(x-43,z-34)<15||Math.hypot(x,z-7)<7||Math.abs(x)<4||(z>3&&Math.abs(x)<15))continue;
    if([[-35,-20],[40,-35],[-95,15],[100,45],[-65,-115],[75,-125]].some(([nx,nz])=>Math.hypot(x-nx,z-nz)<5))continue;
    if(treeColliders.some(c=>Math.hypot(c.x-x,c.z-z)<4.5))continue;
    if(i%3===0){mesh(rough,rockMat,scene,[x,.35,z],[.6+random()*1.4,.4+random(),.7+random()]);continue;}
    const h=2.1+random()*3,tree=new T.Group();tree.position.set(x,0,z);scene.add(tree);
    mesh(new T.CylinderGeometry(.14,.32,h,9),trunk,tree,[0,h/2,0]);
    orb(tree,leaf,[0,h,0],[1.3,h*.6,1.3]);orb(tree,mat(i%2?'#51927a':'#73a388'),[.55,h+.6,.1],[1.05,1.3,1.05]);
    treeColliders.push({x,z,radius:.34,bottom:0,top:h},{x,z,radius:1.4,bottom:h*.4,top:Math.max(h*1.6,h+1.9)});
  }
  const cloudMat=new T.MeshStandardMaterial({color:'#fff8e8',roughness:1,transparent:true,opacity:.87});
  for(let i=0;i<9;i++){const cloud=new T.Group();cloud.position.set((random()-.5)*130,25+random()*12,-25-random()*55);scene.add(cloud);for(let j=0;j<5;j++){const puff=orb(cloud,cloudMat,[j*2.1,Math.sin(j)*.7,0],[2.6,1.1+random(),1.8]);puff.castShadow=false;}}
  const blades=new T.InstancedMesh(new T.ConeGeometry(.09,.48,3),mat('#6fa581'),1700);
  const transform=new T.Object3D();let bladeCount=0;
  for(let i=0;i<1700;i++){const a=random()*6.283,r=Math.sqrt(random())*73,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.hypot(x-43,z-34)<14||Math.hypot(x,z-7)<4.6||Math.abs(x)<1.8)continue;transform.position.set(x,.16,z);transform.rotation.set((random()-.5)*.3,random()*6.28,(random()-.5)*.3);transform.scale.setScalar(.55+random());transform.updateMatrix();blades.setMatrixAt(bladeCount,transform.matrix);blades.setColorAt(bladeCount,new T.Color().setHSL(.36+random()*.04,.22+random()*.2,.35+random()*.2));bladeCount++;}
  blades.count=bladeCount;blades.receiveShadow=true;scene.add(blades);
  for(let i=0;i<16;i++){const z=2-i*1.15;const stone=mesh(new T.CylinderGeometry(.7+random()*.2,.9,.07,7),mat(i%2?'#9fb09a':'#b9bba3'),scene,[(random()-.5)*.6,.035,z],[1,1,.7]);stone.rotation.y=random();}
  const motesGeometry=new T.BufferGeometry(),motes=[];
  for(let i=0;i<100;i++)motes.push((random()-.5)*48,.6+random()*5,(random()-.5)*48);
  motesGeometry.setAttribute('position',new T.Float32BufferAttribute(motes,3));
  const motesMesh=new T.Points(motesGeometry,new T.PointsMaterial({color:'#ffe7a3',size:.065,transparent:true,opacity:.65}));scene.add(motesMesh);
  const flowerMats=['#eab986','#ddd6ff','#f3e5bc'].map(c=>mat(c));
  for(let i=0;i<230;i++){const a=random()*6.28,r=5+random()*165;const x=Math.cos(a)*r,z=Math.sin(a)*r;mesh(cone,i%5===0?flowerMats[i%3]:grass,scene,[x,.15,z],[.08,.35+random()*.35,.08]);}
  // Ancient stone arch, glowing crystal shrine and circular home platform.
  const ruin=mat('#adb5a0');for(const side of [-1,1]){mesh(new T.BoxGeometry(1.3,6,1.5),ruin,scene,[side*3.4,3,-18]);mesh(new T.BoxGeometry(1.8,.4,2),ruin,scene,[side*3.4,6,-18]);}
  mesh(new T.BoxGeometry(8.6,1,1.6),ruin,scene,[0,6.5,-18]);
  const crystalMat=new T.MeshStandardMaterial({color:'#77f8e2',emissive:'#2be8c7',emissiveIntensity:1.8,metalness:.35,roughness:.18});
  const crystal=mesh(new T.OctahedronGeometry(1.15),crystalMat,scene,[0,2,-18],[1,1.8,1]);
  const shrineLight=new T.PointLight('#62ffd5',10,14);shrineLight.position.set(0,3,-18);scene.add(shrineLight);
  mesh(new T.CylinderGeometry(4,4.3,.24,64),mat('#a8b9a0'),scene,[0,.05,7]);
  const homeRing=mesh(new T.TorusGeometry(3.4,.05,8,80),mat('#e3cf8c',.35,.5),scene,[0,.2,7]);homeRing.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;mesh(rough,rockMat,scene,[Math.cos(a)*4,.2,7+Math.sin(a)*4],[.4,.35,.4]);}
  // Each world owns its terrain and collision shapes; player and collection travel together.
  const worldOneObjects=scene.children.filter(o=>!o.isLight&&o!==water);
  const worldOneColliders=treeColliders.slice();
  const worldTwo=new T.Group();scene.add(worldTwo);worldTwo.visible=false;
  const worldTwoColliders=[];
  const basalt=mat('#40364e',.8),ash=mat('#685469'),lava=new T.MeshStandardMaterial({color:'#ff793d',emissive:'#ff3b0b',emissiveIntensity:1.4,roughness:.4});
  mesh(new T.CylinderGeometry(180,183,4,96),basalt,worldTwo,[0,-2.1,0]);
  mesh(new T.CylinderGeometry(179,180,.3,96),ash,worldTwo,[0,-.2,0]);
  for(let i=0;i<160;i++){
    const a=random()*6.28,r=12+random()*156,x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(Math.hypot(x-43,z-34)<16||Math.abs(x)<5||Math.hypot(x,z-7)<8)continue;
    if([[-35,-20],[40,-35],[-95,15],[100,45],[-65,-115],[75,-125]].some(([nx,nz])=>Math.hypot(x-nx,z-nz)<6))continue;
    const h=2+random()*5;
    const pillar=mesh(new T.CylinderGeometry(.5,1,h,6),basalt,worldTwo,[x,h/2,z]);pillar.rotation.y=a;
    mesh(new T.OctahedronGeometry(.65),lava,worldTwo,[x,h+.3,z],[1,1.8,1]);
    worldTwoColliders.push({x,z,radius:1.1,bottom:0,top:h+1.5});
  }
  for(let i=0;i<7;i++){
    const a=i*6.28/7,r=165;
    mesh(new T.ConeGeometry(7,13,7),basalt,worldTwo,[Math.cos(a)*r,4,Math.sin(a)*r]);
    mesh(new T.TorusGeometry(2,.3,8,32),lava,worldTwo,[Math.cos(a)*r,9,Math.sin(a)*r]).rotation.x=Math.PI/2;
    worldTwoColliders.push({x:Math.cos(a)*r,z:Math.sin(a)*r,radius:7,bottom:0,top:11});
  }
  mesh(new T.CylinderGeometry(4,4.3,.25,64),mat('#91798e'),worldTwo,[0,.05,7]);
  mesh(new T.TorusGeometry(3.4,.08,8,64),lava,worldTwo,[0,.23,7]).rotation.x=Math.PI/2;
  mesh(new T.BoxGeometry(9,1,2),basalt,worldTwo,[0,7,-24]);
  for(const x of [-4,4])mesh(new T.BoxGeometry(1.5,7,2),basalt,worldTwo,[x,3.5,-24]);
  const worldPortal=mesh(new T.TorusGeometry(2.5,.15,10,64),lava,worldTwo,[0,3.5,-24]);
  const worldThree=new T.Group();scene.add(worldThree);worldThree.visible=false;
  const worldThreeColliders=[];
  const ice=mat('#b6e5ef'),frozenCrystal=mat('#7d9df5');
  mesh(new T.CylinderGeometry(180,183,4,96),ice,worldThree,[0,-2.1,0]);
  for(let i=0;i<52;i++){
    const a=i*2.39996,r=28+(i%8)*19,x=Math.cos(a)*r,z=Math.sin(a)*r,h=4+i%6;
    if([[-35,-20],[40,-35],[-95,15],[100,45],[-65,-115],[75,-125]].some(([nx,nz])=>Math.hypot(x-nx,z-nz)<10))continue;
    mesh(new T.OctahedronGeometry(1),frozenCrystal,worldThree,[x,h/2,z],[1.4,h/2,1.4]);
    worldThreeColliders.push({x,z,radius:1.5,bottom:0,top:h});
  }
  mesh(new T.CylinderGeometry(4,4.3,.25,64),ice,worldThree,[0,.05,7]);
  mesh(new T.TorusGeometry(3.4,.08,8,64),frozenCrystal,worldThree,[0,.23,7]).rotation.x=Math.PI/2;
  const extraWorlds=[],extraColliders=[];
  for(let w=4;w<=10;w++){
    const group=new T.Group(),colliders=[];scene.add(group);group.visible=false;
    const ground=mat(['#d9bf85','#463c73','#21586b','#424f37','#aa7193','#302a40','#5e3024'][w-4]),accent=mat(['#ffe29c','#d3a0ff','#7aeaff','#b4ef73','#ffcff1','#ad89ff','#ffbd55'][w-4]);
    mesh(new T.CylinderGeometry(180,183,4,96),ground,group,[0,-2.1,0]);
    for(let i=0;i<48;i++){
      const a=i*2.39996,r=29+i%8*19,x=Math.cos(a)*r,z=Math.sin(a)*r,h=4+i%7;
      if(Math.hypot(x-43,z-34)<15||[[-35,-20],[40,-35],[-95,15],[100,45],[-65,-115],[75,-125]].some(([nx,nz])=>Math.hypot(x-nx,z-nz)<10))continue;
      if(w%2===0){
        mesh(new T.CylinderGeometry(1,1.3,h,8),ground,group,[x,h/2,z]);
        mesh(new T.BoxGeometry(3,1,3),accent,group,[x,h,z]);
      }else{
        mesh(new T.OctahedronGeometry(1),accent,group,[x,h/2,z],[1.5,h/2,1.5]);
        mesh(new T.TorusGeometry(2,.12,8,24),accent,group,[x,h+1,z]);
      }
      colliders.push({x,z,radius:w===4?1.8:1.6,bottom:0,top:h+3});
    }
    mesh(new T.CylinderGeometry(4,4.3,.25,64),accent,group,[0,.05,7]);
    mesh(new T.TorusGeometry(3.4,.08,8,64),accent,group,[0,.23,7]).rotation.x=Math.PI/2;
    extraWorlds.push(group);extraColliders.push(colliders);
  }
  const worldTitles=['용의 계곡','잿불 화산','극천 빙하','황금 사막','별빛 차원','심해 유적','고대 정글','벚꽃 천계','혼돈 심연','용왕의 불꽃 성역'];
  const worldRequirements=[1,15,30,45,60,75,90,105,120,135];
  // Keep the northern approach free of scenery and collision obstacles.
  for(const objects of [worldOneObjects,[worldTwo],[worldThree],...extraWorlds.map(g=>[g])]){
    for(const object of objects){
      if(Math.abs(object.position.x)<18&&object.position.z<-92&&object.position.z>-178){object.userData.summitHidden=true;object.visible=false;}
      object.traverse(o=>{
      if(o.isMesh&&Math.abs(o.position.x)<16&&o.position.z<-95&&o.position.z>-176)o.visible=false;
    });}
  }
  for(const list of [worldOneColliders,worldTwoColliders,worldThreeColliders,...extraColliders]){
    for(let i=list.length-1;i>=0;i--)if(Math.abs(list[i].x)<18&&list[i].z<-92&&list[i].z>-178)list.splice(i,1);
  }
  const summit=new T.Group();scene.add(summit);
  const summitStone=mat('#a9afbd'),summitTrim=mat('#ffe2a0');
  for(let i=0;i<24;i++){
    const h=(i+1)*.5;
    mesh(new T.BoxGeometry(12,h,2),summitStone,summit,[0,h/2,-101-i*2]);
    mesh(new T.BoxGeometry(12,.05,.15),summitTrim,summit,[0,h+.025,-100-i*2]);
  }
  mesh(new T.BoxGeometry(24,12,24),summitStone,summit,[0,6,-160]);
  let currentWorld=1;
  // Fully volumetric dragon: articulated limbs, curved tail, eyes and wing membranes.
  const dragon=new T.Group();scene.add(dragon);dragon.position.set(0,.2,7);
  const body=new T.Group();dragon.add(body);
  orb(body,jade,[0,1.25,0],[.78,.83,1.22]);orb(body,belly,[0,1.12,-.65],[.61,.65,.65]);
  orb(body,jadeLight,[0,1.95,-.7],[.49,.75,.5]);
  const head=new T.Group();head.position.set(0,2.55,-1);body.add(head);
  orb(head,jadeLight,[0,0,0],[.67,.59,.67]);orb(head,jadeLight,[0,-.2,-.56],[.53,.32,.55]);orb(head,belly,[0,-.38,-.45],[.45,.12,.53]);
  const faceParts=head.children.slice(0,3),roundFaceGeometry=faceParts.map(part=>part.geometry);
  const angularFaceGeometry=[new T.IcosahedronGeometry(1.13,0),new T.BoxGeometry(1.65,1.65,1.8),new T.BoxGeometry(1.8,1.65,1.8)];
  const angularBrows=new T.Group();head.add(angularBrows);angularBrows.visible=false;
  for(const side of [-1,1]){
    const brow=mesh(new T.BoxGeometry(.44,.12,.26),jade,angularBrows,[side*.48,.3,-.4]);brow.rotation.z=side*.22;
  }
  for(const s of [-1,1]){
    orb(head,horn,[s*.49,.08,-.34],[.24,.27,.21]);orb(head,iris,[s*.56,.09,-.45],[.14,.18,.12]);orb(head,dark,[s*.59,.1,-.52],[.06,.12,.04]);orb(head,horn,[s*.59,.17,-.55],[.035,.038,.025]);
    orb(head,dark,[s*.25,-.08,-1.02],[.065,.045,.024]);
    rod(head,[s*.43,.35,.12],[s*.6,1.03,.4],.15,horn,.015);
    const ear=mesh(cone,jade,head,[s*.75,.17,.23],[.23,.6,.32]);ear.rotation.z=-s*.9;
  }
  const feet=[];
  for(const s of [-1,1])for(const z of [-.65,.65]){
    const leg=new T.Group();leg.position.set(s*.57,.94,z);body.add(leg);feet.push(leg);
    orb(leg,jade,[s*.13,-.28,0],[.28,.47,.32]);orb(leg,jadeLight,[s*.14,-.67,-.17],[.28,.19,.4]);
    for(let j=0;j<3;j++)orb(leg,horn,[s*.14+(j-1)*.15,-.66,-.49],[.056,.062,.14]);
  }
  const tail=new T.Group();tail.position.set(0,1.2,.85);body.add(tail);
  const tailPoints=[new T.Vector3(0,0,0),new T.Vector3(.1,-.15,.9),new T.Vector3(.55,-.27,1.8),new T.Vector3(.8,.1,2.7)];
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(tailPoints),24,.17,9,false),jade,tail);
  mesh(new T.ConeGeometry(.27,.75,4),jadeLight,tail,[.8,.2,2.65]).rotation.x=.7;
  for(let i=0;i<6;i++)mesh(cone,horn,body,[0,2.04-i*.06,-.3+i*.27],[.12,.3,.16]);
  const wings=[];
  for(const s of [-1,1]){
    const w=new T.Group();w.position.set(s*.55,1.85,.1);body.add(w);wings.push(w);
    const vertices=[0,0,0,s*.9,1.1,.25,s*2.8,.65,.7,s*1.95,.1,1.12,s*1.55,-.25,.87,s*.9,-.4,1.1,0,-.12,.7];
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex([0,1,2,0,2,3,0,3,4,0,4,5,0,5,6]);g.computeVertexNormals();mesh(g,wingMat,w);
    rod(w,[0,0,0],[s*.9,1.1,.25],.09,jadeLight,.07);rod(w,[s*.9,1.1,.25],[s*2.8,.65,.7],.065,jadeLight,.015);
    for(const p of [[s*1.95,.1,1.12],[s*.9,-.4,1.1]])rod(w,[s*.9,1.1,.25],p,.035,jadeLight,.015);
    orb(w,horn,[s*.9,1.15,.25],[.08,.17,.08]);
  }
  const glideMembranes=new T.Group();body.add(glideMembranes);glideMembranes.visible=false;
  const glideMaterial=new T.MeshStandardMaterial({color:'#efa85e',side:T.DoubleSide,roughness:.8,transparent:true,opacity:.9});
  for(const side of [-1,1]){
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute([side*.5,1.25,-.9,side*1.65,1.05,-1.05,side*1.9,.9,.1,side*1.6,.85,1.35,side*.5,1.2,.9],3));
    geometry.setIndex([0,1,2,0,2,4,2,3,4]);geometry.computeVertexNormals();mesh(geometry,glideMaterial,glideMembranes);
  }
  const fruitMat=new T.MeshStandardMaterial({color:'#ffc267',emissive:'#ff9633',emissiveIntensity:.45,roughness:.3});
  const fruits=[];
  const tailFlame=new T.Group();tailFlame.visible=false;tail.add(tailFlame);tailFlame.position.set(.8,.25,2.7);
  mesh(new T.SphereGeometry(.4,12,8),new T.MeshBasicMaterial({color:'#ff5b19'}),tailFlame,[0,.3,0],[.8,1.8,.8]);
  mesh(new T.ConeGeometry(.23,.95,12),new T.MeshBasicMaterial({color:'#ffe56b'}),tailFlame,[0,.6,-.05]);
  const fruitMaterials=window.fruitRules.types.map(t=>new T.MeshStandardMaterial({color:t.color,emissive:t.color,emissiveIntensity:.25,roughness:.35}));
  function addFruit(x,z){const group=new T.Group();group.position.set(x,.8,z);scene.add(group);orb(group,fruitMat,[0,0,0],[.28,.34,.28]);rod(group,[0,.28,0],[.05,.48,0],.035,trunk);
    const l=orb(group,jadeLight,[.16,.38,0],[.2,.05,.08]);l.rotation.z=.4;
    const extras=[orb(group,fruitMat,[-.4,-.1,0],[.22,.28,.22]),orb(group,fruitMat,[.4,-.1,0],[.22,.28,.22])];extras.forEach(o=>o.visible=false);
    fruits.push({group,extras,base:new T.Vector3(x,.8,z),respawn:0,tier:0,count:1});}
  [[0,3],[1,1],[-1,-1],[0,-4],[2,-7],[6,3],[-6,2],[7,-5],[-7,-7],[4,12],[-5,13],[12,5],[-12,3],[10,-12],[-11,-13],[0,-12],[15,12],[-16,10]].forEach(p=>addFruit(...p));
  for(let i=0;i<140;i++){const angle=i*Math.PI*2/140,r=25+random()*145,x=Math.cos(angle)*r,z=Math.sin(angle)*r;if(!treeColliders.some(c=>Math.hypot(c.x-x,c.z-z)<3))addFruit(x,z);}
  const fireBalls=[],fireGeo=new T.SphereGeometry(.17,8,6),fireMat=new T.MeshBasicMaterial({color:'#ffb34b'});
  const keys={},clock=new T.Clock();let playing=false,level=0,xp=0,food=0,total=0,flying=false,yaw=.35,pitch=.42,distance=11,dragging=false,previousX=0,previousY=0,cooldown=0;
  let fruitBag=Array(window.fruitRules.types.length).fill(0);
  const MAX_LEVEL=134; // Internal 0..59 corresponds to displayed Lv.1..60.
  const needs=[5,8,12,14,16,18,20,22,24,26,28,30,32,35,...Array.from({length:120},(_,i)=>38+i*3)];
  const names=['새끼 드래곤','숲의 비룡','폭풍 드래곤','고대 수호룡','불꽃 수호룡','서리 비룡','번개 비룡','수정 드래곤','달빛 드래곤','태양 드래곤','별빛 수호룡','천공 드래곤','영원의 수호룡','전설의 드래곤','태초의 용왕'];
  names.push('용암 비룡','화산 수호룡','홍련 드래곤','태양핵 드래곤','불사조 용왕','빙하 비룡','눈꽃 수호룡','오로라 드래곤','빙정 드래곤','극광 용왕','혜성 수호룡','은하 드래곤','천공 용왕','영원의 용왕','극천의 용왕');
  names.push(...Array.from({length:30},(_,i)=>(i<15?'황금 사막':'별빛 차원')+' 용왕 '+(i%15+1)+'단계'));
  names.push(...Array.from({length:75},(_,i)=>worldTitles[5+Math.floor(i/15)]+' 용왕 '+(i%15+1)+'단계'));names[MAX_LEVEL]='리자몽';
  const colors=['#329d91','#319fa9','#6973bf','#d68b48','#df7757','#82cbdc','#ccb353','#9872c6','#a7b9df','#eeb14e','#738dc9','#5ebaca','#a879bb','#e8c77a','#ffdc87'];
  function speedMultiplier(){return 1.4*(1+Math.min(level,3)*.25+Math.max(0,level-3)*.1);}
  function bodyGrowth(){return Math.min(level,3)+Math.max(0,level-3)*.1;}
  try{const save=JSON.parse(localStorage.getItem('ember3d-v1'));if(save){level=Math.min(MAX_LEVEL,Math.max(0,save.level|0));xp=level===MAX_LEVEL?0:Math.min(needs[level]-1,Math.max(0,save.xp|0));food=Math.max(0,save.food|0);total=Math.max(0,save.total|0);}}catch{}
  let paused=false,saveTimer=0,money=0;
  let lastWheelSpin=0,wheelSpinning=false,wheelRotation=0;
  try{const stamp=JSON.parse(localStorage.getItem('ember3d-v1'))?.lastWheelSpin;if(Number.isFinite(stamp)&&stamp>0)lastWheelSpin=stamp;}catch{}
  let redeemedCoupons=[];
  try{
    const saved=JSON.parse(localStorage.getItem('ember3d-v1'));
    if(Array.isArray(saved?.redeemedCoupons))redeemedCoupons=saved.redeemedCoupons.filter(c=>['DRAGON','DRAGON OF LEGENDARY','SPEED UP'].includes(c));
    // One-time recovery for the two fruit coupons reported as incorrectly used.
    if(saved&&saved.fruitCouponRecovery!==1){
      redeemedCoupons=redeemedCoupons.filter(c=>c==='DRAGON');
      localStorage.setItem('ember3d-v1',JSON.stringify({...saved,redeemedCoupons,fruitCouponRecovery:1}));
    }
  }catch{}
  try{const savedMoney=JSON.parse(localStorage.getItem('ember3d-v1'))?.money;if(Number.isFinite(savedMoney))money=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,savedMoney));}catch{}
  const adventure=window.createEggAdventure({T,scene,dragon,toast,random,resolveTrees,mapScale,groundAt});
  try{adventure.restore(JSON.parse(localStorage.getItem('ember3d-v1'))?.eggs);}catch{}
  try{const bag=JSON.parse(localStorage.getItem('ember3d-v1'))?.fruitBag;if(Array.isArray(bag)){fruitBag=bag.slice(0,window.fruitRules.types.length).map(v=>Math.max(0,v|0));while(fruitBag.length<window.fruitRules.types.length)fruitBag.push(0);food=fruitBag.reduce((a,b)=>a+b,0);}else fruitBag=[food,...Array(window.fruitRules.types.length-1).fill(0)];}catch{fruitBag=[food,...Array(window.fruitRules.types.length-1).fill(0)];}
  function rollFruit(item){const drop=window.fruitRules.roll(adventure.harvestPower());item.tier=drop.tier;item.count=drop.count;item.group.children[0].material=fruitMaterials[drop.tier];item.extras.forEach((o,i)=>{o.material=fruitMaterials[drop.tier];o.visible=i<drop.count-1;});}
  fruits.forEach(rollFruit);
  function syncBag(){while(fruitBag.length<window.fruitRules.types.length)fruitBag.push(0);fruitBag[0]=Math.max(0,food-fruitBag.slice(1).reduce((a,b)=>a+b,0));}
  function chosenFruit(){syncBag();for(let i=fruitBag.length-1;i>=0;i--)if(fruitBag[i]>0)return i;return 0;}
  function consumeFruit(tier){fruitBag[tier]--;food--;}
  const arena=window.createArena({T,scene,dragon,toast,reward:n=>{food+=n;ui();},getTeam:()=>adventure.battleTeam()});
  try{arena.restore(JSON.parse(localStorage.getItem("ember3d-v1"))?.arena);}catch{}
  function setWorld(value){
    if(travelling)exitTravel();
    currentWorld=Number.isInteger(value)?Math.max(1,Math.min(10,value)):1;while(level+1<worldRequirements[currentWorld-1])currentWorld--;const second=currentWorld===2,third=currentWorld===3;
    worldOneObjects.forEach(o=>o.visible=currentWorld===1&&!o.userData.summitHidden);worldTwo.visible=second;worldThree.visible=third;extraWorlds.forEach((g,i)=>g.visible=currentWorld===i+4);
    treeColliders.splice(0,treeColliders.length,...(currentWorld>3?extraColliders[currentWorld-4]:third?worldThreeColliders:second?worldTwoColliders:worldOneColliders));
    scene.background.set(['#a1c6ca','#30283f','#323b69','#e5b57d','#171332','#144352','#344b32','#c08eaa','#191424','#5b2319'][currentWorld-1]);scene.fog.color.copy(scene.background);
    water.material.color.set(['#3899ab','#ce502a','#689acb','#bd954f','#6554b8','#146078','#3d7661','#b082ba','#3a275d','#d46b29'][currentWorld-1]);
    sun.color.set(second?'#ffb48a':'#ffdfac');
    $('#worldSwitch').textContent=second?'🌿 세계 1로 돌아가기':'🌋 세계 2로 이동';
    $('#worldName').textContent='세계 '+currentWorld+' · '+worldTitles[currentWorld-1]+' · 배틀 보상 '+currentWorld+'배';
    adventure.setWorld(currentWorld);arena.setWorld(currentWorld);dragon.position.set(0,.2,7);flying=false;ui();
  }
  function save(){syncBag();try{localStorage.setItem('ember3d-v1',JSON.stringify({lastWheelSpin,fruitCouponRecovery:1,redeemedCoupons,money,level,xp,food,fruitBag:[...fruitBag],total,world:currentWorld,eggs:adventure.snapshot(),arena:arena.snapshot()}));}catch{}}
  function toast(t){$('#toast').textContent=t;$('#toast').style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.opacity=0,2600);}
  function ui(){
    syncBag();$('#fruitInventory').textContent=window.fruitRules.types.map((f,i)=>f.name+' '+fruitBag[i]).filter((_,i)=>i<3||fruitBag[i]>0).join(' · ');
    const skill=window.dragonSkill(level);$('#skillName').textContent='SPACE · '+skill.name;$('#skillName').style.color=skill.color;
    $('#skillStats').textContent='피해 '+skill.damage+' · 사거리 '+skill.range+'m'+(skill.next?' · Lv.'+skill.next+' 새 기술 해금':' · 최종 기술');
    const nextWorld=currentWorld%10+1,required=worldRequirements[nextWorld-1];
    $('#worldSwitch').textContent=level+1>=required?'세계 '+nextWorld+'로 이동':'🔒 세계 '+nextWorld+' · Lv.'+required+' 필요 ('+(level+1)+'/'+required+')';
    $('#playerSpeed').textContent='Lv.'+(level+1)+' · 내 속도 '+(4.7*speedMultiplier()).toFixed(1);
    $('#stage').textContent='Lv.'+(level+1)+' / 135 · '+names[level];$('#xp').textContent=level===MAX_LEVEL?'MAX':xp+' / '+needs[level];$('#fill').style.width=(level===MAX_LEVEL?100:xp/needs[level]*100)+'%';$('#food').textContent=food;
    $('#flight').textContent=level?flying?'비행 중':'F로 이륙':'성장 후 해금';
    dragon.scale.setScalar(.85+bodyGrowth()*.24);jade.color.set(level===MAX_LEVEL?'#ef8a32':colors[level%colors.length]);jadeLight.color.set(level===MAX_LEVEL?'#f39a44':'#68c8ae');belly.color.set(level===MAX_LEVEL?'#ffe0a0':'#e0d5a1');wingMat.color.set(level===MAX_LEVEL?'#ed8731':'#317c87');tailFlame.visible=level===MAX_LEVEL;body.rotation.x=level===MAX_LEVEL?-.18:0;
    faceParts.forEach((part,i)=>part.geometry=level===MAX_LEVEL?angularFaceGeometry[i]:roundFaceGeometry[i]);angularBrows.visible=level===MAX_LEVEL;
    if(level===MAX_LEVEL){$('#questTitle').textContent='계곡의 수호자';$('#quest').textContent='최종 성장 완료! 하늘과 섬을 자유롭게 탐험하세요.';}else if(level){$('#questTitle').textContent='더 높은 하늘로';$('#quest').textContent='열매를 모아 E로 먹이면 다음 단계로 성장합니다. F를 눌러 날아보세요.';}
  }
  function feed(){if(!playing||paused)return;if(!food){toast('열매 가까이 가면 자동으로 모아집니다.');return;}if(level===MAX_LEVEL){toast('최종 성장한 수호룡입니다!');return;}const tier=chosenFruit(),fruit=window.fruitRules.types[tier],previous=level;consumeFruit(tier);xp+=fruit.growth;while(level<MAX_LEVEL&&xp>=needs[level]){xp-=needs[level];level++;}if(level===MAX_LEVEL)xp=0;if(level>previous){toast('Lv.'+(level+1)+' '+names[level]+'으로 성장! '+(level===1?'F 비행이 해금되었습니다.':'날개와 몸이 더 커졌습니다.'));}else toast(fruit.name+' 먹기 · 성장 +'+fruit.growth);ui();save();}
  function feedAll(){
    if(!playing||paused)return;
    if(!food){toast('먹을 열매가 없어요. 먼저 열매를 모아주세요.');return;}
    if(level===MAX_LEVEL){toast('최대 레벨입니다! 남은 열매는 펫에게 주세요.');return;}
    syncBag();let eaten=0;
    for(let tier=fruitBag.length-1;tier>=0&&level<MAX_LEVEL;tier--){
      const growth=window.fruitRules.types[tier].growth;
      const remaining=needs.slice(level,MAX_LEVEL).reduce((sum,n)=>sum+n,0)-xp;
      const count=Math.min(fruitBag[tier],Math.ceil(remaining/growth));
      fruitBag[tier]-=count;food-=count;eaten+=count;xp+=count*growth;
      while(level<MAX_LEVEL&&xp>=needs[level]){xp-=needs[level];level++;}
    }
    if(level===MAX_LEVEL)xp=0;
    ui();save();toast('열매 '+eaten+'개 한 번에 먹기! 현재 Lv.'+(level+1)+(level===MAX_LEVEL?' · 최대 레벨! 남은 열매 '+food+'개':''));
  }
  $('#feedAllButton').onclick=feedAll;
  function feedCompanion(){if(!playing||paused||travelling)return;const tier=chosenFruit();if(adventure.feedBaby(food,window.fruitRules.types[tier].growth)){consumeFruit(tier);ui();save();}}
  $('#feedBabyButton').onclick=feedCompanion;
  addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable)return;if(e.code==='KeyB'&&!e.repeat)feedCompanion();});
  const skillMaterials=[0,4,9,14].map(l=>new T.MeshBasicMaterial({color:window.dragonSkill(l).color}));
  function fire(){if(!playing||paused||cooldown>0)return;const skill=window.dragonSkill(level);cooldown=skill.cooldown;dragon.updateMatrixWorld(true);const origin=dragon.localToWorld(new T.Vector3(0,2.6,-2));const dir=new T.Vector3(0,0,-1).applyQuaternion(dragon.quaternion);arena.attack(level);save();
    for(let i=0;i<skill.particles;i++){const f=mesh(fireGeo,skillMaterials[skill.tier],scene);f.position.copy(origin);const vel=dir.clone().multiplyScalar(skill.range*(.8+Math.random()*.3));const spread=2+skill.tier*1.1;vel.x+=(Math.random()-.5)*spread;vel.y=(Math.random()-.3)*spread;vel.z+=(Math.random()-.5)*spread;fireBalls.push({mesh:f,vel,life:.8+Math.random()*.2,power:1+skill.tier*.45});}}
  function toggleFlight(){if(!playing||paused)return;if(arena.isActive()){toast('배틀에서는 지상에서 싸웁니다.');return;}if(adventure.isCarrying()){toast('알을 품고 있을 때는 날 수 없어요. 둥지까지 걸어가세요.');return;}if(travelling){if(gliding){toast('글라이드 모드를 끄면 일반 비행으로 돌아갑니다.');return;}if(flying&&groundAt(dragon.position.x,dragon.position.z)<0){toast('바다에는 착륙할 수 없어요. 섬 위에서 F를 누르세요.');return;}flying=!flying;travelAltitude=Math.max(dragon.position.y,groundAt(dragon.position.x,dragon.position.z)+10);ui();return;}if(!level){toast('첫 번째 성장을 완료하면 비행할 수 있어요.');return;}flying=!flying;ui();toast(flying?'비행 시작! WASD로 하늘을 탐험하세요.':'착륙합니다.');}
  addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable)return;if(paused)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(paused)return;keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyQ'&&playing&&!travelling&&!arena.isActive())adventure.interact(flying);if(e.code==='KeyE')feed();if(e.code==='KeyT'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)&&!e.target?.isContentEditable){e.preventDefault();feedAll();}if(e.code==='Space')fire();if(e.code==='KeyF')toggleFlight();if(e.code==='KeyR'&&playing){if(travelling){gliding=false;glideMode=false;$('#glideToggle').textContent='글라이드 모드: 끔';dragon.position.set(0,35,0);travelAltitude=35;flying=true;return;}if(arena.isActive()){toast('배틀 나가기 버튼을 눌러주세요.');return;}if(adventure.isCarrying()){toast('알을 운반할 때는 직접 둥지로 돌아가세요.');return;}dragon.position.set(0,.2,7);flying=false;ui();}});
  addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);dragging=false;});
  renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;previousX=e.clientX;previousY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;yaw-=(e.clientX-previousX)*.006;pitch=T.MathUtils.clamp(pitch+(e.clientY-previousY)*.003,.14,1.1);previousX=e.clientX;previousY=e.clientY;});
  renderer.domElement.addEventListener('pointerup',()=>dragging=false);
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();distance=T.MathUtils.clamp(distance+e.deltaY*.009,6,22);},{passive:false});
  document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();keys[b.dataset.key]=true;b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.key]=false;});
  $('#feedTouch').onclick=feed;$('#fireTouch').onclick=fire;
  $('#start').onclick=()=>{playing=true;$('#intro').style.display='none';toast('Q 알 가져오기 · C 살금살금 · 흰 원이 내 둥지입니다.');};
  function clearKeys(){Object.keys(keys).forEach(k=>keys[k]=false);}
  $('#restart').onclick=()=>{paused=true;clearKeys();$('#restartModal').hidden=false;};
  $('#cancelRestart').onclick=()=>{paused=false;$('#restartModal').hidden=true;};
  $('#confirmRestart').onclick=()=>{
    arena.reset();adventure.reset();redeemedCoupons=[];money=0;level=xp=food=total=0;fruitBag=Array(window.fruitRules.types.length).fill(0);setWorld(1);flying=false;cooldown=0;yaw=.35;pitch=.42;distance=11;clearKeys();dragon.position.set(0,.2,7);dragon.rotation.set(0,0,0);
    fruits.forEach(f=>{f.respawn=0;rollFruit(f);f.group.visible=true;});fireBalls.forEach(f=>scene.remove(f.mesh));fireBalls.length=0;
    $('#questTitle').textContent='작은 날개의 첫 모험';$('#quest').textContent='열매로 성장하고 수호룡 몰래 알을 가져와 부화시키세요.';
    paused=false;playing=true;$('#restartModal').hidden=true;$('#intro').style.display='none';ui();save();toast('새로운 모험을 시작합니다!');
  };
  $('#collection').onclick=()=>{paused=true;clearKeys();adventure.drawCollection();$('#collectionModal').hidden=false;};
  $('#closeCollection').onclick=()=>{paused=false;$('#collectionModal').hidden=true;};
  const eggTouch=document.createElement('button');eggTouch.textContent='알 Q';eggTouch.onclick=()=>{if(playing&&!paused&&!travelling)adventure.interact(flying);};$('#touch').appendChild(eggTouch);
  const sneakTouch=document.createElement('button');sneakTouch.textContent='살금살금';sneakTouch.onpointerdown=()=>keys.KeyC=true;sneakTouch.onpointerup=sneakTouch.onpointercancel=()=>keys.KeyC=false;$('#touch').appendChild(sneakTouch);
  $('#battleOpen').onclick=()=>{if(!playing||travelling||arena.isActive())return;if(adventure.isCarrying()){toast('알을 먼저 둥지에 가져다 주세요.');return;}paused=true;clearKeys();arena.menu();$('#battleModal').hidden=false;};
  $('#battleCancel').onclick=()=>{paused=false;$('#battleModal').hidden=true;};
  $('#battleStart').onclick=()=>{if(arena.start(Number($('#battleSelect').value),level)){paused=false;flying=false;clearKeys();$('#battleModal').hidden=true;ui();}};
  function shopMenu(){
    $('#shopMoney').textContent='보유 '+Math.floor(money).toLocaleString('ko-KR')+'원 · 초당 수입 '+adventure.incomeRate().toLocaleString('ko-KR')+'원';
    $('#shopItems').innerHTML='';
    window.fruitRules.types.forEach((fruit,tier)=>{
      if(!fruit.price)return;
      const button=document.createElement('button');
      button.textContent=fruit.name+' · 성장 +'+fruit.growth+' · '+fruit.price.toLocaleString('ko-KR')+'원 (보유 '+(fruitBag[tier]||0)+'개)';
      button.disabled=money<fruit.price;button.style.opacity=button.disabled?'.5':'1';
      button.onclick=()=>buyFruit(tier);$('#shopItems').appendChild(button);
    });
  }
  function buyFruit(tier){
    const fruit=window.fruitRules.types[tier];
    if(!playing||$('#shopModal').hidden||!fruit?.price)return;
    if(money<fruit.price){toast('돈이 부족해요. 부화한 드래곤이 돈을 벌어옵니다!');return;}
    syncBag();money-=fruit.price;fruitBag[tier]++;food++;ui();save();shopMenu();toast(fruit.name+' 구매 완료! E / T 내 먹이 · B 펫 먹이');
  }
  $('#shopOpen').onclick=()=>{
    if(!playing||paused)return;
    if(arena.isActive()||adventure.isCarrying()){toast('배틀을 마치고 알을 둥지에 놓은 뒤 상점을 이용하세요.');return;}
    paused=true;clearKeys();$('#shopModal').hidden=false;shopMenu();
  };
  $('#exportSave').onclick=()=>{
    if(arena.isActive()||adventure.isCarrying()){toast('배틀을 마치고 알을 둥지에 놓은 후 저장을 내보내세요.');return;}
    save();
    const data=localStorage.getItem('ember3d-v1');
    const url=URL.createObjectURL(new Blob([JSON.stringify({game:'Dragon of legendary',version:1,data:JSON.parse(data)},null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='Dragon-of-legendary-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('저장 파일을 내보냈어요. 오프라인 게임에서 저장 불러오기를 누르세요.');
  };
  $('#importSave').onclick=()=>{
    if(arena.isActive()||adventure.isCarrying()){toast('배틀과 알 운반을 마친 후 불러오세요.');return;}
    $('#saveFile').value='';$('#saveFile').click();
  };
  $('#saveFile').onchange=async()=>{
    const file=$('#saveFile').files?.[0];if(!file)return;
    const wasPaused=paused;paused=true;clearKeys();
    try{
      if(file.size>2000000)throw new Error('파일이 너무 큽니다.');
      const envelope=JSON.parse(await file.text()),data=envelope.data;
      if(envelope.game!=='Dragon of legendary'||envelope.version!==1||!data||!Number.isInteger(data.level)||data.level<0||data.level>MAX_LEVEL||!Array.isArray(data.fruitBag)||!data.fruitBag.every(n=>Number.isSafeInteger(n)&&n>=0)||!Number.isFinite(data.money)||data.money<0||!Array.isArray(data.eggs?.collection))throw new Error('올바른 게임 저장 파일이 아닙니다.');
      if(!window.confirm('이 파일의 Lv.'+(data.level+1)+' 진행 상황을 불러올까요? 현재 저장은 자동 백업됩니다.'))return;
      const previous=localStorage.getItem('ember3d-v1');if(previous)localStorage.setItem('ember3d-before-import',previous);
      localStorage.setItem('ember3d-v1',JSON.stringify(data));playing=false;window.location.reload();
    }catch(error){toast('불러오기 실패: '+error.message);}finally{paused=wasPaused;}
  };
  function wheelStatus(){
    const left=window.dragonWheel.remaining(lastWheelSpin);
    $('#wheelSpin').disabled=wheelSpinning||left>0;
    $('#wheelTime').textContent=left>0?'다음 돌림판까지 '+Math.floor(left/3600000)+'시간 '+Math.floor(left/60000)%60+'분 '+Math.ceil(left/1000)%60+'초':'지금 무료로 돌릴 수 있어요!';
  }
  $('#wheelOpen').onclick=()=>{
    if(!playing||paused)return;
    if(arena.isActive()||adventure.isCarrying()){toast('배틀과 알 운반을 마친 후 돌림판을 이용하세요.');return;}
    paused=true;clearKeys();$('#wheelModal').hidden=false;wheelStatus();
  };
  $('#wheelClose').onclick=()=>{if(wheelSpinning)return;paused=false;$('#wheelModal').hidden=true;};
  $('#wheelSpin').onclick=()=>{
    if(!playing||$('#wheelModal').hidden||wheelSpinning)return;
    try{const stored=JSON.parse(localStorage.getItem('ember3d-v1'))?.lastWheelSpin;if(Number.isFinite(stored))lastWheelSpin=Math.max(lastWheelSpin,stored);}catch{}
    if(window.dragonWheel.remaining(lastWheelSpin)>0){wheelStatus();return;}
    syncBag();const before={lastWheelSpin,level,xp,food,bag:[...fruitBag]};
    const index=window.dragonWheel.pick(),reward=window.dragonWheel.rewards[index];
    lastWheelSpin=Date.now();
    if(reward.count){fruitBag[reward.tier]+=reward.count;food+=reward.count;}
    if(reward.levels){level=Math.min(MAX_LEVEL,level+reward.levels);if(level===MAX_LEVEL)xp=0;}
    // Save before animation so closing the game cannot reroll or lose the prize.
    save();
    let persisted=false;try{persisted=JSON.parse(localStorage.getItem('ember3d-v1'))?.lastWheelSpin===lastWheelSpin;}catch{}
    if(!persisted){lastWheelSpin=before.lastWheelSpin;level=before.level;xp=before.xp;food=before.food;fruitBag=before.bag;$('#wheelResult').textContent='저장할 수 없어 돌리지 않았어요. 저장 공간을 확인하세요.';return;}
    ui();wheelSpinning=true;$('#wheelClose').disabled=true;wheelStatus();
    const target=(360-window.dragonWheel.sector(index).center)%360;wheelRotation+=1800+(target-wheelRotation%360+360)%360;
    $('#wheelDisc').style.transform='rotate('+wheelRotation+'deg)';
    $('#wheelResult').textContent='돌리는 중…';
    setTimeout(()=>{wheelSpinning=false;$('#wheelClose').disabled=false;$('#wheelResult').textContent=reward.label+(reward.levels?' · 실제 성장 +'+(level-before.level)+' (최대 Lv.135)':'')+' · 결과 저장 완료';wheelStatus();},3200);
  };
  $('#couponOpen').onclick=()=>{
    if(!playing||paused)return;
    if(arena.isActive()){toast('배틀을 마친 뒤 쿠폰을 사용하세요.');return;}
    paused=true;clearKeys();$('#couponModal').hidden=false;$('#couponInput').value='';$('#couponResult').textContent=redeemedCoupons.length?'이 저장 데이터에서 받은 쿠폰: '+redeemedCoupons.join(' / '):'아직 사용한 쿠폰이 없습니다. 코드를 입력하세요.';$('#couponInput').focus?.();
  };
  $('#couponClose').onclick=()=>{$('#couponInput').blur?.();clearKeys();paused=false;$('#couponModal').hidden=true;};
  $('#couponRedeem').onclick=()=>{
    if(!playing||$('#couponModal').hidden)return;
    const entered=String($('#couponInput').value||'').normalize('NFKC').toUpperCase().replace(/[\s,，\u200B-\u200D\uFEFF]+/g,'');
    const code=({DRAGON:'DRAGON',DRAGONOFLEGENDARY:'DRAGON OF LEGENDARY',SPEEDUP:'SPEED UP'})[entered];
    const result=$('#couponResult');
    if(!['DRAGON','DRAGON OF LEGENDARY','SPEED UP'].includes(code)){result.textContent='올바른 쿠폰 코드를 입력하세요.';return;}
    if(redeemedCoupons.includes(code)){result.textContent=code+' 쿠폰은 이 저장 데이터에 이미 보상이 지급되었습니다. 다른 코드를 입력하세요.';return;}
    if(code==='DRAGON'){
      if(level===MAX_LEVEL){result.textContent='이미 최종 진화입니다. 쿠폰은 사용되지 않았어요.';return;}
      const old=level;level=Math.min(MAX_LEVEL,level+3);if(level===MAX_LEVEL)xp=0;
      result.textContent='무료 '+(level-old)+'단계 진화 완료! Lv.'+(level+1);
    }else{
      syncBag();const tier=code==='SPEED UP'?2:7,count=code==='SPEED UP'?50:7;
      fruitBag[tier]+=count;food+=count;result.textContent=window.fruitRules.types[tier].name+' '+count+'개를 받았어요!';
    }
    redeemedCoupons.push(code);ui();save();$('#couponInput').value='';
  };
  $('#shopClose').onclick=()=>{paused=false;$('#shopModal').hidden=true;};
  $('#battleLeave').onclick=()=>{arena.leave();save();};
  $('#worldSwitch').onclick=()=>{
    if(!playing||paused)return;
    if(travelling){toast('여행에서 돌아온 뒤 세계를 이동하세요.');return;}
    const nextWorld=currentWorld%10+1,required=worldRequirements[nextWorld-1];
    if(level+1<required){toast('Lv.'+required+'을 달성하면 세계 '+nextWorld+'이 열립니다! 현재 Lv.'+(level+1));return;}
    if(arena.isActive()){toast('배틀을 마친 후 세계를 이동하세요.');return;}
    if(adventure.isCarrying()){toast('알을 먼저 둥지에 가져다 주세요.');return;}
    clearKeys();setWorld(nextWorld);save();toast('세계 '+currentWorld+' · '+worldTitles[currentWorld-1]+'에 도착했습니다!');
  };
  addEventListener('pagehide',()=>{if(playing)save();});
  $('#glideToggle').onclick=()=>{
    if(!travelling||!playing||paused)return;
    glideMode=!glideMode;
    if(glideMode){gliding=flying&&dragon.position.y>groundAt(dragon.position.x,dragon.position.z)+1;toast('섬에 착륙한 뒤 절벽 밖으로 걸어 나가세요! 공중에서는 바로 활공합니다.');}
    else{if(gliding){flying=true;travelAltitude=dragon.position.y;}gliding=false;}
    $('#glideToggle').textContent=glideMode?'글라이드 모드: 켬':'글라이드 모드: 끔';
  };
  function exitTravel(){
    if(!travelling)return;
    travelling=false;glideMode=gliding=false;glideMembranes.visible=false;$('#glideToggle').hidden=true;travelRegion.group.visible=false;
    travelVisibility.forEach(([o,visible])=>o.visible=visible);travelVisibility=null;
    camera.far=240;camera.updateProjectionMatrix();scene.fog.density=.012;
    $('#travelOpen').textContent='여행하기';$('#travelHelp').hidden=true;
    setWorld(currentWorld);clearKeys();
  }
  $('#travelOpen').onclick=()=>{
    if(!playing||paused)return;
    if(travelling){exitTravel();return;}
    if(arena.isActive()||adventure.isCarrying()){toast('배틀을 마치고 알을 둥지에 놓은 뒤 여행하세요.');return;}
    if(!travelRegion)travelRegion=window.createTravelRegion(T,scene);
    travelVisibility=scene.children.filter(o=>!o.isLight&&o!==dragon&&o!==travelRegion.group).map(o=>[o,o.visible]);
    travelVisibility.forEach(([o])=>o.visible=false);travelRegion.group.visible=true;travelling=true;
    camera.far=3500;camera.updateProjectionMatrix();scene.fog.density=.00065;
    scene.background.set('#a9dcec');scene.fog.color.copy(scene.background);
    dragon.position.set(0,35,0);travelAltitude=35;flying=true;clearKeys();
    $('#glideToggle').hidden=false;$('#glideToggle').textContent='글라이드 모드: 끔';$('#travelOpen').textContent='여행 끝내기';$('#travelHelp').hidden=false;$('#worldName').textContent='여행 · 푸른 바다와 24개의 섬';ui();
    toast('여행 시작! Q 상승 · C 하강 · F 섬에 착륙 · R 출발 섬');
  };
  const mini=$('#mini').getContext('2d');
  function minimap(){if(travelling){travelRegion.map(mini,dragon.position);return;}mini.clearRect(0,0,180,180);mini.fillStyle='#6f9980';mini.beginPath();mini.arc(90,90,76,0,7);mini.fill();mini.fillStyle='#ffd280';for(const f of fruits){if(f.respawn<=0){mini.beginPath();mini.arc(90+f.base.x*mapScale,90+f.base.z*mapScale,2.7,0,7);mini.fill();}}
    adventure.map(mini);mini.fillStyle='#fff';mini.beginPath();mini.arc(90+dragon.position.x*mapScale,90+dragon.position.z*mapScale,4,0,7);mini.fill();mini.strokeStyle='#fff';mini.beginPath();mini.moveTo(90+dragon.position.x*mapScale,90+dragon.position.z*mapScale);mini.lineTo(90+dragon.position.x*mapScale-Math.sin(dragon.rotation.y)*11,90+dragon.position.z*mapScale-Math.cos(dragon.rotation.y)*11);mini.stroke();}
  let frame=0;const target=new T.Vector3(),desired=new T.Vector3();
  function tick(){
    if(!$('#wheelModal').hidden)wheelStatus();
    requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;cooldown=Math.max(0,cooldown-dt);
    let moving=false;
    if(playing&&!paused){
      money=Math.min(Number.MAX_SAFE_INTEGER,money+adventure.incomeRate()*dt);
      const f=Number(!!(keys.KeyW||keys.ArrowUp))-Number(!!(keys.KeyS||keys.ArrowDown)),s=Number(!!(keys.KeyD||keys.ArrowRight))-Number(!!(keys.KeyA||keys.ArrowLeft));
      if(!gliding&&(f||s)){moving=true;const v=new T.Vector3(s,0,-f).normalize().applyAxisAngle(new T.Vector3(0,1,0),yaw);const speed=travelling?(flying?65:12):(flying?9:keys.KeyC?2:4.7)*speedMultiplier()*(adventure.isCarrying()?.92:1);moveThroughTrees(dragon.position,v.clone().multiplyScalar(dt*speed),.7+bodyGrowth()*.2,2+bodyGrowth()*.5);const angle=Math.atan2(-v.x,-v.z);dragon.rotation.y+=Math.atan2(Math.sin(angle-dragon.rotation.y),Math.cos(angle-dragon.rotation.y))*Math.min(1,dt*11);}
      if(travelling&&glideMode&&!gliding&&dragon.position.y>groundAt(dragon.position.x,dragon.position.z)+1){gliding=true;flying=true;}
      if(gliding){
        moving=true;dragon.rotation.y-=s*dt*1.5;
        const glideSpeed=keys.KeyC?52:f>0?42:30;
        moveThroughTrees(dragon.position,new T.Vector3(-Math.sin(dragon.rotation.y),0,-Math.cos(dragon.rotation.y)).multiplyScalar(dt*glideSpeed),.7+bodyGrowth()*.2,2+bodyGrowth()*.5);
      }
      const radius=Math.hypot(dragon.position.x,dragon.position.z),limit=travelling?travelRegion.radius:flying?186:mapRadius;if(radius>limit){dragon.position.x*=limit/radius;dragon.position.z*=limit/radius;}
      if(travelling){
        const floor=groundAt(dragon.position.x,dragon.position.z);
        if(gliding){
          dragon.position.y-=dt*(keys.KeyC?12:f<0?2:3.5);
          if(floor>=0&&dragon.position.y<=floor+.25){dragon.position.y=floor+.18;gliding=false;flying=false;toast('착륙했어요! 다음 절벽에서 다시 활공할 수 있어요.');}
          else if(floor<0&&dragon.position.y<2){dragon.position.y=3;travelAltitude=12;gliding=false;glideMode=false;flying=true;$('#glideToggle').textContent='글라이드 모드: 끔';toast('바다 가까이에서 일반 비행으로 전환합니다.');}
        }else{
        if(!flying&&floor<0){flying=true;travelAltitude=Math.max(12,dragon.position.y);toast('절벽 밖에서는 날개를 펼칩니다!');}
        if(flying){travelAltitude=T.MathUtils.clamp(travelAltitude+(Number(!!keys.KeyQ)-Number(!!keys.KeyC))*dt*35,5,260);travelAltitude=Math.max(travelAltitude,floor+5);}
        dragon.position.y=T.MathUtils.lerp(dragon.position.y,flying?travelAltitude:floor+.18,dt*4);
        }
      }else{
      dragon.position.y=T.MathUtils.lerp(dragon.position.y,flying?groundAt(dragon.position.x,dragon.position.z)+5.5+Math.sin(t*2)*.25:groundAt(dragon.position.x,dragon.position.z)+.18,dt*3);
      }
      resolveTrees(dragon.position,.7+bodyGrowth()*.2,2+bodyGrowth()*.5);
      if(!travelling)for(const item of fruits){if(item.respawn>0){item.respawn-=dt;item.group.visible=false;if(item.respawn<=0)rollFruit(item);}else{item.group.visible=true;if(!flying&&Math.hypot(dragon.position.x-item.base.x,dragon.position.z-item.base.z)<1.6){syncBag();food+=item.count;fruitBag[item.tier]+=item.count;total+=item.count;item.respawn=16;item.group.visible=false;ui();save();toast(window.fruitRules.types[item.tier].name+' +'+item.count+' · E 내 먹이 / B 펫 먹이');}}}
      if(keys.Space)fire();
      arena.update(dt);
      const changed=!travelling&&!arena.isActive()&&adventure.update(dt,{sneaking:!!keys.KeyC,running:false,flying,noisy:cooldown>.25});
      saveTimer+=dt;if(changed||saveTimer>2){save();saveTimer=0;}
    }
    if(travelling)travelRegion.update(t);
    if(travelling)$('#travelHelp').textContent=glideMode?'글라이드 · 절벽 밖으로 이동 · A/D 방향 · W 가속 · S 완만한 하강 · C 급강하 · 버튼으로 해제':'여행 · WASD 비행 · Q 상승 · C 하강 · F 착륙/이륙 · R 출발 섬';
    body.position.y=moving&&!flying?Math.sin(t*13)*.08:Math.sin(t*2)*.05;
    tailFlame.scale.setScalar(1+Math.sin(t*17)*.12);
    head.rotation.z=Math.sin(t*1.7)*.04;tail.rotation.y=Math.sin(t*2.5)*.2;
    glideMembranes.visible=gliding;
    wings.forEach((w,i)=>{w.visible=!gliding;w.rotation.z=(i===0?-1:1)*(flying?Math.sin(t*8)*.55:.15+Math.sin(t*2)*.06);});
    feet.forEach((leg,i)=>{leg.rotation.x=gliding?(i%2===0?-.6:.6):moving&&!flying?Math.sin(t*11+i*Math.PI*.7)*.45:flying?.5:0;leg.rotation.z=gliding?(i<2?-1.25:1.25):0;});
    for(const item of fruits){item.group.position.y=.9+Math.sin(t*2+item.base.x)*.13;item.group.rotation.y=t*.7;}
    crystal.rotation.y=t*.3;crystal.position.y=2+Math.sin(t)*.25;motesMesh.rotation.y=t*.015;
    $('#moneyHud').textContent='보유 '+Math.floor(money).toLocaleString('ko-KR')+'원 · 초당 +'+adventure.incomeRate().toLocaleString('ko-KR')+'원';
    const odds=window.fruitRules.chances(adventure.harvestPower());$('#fruitBonus').textContent='펫 행운: 황금 '+Math.round(odds.gold*100)+'% · 별빛 '+Math.round(odds.star*100)+'% · 2~3개 '+Math.round(odds.multiple*100)+'%';
    $('#skillReady').textContent=cooldown>0?'충전 '+cooldown.toFixed(1)+'초':'준비 완료 · SPACE를 누르고 연속 공격';
    for(let i=fireBalls.length-1;i>=0;i--){const b=fireBalls[i];b.life-=dt;b.mesh.position.addScaledVector(b.vel,dt);b.mesh.scale.setScalar((1+(1-b.life)*3)*(b.power||1));if(b.life<=0){scene.remove(b.mesh);fireBalls.splice(i,1);}}
    if(++frame%3===0){const a=water.geometry.attributes.position.array;for(let i=2;i<a.length;i+=3)a[i]=Math.sin(waterBase[i-2]*.15+t*.7)*.13+Math.cos(waterBase[i-1]*.18+t)*.09;water.geometry.attributes.position.needsUpdate=true;}
    target.copy(dragon.position).add(new T.Vector3(0,1.8+bodyGrowth()*.3,0));
    if(playing)desired.set(Math.sin(yaw)*distance,Math.sin(pitch)*distance+2,Math.cos(yaw)*distance).add(target);
    else{desired.set(7+Math.sin(t*.1),5.8,15);target.set(-2,1.7,6);}
    camera.position.lerp(desired,1-Math.exp(-dt*5));camera.lookAt(target);renderer.render(scene,camera);
    if(frame%10===0){minimap();const active=fruits.filter(f=>f.respawn<=0);let nearest=Infinity;for(const f of active)nearest=Math.min(nearest,Math.hypot(dragon.position.x-f.base.x,dragon.position.z-f.base.z));$('#compass').textContent=travelling?'Q 상승 · C 하강 · F 착륙 · 고도 '+Math.round(dragon.position.y)+'m':flying?'✦ F로 착륙하면 열매를 모을 수 있어요':food?'✦ E 먹이 주기 · 보유 '+food+'개':'✧ 가장 가까운 열매 '+Math.round(nearest)+'m · 지도를 따라가세요';}
  }
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  try{setWorld(JSON.parse(localStorage.getItem('ember3d-v1'))?.world);}catch{setWorld(1);}
  window.dragonMobileKeys=keys;
  window.dragonMobileCamera=(dx,dy)=>{yaw-=dx*.012;pitch=T.MathUtils.clamp(pitch+dy*.006,.14,1.1);};
  camera.position.set(10,6,16);ui();tick();
})();
