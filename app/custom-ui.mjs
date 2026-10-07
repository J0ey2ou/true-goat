import {t} from './i18n.mjs';
const $=id=>document.getElementById(id);
export function createClaimDialog({copy,view}){
  const dialog=document.createElement('dialog');dialog.id='custom-result-dialog';dialog.className='custom-dialog';dialog.setAttribute('aria-labelledby','custom-result-title');
  dialog.innerHTML='<div class="custom-dialog-head"><h2 id="custom-result-title">有依据的一句话</h2><button type="button" id="custom-result-close" aria-label="关闭">×</button></div><p id="custom-result-sentence" class="custom-claim" translate="no"></p><p id="custom-result-evidence" translate="no"></p><p id="custom-result-caveat" class="custom-small" translate="no"></p><a id="custom-result-source" target="_blank" rel="noopener noreferrer">核查数据来源 ↗</a><p id="custom-result-honors" hidden><a href="https://www.nba.com/history/awards" target="_blank" rel="noopener noreferrer">NBA 荣誉来源 ↗</a></p><div class="custom-actions"><button type="button" class="button primary" id="custom-result-copy">复制完整结论与依据</button><button type="button" class="button outline" id="custom-result-view">查看比较与其他结果</button></div>';
  document.body.append(dialog);$('custom-result-close').onclick=()=>dialog.close();$('custom-result-copy').onclick=()=>copy($('custom-result-copy'));$('custom-result-view').onclick=()=>{dialog.close();view();};
  return {close:()=>dialog.close(),get open(){return dialog.open;},show(claim,source,{open=true}={}){
    dialog.querySelector('.custom-copy-fallback')?.remove();$('custom-result-honors').hidden=!claim.honors;
    for(const key of ['sentence','evidence','caveat'])$('custom-result-'+key).textContent=claim[key];
    $('custom-result-source').hidden=!source;if(source)$('custom-result-source').href=source;
    $('custom-result-copy').textContent=t('复制完整结论与依据');
    if(open&&!dialog.open)dialog.showModal();
  }};
}

export function setupCustomTour(){
  const key='true-goat-custom-tour:v2',dialog=document.createElement('dialog');dialog.className='custom-dialog custom-tour';dialog.id='custom-tour';dialog.setAttribute('aria-labelledby','custom-tour-title');
  dialog.innerHTML='<div class="custom-dialog-head"><span class="eyebrow">QUICK TOUR</span><button type="button" id="custom-tour-skip">跳过演示</button></div><p id="custom-tour-step" class="custom-small"></p><h2 id="custom-tour-title"></h2><p id="custom-tour-description"></p><div id="custom-tour-demo" class="custom-demo" aria-hidden="true"></div><p class="custom-small">动画为虚构示意，不代表真实球员纪录。</p><div class="custom-actions"><button type="button" class="button outline" id="custom-tour-back">上一步</button><button type="button" class="button primary" id="custom-tour-next">下一步</button></div>';
  document.body.append(dialog);let step=0;
  const steps=[
    ['他在哪方面是第一？','搜一位你喜欢的球员，选得分、助攻等项目，再点「一键找定语」。不想只和同队球员比？勾选「不使用效力球队」。',['选你喜欢的球员','选择得分或助攻','看看他能拿哪些第一']],
    ['反过来，谁能做到？','比如：谁在 25 岁前单场拿过 40 分？选择「为条件找球员」，填上年龄和得分，再点「按条件寻找球员」。',['年龄 < 25 岁','单场得分 ≥ 40 分','找到符合条件的球员']],
    ['找到一句话，也能查清为什么','点开结果，看看他和谁比、在哪场比赛或哪个赛季做到。觉得有意思，就把完整结论和来源一起复制分享。',['读完整结论','查看比赛与比较名单','复制并分享']]
  ];
  function render(){const s=steps[step];$('custom-tour-title').textContent=t(s[0]);$('custom-tour-description').textContent=t(s[1]);$('custom-tour-step').textContent=`${step+1} / ${steps.length}`;$('custom-tour-demo').replaceChildren(...s[2].map(label=>{const div=document.createElement('div');div.textContent=t(label);return div;}));$('custom-tour-back').disabled=step===0;$('custom-tour-next').textContent=t(step===2?'开始探索':'下一步');}
  function close(){try{localStorage.setItem(key,'seen');}catch{}dialog.close();}
  $('custom-tour-back').onclick=()=>{step--;render();};$('custom-tour-next').onclick=()=>{if(step===2)close();else{step++;render();}};$('custom-tour-skip').onclick=close;dialog.addEventListener('cancel',close);
  function show(){step=0;render();if(!dialog.open)dialog.showModal();}
  $('custom-tour-replay').onclick=show;
  function firstVisit(){try{if(localStorage.getItem(key))return;}catch{}if(!document.querySelector('dialog[open]'))show();}
  document.addEventListener('goat:language-ready',firstVisit,{once:true});document.addEventListener('goat:language-change',()=>{if(dialog.open)render();});firstVisit();
}
