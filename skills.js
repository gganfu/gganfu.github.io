// Internal growth index 0..59 is displayed as Lv.1..60.
window.dragonSkill=function(index){
  const level=Math.max(0,Math.min(134,index|0)),tier=level>=14?3:level>=9?2:level>=4?1:0;
  const skills=[
    {name:'불씨 브레스',color:'#ffb34b',bonus:0,range:12,cooldown:.45,particles:12},
    {name:'홍련 화염',color:'#ff5a32',bonus:8,range:14,cooldown:.42,particles:20},
    {name:'푸른 용의 숨결',color:'#58d8ff',bonus:18,range:17,cooldown:.38,particles:28},
    {name:'용왕의 황금 폭염',color:'#ffe993',bonus:35,range:21,cooldown:.34,particles:38}
  ];
  return {...skills[tier],tier,damage:12+level*2+skills[tier].bonus,aim:.65-tier*.08,next:[5,10,15,null][tier]};
};
