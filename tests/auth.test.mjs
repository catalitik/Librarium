import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

test('OAuth uses PKCE and exchanges concurrent callbacks only once', async () => {
  let calls = 0;
  let options;
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  globalThis.__authTestClient = (_url, _key, config) => {
    options = config;
    return { auth: { exchangeCodeForSession: async code => {
      assert.equal(code, 'one-use-code');
      calls++;
      await pending;
      return { error: null };
    } } };
  };
  globalThis.document = { title: 'Librarium' };
  globalThis.window = {
    location: { pathname: '/auth/callback', search: '?code=one-use-code&keep=yes' },
    history: { replaceState: (_state, _title, url) => {
      assert.equal(url, '/auth/callback?keep=yes');
      window.location.search = '?keep=yes';
    } },
  };
  try {
    const result = await build({
      entryPoints: ['src/services/supabase.ts'], bundle: true, write: false, format: 'esm',
      define: { 'import.meta.env': JSON.stringify({ VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'test-public-key' }) },
      plugins: [{ name: 'mock-auth', setup(builder) {
        builder.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: 'auth', namespace: 'test' }));
        builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const createClient = globalThis.__authTestClient;' }));
      } }],
    });
    const auth = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
    assert.equal(options.auth.flowType, 'pkce');
    const first = auth.completeAuthCallback();
    const second = auth.completeAuthCallback();
    assert.equal(calls, 1);
    release();
    await Promise.all([first, second]);
    await auth.completeAuthCallback();
    assert.equal(calls, 1);
    window.location.search = '?error=access_denied';
    await assert.rejects(auth.completeAuthCallback(), /access_denied/);
  } finally {
    delete globalThis.__authTestClient;
    delete globalThis.window;
    delete globalThis.document;
  }
});
