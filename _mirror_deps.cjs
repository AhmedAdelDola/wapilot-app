// Scans the Gradle build log for failed Maven Central downloads, then mirrors
// those artifacts (plus their .pom / .module metadata) into a local Maven repo
// using `curl` (which works, unlike Gradle's JVM TLS stack on this machine).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOG = process.argv[2] || path.join(__dirname, '_build_log.txt');
const REPO = path.join(__dirname, 'android', 'localrepo');

if (!fs.existsSync(LOG)) {
  console.error('Build log not found:', LOG);
  process.exit(1);
}
const text = fs.readFileSync(LOG, 'utf8');

// Extract all maven2 artifact URLs that failed (or any maven2 URL mentioned)
const urlRe = /https:\/\/repo\.maven\.apache\.org\/maven2\/[^\s"'<>)]+/g;
const urls = new Set();
for (const m of text.matchAll(urlRe)) {
  let u = m[0];
  // strip trailing punctuation Gradle sometimes appends
  u = u.replace(/[.,)]\]>$]/g, '');
  urls.add(u);
}

console.log(`Found ${urls.size} maven URLs in log.`);

function localPathFor(url) {
  // https://repo.maven.apache.org/maven2/com/facebook/react/react-android/0.81.5/react-android-0.81.5-release.aar
  const base = 'https://repo.maven.apache.org/maven2/';
  const rel = url.slice(base.length); // com/facebook/react/...
  return path.join(REPO, rel);
}

function curl(url, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) return true;
  try {
    execSync(`curl -fsSL "${url}" -o "${outPath}"`, { stdio: 'pipe' });
    return fs.existsSync(outPath) && fs.statSync(outPath).size > 0;
  } catch (e) {
    return false;
  }
}

let ok = 0, fail = 0;
for (const url of urls) {
  const out = localPathFor(url);
  const got = curl(url, out);
  if (!got) { fail++; console.error('FAILED:', url); continue; }
  ok++;
  // Try to also grab the .pom and .module metadata siblings
  for (const ext of ['.pom', '.module', '.aar.sha1', '.pom.sha1']) {
    if (url.endsWith(ext)) continue;
    const metaUrl = url + ext;
    const metaOut = localPathFor(metaUrl);
    curl(metaUrl, metaOut);
  }
}
console.log(`Downloaded ${ok} artifacts, ${fail} failed.`);
console.log('Local repo at:', REPO);
