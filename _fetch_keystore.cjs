// Fetches the Android production keystore from EAS using the locally-stored session secret.
const path = require('path');
const fs = require('fs');

// 1) Load the stored EAS session secret
const statePath = path.join(process.env.USERPROFILE, '.expo', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const sessionSecret = state.auth.sessionSecret;
if (!sessionSecret) {
  console.error('No EAS session found in', statePath);
  process.exit(1);
}

// 2) Build a GraphQL client the same way eas-cli does
const easCli = path.join(
  process.env.APPDATA,
  'npm',
  'node_modules',
  'eas-cli',
  'build'
);
const core = require(path.join(easCli, '..', 'node_modules', '@urql', 'core'));
const gql = require(path.join(easCli, '..', 'node_modules', 'graphql-tag'));
const retryExchange = require(path.join(easCli, '..', 'node_modules', '@urql', 'exchange-retry'));
const nodeFetch = require(path.join(easCli, '..', 'node_modules', 'node-fetch'));

const graphqlClient = core.createClient({
  url: 'https://api.expo.dev/graphql',
  exchanges: [
    core.cacheExchange,
    retryExchange.retryExchange({ maxDelayMs: 4000, retryIf: () => false }),
    core.fetchExchange,
  ],
  fetch: nodeFetch.default,
  fetchOptions: () => ({
    headers: { 'expo-session': sessionSecret },
  }),
});

const PROJECT_ID = '9819b83a-87f0-46ff-be76-1ff2bcd2c2b8';

const QUERY = gql`
  query FetchKeystore($projectId: String!) {
    app {
      byId(appId: $projectId) {
        id
        androidAppCredentials {
          id
          androidAppBuildCredentialsList {
            id
            isDefault
            isLegacy
            name
            androidKeystore {
              id
              keystore
              keystorePassword
              keyAlias
              keyPassword
            }
          }
        }
      }
    }
  }
`;

(async () => {
  const data = await graphqlClient
    .query(QUERY, { projectId: PROJECT_ID }, { additionalTypenames: ['App'] })
    .toPromise();

  if (data.error) {
    console.error('GraphQL error:', JSON.stringify(data.error, null, 2));
    process.exit(1);
  }

  const app = data.data.app.byId;
  const creds = app.androidAppCredentials || [];
  // find default build credentials that have a keystore
  let chosen = null;
  for (const ac of creds) {
    for (const bc of ac.androidAppBuildCredentialsList || []) {
      if (bc.androidKeystore && (bc.isDefault || !chosen)) {
        chosen = bc;
      }
    }
  }
  if (!chosen || !chosen.androidKeystore) {
    console.error('No Android keystore found for this project.');
    process.exit(1);
  }

  const ks = chosen.androidKeystore;
  const outDir = path.join(process.cwd(), 'android', 'app');
  fs.mkdirSync(outDir, { recursive: true });
  const keystorePath = path.join(outDir, 'message-pro-release.keystore');
  fs.writeFileSync(keystorePath, ks.keystore, 'base64');

  const props = {
    keystorePath,
    keystorePassword: ks.keystorePassword,
    keyAlias: ks.keyAlias,
    keyPassword: ks.keyPassword,
  };
  // also write a properties file for reference
  const propsPath = path.join(outDir, 'release-keystore.properties');
  fs.writeFileSync(
    propsPath,
    [
      `storeFile=${keystorePath}`,
      `storePassword=${ks.keystorePassword}`,
      `keyAlias=${ks.keyAlias}`,
      `keyPassword=${ks.keyPassword}`,
    ].join('\n')
  );

  console.log('Keystore saved to:', keystorePath);
  console.log('Properties saved to:', propsPath);
  console.log('--- SENSITIVE ---');
  console.log('keystorePassword:', ks.keystorePassword);
  console.log('keyAlias:', ks.keyAlias);
  console.log('keyPassword:', ks.keyPassword);
})();
