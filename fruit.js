window.fruitRules={
  types:[{name:'일반 열매',color:'#ba9264',growth:1},{name:'황금 열매',color:'#ffc746',growth:3},{name:'별빛 열매',color:'#bb8aff',growth:6},{name:'시크릿 열매',color:'#ff78cf',growth:10,price:1111111},{name:'영원한 열매',color:'#81ffe0',growth:50,price:5555555},{name:'무지개 열매',color:'#ffbaee',growth:70,price:7777777},{name:'디바인 열매',color:'#fff3ab',growth:80,price:8888888},{name:'어드민 열매',color:'#ff6c59',growth:100,price:9999999}],
  chances(power=0){const p=Math.max(0,(power<=27?Math.min(27,power):27+Math.min(12,power-27)*.25));return {gold:.12+p*.012,star:.03+p*.008,multiple:.08+p*.025};},
  roll(power,rng=Math.random){const c=this.chances(power),r=rng(),tier=r<c.star?2:r<c.star+c.gold?1:0;
    const multiple=rng()<c.multiple;return {tier,count:multiple?(rng()<.25?3:2):1};}
};
