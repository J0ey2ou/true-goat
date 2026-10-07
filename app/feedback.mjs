import {t} from './i18n.mjs';
export function issueUrl({subject,wrong,correct,source,page,release}){
  const fields={subject,wrong,correct,source};for(const [k,v] of Object.entries(fields))if(typeof v!=='string'||!v.trim()||v.length>({subject:80,wrong:250,correct:250,source:500}[k]))throw Error('Invalid report');
  const proof=new URL(source);if(!['https:','http:'].includes(proof.protocol)||proof.username||proof.password)throw Error('Invalid source URL');
  const body=`## Data correction / 数据纠错\n\nPlayer / Field: ${subject.trim()}\n\nCurrent value / 当前错误\n${wrong.trim()}\n\nSuggested correction / 建议更正\n${correct.trim()}\n\nEvidence / 正确数据来源\n${source.trim()}\n\nPage: ${page}\nRelease: ${release||'unknown'}\n\nSubmitted for review; not an automatic data edit.`;
  const url=new URL('https://github.com/J0ey2ou/true-goat/issues/new');url.searchParams.set('title','[Data] '+subject.trim());url.searchParams.set('body',body);return url.href;
}
export function initFeedback(){
  if(document.getElementById('report-data-error'))return;
  const nav=document.querySelector('.topbar nav');
  if(nav&&![...nav.querySelectorAll('a')].some(a=>/\/custom(?:\.html)?$/.test(a.pathname))){const link=document.createElement('a');link.href='/custom';link.textContent='定制数据';nav.append(link);}
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./feedback.css',import.meta.url).href;document.head.append(css);
  const button=document.createElement('button');button.id='report-data-error';button.type='button';button.textContent='⚑ 上报数据错误';button.setAttribute('aria-haspopup','dialog');
  const dialog=document.createElement('dialog');dialog.id='feedback-dialog';dialog.setAttribute('aria-labelledby','feedback-title');
  dialog.innerHTML='<button type="button" id="feedback-close" aria-label="关闭纠错窗口">×</button><h2 id="feedback-title">帮助修正数据</h2><p>反馈将公开发布到 GitHub Issues，需登录 GitHub 并确认提交。不要填写邮箱、密码或其他私人信息。</p><form id="feedback-form"><label>球员 / 数据字段<input name="subject" maxlength="80" required></label><label>目前错误的数据<textarea name="wrong" maxlength="250" required></textarea></label><label>建议的正确数据<textarea name="correct" maxlength="250" required></textarea></label><label>正确数据的依据链接<input name="source" type="url" maxlength="500" placeholder="https://…" required></label><button class="button primary" type="submit">前往 GitHub 确认提交 ↗</button><p id="feedback-status" role="status"></p><a id="feedback-link" hidden target="_blank" rel="noopener noreferrer">打开 GitHub 纠错草稿 ↗</a></form>';
  document.body.append(button,dialog);button.onclick=()=>dialog.showModal();document.getElementById('feedback-close').onclick=()=>dialog.close();
  const form=document.getElementById('feedback-form');form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;try{
    const values=Object.fromEntries(new FormData(form));const route=location.pathname.split('/').pop()||'index.html';
    const page='https://j0ey2ou.github.io/true-goat/'+({'guess':'guess.html','players':'players.html','custom':'custom.html'}[route]||(['guess.html','players.html','custom.html'].includes(route)?route:'index.html'));
    const url=issueUrl({...values,page,release:document.querySelector('meta[name="true-goat-release"]')?.content});
    const link=document.getElementById('feedback-link');link.href=url;link.hidden=false;window.open(url,'_blank','noopener,noreferrer');
    document.getElementById('feedback-status').textContent=t('草稿已准备；请在 GitHub 点击提交。此处尚未上传成功。');
  }catch{document.getElementById('feedback-status').textContent=t('请填写完整内容，并提供有效的 http / https 来源链接。');}};
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initFeedback,{once:true});else initFeedback();}
