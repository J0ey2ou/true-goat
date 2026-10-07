// Export only the default online clue facts into SQL for project-owner install.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=JSON.parse(await readFile(path.join(root,'app/data/guess-players.json'),'utf8'));
const keys=['id','name','chineseName','pools','teams','teamsComplete','positions','birthYear','heightCm','firstSeasonYear','firstSeasonScope','teamCount','playoffAppearances','finalsAppearances','pointsPerGame','mvpCount'];
const people=source.players.map(player=>{
  const data=Object.fromEntries(keys.map(key=>[key,player[key]??null]));
  data.teams=(data.teams||[]).map(({id,name})=>({id,name}));
  data.metricCoverage=Object.fromEntries(['teamCount','playoffAppearances','finalsAppearances','pointsPerGame','mvpCount'].filter(k=>player[k]!==null).map(k=>[k,Object.fromEntries(['scope','throughSeason','complete'].map(f=>[f,player.metricCoverage[k]?.[f]??null]))]));
  return data;
});
const dir=path.join(root,'output','arena-setup');await mkdir(dir,{recursive:true});
const sql=['begin;'];
for(let offset=0;offset<people.length;offset+=250){
  const value=JSON.stringify(people.slice(offset,offset+250)).replaceAll("'","''");
  sql.push(`insert into goat_private.players(id,version,data) select x->>'id','${source.version}',x from jsonb_array_elements('${value}'::jsonb) x on conflict(id) do update set version=excluded.version,data=excluded.data;`);
}
sql.push('commit;');
const seed=sql.join('\n');await writeFile(path.join(dir,'02-player-seed.sql'),seed);
let token;
try{const saved=JSON.parse(await readFile(path.join(dir,'install-token.json'),'utf8'));if(saved.version===source.version)token=saved.token;}catch{try{const previous=await readFile(path.join(dir,'在线功能安装.html'),'utf8');token=previous.match(/,token="([a-f0-9]{64})",version=/)?.[1];}catch{}}
token ||= randomBytes(32).toString('hex');
await writeFile(path.join(dir,'install-token.json'),JSON.stringify({version:source.version,token}));
const hash=createHash('sha256').update(token).digest('hex');
const upgradeSql=await readFile(path.join(root,'supabase/migrations/202610070002_multiplayer.sql'),'utf8');
const schema=(await readFile(path.join(root,'supabase/migrations/202610070001_arena.sql'),'utf8'))+'\n'+upgradeSql;
await writeFile(path.join(dir,'03-multiplayer.sql'),upgradeSql);
const installSql=schema+`\ninsert into goat_private.install_settings(singleton,token_hash,expires_at,version,active) values(true,'${hash}',now()+interval '2 hours','${source.version}',true) on conflict(singleton) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,version=excluded.version,active=true;\n`;
await writeFile(path.join(dir,'01-backend.sql'),installSql);
const config=await import('../app/online-config.mjs');
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>True GOAT 在线功能安装</title><style>body{font:16px/1.8 system-ui,'Microsoft YaHei';max-width:850px;margin:35px auto;padding:0 22px;background:#f5f7fa;color:#182640}section{background:white;padding:24px;border:1px solid #dde3ea;border-radius:12px;margin:20px 0}button,a{font:inherit}button{padding:11px 18px;cursor:pointer;border:0;border-radius:6px;background:#096d78;color:white;margin:8px 8px 8px 0}textarea{width:100%;height:280px;font:12px/1.5 monospace}#status{white-space:pre-wrap}p{margin:12px 0}</style><h1>开通账号、1v1 与天梯</h1><p>项目：qtfmrczwxinizmqgkebh · 题库 ${source.version} · ${people.length} 位球员</p><section><h2>1. 创建数据库结构</h2><p>点击复制 SQL，在 <a href="https://supabase.com/dashboard/project/qtfmrczwxinizmqgkebh/sql/new" target="_blank">Supabase SQL Editor</a> 中粘贴并点击 Run。包含账号档案、受权限控制的对局和积分结算。</p><button id="copy">复制安装 SQL</button><textarea id="schema" readonly></textarea><p>请在两小时内完成下一步。此安装页面含临时题库导入授权，仅用于你的项目，完成导入后自动失效。</p></section><section><h2>2. 导入球员题库</h2><p>数据库 SQL 执行成功后，点击此按钮。将分批导入 ${people.length} 位球员的默认线索数据。</p><button id="import">导入题库并开通对战</button><p id="status" role="status"></p></section><section><h2>3. 设置邮件返回地址</h2><p>在 Supabase Authentication → URL Configuration 中，Site URL 设置为 https://j0ey2ou.github.io/true-goat/；Redirect URLs 加入 https://j0ey2ou.github.io/true-goat/guess.html 。默认注册需要邮件确认。</p><p>完成后回到网站，用两个不同账号测试好友房，再开放天梯匹配。</p></section><script>
const schema=${JSON.stringify(installSql).replaceAll('<','\\u003c')},players=${JSON.stringify(people).replaceAll('<','\\u003c')},token=${JSON.stringify(token)},version=${JSON.stringify(source.version)},config=${JSON.stringify(config.ONLINE_CONFIG)};
document.getElementById('schema').value=schema;
document.getElementById('copy').onclick=async()=>{try{await navigator.clipboard.writeText(schema);document.getElementById('copy').textContent='SQL 代码已复制 ✓';document.getElementById('status').textContent='安装 SQL 已复制，请到 SQL Editor 执行。';}catch{const box=document.getElementById('schema');box.focus();box.select();document.getElementById('copy').textContent='代码已选中，请按 Ctrl+C';document.getElementById('status').textContent='已选中 SQL，请按 Ctrl+C。';}};
document.getElementById('import').onclick=async()=>{const button=document.getElementById('import'),status=document.getElementById('status');button.disabled=true;try{for(let offset=0;offset<players.length;offset+=250){const chunk=players.slice(offset,offset+250);const response=await fetch(config.url+'/rest/v1/rpc/goat_seed',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_token:token,p_players:chunk,p_version:version,p_finish:offset+250>=players.length})});const result=await response.json();if(!response.ok)throw Error(result.message||'导入失败，请确认安装 SQL 已成功执行。');status.textContent='已导入 '+Math.min(offset+250,players.length)+' / '+players.length+' 位球员';}status.textContent+='\\n题库已导入，临时安装授权已失效。请完成邮件返回地址设置，再测试注册与对战。';}catch(error){status.textContent=error.message;button.disabled=false;}};
</script></html>`;
// Compile the generated browser script before publishing the installation page.
// A bad escape anywhere in this script also disables the unrelated copy button.
const upgradeSection='<section id="multiplayer-upgrade"><h2>已安装项目：升级 2–5 人对战</h2><p>已有账号和题库不需要重装。复制下面升级 SQL，到 Supabase SQL Editor 粘贴并 Run；保留现有账号、积分和 1v1 对局，不需要重新导入球员。</p><button id="copy-upgrade">复制多人升级 SQL</button><textarea id="upgrade" readonly aria-label="多人升级 SQL"></textarea><p id="upgrade-status" role="status"></p><p>直接注册还需在 Authentication → Sign In / Providers → Email 中关闭 Confirm email 并保存。公开密钥不能修改这个管理设置。</p></section>';
const upgradeCode=`\ndocument.getElementById('upgrade').value=${JSON.stringify(upgradeSql).replaceAll('<','\\u003c')};\ndocument.getElementById('copy-upgrade').onclick=async()=>{const box=document.getElementById('upgrade'),status=document.getElementById('upgrade-status');try{await navigator.clipboard.writeText(box.value);status.textContent='多人升级 SQL 已复制。请到 SQL Editor 粘贴并 Run；不需要重新导入球员。';}catch{box.focus();box.select();status.textContent='代码已选中，请按 Ctrl+C 复制。';}};\n`;
const finalHtml=html.replace('<section><h2>1.',upgradeSection+'<section><h2>1.').replace('</script>',upgradeCode+'</script>');
new vm.Script(finalHtml.match(/<script>([\s\S]*)<\/script>/)[1],{filename:'arena-setup-inline.js'});
await writeFile(path.join(dir,'在线功能安装.html'),finalHtml);
console.log(JSON.stringify({players:people.length,version:source.version,seedBytes:Buffer.byteLength(seed),directory:dir}));
