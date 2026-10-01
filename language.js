// Offline UI localization. Game state and coupon identifiers stay language-neutral.
(()=>{
  const languages=['ko','en','zh','ja','de'];
  const rows=[
    ['저장 내보내기','Export save','导出存档','セーブを書き出す','Spielstand exportieren'],
    ['저장 불러오기','Import save','导入存档','セーブを読み込む','Spielstand importieren'],
    ['쿠폰 코드','Coupon code','兑换码','クーポンコード','Gutscheincode'],
    ['쿠폰을 입력하세요','Enter a coupon code','请输入兑换码','コードを入力してください','Gutscheincode eingeben'],
    ['쿠폰 사용','Redeem','兑换','受け取る','Einlösen'],
    ['열매 상점','Fruit shop','果实商店','果実ショップ','Fruchtladen'],
    ['다시 시작','Restart','重新开始','最初から','Neustart'],
    ['드래곤 도감','Dragon collection','龙图鉴','ドラゴン図鑑','Drachensammlung'],
    ['아기 먹이 주기','Feed companion','喂养幼龙','子竜に餌をあげる','Begleiter füttern'],
    ['한 번에 다 먹기','Eat all','全部吃掉','まとめて食べる','Alles essen'],
    ['모험 시작하기','Start adventure','开始冒险','冒険を始める','Abenteuer starten'],
    ['돌아가기','Back','返回','戻る','Zurück'],
    ['이전','Previous','上一页','前へ','Zurück'],['다음','Next','下一页','次へ','Weiter'],
    ['취소','Cancel','取消','キャンセル','Abbrechen'],['초기화하고 시작','Reset and start','重置并开始','リセットして開始','Zurücksetzen und starten'],
    ['처음부터 다시 시작할까요?','Start over?','要重新开始吗？','最初からやり直しますか？','Neu anfangen?'],
    ['성장, 열매, 부화 중인 알과 드래곤 도감이 초기화됩니다.','Growth, fruit, incubating eggs and your collection will be reset.','成长、果实、孵化中的蛋和图鉴将被重置。','成長、果実、孵化中の卵と図鑑がリセットされます。','Wachstum, Früchte, brütende Eier und Sammlung werden zurückgesetzt.'],
    ['같은 종류는 한 칸에 모아 표시해요. 성장 단계는 이미 키운 대표 드래곤의 단계입니다.','Each species shares one entry. Growth shows its trained representative.','同种龙合并显示。成长显示已培养的代表龙。','同じ種類はまとめて表示。成長は育成済みの代表ドラゴンの段階です。','Jede Art hat einen Eintrag. Wachstum zeigt ihren trainierten Vertreter.'],
    ['작은 불씨에서, 하늘의 수호자로.','From a spark to a guardian of the skies.','从小小火苗到天空守护者。','小さな火種から、空の守護者へ。','Vom Funken zum Wächter des Himmels.'],
    ['바람이 머무는 계곡을 탐험하고','Explore the windswept valley','探索微风吹拂的山谷','風が吹く谷を探索して','Erkunde das windige Tal'],
    ['당신만의 드래곤을 성장시키세요.','Raise your own dragon.','培养属于你的龙。','自分のドラゴンを育てよう。','Ziehe deinen eigenen Drachen auf.'],
    ['작은 날개의 첫 모험','The first flight','初次冒险','小さな翼の冒険','Das erste Flugabenteuer'],
    ['황금 열매를 모아 E로 먹이세요.','Collect golden fruit and press E to eat.','收集黄金果实，按E食用。','黄金の果実を集めてEで食べよう。','Sammle Goldfrüchte und iss sie mit E.'],
    ['다섯 번 먹으면 더 큰 드래곤으로 자랍니다.','Eat five times to grow bigger.','吃五次就能长大。','5回食べると大きくなります。','Iss fünfmal, um zu wachsen.'],
    ['먹이를 줄 드래곤','Choose a companion to feed','选择要喂养的龙','餌をあげるドラゴン','Drachen zum Füttern wählen'],
    ['먼저 알을 부화시키세요','Hatch an egg first','请先孵化龙蛋','まず卵を孵化させよう','Zuerst ein Ei ausbrüten'],
    ['둥지에서 열매 1개씩 먹일 수 있어요.','Feed one fruit at a time at the nest.','可在巢中一次喂一个果实。','巣で果実を1個ずつあげられます。','Im Nest kannst du je eine Frucht füttern.'],
    ['선택한 단계 도전','Challenge selected stage','挑战所选关卡','選んだステージに挑戦','Gewählte Stufe starten'],
    ['배틀 나가기','Leave battle','离开战斗','バトルを終了','Kampf verlassen'],
    ['AI 드래곤 배틀장','AI dragon arena','AI龙竞技场','AIドラゴン闘技場','KI-Drachenarena'],
    ['AI 배틀장','AI arena','AI竞技场','AI闘技場','KI-Arena'],
    ['상대를 바라보고 SPACE로 공격하세요. 빨간 공격 예고 원을 피하세요.','Face the enemy and attack with SPACE. Avoid the red warning circle.','面向敌人按空格攻击，躲开红色警示圈。','敵を向いてSPACEで攻撃。赤い予告円を避けよう。','Zum Gegner schauen und mit SPACE angreifen. Roten Warnkreis meiden.'],
    ['진화하면 공격력과 체력이 증가합니다. 재도전은 무료입니다.','Evolution increases attack and health. Retries are free.','进化增加攻击和生命，重试免费。','進化すると攻撃力と体力が上昇。再挑戦は無料です。','Entwicklung erhöht Angriff und Leben. Wiederholungen sind kostenlos.'],
    ['게임 속 돈으로만 구매합니다. 플레이 중 부화한 모든 드래곤이 돈을 벌어요.','Use in-game money only. Hatched dragons earn money while you play.','仅使用游戏币。游玩时孵化的龙会赚钱。','ゲーム内通貨のみ使用。プレイ中は孵化したドラゴンがお金を稼ぎます。','Nur Spielgeld. Geschlüpfte Drachen verdienen während des Spielens Geld.'],
    ['강한 알·진화한 펫일수록 수입 증가! 같은 종류도 부화한 수만큼 벌어요.','Stronger and evolved pets earn more. Each hatch adds income.','越强、进化越高的宠物赚得越多，每次孵化都会增加收入。','強い卵や進化したペットほど収入増加。同じ種類も数だけ稼ぎます。','Stärkere und entwickelte Begleiter verdienen mehr. Jedes Schlüpfen erhöht das Einkommen.'],
    ['메뉴를 열거나 게임을 닫으면 수입이 멈춥니다.','Income pauses in menus and when the game is closed.','打开菜单或关闭游戏时收入暂停。','メニュー中やゲーム終了中は収入が止まります。','In Menüs und bei geschlossenem Spiel pausiert das Einkommen.'],
    ['좋은 열매부터 먹이기 · 새로 생성되는 열매에 적용','Best fruit first · luck affects newly spawned fruit','优先食用好果实 · 幸运影响新生成果实','良い果実から使用・運は新しく出現する果実に適用','Beste Früchte zuerst · Glück gilt für neue Früchte'],
    ['별빛 열매','Starlight fruit','星光果实','星光の果実','Sternenfrucht'],['어드민 열매','Admin fruit','管理员果实','アドミンの果実','Adminfrucht'],
    ['황금 열매','Golden fruit','黄金果实','黄金の果実','Goldfrucht'],['일반 열매','Common fruit','普通果实','普通の果実','Normale Frucht'],
    ['시크릿 열매','Secret fruit','秘密果实','シークレットの果実','Geheimfrucht'],['영원한 열매','Eternal fruit','永恒果实','永遠の果実','Ewigkeitsfrucht'],
    ['무지개 열매','Rainbow fruit','彩虹果实','虹の果実','Regenbogenfrucht'],['디바인 열매','Divine fruit','神圣果实','神聖な果実','Göttliche Frucht'],
    ['용의 계곡','Dragon Valley','龙之谷','竜の谷','Drachental'],['잿불 화산','Ember Volcano','余烬火山','残火の火山','Glutvulkan'],
    ['극천 빙하','Celestial Glacier','极天冰川','極天の氷河','Himmelsgletscher'],['황금 사막','Golden Desert','黄金沙漠','黄金の砂漠','Goldene Wüste'],
    ['별빛 차원','Starlight Dimension','星光维度','星光の次元','Sternendimension'],['심해 유적','Deep Sea Ruins','深海遗迹','深海遺跡','Tiefseeruinen'],
    ['고대 정글','Ancient Jungle','远古丛林','古代ジャングル','Uralter Dschungel'],['벚꽃 천계','Blossom Heaven','樱花天界','桜の天界','Kirschblütenhimmel'],
    ['혼돈 심연','Chaos Abyss','混沌深渊','混沌の深淵','Chaosabgrund'],['용왕의 불꽃 성역','Dragon King Flame Sanctuary','龙王烈焰圣域','竜王の炎の聖域','Flammenheiligtum des Drachenkönigs'],
    ['새끼 드래곤','Baby dragon','幼龙','子ドラゴン','Drachenbaby'],['고대룡','Ancient dragon','古龙','古代竜','Uralter Drache'],['어린 용','Young dragon','小龙','若い竜','Junger Drache'],['성체','Adult','成年','成体','Ausgewachsen'],['아기','Baby','幼年','赤ちゃん','Baby'],['리자몽','Charizard','喷火龙','リザードン','Glurak'],
    ['최고 속도','Top speed','最高速度','最高速度','Höchstgeschwindigkeit'],['추격 속도','Chase speed','追击速度','追跡速度','Verfolgungstempo'],['내 체력','Your HP','你的生命','自分の体力','Deine LP'],['내 속도','Your speed','你的速度','自分の速度','Dein Tempo'],['모은 열매','Collected fruit','持有果实','集めた果実','Gesammelte Früchte'],
    ['성장 후 해금','Unlock by growing','成长后解锁','成長で解放','Durch Wachstum freischalten'],['성장 자동 저장','Progress saves automatically','自动保存进度','成長は自動保存','Fortschritt automatisch gespeichert'],
    ['누적 피해','Total damage','累计伤害','累計ダメージ','Gesamtschaden'],['지원 공격','Support attack','支援攻击','支援攻撃','Unterstützungsangriff'],['기본 공격','Base attack','基础攻击','基本攻撃','Basisangriff'],['알 등급','Egg rank','蛋等级','卵ランク','Ei-Rang'],['펫 행운','Pet luck','宠物幸运','ペットの幸運','Begleiterglück'],
    ['초당 수입','Income/sec','每秒收入','毎秒収入','Einkommen/Sek.'],['보유','Owned','持有','所持','Besitz'],['성장','Growth','成长','成長','Wachstum'],['비행','Flight','飞行','飛行','Flug'],['달리기','Sprint','奔跑','ダッシュ','Sprint'],['이동','Move','移动','移動','Bewegen'],['먹이 주기','Feed','喂养','餌やり','Füttern'],
    ['배틀장','Arena','竞技场','闘技場','Arena'],['배틀','Battle','战斗','バトル','Kampf'],['드래곤','Dragon','龙','ドラゴン','Drache'],['수호룡','Guardian','守护龙','守護竜','Wächterdrache'],['용왕','Dragon King','龙王','竜王','Drachenkönig'],
    ['세계','World','世界','世界','Welt'],['단계','Stage','阶段','段階','Stufe'],['페이지','Page','页','ページ','Seite'],['필요','Required','需要','必要','Benötigt'],['완료','Complete','完成','完了','Abgeschlossen'],['해금','Unlock','解锁','解放','Freischalten'],['상대','Enemy','敌人','相手','Gegner'],['피해','Damage','伤害','ダメージ','Schaden'],['사거리','Range','射程','射程','Reichweite'],['보상','Reward','奖励','報酬','Belohnung'],['대표','Representative','代表','代表','Vertreter'],['미발견','Undiscovered','未发现','未発見','Unentdeckt'],['발견','Discovered','已发现','発見','Entdeckt'],['최종','Final','最终','最終','Final'],['일반','Common','普通','一般','Normal'],['희귀','Rare','稀有','レア','Selten'],['영웅','Epic','史诗','エピック','Episch'],['전설','Legendary','传说','伝説','Legendär'],['신화','Mythic','神话','神話','Mythisch'],['화염','Flame','火焰','炎','Flamme'],['열매','Fruit','果实','果実','Frucht'],['둥지','Nest','巢穴','巣','Nest'],['부화','Hatching','孵化','孵化','Brüten'],['지원','Support','支援','支援','Unterstützung'],['공격','Attack','攻击','攻撃','Angriff'],['방어','Defense','防御','防御','Verteidigung'],['속도','Speed','速度','速度','Tempo']
  ];
  rows.push(
    ['글라이드 모드: 끔','Glide mode: OFF','滑翔模式：关闭','滑空モード：オフ','Gleitmodus: AUS'],
    ['글라이드 모드: 켬','Glide mode: ON','滑翔模式：开启','滑空モード：オン','Gleitmodus: EIN'],
    ['여행하기','Travel','旅行','旅に出る','Reisen'],['여행 끝내기','Return from trip','结束旅行','旅から戻る','Reise beenden'],
    ['출발 섬','Starting island','起始岛','出発の島','Startinsel'],['상승','Ascend','上升','上昇','Aufsteigen'],['하강','Descend','下降','下降','Sinken'],['착륙','Land','降落','着陸','Landen'],['이륙','Take off','起飞','離陸','Abheben'],
    ['24시간 돌림판','Daily wheel','每日转盘','24時間ルーレット','Tägliches Glücksrad'],
    ['24시간 무료 돌림판','Free 24-hour wheel','24小时免费转盘','24時間無料ルーレット','Kostenloses 24-Stunden-Glücksrad'],
    ['무료로 돌리기','Spin for free','免费转动','無料で回す','Kostenlos drehen'],
    ['꽝','No prize','未中奖','はずれ','Niete'],
    ['지금 무료로 돌릴 수 있어요!','Your free spin is ready!','现在可以免费转动！','無料で回せます！','Dein kostenloser Dreh ist bereit!'],
    ['다음 돌림판까지','Next spin in','距离下次转盘','次のルーレットまで','Nächster Dreh in'],
    ['돌리는 중…','Spinning…','转动中…','回転中…','Dreht sich…'],
    ['결과 저장 완료','Result saved','结果已保存','結果を保存しました','Ergebnis gespeichert'],
    ['판의 칸 크기는 확률과 무관합니다. 위 확률로 추첨합니다.','Segment sizes do not represent odds. The listed odds apply.','转盘格子大小不代表概率，以列出的概率为准。','区画の大きさは確率を表しません。表示確率で抽選します。','Feldgrößen entsprechen nicht den Chancen. Es gelten die angegebenen Wahrscheinlichkeiten.'],
    ['진화 보상은 최대 Lv.135까지 적용됩니다.','Evolution rewards stop at Lv.135.','进化奖励最多提升至Lv.135。','進化報酬はLv.135が上限です。','Entwicklungsbelohnungen enden bei Lv.135.'],
    ['오프라인에서는 PC 시간을 기준으로 24시간을 계산합니다.','Offline cooldown uses your PC clock.','离线冷却时间使用电脑时钟。','オフラインではPCの時計で待ち時間を計算します。','Offline wird die PC-Uhr für die Wartezeit verwendet.'],
    ['숲','Forest','森林','森','Wald'],['바다','Sea','海洋','海','Meer'],['번개','Lightning','闪电','雷','Blitz'],['벚꽃','Cherry Blossom','樱花','桜','Kirschblüte'],['태양','Sun','太阳','太陽','Sonne'],['무지개','Rainbow','彩虹','虹','Regenbogen'],
    ['용암','Lava','熔岩','溶岩','Lava'],['지옥불','Hellfire','地狱火','地獄の炎','Höllenfeuer'],['홍련','Crimson','红莲','紅蓮','Purpur'],['유성','Meteor','流星','流星','Meteor'],['심연','Abyss','深渊','深淵','Abgrund'],['창세','Genesis','创世','創世','Schöpfung'],
    ['빙하','Glacier','冰川','氷河','Gletscher'],['오로라','Aurora','极光','オーロラ','Polarlicht'],['빙정','Ice Crystal','冰晶','氷晶','Eiskristall'],['혜성','Comet','彗星','彗星','Komet'],['천공','Sky','天空','天空','Himmel'],['극천','Celestial','极天','極天','Himmels'],
    ['모래','Sand','沙','砂','Sand'],['사암','Sandstone','砂岩','砂岩','Sandstein'],['황금','Golden','黄金','黄金','Gold'],['스핑크스','Sphinx','斯芬克斯','スフィンクス','Sphinx'],['왕관','Crown','王冠','王冠','Krone'],['황금신','Golden Deity','黄金神','黄金神','Goldgott'],
    ['별가루','Stardust','星尘','星屑','Sternenstaub'],['초신성','Supernova','超新星','超新星','Supernova'],['월식','Lunar Eclipse','月食','月食','Mondfinsternis'],['우주','Cosmos','宇宙','宇宙','Kosmos'],['차원','Dimension','维度','次元','Dimension'],['우주신','Cosmic Deity','宇宙神','宇宙神','Kosmischer Gott'],
    ['파수꾼','Watcher','哨兵','見張り','Wächter'],['군주','Lord','领主','君主','Fürst'],['폭군','Tyrant','暴君','暴君','Tyrann'],['수호신','Guardian Deity','守护神','守護神','Schutzgott'],
    ['무료','Free','免费','無料','Kostenlos'],['진화','Evolution','进化','進化','Entwicklung'],['회피','Dodge','闪避','回避','Ausweichen'],['살금살금','Sneak','潜行','忍び歩き','Schleichen'],['초당','Per second','每秒','毎秒','Pro Sekunde'],['구매 완료','Purchased','购买成功','購入完了','Gekauft'],
    ['올바른 쿠폰 코드를 입력하세요.','Enter a valid coupon code.','请输入有效兑换码。','有効なコードを入力してください。','Gültigen Gutscheincode eingeben.'],
    ['아직 사용한 쿠폰이 없습니다. 코드를 입력하세요.','No coupons used yet. Enter a code.','尚未使用兑换码，请输入。','未使用です。コードを入力してください。','Noch keine Gutscheine verwendet. Code eingeben.'],
    ['이 저장 데이터에서 받은 쿠폰:','Redeemed in this save:','本存档已兑换：','このセーブで使用済み：','In diesem Spielstand eingelöst:'],
    [' 쿠폰은 이 저장 데이터에 이미 보상이 지급되었습니다. 다른 코드를 입력하세요.',' has already been redeemed in this save. Enter another code.',' 已在此存档兑换，请输入其他兑换码。',' は使用済みです。別のコードを入力してください。',' wurde bereits eingelöst. Anderen Code eingeben.'],
    ['개를 받았어요!',' received!','个已获得！','個を受け取りました！',' erhalten!'],['내 둥지','Your nest','你的巢穴','自分の巣','Dein Nest'],['추격 중!','Chasing!','追击中！','追跡中！','Verfolgung!'],['최강 수호룡: 북쪽 끝 계단 위','Strongest guardian: stairs at the north edge','最强守护龙：北端阶梯上','最強の守護竜：北端の階段の上','Stärkster Wächter: Treppe am Nordrand'],
    ['F로 이륙','F to take off','按F起飞','Fで離陸','F zum Abheben'],['비행 중','Flying','飞行中','飛行中','Im Flug'],['준비 완료 · SPACE를 누르고 연속 공격','Ready · Hold SPACE to attack','就绪 · 按住空格连续攻击','準備完了・SPACE長押しで連続攻撃','Bereit · SPACE für Dauerangriff halten'],
    ['빨간 원 밖으로 피하세요!','Get out of the red circle!','躲开红圈！','赤い円から離れよう！','Verlasse den roten Kreis!'],['돈이 부족해요. 부화한 드래곤이 돈을 벌어옵니다!','Not enough money. Hatched dragons earn more!','金币不足，孵化的龙会赚钱！','お金が足りません。孵化したドラゴンが稼ぎます！','Nicht genug Geld. Geschlüpfte Drachen verdienen mehr!']
  );
  let lang='ko';try{const saved=localStorage.getItem('dragon-language');if(languages.includes(saved))lang=saved;}catch{}
  const lookup=new Map(rows.map(row=>[row[0],row]));
  const pattern=new RegExp(rows.map(r=>r[0]).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
  function translate(text){if(lang==='ko')return text;return String(text).replace(pattern,key=>lookup.get(key)[languages.indexOf(lang)]);}
  window.gameLanguage={translate,get:()=>lang};
  const box=document.createElement('div');box.id='languageBox';box.style.cssText='position:fixed;right:16px;bottom:110px;z-index:40;background:#18313c;padding:8px;border-radius:8px';
  const select=document.createElement('select');select.setAttribute('aria-label','Language');select.style.cssText='padding:8px;background:#173d43;color:white;max-width:160px';
  [['ko','한국어'],['en','English'],['zh','中文（简体）'],['ja','日本語'],['de','Deutsch']].forEach(([code,label])=>{const option=document.createElement('option');option.value=code;option.textContent=label;select.appendChild(option);});
  select.value=lang;box.appendChild(select);document.body.appendChild(box);
  const originals=new WeakMap();
  function refresh(root){
    if(root.nodeType===1&&root.closest('script,style,#languageBox'))return;
    if(root.nodeType===3){
      if(root.parentElement?.closest('script,style,#languageBox'))return;
      let record=originals.get(root);if(!record||root.nodeValue!==record.output)record={source:root.nodeValue};
      record.output=translate(record.source);originals.set(root,record);if(root.nodeValue!==record.output)root.nodeValue=record.output;return;
    }
    for(const child of root.childNodes||[])refresh(child);
  }
  const options={subtree:true,childList:true,characterData:true};
  const observer=new MutationObserver(records=>{observer.disconnect();for(const record of records)refresh(record.target);observer.observe(document.body,options);});
  function apply(){observer.disconnect();document.documentElement.lang=lang==='zh'?'zh-CN':lang;refresh(document.body);observer.observe(document.body,options);window.dispatchEvent(new Event('game-language-change'));}
  select.onchange=()=>{lang=select.value;try{localStorage.setItem('dragon-language',lang);}catch{}apply();};
  apply();
})();
