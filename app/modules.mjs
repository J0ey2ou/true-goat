/** Versioned, independent additive modules. No rescaling or fitted coefficients. */
import { DIMENSIONS, sanitizeCoefficients, scorePlayer, rankPlayers } from './model.mjs';

export const MODULE_VERSION = 1;
const finite = v => typeof v === 'number' && Number.isFinite(v);
const clamp = v => finite(v) ? Math.max(0, Math.min(10, v)) : 1;
const raw = (key,label,section,field,center,unit,unitLabel,formula,overlaps,coverageField) => ({key,label,kind:'stat',section,field,center,unit,unitLabel,formula,overlaps,coverageField,
  cutoff:section==='careerPO'?'季后赛数据源截至 2023–24，现役者不是完整生涯':section==='careerRS'?'常规赛数据源截至 2025–26；按球员实际记录末赛季展示':'荣誉/球队快照，来源更新截止不同，主要截至 2025–26；不是实时统计',
  source:section==='careerRS'?'球员库 / 常规赛汇总（Sumitrodatta NBA / BAA 数据）':section==='careerPO'?'球员库 / 季后赛生涯汇总（多来源，截止 2024）':'球员库 / awards.csv 与 team_success.csv 汇总',
  definition:section==='careerRS' && field!=='ts'?'逐场累计总量 ÷ 对应出场数；拒绝指标场次覆盖不完整的数据。':section==='careerPO'?'按该项有记录赛季的出场数加权汇总；部分来源为重建/舍入的场均数，因此是近似值，不视为完整生涯。':field==='ts'?'真实命中率：PTS ÷ [2 × (FGA + 0.44 × FTA)]；未做时代或角色调整。':'直接使用档案中的次数；次数 0 是已记录值，不把缺失改为 0。'+(field==='mvp'?'MVP 始于 1955–56，早期球员没有相同获奖机会。':field==='finalsMvp'?'FMVP 始于 1969，之前的总决赛没有该奖项；未做奖项机会校正。':field==='dpoy'?'DPOY 始于 1982–83，早期球员没有相同获奖机会。':''),
  missing:'缺失时贡献为 0（中性填补），不是原始统计为 0；所有已启用项均缺失则不评分。'});
export const MODULES = Object.freeze([
  raw('rs_ppg','常规赛场均得分','careerRS','ppg',15,5,'分 / 场','β × (场均得分 − 15) ÷ 5',['regular_season'],'points'),
  raw('rs_apg','常规赛场均助攻','careerRS','apg',3,2,'次 / 场','β × (场均助攻 − 3) ÷ 2',['regular_season'],'assists'),
  raw('rs_rpg','常规赛场均篮板','careerRS','rpg',5,3,'个 / 场','β × (场均篮板 − 5) ÷ 3',['regular_season'],'rebounds'),
  raw('rs_ts','常规赛真实命中率','careerRS','ts',0.55,0.05,'比例（显示为百分比）','β × (TS − 0.55) ÷ 0.05',['regular_season']),
  raw('po_ppg','季后赛场均得分','careerPO','ppg',15,5,'分 / 场','β × (季后赛场均得分 − 15) ÷ 5',['playoffs']),
  raw('mvp','常规赛 MVP 次数','awards','mvp',0,1,'次','β × MVP 次数',['awards']),
  raw('finals_mvp','总决赛 MVP 次数','awards','finalsMvp',0,1,'次','β × FMVP 次数',['awards','team_success']),
  raw('dpoy','最佳防守球员次数','awards','dpoy',0,1,'次','β × DPOY 次数',['awards','defense']),
  raw('all_nba','最佳阵容次数','awards','allNba',0,3,'次','β × 最佳阵容次数 ÷ 3（各阵合计）',['awards']),
  raw('titles','总冠军次数','awards','championships',0,1,'次','β × 总冠军次数（不推断队内贡献）',['team_success']),
  {key:'honors',label:'荣誉综合积分（固定子权重）',kind:'honors',unitLabel:'约定荣誉点',formula:'β × (2×MVP + 1.5×FMVP + 0.75×DPOY + 0.25×最佳阵容 + 0.1×最佳防守阵容)',
    definition:'子权重为固定产品约定，用户只调整外部系数 β；不是联盟官方分值或拟合真理。5 项记录必须全部存在；最佳阵容按一二三阵合计。MVP 始于 1955–56、FMVP 始于 1969、DPOY 始于 1982–83、最佳防守阵容始于 1968–69，未校正不同年代的奖项机会。',cutoff:'采用球员库荣誉快照，各来源更新截止不同，主要截至 2025–26。',source:'球员库 / awards.csv 汇总',missing:'任一组成次数缺失，整个模块中性贡献 0。',overlaps:['awards','defense','team_success']},
  {key:'peak_playoffs',label:'巅峰 × 季后赛协同',kind:'interaction',parents:['peak','playoffs'],unitLabel:'协同指数点',formula:'β × max((巅峰−50)/10, 0) × max((季后赛−50)/10, 0) ÷ 5',definition:'只奖励两项均高于中性基准；任一低于 50 则协同为 0，避免负负得正。除以 5 使两项均为 100 时指数为 5。它是新增的显式偏好，不是因果关系或胜率。',cutoff:'沿用七维数据快照，季后赛截至 2024。',source:'基础七维指数的确定性变换',missing:'任一源维度缺失，整个协同项中性贡献 0。',overlaps:['peak','playoffs']},
  {key:'offense_defense',label:'常规赛 × 防守协同',kind:'interaction',parents:['regular_season','defense'],unitLabel:'协同指数点',formula:'β × max((常规赛−50)/10, 0) × max((防守−50)/10, 0) ÷ 5',definition:'只奖励两项同时高于中性基准；防守数据有时代缺失，不把数据可用性误作防守能力。它是可选偏好项，仍逐项加到总分。',cutoff:'沿用七维数据快照，早期防守覆盖不同。',source:'基础七维指数的确定性变换',missing:'任一源维度缺失，整个协同项中性贡献 0。',overlaps:['regular_season','defense']},
].map(m=>Object.freeze(m)));

