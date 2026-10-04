import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
const base = process.env.GOAT_TEST_URL || 'http://127.0.0.1:8765';

test('local app serves only explicit routes and returns useful data', async () => {
  const page = await fetch(base);
  assert.equal(page.status,200);
  assert.match(await page.text(),/查看我的模型/);
  assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  const players = await (await fetch(base+'/data/players.json')).json();
  const models = await (await fetch(base+'/data/experts.json')).json();
  assert.equal(players.players.length,300);
  assert.ok(models.experts.length>=6);
  for (const path of ['/README.md','/data/raw','/../config/espn_expert_rankings.json','/constructor','/__proto__']) {
    assert.equal((await fetch(base+path)).status,404,path);
  }
  assert.equal((await fetch(base,{method:'POST'})).status,404);
});

test('malformed absolute URL is rejected without crashing the server', async () => {
  const address = new URL(base);
  const response = await new Promise((resolve,reject) => {
    const socket = net.connect(Number(address.port),address.hostname);
    let body = '';
    socket.setTimeout(3000,()=>socket.destroy(new Error('timeout')));
    socket.on('connect',()=>socket.write('GET http://[ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n'));
    socket.on('data',chunk=>body+=chunk);
    socket.on('end',()=>resolve(body));
    socket.on('error',reject);
  });
  assert.match(response,/HTTP\/1.1 400/);
  assert.equal((await fetch(base)).status,200);
});
