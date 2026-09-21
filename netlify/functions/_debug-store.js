const { getStoreWithFallback } = require('../lib/store')
const { getStore } = require('@netlify/blobs')

exports.handler = async (event) => {
  const out = {
    env: {
      NETLIFY: !!process.env.NETLIFY,
      NETLIFY_BLOBS_CONTEXT: !!process.env.NETLIFY_BLOBS_CONTEXT,
      NETLIFY_BLOBS_SITE_ID: !!process.env.NETLIFY_BLOBS_SITE_ID,
      NETLIFY_BLOBS_TOKEN: !!process.env.NETLIFY_BLOBS_TOKEN,
      tokenTail: (process.env.NETLIFY_BLOBS_TOKEN || '').slice(-6),
      siteIdEnv: process.env.NETLIFY_BLOBS_SITE_ID || null,
      SITE_ID_env: !!process.env.SITE_ID,
    },
    tests: {},
  }
  try {
    const s = getStore('debug-test')
    out.tests.ambient_getStore = 'ok'
    try { out.tests.ambient_get = String(await s.get('x')) } catch (e) { out.tests.ambient_get = 'ERR ' + e.message }
  } catch (e) { out.tests.ambient_getStore = 'ERR ' + e.message }
  try {
    const s2 = getStoreWithFallback('debug-test')
    out.tests.fallback_getStore = 'ok'
    try { out.tests.fallback_get = String(await s2.get('x')) } catch (e) { out.tests.fallback_get = 'ERR ' + e.message }
  } catch (e) { out.tests.fallback_getStore = 'ERR ' + e.message }
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(out) }
}
