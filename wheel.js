window.dragonWheel={
  cooldown:24*60*60*1000,
  rewards:[
    {label:'꽝',weight:1000},
    {label:'시크릿 열매 3개',weight:5000,tier:3,count:3},
    {label:'디바인 열매 5개',weight:3000,tier:6,count:5},
    {label:'어드민 열매 3개',weight:500,tier:7,count:3},
    {label:'어드민 열매 5개',weight:490,tier:7,count:5},
    {label:'진화 10번',weight:10,levels:10}
  ],
  sector(index){const start=this.rewards.slice(0,index).reduce((sum,r)=>sum+r.weight,0)*.036;const end=start+this.rewards[index].weight*.036;return {start,end,center:(start+end)/2};},
  pick(random=Math.random){let ticket=Math.floor(random()*10000);for(let i=0;i<this.rewards.length;i++){ticket-=this.rewards[i].weight;if(ticket<0)return i;}return 5;},
  remaining(last,now=Date.now()){return last>0?Math.max(0,last+this.cooldown-now):0;}
};
