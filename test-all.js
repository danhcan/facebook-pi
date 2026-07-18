const { spawn } = require('child_process');
const path = require('path');

// Start server
const server = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'src/index.ts'], {
  cwd: 'D:\\AI\\vietnamese-demo',
  stdio: 'pipe'
});

let output = '';
server.stdout.on('data', d => { output += d.toString(); console.log('STDOUT:', d.toString().trim()); });
server.stderr.on('data', d => { output += d.toString(); console.log('STDERR:', d.toString().trim()); });

// Wait for server to start
setTimeout(async () => {
  console.log('Server output:', output.substring(0, 500));
  
  const BASE = 'http://localhost:3000';
  
  async function req(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    try {
      const r = await fetch(`${BASE}${path}`, opts);
      const text = await r.text();
      return { status: r.status, body: text };
    } catch (e) {
      return { status: 'ERR', body: e.message + ' ' + (e.cause?.message || '') };
    }
  }
  
  function log(status, label, body) {
    const icon = [200,201,202,204].includes(status) ? '✅' : status === 401 ? '🔒' : status === 403 ? '🚫' : status === 404 ? '⬜' : '❌';
    console.log(`${icon} ${status} ${label}`);
    if (body && body.length > 5) console.log(`   ${body.substring(0, 200)}`);
  }

  console.log('\n=== 1. HEALTH ===');
  let r = await req('GET', '/health');
  log(r.status, 'GET /health', r.body);

  console.log('\n=== 2. WEBHOOK ===');
  r = await req('GET', '/webhook/facebook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc');
  log(r.status, 'GET /webhook (bad token)', r.body);
  r = await req('GET', '/webhook/facebook?hub.mode=subscribe&hub.verify_token=your_webhook_verify_token&hub.challenge=abc');
  log(r.status, 'GET /webhook (good token)', r.body);
  r = await req('POST', '/webhook/facebook', { object: 'page', entry: [{ id: '1', time: Date.now(), messaging: [{ sender: { id: 'user1' }, recipient: { id: 'page1' }, timestamp: Date.now(), message: { mid: 'm1', text: 'Xin chào!' } }] }] });
  log(r.status, 'POST /webhook (with message)', r.body);

  console.log('\n=== 3. AUTH: REGISTER ===');
  r = await req('POST', '/api/auth/register', { email: 'test@test.com', password: '123456', name: 'Test User' });
  log(r.status, 'POST /api/auth/register', `user created`);
  let token = '';
  try { token = JSON.parse(r.body).token; } catch(e) {}

  r = await req('POST', '/api/auth/register', { email: 'test@test.com', password: '123456', name: 'Dup' });
  log(r.status, 'POST /api/auth/register (dup)', r.body);

  r = await req('POST', '/api/auth/register', { email: 'bad', password: '123' });
  log(r.status, 'POST /api/auth/register (invalid)', r.body);

  console.log('\n=== 4. AUTH: LOGIN ===');
  r = await req('POST', '/api/auth/login', { email: 'test@test.com', password: '123456' });
  log(r.status, 'POST /api/auth/login', r.body.substring(0, 80) + '...');
  try { token = JSON.parse(r.body).token; } catch(e) {}

  r = await req('POST', '/api/auth/login', { email: 'test@test.com', password: 'wrong' });
  log(r.status, 'POST /api/auth/login (wrong pw)', r.body);

  r = await req('POST', '/api/auth/login', { email: 'nobody@test.com', password: '123456' });
  log(r.status, 'POST /api/auth/login (no user)', r.body);

  if (!token) { console.log('\nNo token! Aborting...'); server.kill(); process.exit(1); }

  console.log('\n=== 5. ACCOUNTS (auth required) ===');
  r = await req('GET', '/api/accounts', null, token);
  log(r.status, 'GET /api/accounts', r.body);
  r = await req('POST', '/api/accounts/connect', { code: 'test_code', redirect_uri: 'http://localhost/callback' }, token);
  log(r.status, 'POST /api/accounts/connect', r.body);
  r = await req('DELETE', '/api/accounts/abc123', null, token);
  log(r.status, 'DELETE /api/accounts/abc123', r.body);
  r = await req('POST', '/api/accounts/abc123/refresh', null, token);
  log(r.status, 'POST /api/accounts/abc123/refresh', r.body);

  console.log('\n=== 6. CONVERSATIONS (auth required) ===');
  r = await req('GET', '/api/conversations', null, token);
  log(r.status, 'GET /api/conversations', r.body);
  r = await req('GET', '/api/conversations/abc/messages', null, token);
  log(r.status, 'GET /api/conversations/abc/messages', r.body);
  r = await req('POST', '/api/conversations/abc/reply', { content: 'Xin chào bạn!' }, token);
  log(r.status, 'POST /api/conversations/abc/reply', r.body);
  r = await req('PUT', '/api/conversations/abc/settings', { auto_reply_mode: 'manual' }, token);
  log(r.status, 'PUT /api/conversations/abc/settings', r.body);

  console.log('\n=== 7. KNOWLEDGE (auth required) ===');
  r = await req('GET', '/api/knowledge', null, token);
  log(r.status, 'GET /api/knowledge', r.body);
  r = await req('POST', '/api/knowledge', { title: 'Giá sản phẩm A', content: 'Sản phẩm A giá 100,000 VND', category: 'pricing', tags: ['price','product-a'] }, token);
  log(r.status, 'POST /api/knowledge', r.body);
  r = await req('POST', '/api/knowledge', { title: 'Chính sách đổi trả', content: 'Đổi trả trong 7 ngày', category: 'policy', tags: ['return'] }, token);
  log(r.status, 'POST /api/knowledge (2nd)', r.body);
  r = await req('GET', '/api/knowledge', null, token);
  log(r.status, 'GET /api/knowledge (after create)', r.body.substring(0, 150));
  r = await req('POST', '/api/knowledge/search', { query: 'giá bao nhiêu', limit: 3 }, token);
  log(r.status, 'POST /api/knowledge/search', r.body);

  console.log('\n=== 8. AI RESPONSES (auth required) ===');
  r = await req('GET', '/api/ai-responses', null, token);
  log(r.status, 'GET /api/ai-responses', r.body);
  r = await req('GET', '/api/ai-responses/fake-id', null, token);
  log(r.status, 'GET /api/ai-responses/fake-id', r.body);
  r = await req('PUT', '/api/ai-responses/fake-id', { content: 'Edited response' }, token);
  log(r.status, 'PUT /api/ai-responses/fake-id', r.body);
  r = await req('POST', '/api/ai-responses/fake-id/approve', null, token);
  log(r.status, 'POST /api/ai-responses/fake-id/approve', r.body);
  r = await req('DELETE', '/api/ai-responses/fake-id', null, token);
  log(r.status, 'DELETE /api/ai-responses/fake-id', r.body);
  r = await req('POST', '/api/ai-responses/fake-id/feedback', { feedback: 'positive' }, token);
  log(r.status, 'POST /api/ai-responses/fake-id/feedback', r.body);

  console.log('\n=== 9. HISTORY (auth required) ===');
  r = await req('GET', '/api/history', null, token);
  log(r.status, 'GET /api/history', r.body);
  r = await req('GET', '/api/history/export', null, token);
  log(r.status, 'GET /api/history/export', r.body);
  r = await req('GET', '/api/history/export/fake-job', null, token);
  log(r.status, 'GET /api/history/export/fake-job', r.body);

  console.log('\n=== 10. STATS (auth required) ===');
  r = await req('GET', '/api/stats/overview', null, token);
  log(r.status, 'GET /api/stats/overview', r.body);
  r = await req('GET', '/api/stats/activity', null, token);
  log(r.status, 'GET /api/stats/activity', r.body);
  r = await req('POST', '/api/stats/report', { startDate: '2026-01-01T00:00:00Z', endDate: '2026-12-31T23:59:59Z' }, token);
  log(r.status, 'POST /api/stats/report', r.body);

  console.log('\n=== 11. UNAUTHORIZED (no token) ===');
  r = await req('GET', '/api/accounts');
  log(r.status, 'GET /api/accounts (no token)', r.body);
  r = await req('GET', '/api/knowledge');
  log(r.status, 'GET /api/knowledge (no token)', r.body);
  r = await req('GET', '/api/ai-responses');
  log(r.status, 'GET /api/ai-responses (no token)', r.body);

  console.log('\n=============================');
  console.log('=== ALL TESTS COMPLETE ===');
  console.log('=============================\n');

  server.kill();
  process.exit(0);
}, 8000);
