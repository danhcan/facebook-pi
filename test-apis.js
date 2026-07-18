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
    return { status: 'ERR', body: e.message };
  }
}

function log(status, label, body) {
  const icon = status === 200 || status === 201 ? '✅' : status === 401 ? '🔒' : status === 404 ? '⬜' : '❌';
  console.log(`${icon} ${status} ${label}`);
  if (body && body.length > 5) console.log(`   ${body.substring(0, 200)}`);
}

async function run() {
  console.log('=== HEALTH ===');
  let r = await req('GET', '/health');
  log(r.status, 'GET /health', r.body);

  console.log('\n=== WEBHOOK ===');
  r = await req('GET', '/webhook/facebook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=abc');
  log(r.status, 'GET /webhook (bad token)', r.body);
  r = await req('GET', '/webhook/facebook?hub.mode=subscribe&hub.verify_token=your_webhook_verify_token&hub.challenge=abc');
  log(r.status, 'GET /webhook (good token)', r.body);
  r = await req('POST', '/webhook/facebook', { object: 'page', entry: [] });
  log(r.status, 'POST /webhook (empty entry)', r.body);

  console.log('\n=== AUTH ===');
  r = await req('POST', '/api/auth/register', { email: 'test@test.com', password: '123456', name: 'Test User' });
  log(r.status, 'POST /api/auth/register', r.body);
  const regData = r.status === 201 ? JSON.parse(r.body) : null;
  const token = regData?.token || '';

  r = await req('POST', '/api/auth/register', { email: 'test@test.com', password: '123456', name: 'Test' });
  log(r.status, 'POST /api/auth/register (dup)', r.body);

  r = await req('POST', '/api/auth/login', { email: 'test@test.com', password: '123456' });
  log(r.status, 'POST /api/auth/login', r.body);

  r = await req('POST', '/api/auth/login', { email: 'test@test.com', password: 'wrong' });
  log(r.status, 'POST /api/auth/login (wrong pw)', r.body);

  console.log('\n=== WITHOUT AUTH (expect 401) ===');
  for (const ep of ['/api/accounts', '/api/conversations', '/api/knowledge', '/api/history', '/api/ai-responses', '/api/stats/overview']) {
    r = await req('GET', ep);
    log(r.status, `GET ${ep}`, r.body);
  }

  if (!token) { console.log('\nNo token, aborting authenticated tests'); return; }

  console.log('\n=== ACCOUNTS (auth) ===');
  r = await req('GET', '/api/accounts', null, token);
  log(r.status, 'GET /api/accounts', r.body);
  r = await req('POST', '/api/accounts/connect', { code: 'test_code', redirect_uri: 'http://localhost:3000/callback' }, token);
  log(r.status, 'POST /api/accounts/connect', r.body);

  console.log('\n=== CONVERSATIONS (auth) ===');
  r = await req('GET', '/api/conversations', null, token);
  log(r.status, 'GET /api/conversations', r.body);

  console.log('\n=== KNOWLEDGE (auth) ===');
  r = await req('GET', '/api/knowledge', null, token);
  log(r.status, 'GET /api/knowledge', r.body);
  r = await req('POST', '/api/knowledge', { title: 'Giá sản phẩm', content: 'Sản phẩm A giá 100k', category: 'pricing', tags: ['price'] }, token);
  log(r.status, 'POST /api/knowledge', r.body);

  console.log('\n=== AI RESPONSES (auth) ===');
  r = await req('GET', '/api/ai-responses', null, token);
  log(r.status, 'GET /api/ai-responses', r.body);

  console.log('\n=== STATS (auth) ===');
  r = await req('GET', '/api/stats/overview', null, token);
  log(r.status, 'GET /api/stats/overview', r.body);
  r = await req('GET', '/api/stats/activity', null, token);
  log(r.status, 'GET /api/stats/activity', r.body);

  console.log('\n=== HISTORY (auth) ===');
  r = await req('GET', '/api/history', null, token);
  log(r.status, 'GET /api/history', r.body);
  r = await req('GET', '/api/history/export', null, token);
  log(r.status, 'GET /api/history/export', r.body);

  console.log('\n=== DONE ===');
}

run();
