// ============================================================
// CHATWITHPDFAI.COM — Express server for Hostinger Node.js hosting
// Serves the static site with:
//   - HTTPS redirect (behind Hostinger's reverse proxy)
//   - non-www canonicalization
//   - clean URLs (/pricing -> /pricing.html)
//   - root redirect -> /landing.html
//   - custom 404/500 pages
//   - aggressive caching for assets, short cache for HTML
//   - security headers
// ============================================================

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const compression = require('compression');

const app  = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// Trust Hostinger's reverse proxy (so req.protocol reflects HTTPS)
app.set('trust proxy', true);

// Disable Express signature
app.disable('x-powered-by');

// gzip / brotli compression
app.use(compression());

// ---------- Security headers ----------
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options'   : 'nosniff',
    'X-Frame-Options'          : 'SAMEORIGIN',
    'Referrer-Policy'          : 'strict-origin-when-cross-origin',
    'Permissions-Policy'       : 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });
  next();
});

// ---------- HTTPS redirect ----------
app.use((req, res, next) => {
  const proto = req.headers['x-forwarded-proto'];
  if (proto && proto !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// ---------- www -> non-www ----------
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.')) {
    return res.redirect(301, `https://${host.slice(4)}${req.url}`);
  }
  next();
});

// ---------- Block dotfiles / sensitive ----------
app.use((req, res, next) => {
  const blocked = /(^|\/)\.(git|env|gitignore|gitattributes|github)/i;
  if (blocked.test(req.path)) return res.status(403).sendFile(path.join(ROOT, '403.html'));
  next();
});

// ---------- Root -> /landing.html ----------
app.get('/', (req, res) => res.redirect(302, '/landing.html'));

// ---------- Strip trailing .html (canonicalize) ----------
app.use((req, res, next) => {
  if (req.path.endsWith('.html') && req.path !== '/index.html') {
    const clean = req.path.replace(/\.html$/, '');
    if (clean.length > 0) {
      return res.redirect(301, clean + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''));
    }
  }
  next();
});

// ---------- Clean URLs: /pricing -> serve pricing.html ----------
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.endsWith('/')) return next();
  if (/\.[a-zA-Z0-9]{2,5}$/.test(req.path)) return next();   // already has extension
  const candidate = path.join(ROOT, req.path + '.html');
  if (fs.existsSync(candidate)) {
    res.set('Cache-Control', 'public, max-age=300');
    return res.sendFile(candidate);
  }
  next();
});

// ---------- Static files ----------
app.use(express.static(ROOT, {
  index: false,
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'public, max-age=300');           // 5 min
    } else if (['.css', '.js', '.jsx'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');       // 30 days
    } else if (['.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    }
  }
}));

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).sendFile(path.join(ROOT, '404.html'));
});

// ---------- 500 ----------
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).sendFile(path.join(ROOT, '500.html'));
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`CHATWITHPDFAI.COM listening on :${PORT}`);
});
