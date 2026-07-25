const { getStore } = require('@netlify/blobs')
const fs = require('fs')
const path = require('path')

const LOCAL_DIR = process.env.NETLIFY_BLOBS_LOCAL_DIR || path.join(process.cwd(), '.netlify', 'blobs-local')

function localKey(store, key) {
  return path.join(LOCAL_DIR, store, key.replace(/\//g, path.sep))
}

function createLocalStore(storeName) {
  return {
    get: async (key) => {
      const file = localKey(storeName, key)
      try {
        return fs.readFileSync(file, 'utf8')
      } catch { return null }
    },
    set: async (key, value) => {
      const file = localKey(storeName, key)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, value)
    },
    delete: async (key) => {
      try { fs.unlinkSync(localKey(storeName, key)) } catch {}
    },
    list: async () => {
      const dir = path.join(LOCAL_DIR, storeName)
      try {
        const files = []
        const walk = (d) => {
          fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
            const full = path.join(d, e.name)
            if (e.isDirectory()) walk(full)
            else files.push(full.slice(dir.length + 1).replace(/\\/g, '/'))
          })
        }
        walk(dir)
        return files
      } catch { return [] }
    },
  }
}

function getStoreWithFallback(name) {
  if (process.env.NETLIFY_BLOBS_SITE_ID && process.env.NETLIFY_BLOBS_TOKEN) {
    return getStore(name, {
      siteID: process.env.NETLIFY_BLOBS_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
    })
  }
  return createLocalStore(name)
}

module.exports = { getStoreWithFallback }
