import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32 * 1024) throw new Error('payload_too_large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validPhone(value) {
  return /^998\d{9}$/.test(String(value || '').replace(/\D/g, ''));
}

async function sendContactToTelegram({ name, phone, message }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('telegram_not_configured');

  const text = [
    '<b>Yangi Shinam Tekstil murojaati</b>',
    '',
    `<b>Ism:</b> ${escapeHtml(name)}`,
    `<b>Telefon:</b> ${escapeHtml(phone)}`,
    `<b>Xabar:</b> ${escapeHtml(message || 'Xabar qoldirilmagan')}`,
  ].join('\n');

  const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(8000),
  });

  if (!telegramResponse.ok) throw new Error('telegram_request_failed');
  const result = await telegramResponse.json();
  if (!result.ok) throw new Error('telegram_request_rejected');
}

const server = createServer(async (request, response) => {
  const requestedPath = (request.url || '/').split('?')[0];

  if (requestedPath === '/api/health' && request.method === 'GET') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (requestedPath === '/api/contact') {
    if (request.method !== 'POST') {
      sendJson(response, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }

    try {
      const payload = await readJsonBody(request);
      const name = String(payload.name || '').trim();
      const phone = String(payload.phone || '').trim();
      const message = String(payload.message || '').trim();

      if (!name || !validPhone(phone)) {
        sendJson(response, 400, { ok: false, error: 'invalid_contact' });
        return;
      }

      await sendContactToTelegram({ name, phone, message });
      sendJson(response, 200, { ok: true });
    } catch (error) {
      if (error.message === 'payload_too_large') {
        sendJson(response, 413, { ok: false, error: 'payload_too_large' });
        return;
      }
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { ok: false, error: 'invalid_json' });
        return;
      }
      if (error.message === 'telegram_not_configured') {
        sendJson(response, 503, { ok: false, error: 'telegram_not_configured' });
        return;
      }
      sendJson(response, 502, { ok: false, error: 'telegram_unavailable' });
    }
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method Not Allowed');
    return;
  }

  const safePath = normalize(requestedPath === '/' ? '/index.html' : requestedPath);
  const filePath = requestedPath === '/manus-routes.json'
    ? join(root, 'public', 'manus-routes.json')
    : join(root, safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    if (request.method === 'HEAD') response.end();
    else response.end(file);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Shinam Tekstil server listening on http://0.0.0.0:${port}`);
});
