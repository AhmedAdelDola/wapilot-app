// Local HTTP reverse-proxy that fetches Maven artifacts over Node's HTTPS stack
// (which works on this machine, unlike the JVM's TLS that the local MITM breaks).
// Gradle talks plain HTTP to this proxy -> no TLS -> no bad_record_mac.
const http = require('http');
const https = require('https');

const PORT = 8899;

// Map a local path prefix to an upstream HTTPS base.
const ROUTES = [
  { prefix: '/mavencentral/', base: 'https://repo.maven.apache.org/maven2/' },
  { prefix: '/google/',       base: 'https://dl.google.com/dl/android/maven2/' },
  { prefix: '/jitpack/',      base: 'https://jitpack.io/' },
  { prefix: '/ali/',          base: 'https://maven.aliyun.com/repository/public/' },
];

function resolve(urlPath) {
  for (const r of ROUTES) {
    if (urlPath.startsWith(r.prefix)) {
      return r.base + urlPath.slice(r.prefix.length);
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const target = resolve(req.url);
  if (!target) {
    res.writeHead(404);
    res.end('No route for ' + req.url);
    return;
  }
  const r = https.get(target, { timeout: 60000 }, (up) => {
    res.writeHead(up.statusCode, up.headers);
    up.pipe(res);
  });
  r.on('error', (e) => {
    res.writeHead(502);
    res.end('Upstream error: ' + e.message);
  });
  r.on('timeout', () => { r.destroy(new Error('timeout')); });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Local Maven proxy listening on http://127.0.0.1:' + PORT);
});
