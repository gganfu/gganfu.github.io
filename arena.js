window.createArena=function({T,scene,dragon,toast,reward,getTeam=()=>[]}){
  const $=s=>document.querySelector(s),center=new T.Vector3(43,0,34),radius=12;
  let active=false,stage=0,unlocked=1,cleared=0,hp=100,enemyHp=100,attackTimer=0,warning=0,elapsed=0,playerLevel=0,shotCooldown=0;
  const baseStages=[
    {name:'훈련 비룡',hp:65,speed:5,damage:8,interval:3.2,color:'#83c99b'},
    {name:'화염 전사',hp:110,speed:6.3,damage:11,interval:2.8,color:'#f3a263'},
    {name:'폭풍 기사',hp:165,speed:7.5,damage:14,interval:2.5,color:'#819dda'},
    {name:'그림자 군주',hp:220,speed:8.5,damage:17,interval:2.2,color:'#ae7cda'},
    {name:'고대 용왕',hp:300,speed:9.5,damage:20,interval:1.9,color:'#efd082'}
  ];
  let world=1,clearedWorlds=Array(10).fill(0),team=[],teamDamage=0;
  let stages=baseStages.map(s=>({...s,damage:s.damage*1.3*1.5,defense:1.3*1.5}));
  const bolts=[],boltGeo=new T.SphereGeometry(.14,8,6),boltMat=new T.MeshBasicMaterial({color:'#8ffff0'});
  function clearTeam(){team.forEach(b=>scene.remove(b.model));team=[];bolts.forEach(b=>scene.remove(b.model));bolts.length=0;}
  function setWorld(value){
    if(active)return false;world=Number.isInteger(value)&&value>=1&&value<=10?value:1;
    stages=world===1?baseStages:baseStages.map((s,i)=>({...s,name:['용암 추적자','흑요석 전사','화산 폭군','지옥불 군주','멸망의 용왕'][i],hp:Math.round(s.hp*1.7),damage:Math.round(s.damage*1.35),speed:s.speed*1.15,color:'#e77d64'}));
    if(world===3)stages=baseStages.map((s,i)=>({...s,name:['눈보라 추적자','빙정 전사','극광 폭군','은하 군주','극천의 용왕'][i],hp:Math.round(s.hp*2.5),damage:Math.round(s.damage*1.7),speed:s.speed*1.3,color:'#99dcff'}));
    if(world>=4)stages=baseStages.map((s,i)=>({...s,name:(world===4?['모래 추적자','오아시스 전사','황금 폭군','사막 황제','황금신 용왕']:['별빛 추적자','초신성 전사','차원 폭군','무한 군주','우주신 용왕'])[i],hp:Math.round(s.hp*(world===4?3.5:4.8)),damage:Math.round(s.damage*(world===4?2.1:2.6)),speed:s.speed*(world===4?1.45:1.6),color:world===4?'#ffcf78':'#bf9bff'}));
    if(world>5)stages=baseStages.map((s,i)=>({...s,name:['심해','고대 정글','벚꽃','혼돈','불꽃 성역'][world-6]+' '+['추적자','전사','폭군','군주','용왕'][i],hp:Math.round(s.hp*(5.5+(world-6)*1.2)),damage:Math.round(s.damage*(3+(world-6)*.4)),speed:s.speed*(1.7+(world-6)*.1),color:['#68d5f0','#a3d775','#ffb3df','#a58cea','#ffaa57'][world-6]}));
    stages=stages.map(s=>({...s,damage:s.damage*1.3*1.5,defense:1.3*1.5}));
    cleared=clearedWorlds[world-1];unlocked=Math.min(5,cleared+1);stage=0;menu();render();return true;
  }
  const floor=new T.Mesh(new T.CylinderGeometry(radius,radius+.7,.25,64),new T.MeshStandardMaterial({color:'#637e87',roughness:.85}));floor.position.copy(center);floor.position.y=.06;floor.receiveShadow=true;scene.add(floor);
  const ring=new T.Mesh(new T.TorusGeometry(radius,.16,8,80),new T.MeshStandardMaterial({color:'#efcd83',emissive:'#bd7742',emissiveIntensity:.3}));ring.rotation.x=-Math.PI/2;ring.position.copy(center);ring.position.y=.27;scene.add(ring);
  const enemy=dragon.clone(true),materials=new Map();enemy.traverse(o=>{if(o.isMesh){if(!materials.has(o.material))materials.set(o.material,o.material.clone());o.material=materials.get(o.material);}});
  enemy.scale.setScalar(1.15);enemy.visible=false;scene.add(enemy);
  const danger=new T.Mesh(new T.CircleGeometry(3.5,48),new T.MeshBasicMaterial({color:'#ff4735',transparent:true,opacity:.45,depthWrite:false}));danger.rotation.x=-Math.PI/2;danger.visible=false;scene.add(danger);
  function render(){
    $('#arenaStage').textContent='세계 '+world+' · '+(stage+1)+'단계 · '+stages[stage].name;
    $('#battleHP').textContent='내 체력 '+Math.ceil(hp)+' / '+(100+playerLevel*12)+' · 상대 '+Math.ceil(enemyHp)+' / '+stages[stage].hp;
    $('#battleHint').textContent=warning>0?'빨간 원 밖으로 피하세요!':'SPACE 화염 · WASD 회피 · 상대 공격·방어 ×1.95';
    $('#teamStatus').textContent=team.length?'지원 '+team.map(b=>b.name+' Lv.'+(b.level+1)).join(' · ')+' | 누적 피해 '+Math.round(teamDamage):'지원 드래곤 없음 · 알을 부화시키면 최대 3마리가 자동 참전합니다.';
    $('#battleHud').hidden=!active;
  }
  function menu(){
    $('#battleSelect').innerHTML=stages.map((s,i)=>'<option value="'+i+'" '+(i>=unlocked?'disabled':'')+'>'+(i+1)+'단계 · '+s.name+(i>=unlocked?' 🔒':'')+'</option>').join('');
    $('#battleProgress').textContent='세계 '+world+' · 완료 '+cleared+' / 5 · 첫 승리 보상: 단계 × 열매 '+(world*10)+'개';
  }
  function start(index,level){
    if(active||!Number.isInteger(index)||index<0||index>=unlocked||index>=5)return false;
    stage=index;playerLevel=level;hp=100+level*12;enemyHp=stages[stage].hp;elapsed=0;attackTimer=1.5;warning=shotCooldown=0;active=true;
    clearTeam();teamDamage=0;
    team=getTeam().map((b,i)=>{const model=b.model.clone(true);scene.add(model);model.position.copy(center).add(new T.Vector3((i-1)*3,.2,4));return {...b,model,cooldown:1+i*.3};});
    enemy.visible=true;danger.visible=false;dragon.position.copy(center).add(new T.Vector3(0,.2,7));dragon.rotation.y=0;
    enemy.position.copy(center).add(new T.Vector3(0,.2,-6));
    materials.forEach(m=>{if(m.color)m.color.lerp(new T.Color(stages[stage].color),.6);});
    render();toast((stage+1)+'단계 시작! SPACE로 화염을 쏘세요.');return true;
  }
  function finish(won){
    active=false;enemy.visible=false;danger.visible=false;clearTeam();
    if(won){if(stage+1>cleared){cleared=stage+1;unlocked=Math.min(5,cleared+1);clearedWorlds[world-1]=cleared;reward((stage+1)*world*10);}toast(stage===4?'5단계 완료! 배틀장 챔피언입니다!':'승리! 다음 단계가 열렸습니다.');}
    else toast('패배했어요. 열매로 성장한 뒤 다시 도전하세요!');
    dragon.position.set(0,.2,7);render();menu();
  }
  function attack(level=playerLevel){
    if(!active||shotCooldown>0)return false;const skill=window.dragonSkill(level);shotCooldown=skill.cooldown;
    const delta=enemy.position.clone().sub(dragon.position);delta.y=0;
    const direction=new T.Vector3(-Math.sin(dragon.rotation.y),0,-Math.cos(dragon.rotation.y));
    if(delta.length()<skill.range&&direction.dot(delta.normalize())>skill.aim){enemyHp=Math.max(0,enemyHp-skill.damage/stages[stage].defense);if(enemyHp<=0)finish(true);render();return true;}
    return false;
  }
  function update(dt){
    if(!active)return;elapsed+=dt;shotCooldown=Math.max(0,shotCooldown-dt);dragon.position.y=.2;
    const fromCenter=dragon.position.clone().sub(center);fromCenter.y=0;if(fromCenter.length()>radius-1){fromCenter.setLength(radius-1);dragon.position.x=center.x+fromCenter.x;dragon.position.z=center.z+fromCenter.z;}
    const delta=dragon.position.clone().sub(enemy.position);delta.y=0;
    enemy.rotation.y=Math.atan2(-delta.x,-delta.z);
    if(warning>0){
      warning-=dt;danger.material.opacity=.3+Math.sin(elapsed*18)*.15;
      if(warning<=0){if(Math.hypot(dragon.position.x-danger.position.x,dragon.position.z-danger.position.z)<3.5)hp=Math.max(0,hp-stages[stage].damage);danger.visible=false;attackTimer=stages[stage].interval;if(hp<=0){finish(false);return;}}
    }else{
      if(delta.length()>5){const step=Math.min(delta.length()-5,stages[stage].speed*dt);enemy.position.addScaledVector(delta.normalize(),step);}
      attackTimer-=dt;if(attackTimer<=0){warning=.9;danger.position.set(dragon.position.x,.23,dragon.position.z);danger.visible=true;}
    }
    for(const b of team){
      const offset=new T.Vector3(Math.sin(elapsed+b.level)*4,0,4);
      const destination=enemy.position.clone().add(offset),move=destination.sub(b.model.position);move.y=0;
      if(move.length()>.2){const step=Math.min(move.length(),dt*(3+b.level));b.model.position.addScaledVector(move.normalize(),step);}
      const aim=enemy.position.clone().sub(b.model.position);b.model.rotation.y=Math.atan2(-aim.x,-aim.z);
      b.cooldown-=dt;if(b.cooldown<=0&&aim.length()<10){b.cooldown=1.8;const damage=(b.damage??(2+b.level*2))/stages[stage].defense;teamDamage+=damage;enemyHp=Math.max(0,enemyHp-damage);const model=new T.Mesh(boltGeo,boltMat);model.position.copy(b.model.position).add(new T.Vector3(0,1,0));scene.add(model);bolts.push({model,life:.3,target:enemy.position.clone().add(new T.Vector3(0,1.5,0))});}
    }
    for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];b.life-=dt;b.model.position.lerp(b.target,Math.min(1,dt*12));if(b.life<=0){scene.remove(b.model);bolts.splice(i,1);}}
    if(enemyHp<=0){finish(true);return;}render();
  }
  function leave(){clearTeam();active=false;enemy.visible=danger.visible=false;dragon.position.set(0,.2,7);render();}
  function reset(){leave();clearedWorlds=Array(10).fill(0);setWorld(1);}
  function snapshot(){return {cleared:clearedWorlds[0],clearedWorlds:[...clearedWorlds]};}
  function restore(data){clearedWorlds=Array.from({length:10},(_,i)=>i).map(i=>Math.max(0,Math.min(5,(data?.clearedWorlds?.[i]??(i===0?data?.cleared:0))|0)));setWorld(world);}
  menu();render();return {setWorld,start,update,attack,leave,reset,snapshot,restore,menu,isActive:()=>active};
};
