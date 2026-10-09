/* Simulation shared by the browser and the race checks. Units: seconds, metres. */
(function(root){
  const EVENTS = [
    {id:'banana',name:'바나나 미끄럼',text:'바나나 밟고 벌러덩!',color:'#ffd55b'},
    {id:'boost',name:'소닉 부스터',text:'발이 안 보여! 초고속 부스터!',color:'#58dfff'},
    {id:'rock',name:'돌멩이',text:'앗, 돌멩이! 0.2초 멈춤',color:'#c7c8d7'},
    {id:'rainbow',name:'무지개 유니콘',text:'0.15초 반짝! 유니콘 변신',color:'#ff98d4'},
    {id:'pegasus',name:'페가수스 날개',text:'하얀 페가수스! 장애물 한 번 날아서 피하기',color:'#f5ecff'},
    {id:'mud',name:'끈적한 진흙',text:'진흙이 발을 잡았어!',color:'#b58b66'},
    {id:'spring',name:'점프 스프링',text:'통통! 하늘로 점프!',color:'#a8edaa'},
    {id:'wind',name:'회오리 바람',text:'빙글빙글! 바람을 타고 전진!',color:'#9fe9df'},
    {id:'carrot',name:'당근 파워',text:'당근 먹고 힘이 불끈!',color:'#ffb775'},
    {id:'puddle',name:'물웅덩이',text:'철퍼덕! 물 튀기며 잠깐 감속',color:'#9bc5ff'}
  ];
  function shuffle(a,rand){for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  class RaceEngine {
    constructor(count,mode='first',random=Math.random){
      this.random=random;this.mode=mode;this.time=0;this.distance=240;this.done=false;this.winner=null;this.arrivals=[];this.items=[];this.notices=[];this.eventCount=0;this.leaderChanges=0;this.lastLeader=-1;
      this.horses=Array.from({length:count},(_,i)=>({id:i,x:0,speed:8,pace:8,paceAt:0,finish:null,effect:null,effectUntil:0,fallStart:0,stunUntil:0,unicornUntil:0,unicornObtained:false,pegasus:false,flightUsed:false,flightUntil:0,flightStart:0,events:0}));
      // Every race includes all ten event types; order, recipients and pace are random.
      this.schedule=shuffle(EVENTS.map(e=>e.id),random).map((id,i)=>({id,at:2.2+i*2.15+random()*.5,fired:false}));
      this.schedule.push(...[23.7,25.4,26.7].map(at=>({id:['boost','banana','carrot','wind'][Math.floor(random()*4)],at,fired:false,final:true})));
      // Random spacing and placement; there is no fixed rock count per lane.
      this.horses.forEach(h=>{for(let x=18+random()*12;x<232;x+=14+random()*22){if(random()<.3)this.items.push({type:'rock',target:h.id,x,hit:false,chase:false})}});
    }
    ranking(){return this.horses.slice().sort((a,b)=>a.finish!==null&&b.finish!==null?a.finish-b.finish:a.finish!==null?-1:b.finish!==null?1:b.x-a.x)}
    eligible(type){const leader=this.ranking()[0]?.id;return this.horses.filter(h=>h.finish===null&&(type!=='rainbow'||(h.id!==leader&&!h.unicornObtained&&!h.pegasus))&&(type!=='pegasus'||(!h.unicornObtained&&!h.pegasus)))}
    spawn(type,final=false){const list=this.eligible(type);if(!list.length)return;const h=list[Math.floor(this.random()*list.length)],chase=type==='rainbow'||type==='pegasus';this.items.push({type,target:h.id,x:h.x+(chase?-10:final?6:12),hit:false,chase});}
    emit(h,type,extra=''){this.notices.push({target:h.id,type,text:extra||EVENTS.find(e=>e.id===type).text,at:this.time});h.events++;this.eventCount++}
    apply(h,type){
      const t=this.time,obstacle=['banana','rock','mud','puddle'].includes(type);
      if(obstacle&&h.pegasus&&!h.flightUsed){h.flightUsed=true;h.flightStart=t;h.flightUntil=t+.65;this.emit(h,type,'날개 펴고 슝! 한 번 피하기 성공');return}
      if(type==='rainbow'){
        if(!this.eligible(type).includes(h))return;
        h.unicornObtained=true;h.unicornUntil=t+.15;
      }else if(type==='pegasus'){
        if(h.unicornObtained||h.pegasus)return;h.pegasus=true;
      }else if(type==='rock')h.stunUntil=t+.2;
      else{h.effect=type;h.effectUntil=t+({banana:.85,boost:1.35,mud:1.25,spring:.8,wind:.95,carrot:1.5,puddle:.65}[type]||0);if(type==='banana')h.fallStart=t;if(type==='spring'){h.flightStart=t;h.flightUntil=t+.8}}
      this.emit(h,type);
    }
    step(dt){
      if(this.done)return;dt=Math.max(0,Math.min(dt,.1));const before=this.time;this.time+=dt;
      this.schedule.forEach(e=>{if(!e.fired&&this.time>=e.at){e.fired=true;this.spawn(e.id,e.final)}});
      const active=this.horses.filter(h=>h.finish===null),mean=active.reduce((s,h)=>s+h.x,0)/Math.max(1,active.length);
      const arrivals=[];
      this.horses.forEach(h=>{
        if(h.finish!==null)return;
        if(this.time>=h.paceAt){h.pace=7.2+this.random()*1.6;h.paceAt=this.time+.9+this.random()*1.5}
        if(this.time>=h.effectUntil)h.effect=null;
        // Gentle pack compression keeps contenders visible; it stops in the final stretch.
        const closing=h.x<206?Math.max(-.9,Math.min(.9,(mean-h.x)*.065)):0;
        let target=h.pace+closing;
        if(h.effect==='boost')target*=1.8;if(h.effect==='carrot')target*=1.32;if(h.effect==='mud')target*=.45;if(h.effect==='puddle')target*=.5;if(h.effect==='wind')target*=1.4;
        if(h.unicornUntil>this.time)target*=1.85;
        h.speed+=(target-h.speed)*Math.min(1,dt*5);
        const prev=h.x,sliding=h.effect==='banana'&&this.time-h.fallStart<.18,blocked=h.stunUntil>this.time||(h.effect==='banana'&&!sliding),unclamped=blocked?h.x:h.x+h.speed*dt*(sliding?.65:1);h.x=Math.min(this.distance,unclamped);
        this.items.forEach(item=>{if(item.hit||item.target!==h.id)return;if(item.chase)item.x+=dt*18;if((item.chase&&item.x>=h.x)||(prev<=item.x&&h.x>=item.x)){item.hit=true;this.apply(h,item.type)}});
        if(h.x>=this.distance){h.finish=before+dt*(this.distance-prev)/Math.max(.00001,unclamped-prev);arrivals.push(h)}
      });
      arrivals.sort((a,b)=>a.finish-b.finish).forEach(h=>this.arrivals.push(h.id));
      const leader=this.ranking()[0]?.id;if(leader!==this.lastLeader&&this.lastLeader>=0)this.leaderChanges++;this.lastLeader=leader;
      if((this.mode==='first'&&this.arrivals.length)||(this.mode==='last'&&this.arrivals.length===this.horses.length)){this.done=true;this.winner=this.mode==='first'?this.arrivals[0]:this.arrivals[this.arrivals.length-1]}
    }
  }
  root.HorseRaceEngine=RaceEngine;root.HORSE_EVENTS=EVENTS;
  if(typeof module!=='undefined')module.exports={RaceEngine,EVENTS};
})(typeof window!=='undefined'?window:globalThis);