export function sanitizeAdvanced(value = {}) {
  return {v:MODULE_VERSION,enabled:value?.enabled===true,disabledBase:DIMENSIONS.map(d=>d.key).filter(key=>Array.isArray(value?.disabledBase)&&value.disabledBase.includes(key)),modules:Object.fromEntries(MODULES.map(m=>[m.key,{enabled:value?.modules?.[m.key]?.enabled===true,coefficient:clamp(value?.modules?.[m.key]?.coefficient)}]))};
}
export function effectiveCoefficients(coefficients, advanced) {
  const safe=sanitizeCoefficients(coefficients),state=sanitizeAdvanced(advanced);
  if(state.enabled)for(const key of state.disabledBase)safe[key]=0;
  return safe;
}
export function evaluateModule(module,player,profile) {
  let value=null,z=null,reason='',cutoff=module.cutoff;
  if(module.kind==='interaction'){
    const values=module.parents.map(key=>player?.components?.[key+'_score']);
    if(values.every(finite))value=z=values.reduce((p,x)=>p*Math.max((x-50)/10,0),1)/5;
    else reason='源维度缺失';
  }else if(module.kind==='honors'){
    const items=[['mvp',2],['finalsMvp',1.5],['dpoy',.75],['allNba',.25],['allDefense',.1]];
    if(items.every(([key])=>finite(profile?.awards?.[key])))value=z=items.reduce((sum,[key,w])=>sum+profile.awards[key]*w,0);
    else reason='荣誉组成记录不完整';
  }else{
    const section=profile?.[module.section];
    value=finite(section?.[module.field])?section[module.field]:null;
    if(module.coverageField && value!==null && !(finite(section?.games)&&section.games>0&&section.metricCoverageGames?.[module.coverageField]===section.games)){
      value=null;reason='指标出场覆盖不足，未将部分记录视作完整场均值';
    }
    if(module.section==='careerRS' || module.section==='careerPO'){
      if(!finite(section?.games)||section.games<=0){value=null;reason='没有对应比赛记录';}
      const through=profile?.coverage?.[module.section==='careerRS'?'regularSeasonThrough':'playoffsThrough'];
      cutoff+=(Number.isFinite(through)?'；该球员末个已收录赛季结束年 '+through:'');
    }
    if(value!==null)z=(value-module.center)/module.unit;
  }
  return {raw:value,z,missing:z===null,reason:reason||(z===null?'缺少观测记录':''),cutoff};
}
export function scoreWithModules(player,coefficients,priorCoefficient=0,advanced={},profile=null) {
  const state=sanitizeAdvanced(advanced),safe=effectiveCoefficients(coefficients,state),basic=scorePlayer(player,safe,priorCoefficient);
  const terms=DIMENSIONS.filter(d=>safe[d.key]>0).map(d=>({key:d.key,label:d.label,coefficient:safe[d.key],raw:finite(player?.components?.[d.key+'_score'])?player.components[d.key+'_score']:null,z:finite(player?.components?.[d.key+'_score'])?(player.components[d.key+'_score']-50)/10:null,contribution:basic.contributions[d.key],missing:!finite(player?.components?.[d.key+'_score']),unitLabel:'七维指数（0–100）',formula:'β × (指数 − 50) ÷ 10',cutoff:'基础模型快照；季后赛截至 2024'}));
  if(basic.priorCoefficient>0)terms.push({key:'public_prior',label:'大众参考',coefficient:basic.priorCoefficient,raw:basic.priorScore,z:basic.priorMissing?null:(basic.priorScore-50)/10,contribution:basic.priorContribution,missing:basic.priorMissing,unitLabel:'大众参考指数（0–100）',formula:'γ × (大众参考 − 50) ÷ 10',cutoff:'已收录媒体榜单快照'});
  if(state.enabled)for(const module of MODULES){
    const setting=state.modules[module.key];if(!setting.enabled||setting.coefficient<=0)continue;
    const evaluated=evaluateModule(module,player,profile);
    terms.push({key:module.key,label:module.label,coefficient:setting.coefficient,...evaluated,contribution:evaluated.missing?0:setting.coefficient*evaluated.z,unitLabel:module.unitLabel,formula:module.formula});
  }
  const activeMass=terms.reduce((s,t)=>s+t.coefficient,0),observedMass=terms.filter(t=>!t.missing).reduce((s,t)=>s+t.coefficient,0);
  const score=activeMass>0&&observedMass===0?null:50+terms.reduce((s,t)=>s+t.contribution,0);
  // Do not export the basic engine's ambiguously named subtotal/map as if they
  // contained every active module. Basic model.mjs itself stays unchanged.
  const {dataScore:basicDimensionsScoreIncludingIntercept,contributions:basicDimensionContributions,...baseDetails}=basic;
  return {...baseDetails,score:state.enabled?score:basic.score,basicDimensionsScoreIncludingIntercept,basicDimensionContributions,
    activeTermContributions:Object.fromEntries(terms.map(t=>[t.key,t.contribution])),
    fieldDefinitions:{score:'完整当前模型的最终分；50 + 所有实际启用项贡献。所有启用项都缺失时为 null。',basicDimensionsScoreIncludingIntercept:'仅基础七维的诊断小计（含固定起点 50），不含大众参考或新增模块；不是高级模型总分，也不表示数据完整。',basicDimensionContributions:'仅七个基础维度的贡献；停用项为 0，不含大众参考或新增模块。',activeTermContributions:'所有实际启用项的完整贡献映射，包含启用的大众参考和新增模块；不含固定起点 50。各项观测值、是否缺失和公式见 termDetails。',coverage:'按独立系数加权的已观测数据覆盖率，不是概率、置信度或比赛胜率。'},
    termDetails:terms,coverage:activeMass?observedMass/activeMass:1,missingModules:terms.filter(t=>t.missing).map(t=>t.key),advancedEnabled:state.enabled};
}
export function rankWithModules(players,coefficients,priorCoefficient=0,advanced={},directory=new Map()) {
  if(!advanced?.enabled)return rankPlayers(players,coefficients,priorCoefficient);
  const rows=players.map(p=>({...p,...scoreWithModules(p,coefficients,priorCoefficient,advanced,directory.get(p.player_id))}));
  const key=p=>finite(p.score)?Math.round(p.score*1e9):null;
  rows.sort((a,b)=>key(a)===key(b)?String(a.player_name??'').localeCompare(String(b.player_name??''),'en')||String(a.player_id??'').localeCompare(String(b.player_id??''),'en'):key(a)===null?1:key(b)===null?-1:key(b)-key(a));
  let previous=null,rank=null;
  return rows.map((p,i)=>{const k=key(p);rank=k===null?null:k===previous?rank:i+1;previous=k;return {...p,rank};});
}
export function overlapWarnings(coefficients,advanced) {
  const state=sanitizeAdvanced(advanced);if(!state.enabled)return [];
  const safe=effectiveCoefficients(coefficients,state),selected=MODULES.filter(m=>state.modules[m.key].enabled&&state.modules[m.key].coefficient>0),warnings=[];
  for(const m of selected){const parents=(m.overlaps||[]).filter(k=>safe[k]>0).map(k=>DIMENSIONS.find(d=>d.key===k).label);if(parents.length)warnings.push(m.label+' 与 '+parents.join('、')+' 使用重叠信息；会重复强调这一偏好。');}
  if(selected.some(m=>m.key==='honors')&&selected.some(m=>['mvp','finals_mvp','dpoy','all_nba'].includes(m.key)))warnings.push('荣誉积分已含 MVP、FMVP、DPOY 和最佳阵容，再启用次数模块会重复计入。');
  return warnings;
}
