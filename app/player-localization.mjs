import {PLAYER_NAMES} from './player-name-data.mjs';
const han=/\p{Script=Han}/u;
const text=value=>typeof value==='string'&&value.trim()?value.trim():null;
const latin=value=>text(value)&&!han.test(value)?value.trim():null;

/** Display labels only: IDs, original names and statistical/source facts stay intact. */
export function decoratePlayerIdentity(player) {
  const id=player.id||player.player_id;
  const reviewed=PLAYER_NAMES[id]||{};
  const original=text(player.name)||text(player.player_name)||'';
  const aliases=[...new Set([...(player.aliases||[]),...(reviewed.aliases||[])])];
  const chineseName=text(reviewed.chineseName)||text(player.chineseName)||text(player.nameZh)||(han.test(original)?original:null);
  const englishName=latin(player.englishName)||latin(player.nameEn)||latin(original)||latin(reviewed.englishName);
  return {...player,chineseName,englishName,aliases,nameTranslationStatus:{chinese:!!chineseName,english:!!englishName}};
}

export function playerNameLabel(player,locale='zh-CN') {
  const p=decoratePlayerIdentity(player);
  return locale==='en'?(p.englishName||p.name||p.player_name||'—'):(p.chineseName||p.name||p.player_name||'—');
}

export function playerNameNote(player,locale='zh-CN') {
  const p=decoratePlayerIdentity(player);
  if(locale==='en'&&!p.englishName)return 'English name unverified; original name retained.';
  if(locale!=='en'&&!p.chineseName)return '中文译名未核实，保留原文姓名。';
  return '';
}

// Exact field values only, so original sources, URLs, user input and free prose remain intact.
export const CHINESE_FIELDS=Object.freeze(Object.fromEntries(`
Atlanta Hawks|亚特兰大老鹰
Boston Celtics|波士顿凯尔特人
Brooklyn Nets|布鲁克林篮网
Charlotte Hornets|夏洛特黄蜂
Chicago Bulls|芝加哥公牛
Cleveland Cavaliers|克利夫兰骑士
Dallas Mavericks|达拉斯独行侠
Denver Nuggets|丹佛掘金
Detroit Pistons|底特律活塞
Golden State Warriors|金州勇士
Houston Rockets|休斯顿火箭
Indiana Pacers|印第安纳步行者
Los Angeles Clippers|洛杉矶快船
Los Angeles Lakers|洛杉矶湖人
Memphis Grizzlies|孟菲斯灰熊
Miami Heat|迈阿密热火
Milwaukee Bucks|密尔沃基雄鹿
Minnesota Timberwolves|明尼苏达森林狼
New Orleans Pelicans|新奥尔良鹈鹕
New York Knicks|纽约尼克斯
Oklahoma City Thunder|俄克拉荷马城雷霆
Orlando Magic|奥兰多魔术
Philadelphia 76ers|费城76人
Phoenix Suns|菲尼克斯太阳
Portland Trail Blazers|波特兰开拓者
Sacramento Kings|萨克拉门托国王
San Antonio Spurs|圣安东尼奥马刺
Toronto Raptors|多伦多猛龙
Utah Jazz|犹他爵士
Washington Wizards|华盛顿奇才
Seattle SuperSonics|西雅图超音速
New Jersey Nets|新泽西篮网
Vancouver Grizzlies|温哥华灰熊
Washington Bullets|华盛顿子弹
Minneapolis Lakers|明尼阿波利斯湖人
Philadelphia Warriors|费城勇士
San Francisco Warriors|旧金山勇士
Fort Wayne Pistons|韦恩堡活塞
Syracuse Nationals|锡拉丘兹民族
Rochester Royals|罗切斯特皇家
Cincinnati Royals|辛辛那提皇家
Kansas City Kings|堪萨斯城国王
Kansas City-Omaha Kings|堪萨斯城–奥马哈国王
St. Louis Hawks|圣路易斯老鹰
Milwaukee Hawks|密尔沃基老鹰
Tri-Cities Blackhawks|三城黑鹰
Buffalo Braves|布法罗勇敢者
San Diego Clippers|圣迭戈快船
San Diego Rockets|圣迭戈火箭
New Orleans Jazz|新奥尔良爵士
Charlotte Bobcats|夏洛特山猫
New Orleans Hornets|新奥尔良黄蜂
Baltimore Bullets|巴尔的摩子弹
Capital Bullets|首都子弹
China|中国
United States|美国
USA|美国
Canada|加拿大
France|法国
Spain|西班牙
Serbia|塞尔维亚
Greece|希腊
Germany|德国
Slovenia|斯洛文尼亚
Australia|澳大利亚
Argentina|阿根廷
Brazil|巴西
Turkey|土耳其
Lithuania|立陶宛
Latvia|拉脱维亚
Croatia|克罗地亚
Montenegro|黑山
Finland|芬兰
Italy|意大利
Senegal|塞内加尔
Nigeria|尼日利亚
Cameroon|喀麦隆
Democratic Republic of the Congo|刚果民主共和国
South Sudan|南苏丹
Japan|日本
South Korea|韩国
New Zealand|新西兰
Bahamas|巴哈马
Dominican Republic|多米尼加共和国
Puerto Rico|波多黎各
Taiwan|中国台湾
Hong Kong|中国香港
`.trim().split('\n').map(line=>line.split('|'))));
