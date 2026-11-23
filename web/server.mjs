import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, 'dist');
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 18180);
const apiTarget = new URL(process.env.API_TARGET || 'https://study.yuanweiep.com');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function proxy(req, res) {
  const headers = { ...req.headers, host: apiTarget.host };
  delete headers.connection;
  const upstream = https.request(
    {
      protocol: apiTarget.protocol,
      hostname: apiTarget.hostname,
      port: apiTarget.port || 443,
      path: req.url,
      method: req.method,
      headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on('error', (error) => {
    if (!res.headersSent) send(res, 502, `接口代理失败：${error.message}`);
    else res.end();
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  let filePath = path.normalize(path.join(distDir, relative));
  if (!filePath.startsWith(distDir)) {
    send(res, 400, '非法路径');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (path.extname(requestPath)) {
      send(res, 404, '未找到文件');
      return;
    }
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const headers = { 'Content-Type': mime[ext] || 'application/octet-stream' };
  if (filePath.endsWith(`${path.sep}index.html`)) headers['Cache-Control'] = 'no-cache';
  else if (relative.startsWith('assets/')) headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('缺少 dist/index.html，请先执行部署脚本完成构建。');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if ((req.url || '').startsWith('/preins')) proxy(req, res);
  else serveStatic(req, res);
});

server.listen(port, host, () => {
  console.log(`广告投放管理后台已启动：http://${host}:${port}`);
  console.log(`对外访问：http://57.95.5.18:${port}`);
  console.log(`接口代理：/preins -> ${apiTarget.origin}`);
});
