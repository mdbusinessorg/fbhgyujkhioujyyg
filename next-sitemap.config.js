/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.mosalo.eu.cc',
  outDir: './out',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  changefreq: 'daily',
  priority: 0.7,

  // Exclui páginas privadas/dashboard do sitemap público
  exclude: [
    '/dashboard/*',
    '/admin/*',
    '/auth/*',
  ],

  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/dashboard/', '/admin/', '/auth/'] },
    ],
    additionalSitemaps: [
      'https://www.mosalo.eu.cc/sitemap.xml',
    ],
  },
}
