window.createTravelRegion=function(T,scene){
  const group=new T.Group();group.visible=false;scene.add(group);
  const islands=[],trees=[],clouds=[],falls=[];let seed=8741;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.85,...extra});
  const sand=material('#f4dda3'),cliff=material('#8b938b'),rock=material('#c1c7c2'),bark=material('#79624d');
  const greens=['#66ba88','#44977b','#85bd70','#66b2a5'].map(c=>material(c));
  const leaves=['#287964','#4a9468','#edaac4'].map(c=>material(c));
  function mesh(geometry,mat,x,y,z,scale=[1,1,1]){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.scale.set(...scale);m.receiveShadow=true;group.add(m);return m;}
  const ocean=mesh(new T.PlaneGeometry(4400,4400),material('#238da7',{roughness:.26,metalness:.3}),0,-2,0);ocean.rotation.x=-Math.PI/2;
  const shallow=material('#63dacb',{transparent:true,opacity:.35,depthWrite:false});
  const waterfall=material('#99eafa',{transparent:true,opacity:.7,emissive:'#236d81',emissiveIntensity:.25});
  const cylinder=new T.CylinderGeometry(1,1.07,1,36),cone=new T.ConeGeometry(1,1,8),stone=new T.IcosahedronGeometry(1,1);
  function island(x,z,rx,rz,h,index){
    islands.push({x,z,rx,rz,h,name:(index===0?'출발 섬':index===1?'대륙의 절벽':'섬 '+index)});
    mesh(cylinder,cliff,x,(h-6)/2,z,[rx,h+6,rz]);
    mesh(cylinder,sand,x,h+.15,z,[rx*1.01,.3,rz*1.01]);
    mesh(cylinder,greens[index%4],x,h+.36,z,[rx*.91,.12,rz*.91]);
    const reef=mesh(new T.CircleGeometry(1,40),shallow,x,-1.8,z,[rx*1.2,rz*1.2,1]);reef.rotation.x=-Math.PI/2;
    const amount=index===1?90:14;
    for(let j=0;j<amount;j++){
      const a=random()*Math.PI*2,r=Math.sqrt(random())*.78,px=x+Math.cos(a)*rx*r,pz=z+Math.sin(a)*rz*r;
      if(index===0&&Math.hypot(px,pz)<14)continue;
      const tall=5+random()*7;
      mesh(cylinder,bark,px,h+.5+tall/2,pz,[.6,tall,.6]);
      mesh(cone,leaves[index%3],px,h+tall+1,pz,[3+random()*2,7,3+random()*2]);
      trees.push({x:px,z:pz,radius:2,bottom:h,top:h+tall+5});
    }
    for(let j=0;j<7;j++){
      const a=j/7*Math.PI*2;
      const px=x+Math.cos(a)*rx*.9,pz=z+Math.sin(a)*rz*.9,height=3+random()*7;
      mesh(stone,rock,px,h+2,pz,[5,height,5]);trees.push({x:px,z:pz,radius:5,bottom:h-2,top:h+2+height});
    }
    if(h>15){
      const f=mesh(new T.PlaneGeometry(5,h+2),waterfall,x,(h-2)/2,z+rz*1.01);falls.push(f);
      mesh(stone,shallow,x,-1.4,z+rz*1.04,[10,.3,8]);
    }
  }
  island(0,0,65,55,5,0);island(520,-390,290,190,42,1);
  for(let i=0;i<22;i++){const a=i*2.39996,r=260+(i%5)*205;island(Math.cos(a)*r,Math.sin(a)*r,38+random()*45,32+random()*40,7+random()*58,i+2);}
  const cloudMat=material('#fff9ef',{transparent:true,opacity:.8});
  for(let i=0;i<36;i++){const a=random()*6.28,r=random()*1400;clouds.push(mesh(stone,cloudMat,Math.cos(a)*r,115+random()*80,Math.sin(a)*r,[25+random()*30,5,12]));}
  // An isolated natural stone arch on the mainland skyline.
  mesh(new T.BoxGeometry(12,65,14),cliff,440,74,-360);mesh(new T.BoxGeometry(12,65,14),cliff,482,74,-360);mesh(new T.BoxGeometry(54,12,14),rock,461,108,-360);
  trees.push({x:440,z:-360,radius:8,bottom:41.5,top:107},{x:482,z:-360,radius:8,bottom:41.5,top:107});
  for(let x=440;x<=482;x+=7)trees.push({x,z:-360,radius:7,bottom:102,top:114});
  function ground(x,z){let height=-2;for(const i of islands)if(((x-i.x)/i.rx)**2+((z-i.z)/i.rz)**2<=1)height=Math.max(height,i.h+.42);return height;}
  function map(ctx,position){
    const scale=76/1500;ctx.clearRect(0,0,180,180);ctx.fillStyle='#238da7';ctx.beginPath();ctx.arc(90,90,76,0,7);ctx.fill();
    ctx.fillStyle='#a9dc93';for(const i of islands){ctx.beginPath();ctx.ellipse(90+i.x*scale,90+i.z*scale,i.rx*scale,i.rz*scale,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(90+position.x*scale,90+position.z*scale,3,0,7);ctx.fill();
  }
  function update(t){ocean.material.color.setHSL(.52,.61,.37+Math.sin(t*.3)*.015);falls.forEach((f,i)=>f.material.opacity=.65+Math.sin(t*3+i)*.08);clouds.forEach((c,i)=>c.position.x+=Math.sin(t*.1+i)*.015);}
  return {group,ground,trees,islands,map,update,radius:1500};
};
