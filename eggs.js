// Egg theft, guardian perception, incubation and the persistent dragon collection.
window.createEggAdventure=function({T,scene,dragon,toast,random,resolveTrees=()=>{},mapScale=76/76,groundAt=()=>0}){
  const $=s=>document.querySelector(s);
  const types=[
    ['숲','#79c581','일반',12],['불꽃','#f57e53','일반',13],['바다','#54badc','일반',14],
    ['서리','#b1eaff','희귀',16],['번개','#ffdf63','희귀',17],['수정','#bf8de9','희귀',18],
    ['벚꽃','#ff9fc6','희귀',16],['독','#a3d850','희귀',17],['그림자','#7368a8','영웅',20],
    ['태양','#ffaa43','영웅',21],['달빛','#cfdaff','영웅',22],['무지개','#7ce6da','전설',25],
    ['용암','#ff603b','화산 영웅',24],['흑요석','#796478','화산 영웅',25],
    ['지옥불','#ffad35','화산 영웅',26],['잿빛 폭풍','#bc9eb8','화산 영웅',27],
    ['홍련','#ff416f','화산 전설',28],['마그마','#ff934e','화산 전설',29],
    ['유성','#beb0ff','화산 전설',30],['태양핵','#ffe881','화산 전설',31],
    ['심연','#805ccc','화산 신화',32],['불사조','#ffcf9c','화산 신화',33],
    ['파멸','#e94a57','화산 신화',34],['창세','#fff1ba','화산 신화',35],
    ['빙하','#a0eaff','빙설 영웅',30],['눈꽃','#eefaff','빙설 영웅',31],
    ['오로라','#73ffd4','빙설 전설',32],['극광','#a8a0ff','빙설 전설',33],
    ['빙정','#61caff','빙설 전설',34],['백야','#fff0bc','빙설 전설',35],
    ['혜성','#9bceff','빙설 신화',36],['성운','#caaaff','빙설 신화',37],
    ['천공','#78aaff','빙설 신화',38],['은하','#e6aaff','빙설 신화',39],
    ['영원','#baffed','빙설 신화',40],['극천','#ffffff','빙설 신화',42]
  ];
  const newNames=[
    ['모래','사막불꽃','사암','오아시스','황금','태양석','스핑크스','사막폭풍','왕관','황제','영광','황금신'],
    ['별가루','성운빛','초신성','유성우','월식','일식','우주','시공','차원','무한','태초별','우주신']
  ];
  newNames.forEach((list,w)=>list.forEach((name,i)=>types.push([name,(w?['#ad8aff','#81dcff','#f3a5ff']:['#e4b662','#ffda81','#a0e2cd'])[i%3],w?'차원 신화':'사막 신화',44+w*12+i])));
  const laterThemes=['심해','고대 정글','벚꽃','혼돈','불꽃 성역'];
  laterThemes.forEach((theme,w)=>Array.from({length:12},(_,i)=>types.push([theme+' '+['물결','수정','폭풍','비늘','광휘','정령','군주','별','황제','불사','태초','용신'][i],['#68d5f0','#a3d775','#ffb3df','#a58cea','#ffaa57'][w],theme+' 신화',60+w*6+i])));
  const materials=types.map(t=>new T.MeshStandardMaterial({color:t[1],roughness:.3,metalness:.25}));
  const eggGeo=new T.SphereGeometry(1,20,16),dotGeo=new T.SphereGeometry(.11,8,6);
  const spotMat=new T.MeshStandardMaterial({color:'#fff1ce',roughness:.45});
  const eggs=[],guards=[],babies=[];let world=1,carried=null,incubating=[],collection=Array(types.length).fill(0),alarm=0,age=0,spawnIndex=0;
  function eggModel(type){
    const g=new T.Group(),shell=new T.Mesh(eggGeo,materials[type]);shell.scale.set(.48,.67,.48);shell.castShadow=true;g.add(shell);
    for(let i=0;i<7;i++){const a=i*2.4,y=(i%3-1)*.24,m=new T.Mesh(dotGeo,materials[(type+i+1)%12]);m.position.set(Math.cos(a)*.43,y,Math.sin(a)*.43);m.scale.y=1.4;g.add(m);}
    const crown=new T.Mesh(new T.OctahedronGeometry(.15),spotMat);crown.position.y=.77;g.add(crown);return g;
  }
  // Freeze the unevolved model and its materials before the player grows.
  const hatchlingTemplate=dragon.clone(true),templateMaterials=new Map();
  hatchlingTemplate.traverse(o=>{if(!o.isMesh)return;if(!templateMaterials.has(o.material))templateMaterials.set(o.material,o.material.clone());o.material=templateMaterials.get(o.material);});
  function copyDragon(color,scale){
    const d=hatchlingTemplate.clone(true),cache=new Map();
    d.traverse(o=>{if(!o.isMesh)return;const original=o.material;if(!cache.has(original)){const m=original.clone();if(m.color&&m.color.g>.25&&m.color.b>.15)m.color.lerp(new T.Color(color),.78);cache.set(original,m);}o.material=cache.get(original);});
    d.scale.setScalar(scale);scene.add(d);return d;
  }
  function releaseModel(model){scene.remove(model);const mats=new Set();model.traverse(o=>{if(o.isMesh)mats.add(o.material);});mats.forEach(m=>m.dispose());}
  const locations=[[-35,-20],[40,-35],[-95,15],[100,45],[-65,-115],[0,-160]];
  const guardNames=['숲 수호룡','바다 수호룡','번개 수호룡','벚꽃 수호룡','태양 수호룡','무지개 수호룡'];
  const volcanicNames=['용암 파수꾼','지옥불 수호룡','홍련 폭군','유성 군주','심연 수호신','창세 용왕'];
  const frozenNames=['빙하 파수꾼','오로라 수호룡','빙정 군주','혜성 폭군','천공 수호신','극천 용왕'];
  function eggRank(type){return Math.floor(type/2)+1;}
  function guardianLevel(type){return 1+Math.floor(type/2);}
  function guardianSpeed(world,index){
    const base=world>5?66+(world-6)*14+index*2.4:world===5?52+index*2:world===4?38+index*2:world===3?21+index*1.2:world===2?14+index*1.1:(6.1+index*.5)*1.4;
    const speed=base*1.25*1.1*1.15*1.1*1.1*.85*.85;
    // Even the slowest guardian must outrun every guardian in the previous world.
    const worldMinimum=world>1?guardianSpeed(world-1,5)+1:0;
    return Math.max(speed,worldMinimum+index);
  }
  function supportDamage(b){return (2+b.level*2)*eggRank(b.type);}
  function setWorld(value){
    if(carried)return false;
    world=Number.isInteger(value)&&value>=1&&value<=10?value:1;spawnIndex=0;alarm=0;
    eggs.forEach((e,i)=>{scene.remove(e.group);e.type=(world-1)*12+i;e.group=eggModel(e.type);scene.add(e.group);e.group.position.copy(e.home);e.available=true;e.cooldown=0;});
    guards.forEach((g,i)=>{
      g.level=(world-1)*6+i+1;g.name=world>5?laterThemes[world-6]+' '+['파수꾼','수호룡','군주','폭군','수호신','용왕'][i]:[guardNames,volcanicNames,frozenNames,['모래 파수꾼','사암 수호룡','황금 군주','스핑크스 폭군','왕관 수호신','황금신 용왕'],['별가루 파수꾼','초신성 수호룡','월식 군주','우주 폭군','차원 수호신','우주신 용왕']][world-1][i];g.speed=guardianSpeed(world,i);
      g.chasing=g.reaction=0;g.sleeping=false;g.model.position.copy(g.home);g.model.scale.setScalar(world===2?1.5:1.15);
      g.model.traverse(o=>{if(!o.isMesh||!o.material.color)return;if(!o.material.userData.baseColor)o.material.userData.baseColor=o.material.color.getHexString();o.material.color.set('#'+o.material.userData.baseColor);if(world>1)o.material.color.lerp(new T.Color(types[(world-1)*12+i*2][1]),.8);});
      scene.remove(g.label);g.label.material.map.dispose();g.label.material.dispose();
      g.label=guardLabel(g.level,g.name,g.speed,i===5);g.label.position.copy(g.model.position).add(new T.Vector3(0,world===2?6.2:5.2,0));
    });
    redraw();return true;
  }
  function guardLabel(level,name,speed,fastest){
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=150;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle=fastest?'#51311e':'#102d39';ctx.fillRect(4,4,632,142);
    ctx.strokeStyle=fastest?'#ffce62':'#a9d9df';ctx.lineWidth=5;ctx.strokeRect(4,4,632,142);
    ctx.textAlign='center';ctx.fillStyle=fastest?'#ffdb79':'#ffffff';ctx.font='bold 36px sans-serif';
    const translate=text=>window.gameLanguage?window.gameLanguage.translate(text):text;
    ctx.fillText(translate('Lv.'+level+' '+name+(fastest?' ★ 최고 속도':'')),320,57,610);
    ctx.fillStyle='#ffffff';ctx.font='28px sans-serif';ctx.fillText(translate('추격 속도 '+speed.toFixed(1)+' m/s'),320,111,610);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const label=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,depthWrite:false}));
    label.scale.set(5.8,1.36,1);label.renderOrder=10;scene.add(label);return label;
  }
  locations.forEach(([x,z],i)=>{
    const guard=copyDragon(['#ba7058','#7378be','#bc9a4e'][i%3],1.15);
    guard.position.set(x,groundAt(x,z-3)+.2,z-3);
    const sector=new T.Mesh(new T.CircleGeometry(7.5,36,-Math.PI/3,Math.PI*2/3),new T.MeshBasicMaterial({color:'#70e1ab',transparent:true,opacity:.13,side:T.DoubleSide,depthWrite:false}));
    sector.rotation.x=-Math.PI/2;scene.add(sector);
    const speed=guardianSpeed(1,i),level=i+1,label=guardLabel(level,guardNames[i],speed,i===locations.length-1);
    label.position.copy(guard.position).add(new T.Vector3(0,5.2,0));
    guards.push({model:guard,home:new T.Vector3(x,groundAt(x,z-3)+.2,z-3),sector,label,level,name:guardNames[i],phase:i*1.9,sleeping:false,chasing:0,speed,reaction:0});
    for(let j=0;j<2;j++){const type=i*2+j,g=eggModel(type),home=new T.Vector3(x+(j?1:-1),groundAt(x,z)+.8,z);g.position.copy(home);scene.add(g);eggs.push({type,group:g,home,cooldown:0,available:true,owner:i});}
    const ring=new T.Mesh(new T.TorusGeometry(1.7,.14,8,32),new T.MeshStandardMaterial({color:'#aa835d',roughness:1}));ring.rotation.x=-Math.PI/2;ring.position.set(x,groundAt(x,z)+.15,z);scene.add(ring);
  });
  function redraw(){
    $('#eggStatus').textContent=carried?types[carried.type][0]+' 알 운반 중 · 둥지(흰 원)로 돌아가세요':'Q 알 가져오기 · 최강 수호룡: 북쪽 끝 계단 위';
    $('#alertFill').style.width=Math.round(alarm*100)+'%';
    const pursuer=carried?guards[carried.owner]:null;
    const fastest=guards[5];
    $('#guardStatus').textContent=pursuer?'Lv.'+pursuer.level+' '+pursuer.name+' 추격 중! '+pursuer.speed.toFixed(1)+' m/s':alarm>.7?'위험! 곧 발각됩니다!':alarm>.1?'의심받는 중 · 시야 밖으로 피하세요':'최고 속도: Lv.'+fastest.level+' '+fastest.name+' · '+fastest.speed.toFixed(1)+' m/s';
    $('#hatchStatus').textContent=incubating.length?'부화 '+incubating.map(a=>types[a.type][0]+' '+Math.ceil(a.remaining)+'초').join(' · '):'내 둥지: (0, 7) · 부화한 드래곤 '+collection.reduce((a,b)=>a+b,0)+'마리';
  }
  let collectionPage=0;
  $('#collectionPrev').onclick=()=>{collectionPage=Math.max(0,collectionPage-1);drawCollection();};
  $('#collectionNext').onclick=()=>{collectionPage=Math.min(Math.ceil(types.length/12)-1,collectionPage+1);drawCollection();};
  function drawCollection(){
    $('#collectionPage').textContent=(collectionPage+1)+' / '+Math.ceil(types.length/12)+' 페이지';
    $('#collectionPrev').disabled=collectionPage===0;
    $('#collectionNext').disabled=collectionPage===Math.ceil(types.length/12)-1;
    $('#speciesGrid').scrollTop=0;
    $('#collectionTitle').textContent='드래곤 도감 · '+collection.filter(Boolean).length+' / '+types.length+'종 · 높은 수호룡 레벨 = 강한 알';
    $('#speciesGrid').innerHTML=types.map((t,i)=>{if(i<collectionPage*12||i>=(collectionPage+1)*12)return '';const b=babies.find(b=>b.type===i);return '<div class="species"><span class="eggIcon" style="background:'+t[1]+'"></span><b>'+t[0]+' 드래곤</b><small>'+t[2]+' · '+t[3]+'초 부화</small><small>획득: Lv.'+guardianLevel(i)+' 수호룡 · 알 등급 '+eggRank(i)+'</small><small>기본 공격 '+supportDamage({type:i,level:0})+' → 최종 '+supportDamage({type:i,level:3})+'</small><small>'+(collection[i]?'발견! '+collection[i]+'마리':'미발견')+'</small>'+(b?'<small>대표 성장: '+babyStages[b.level]+' · 현재 공격 '+supportDamage(b)+'</small>':'')+'</div>';}).join('');
  }
  function interact(flying){
    if(carried){toast('알을 둥지로 가져오세요. 둥지 안에서 자동으로 내려놓습니다.');return;}
    if(flying||dragon.position.y>groundAt(dragon.position.x,dragon.position.z)+.6){toast('알을 가져오려면 먼저 착륙하세요.');return;}
    const distance=e=>Math.hypot(e.home.x-dragon.position.x,e.home.z-dragon.position.z,e.home.y-.6-dragon.position.y);
    const e=eggs.filter(e=>e.available&&distance(e)<2.4).sort((a,b)=>distance(a)-distance(b))[0];
    if(!e){toast('색깔 있는 알 가까이에서 Q를 누르세요.');return;}
    e.available=false;e.cooldown=24;carried=e;const guard=guards[e.owner];guard.chasing=8;guard.sleeping=false;guard.reaction=.65;alarm=1;toast(types[e.type][0]+' 알 획득! 수호룡이 쫓아옵니다! 둥지로 돌아가세요.');redraw();
  }
  function returnEgg(){if(!carried)return;carried.available=true;carried.cooldown=0;carried.group.visible=true;carried.group.position.copy(carried.home);carried=null;}
  function baby(type){
    // Show one companion per species; duplicate hatch counts remain in the collection.
    if(babies.some(b=>b.type===type))return;
    const b={type,model:copyDragon(types[type][1],.28),level:0,xp:0,angle:type*.5};babies.push(b);b.model.position.set(Math.cos(b.angle)*3,.2,7+Math.sin(b.angle)*3);refreshBabyChoices();
  }
  const babyStages=['아기','어린 용','성체','고대룡'],babyNeeds=[3,5,8];
  function babySpeed(b){return (1.1+b.level*.65)*1.4;}
  function refreshBabyChoices(){
    const old=$('#babyChoice').value;
    $('#babyChoice').innerHTML=babies.length?babies.map(b=>'<option value="'+b.type+'">'+types[b.type][0]+' · 대표 '+babyStages[b.level]+' · '+collection[b.type]+'마리</option>').join(''):'<option value="">먼저 알을 부화시키세요</option>';
    $('#babyChoice').value=babies.some(b=>String(b.type)===old)?old:babies.length?String(babies[0].type):'';
    babyInfo();
  }
  function babyInfo(){
    const b=babies.find(b=>String(b.type)===$('#babyChoice').value);
    $('#babyInfo').textContent=b?babyStages[b.level]+' · 성장 '+(b.level===3?'MAX':b.xp+'/'+babyNeeds[b.level])+' · 속도 '+babySpeed(b).toFixed(1)+' · 알 등급 '+eggRank(b.type)+' · 지원 공격 '+supportDamage(b):'둥지에서 열매 1개씩 먹일 수 있어요.';
  }
  $('#babyChoice').onchange=babyInfo;
  function feedBaby(food,nutrition=1){
    const b=babies.find(b=>String(b.type)===$('#babyChoice').value);
    if(!b){toast('먼저 알을 부화시켜 주세요.');return false;}
    if(Math.hypot(dragon.position.x,dragon.position.z-7)>4.5||dragon.position.y>.6){toast('아기 드래곤에게 먹이려면 둥지에 착륙하세요.');return false;}
    if(b.level===3){toast('이 드래곤은 최종 진화를 마쳤어요. 다른 드래곤을 선택하세요.');return false;}
    if(food<1){toast('황금 열매를 먼저 모아오세요.');return false;}
    const previous=b.level;b.xp+=nutrition;
    while(b.level<3&&b.xp>=babyNeeds[b.level]){b.xp-=babyNeeds[b.level];b.level++;}
    if(b.level===3)b.xp=0;
    if(b.level>previous){b.model.scale.setScalar(.28+b.level*.15);toast(types[b.type][0]+' 드래곤이 '+babyStages[b.level]+'으로 진화! 속도 증가');}
    else toast(types[b.type][0]+' 아기에게 열매를 먹였어요! 성장 +'+nutrition);
    refreshBabyChoices();drawCollection();return true;
  }
  function reset(){
    returnEgg();incubating.forEach(a=>scene.remove(a.model));incubating=[];babies.forEach(b=>releaseModel(b.model));babies.length=0;collection=Array(types.length).fill(0);alarm=age=spawnIndex=0;world=1;
    eggs.forEach((e,i)=>{e.type=i;e.group.children[0].material=materials[i];e.available=true;e.cooldown=0;e.group.visible=true;e.group.position.copy(e.home);});
    guards.forEach(g=>{g.chasing=0;g.reaction=0;g.sleeping=false;g.model.position.copy(g.home);});refreshBabyChoices();redraw();drawCollection();
  }
  function snapshot(){return {collection:[...collection],babies:babies.map(b=>({type:b.type,level:b.level,xp:b.xp})),incubating:incubating.map(a=>({type:a.type,remaining:a.remaining}))};}
  function restore(data){
    if(!data)return;
    if(Array.isArray(data.collection))collection=types.map((_,i)=>Math.max(0,Math.min(9999,data.collection[i]|0)));
    collection.forEach((count,type)=>{if(count)baby(type);});
    if(Array.isArray(data.babies))for(const state of data.babies){const b=babies.find(b=>b.type===state.type);if(b){b.level=Math.max(0,Math.min(3,state.level|0));b.xp=b.level===3?0:Math.max(0,Math.min(babyNeeds[b.level]-1,state.xp|0));b.model.scale.setScalar(.28+b.level*.15);}}
    if(Array.isArray(data.incubating))for(const a of data.incubating.slice(0,3)){if(!Number.isInteger(a.type)||a.type<0||a.type>=types.length||!Number.isFinite(a.remaining))continue;const model=eggModel(a.type);scene.add(model);incubating.push({type:a.type,remaining:Math.max(.1,Math.min(types[a.type][3],a.remaining)),model});}
    refreshBabyChoices();redraw();drawCollection();
  }
  function update(dt,{sneaking,running,flying,noisy}){
    age+=dt;let seen=false,caught=false,changed=false;
    const safe=Math.hypot(dragon.position.x,dragon.position.z-7)<4.5;
    for(const g of guards){
      if(carried&&guards[carried.owner]===g)g.chasing=8;
      g.sleeping=g.chasing<=0&&(age+g.phase)%18>11;
      if(g.chasing>0){
        g.chasing-=dt;g.reaction=Math.max(0,g.reaction-dt);const delta=dragon.position.clone().sub(g.model.position);delta.y=0;
        if(delta.length()<1.5&&carried&&!safe&&g.reaction===0)caught=true;
        if(delta.length()>1&&!safe&&g.reaction===0){const step=Math.min(delta.length()-1,dt*g.speed);g.model.position.addScaledVector(delta.normalize(),step);}
        g.model.rotation.y=Math.atan2(-delta.x,-delta.z);
      }else{
        g.model.position.lerp(g.home,Math.min(1,dt*2));g.model.rotation.y=Math.sin((age+g.phase)*.48)*1.6;
      }
      g.model.position.y=groundAt(g.model.position.x,g.model.position.z)+.2;
      resolveTrees(g.model.position,.85,3);
      g.model.rotation.z=g.sleeping?.15:0;
      const delta=dragon.position.clone().sub(g.model.position);delta.y=0;const d=delta.length();
      const forward=new T.Vector3(-Math.sin(g.model.rotation.y),0,-Math.cos(g.model.rotation.y));
      const visible=d<7.5&&d>0&&forward.dot(delta.clone().normalize())>.5;
      const heard=d<(noisy?10:running?5:sneaking?1:2);
      if(!g.sleeping&&(visible||heard)&&Math.hypot(dragon.position.x,dragon.position.z-7)>4.5){seen=true;if(carried&&alarm>=1)g.chasing=6;}
      g.sector.visible=!g.sleeping;g.sector.position.copy(g.model.position);g.sector.position.y=g.model.position.y+.05;g.sector.rotation.z=g.model.rotation.y+Math.PI/2;
      g.label.position.copy(g.model.position).add(new T.Vector3(0,world===2?6.2:5.2,0));
      g.sector.material.color.set(g.chasing>0?'#ff5444':seen?'#ffc364':'#70e1ab');
    }
    alarm=T.MathUtils.clamp(alarm+dt*(seen?(sneaking?.24:.55):-1),0,1);
    if(caught){returnEgg();dragon.position.set(0,.2,7);guards.forEach(g=>g.chasing=0);alarm=0;toast('수호룡에게 들켰어요! 알을 돌려주고 둥지로 돌아왔습니다.');}
    if(carried){
      dragon.updateMatrixWorld(true);carried.group.position.copy(dragon.localToWorld(new T.Vector3(0,1,-2.1)));carried.group.visible=true;
      if(Math.hypot(dragon.position.x,dragon.position.z-7)<3.6&&incubating.length<3){
        const type=carried.type,model=eggModel(type);scene.add(model);incubating.push({type,remaining:types[type][3],model});carried.group.visible=false;carried=null;guards.forEach(g=>g.chasing=0);alarm=0;toast(types[type][0]+' 알 부화 시작!');changed=true;
      }
    }
    for(const e of eggs){
      if(e===carried)continue;
      if(!e.available){e.cooldown-=dt;e.group.visible=false;if(e.cooldown<=0){e.available=true;e.type=(world-1)*12+e.owner*2+spawnIndex++%2;scene.remove(e.group);e.group=eggModel(e.type);scene.add(e.group);e.group.position.copy(e.home);e.group.visible=true;}}
      else{e.group.rotation.y+=dt*.4;e.group.position.y=e.home.y+Math.sin(age*2+e.owner)*.07;}
    }
    for(let i=incubating.length-1;i>=0;i--){
      const a=incubating[i];a.remaining-=dt;a.model.position.set((i-1)*1.5,.9,7);a.model.rotation.z=Math.sin(age*(a.remaining<3?20:3))*.12;
      if(a.remaining<=0){collection[a.type]++;baby(a.type);scene.remove(a.model);incubating.splice(i,1);toast(types[a.type][0]+' 아기 드래곤이 태어났어요!');drawCollection();changed=true;}
    }
    babies.forEach((b,i)=>{b.angle+=dt*babySpeed(b)/3;const a=b.angle;b.model.position.set(Math.cos(a)*3,.2+Math.abs(Math.sin(age*(3+b.level)+i))*.07,7+Math.sin(a)*3);b.model.rotation.y=-a;});
    redraw();return changed;
  }
  function map(ctx){
    ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(90,90+7*mapScale,4*mapScale,0,7);ctx.stroke();
    for(const e of eggs)if(e.available){ctx.fillStyle=types[e.type][1];ctx.beginPath();ctx.arc(90+e.home.x*mapScale,90+e.home.z*mapScale,4,0,7);ctx.fill();}
    for(const g of guards){ctx.fillStyle=g.sleeping?'#8fafff':'#ff6864';ctx.fillRect(87+g.model.position.x*mapScale,87+g.model.position.z*mapScale,6,6);}
  }
  redraw();
  function battleTeam(){return [...babies].sort((a,b)=>supportDamage(b)-supportDamage(a)||a.type-b.type).slice(0,3).map(b=>({name:types[b.type][0],level:b.level,damage:supportDamage(b),model:b.model}));}
  function incomeRate(){return babies.reduce((sum,b)=>sum+supportDamage(b)*100*Math.max(1,collection[b.type]),0);}
  function harvestPower(){return babies.reduce((best,b)=>Math.max(best,eggRank(b.type)+b.level*3),0);}
  addEventListener('game-language-change',()=>guards.forEach((g,i)=>{
    const position=g.label.position.clone();scene.remove(g.label);g.label.material.map.dispose();g.label.material.dispose();
    g.label=guardLabel(g.level,g.name,g.speed,i===5);g.label.position.copy(position);
  }));
  return {interact,update,map,reset,snapshot,restore,drawCollection,returnEgg,feedBaby,battleTeam,setWorld,harvestPower,incomeRate,isCarrying:()=>!!carried};
};
