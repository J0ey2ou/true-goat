import {t} from './i18n.mjs';
const $=id=>document.getElementById(id);
export function createClaimDialog({copy,view}){
  const dialog=document.createElement('dialog');dialog.id='custom-result-dialog';dialog.className='custom-dialog';dialog.setAttribute('aria-labelledby','custom-result-title');
  dialog.innerHTML='<div class="custom-dialog-head"><h2 id="custom-result-title">这句，拿数据说话</h2><button type="button" id="custom-result-close" aria-label="关闭">×</button></div><p id="custom-result-sentence" class="custom-claim" translate="no"></p><p id="custom-result-scope" class="custom-small" translate="no"></p><p id="custom-result-evidence" translate="no"></p><p id="custom-result-caveat" class="custom-small" translate="no"></p><a id="custom-result-source" target="_blank" rel="noopener noreferrer">核查数据来源 ↗</a><p id="custom-result-honors" hidden><a href="https://www.nba.com/history/awards" target="_blank" rel="noopener noreferrer">NBA 荣誉来源 ↗</a></p><div class="custom-actions"><button type="button" class="button primary" id="custom-result-copy">复制这句话和依据</button><button type="button" class="button outline" id="custom-result-view">看看其他球员</button></div>';
  document.body.append(dialog);$('custom-result-close').onclick=()=>dialog.close();$('custom-result-copy').onclick=()=>copy($('custom-result-copy'));$('custom-result-view').onclick=()=>{dialog.close();view();};
  return {close:()=>dialog.close(),get open(){return dialog.open;},show(claim,source,{open=true}={}){
    dialog.querySelector('.custom-copy-fallback')?.remove();$('custom-result-honors').hidden=!claim.honors;
    for(const key of ['sentence','scope','evidence','caveat'])$('custom-result-'+key).textContent=claim[key];
    $('custom-result-source').hidden=!source;if(source)$('custom-result-source').href=source;
    $('custom-result-copy').textContent=t('复制这句话和依据');
    if(open&&!dialog.open)dialog.showModal();
  }};
}

export function setupCustomTour(){
  const key='true-goat-custom-tour:v3',dialog=document.createElement('dialog');dialog.className='custom-dialog custom-tour';dialog.id='custom-tour';dialog.setAttribute('aria-labelledby','custom-tour-title');
  dialog.innerHTML='<div class="custom-dialog-head"><span class="eyebrow">QUICK TOUR</span><button type="button" id="custom-tour-skip">跳过演示</button></div><p id="custom-tour-step" class="custom-small"></p><h2 id="custom-tour-title"></h2><p id="custom-tour-description"></p><div id="custom-tour-demo" class="custom-demo" aria-hidden="true"></div><p class="custom-small">动画为虚构示意，不代表真实球员纪录。</p><div class="custom-actions"><button type="button" class="button outline" id="custom-tour-back">上一步</button><button type="button" class="button primary" id="custom-tour-next">下一步</button></div>';
  document.body.append(dialog);let step=0;
  const steps=[
    ['想聊谁？先搜他的名字','选好球员，点「帮我找亮点」，看看他有哪些拿得出手的表现。想自己比？把得分、年龄等条件填好，再点「看看排第几」。',['① 搜一位球员','② 点「帮我找亮点」','③ 看表现，也看和谁比']],
    ['反过来，这种表现谁打出来过？','比如想找 25 岁前单场拿过 40 分的球员：点「这种表现谁有过」，选单场，再加上年龄和得分。最后点「找出这些球员」，名单就出来了。',['选单场表现','年龄 < 25 岁，得分 ≥ 40 分','点「找出这些球员」']],
    ['聊球有话说，也有出处','结果会帮你写成一句顺口的话，旁边能看到比赛、比较名单和来源。并列就写并列，只有一个人也会说明；分享时会把比较条件一起带上。',['一句话看懂表现','往下看比赛和比较范围','连同依据一起分享']]
  ];
  function render(){const s=steps[step];$('custom-tour-title').textContent=t(s[0]);$('custom-tour-description').textContent=t(s[1]);$('custom-tour-step').textContent=`${step+1} / ${steps.length}`;$('custom-tour-demo').replaceChildren(...s[2].map(label=>{const div=document.createElement('div');div.textContent=t(label);return div;}));$('custom-tour-back').disabled=step===0;$('custom-tour-next').textContent=t(step===2?'开始探索':'下一步');}
  function close(){try{localStorage.setItem(key,'seen');}catch{}dialog.close();}
  $('custom-tour-back').onclick=()=>{step--;render();};$('custom-tour-next').onclick=()=>{if(step===2)close();else{step++;render();}};$('custom-tour-skip').onclick=close;dialog.addEventListener('cancel',close);
  function show(){step=0;render();if(!dialog.open)dialog.showModal();}
  $('custom-tour-replay').onclick=show;
  function firstVisit(){try{if(localStorage.getItem(key))return;}catch{}if(!document.querySelector('dialog[open]'))show();}
  document.addEventListener('goat:language-ready',firstVisit,{once:true});document.addEventListener('goat:language-change',()=>{if(dialog.open)render();});firstVisit();
}
