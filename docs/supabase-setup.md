# Supabase 在线功能配置 / Online setup

GitHub Pages hosts the frontend. Supabase supplies authentication, a PostgreSQL referee, participant-authorized updates and ranked ratings. Single-player games and ranking preferences remain browser-local.

GitHub Pages 托管前端，Supabase 提供身份认证、数据库裁判、参与者进度同步与天梯积分；单人游戏和评级偏好仍保存在本机。

## 安装 / Install

1. Create a Supabase project. Set `url` and `publishableKey` in [online-config.mjs](../app/online-config.mjs). Never put a database password, secret key or service_role in the frontend.
2. From the repository root, run `node scripts/21_export_arena_seed.mjs`. Open the generated `output/arena-setup/在线功能安装.html` locally, or serve that directory only on a loopback address.
3. Copy **installation SQL**, not the SQL Editor URL. Paste the code into your project's SQL Editor and run as the project owner. The generated SQL includes [the migration](../supabase/migrations/202610070001_arena.sql) and a hashed, two-hour setup capability. Enabling RLS on private tables is also supported.
4. Within two hours, use the local installation page to import the player facts. Imports use batches of at most 250. Successful completion revokes the setup capability. If it expires before completion, rerun the installation SQL and retry. Do not upload the installation page or token file; only the allowlisted `dist/` belongs on the public website.
5. In Authentication → URL Configuration, set Site URL to your deployed website root and add the exact guessing-page URL to Redirect URLs. For this deployment: `https://j0ey2ou.github.io/true-goat/` and `https://j0ey2ou.github.io/true-goat/guess.html`. Add local guessing-page URLs separately only when testing locally.
6. In Authentication → Sign In / Providers → Email, choose your registration policy. The current deployment uses email/password with **Confirm email disabled**; email ownership is not verified. To require confirmation, configure a sending service first. Supabase's default SMTP is not a public registration mail service. Enable `passwordRecoveryEnabled` only after reset emails are configured and tested.
7. Test two separate accounts in a friendly room before enabling public ranked play. Confirm opponent color progress, page-refresh recovery and no rating changes in friendly rooms.

中文流程：创建项目 → 填公开配置 → 运行导出脚本 → 在 SQL Editor 粘贴生成的安装代码 → 导入题库 → 设置网站和返回地址 → 配置邮箱注册策略 → 用两个账号测试好友房。安装文件含临时导入授权，不能公开部署；公开密钥不是管理密钥，不能代替控制台设置。

## 权限与规则 / Access and rules

- Public match rows contain participant IDs, counts and color grids, **not hidden answers or opponent guess names**. RLS permits only participants to read their matches. Clients have no direct write access to matches or ratings.
- Answers, guesses, facts and installer settings live in a private schema with client privileges revoked. Security-definer RPCs use an empty search path and explicitly check login and match participation. Private-table RLS may be enabled as an additional layer; project-owner functions perform authorized operations.
- The server enforces the pool, fixed ten clues, eight attempts, duplicate rejection, a 650 ms submission interval, 180-second deadlines and exactly-once settlement. First correct answer wins; timeout or both players exhausting attempts produces a draw. Waiting rooms expire after five minutes.
- Only ranked games update Elo: initial 1000, K=24, ratings floored at zero. Friend rooms do not change ratings or ranked statistics. The public leaderboard exposes nicknames and ranked statistics, not emails.
- Realtime updates are filtered to the participant's match. Visible active games also poll every 1.6 seconds when WebSockets are unavailable. The browser clock uses the server timestamp; deadlines are enforced by the database.
- This is a recreational game, not a complete anti-cheat service. Public data can reveal every possible player's facts; the target answer is kept server-side, but multi-account abuse, automation and large-scale denial of service need additional protection.

## 本地验证 / Local verification

The isolated SQL tests need `@electric-sql/pglite@0.5.8`. Install it into a temporary tooling directory, not the public app bundle. The browser test additionally needs Playwright and a browser.

```sh
npm install --prefix output/backend-tests --no-audit --no-fund @electric-sql/pglite@0.5.8
GOAT_PGLITE_MODULE="file://$PWD/output/backend-tests/node_modules/@electric-sql/pglite/dist/index.js" node scripts/22_verify_arena_sql.mjs
# With Playwright available:
GOAT_PGLITE_MODULE="file://$PWD/output/backend-tests/node_modules/@electric-sql/pglite/dist/index.js" node scripts/23_verify_online_browser.mjs
```

Both tests use an isolated local database. The browser test's auth and transport are test doubles; they do not create Supabase accounts, send email or write to the real ladder. Cloud installation, auth settings and live multi-user connectivity must also be checked on the deployed project.

数据库测试覆盖安装、参与者权限、答案隐藏、非法与重复猜测、默认裁判一致性、好友房、超时与一次性积分结算。双浏览器测试覆盖两个隔离账号的界面流程，不在真实云项目创建账号或写入天梯。

References: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [email/SMTP limitations](https://supabase.com/docs/guides/auth/auth-smtp).
