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
  const key='true-goat-custom-tour:v1',dialog=document.createElement('dialog');dialog.className='custom-dialog custom-tour';dialog.id='custom-tour';dialog.setAttribute('aria-labelledby','custom-tour-title');
  dialog.innerHTML='<div class="custom-dialog-head"><span class="eyebrow">QUICK TOUR</span><button type="button" id="custom-tour-skip">跳过演示</button></div><p id="custom-tour-step" class="custom-small"></p><h2 id="custom-tour-title"></h2><p id="custom-tour-description"></p><div id="custom-tour-demo" class="custom-demo" aria-hidden="true"></div><p class="custom-small">动画为虚构示意，不代表真实球员纪录。</p><div class="custom-actions"><button type="button" class="button outline" id="custom-tour-back">上一步</button><button type="button" class="button primary" id="custom-tour-next">下一步</button></div>';
  document.body.append(dialog);let step=0;
  const steps=[
    ['先选一位球员，为他找第一','想知道喜欢的球员有什么独特纪录？选球员，再选得分、助攻等维度，系统验证一组候选定语。',['球员 A','得分 / 助攻','他的候选第一']],
    ['先写条件，反过来找球员','不知道选谁？组合年龄、表现、球队或生涯荣誉。系统列出已收录范围内所有符合者，再按最高、最早或最长连续排序。',['年龄 < 25 · 得分 ≥ 30','核验已收录记录','球员 A / 球员 B']],
    ['结论是一句话，下面有依据','点击结果，查看带完整定语的结论、比较人数与数据来源。并列、单人样本和缺失数据都会明示。',['完整的一句话','对照比较名单','复制结论 + 来源']]
  ];
  function render(){const s=steps[step];$('custom-tour-title').textContent=t(s[0]);$('custom-tour-description').textContent=t(s[1]);$('custom-tour-step').textContent=`${step+1} / ${steps.length}`;$('custom-tour-demo').replaceChildren(...s[2].map(label=>{const div=document.createElement('div');div.textContent=t(label);return div;}));$('custom-tour-back').disabled=step===0;$('custom-tour-next').textContent=t(step===2?'开始探索':'下一步');}
  function close(){try{localStorage.setItem(key,'seen');}catch{}dialog.close();}
  $('custom-tour-back').onclick=()=>{step--;render();};$('custom-tour-next').onclick=()=>{if(step===2)close();else{step++;render();}};$('custom-tour-skip').onclick=close;dialog.addEventListener('cancel',close);
  function show(){step=0;render();if(!dialog.open)dialog.showModal();}
  $('custom-tour-replay').onclick=show;
  function firstVisit(){try{if(localStorage.getItem(key))return;}catch{}if(!document.querySelector('dialog[open]'))show();}
  document.addEventListener('goat:language-ready',firstVisit,{once:true});document.addEventListener('goat:language-change',()=>{if(dialog.open)render();});firstVisit();
}
