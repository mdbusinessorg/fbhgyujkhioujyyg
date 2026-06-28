// CareerJet public search API proxy
// Docs: http://www.careerjet.com/partners/api/
const AFFID = process.env.CAREERJET_AFFID

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (!AFFID) {
    return { statusCode: 200, headers, body: JSON.stringify({ jobs: [], error: 'CAREERJET_AFFID not configured' }) }
  }

  const params = event.queryStringParameters || {}
  const keywords = params.keywords || 'emprego'
  const location = params.location || 'Angola'
  const page = params.page || '1'
  const pagesize = params.pagesize || '20'

  const userIp = (event.headers['x-forwarded-for'] || '8.8.8.8').split(',')[0].trim()
  const userAgent = event.headers['user-agent'] || 'MoSalo/1.0'

  const apiUrl = new URL('http://public.api.careerjet.net/search')
  apiUrl.searchParams.set('affid', AFFID)
  apiUrl.searchParams.set('keywords', keywords)
  apiUrl.searchParams.set('location', location)
  apiUrl.searchParams.set('locale_code', 'pt_PT')
  apiUrl.searchParams.set('pagesize', pagesize)
  apiUrl.searchParams.set('page', page)
  apiUrl.searchParams.set('sort', 'date')
  apiUrl.searchParams.set('user_ip', userIp)
  apiUrl.searchParams.set('user_agent', userAgent)
  apiUrl.searchParams.set('url', 'https://mosalo.netlify.app')

  try {
    const res = await fetch(apiUrl.toString(), {
      headers: { 'User-Agent': userAgent },
    })
    const data = await res.json()

    const jobs = (data.jobs || []).map((j) => ({
      title: j.title,
      description: j.description,
      company: j.company || '',
      locations: j.locations || '',
      salary: j.salary || '',
      url: j.url,
      date: j.date || '',
      source: 'CareerJet',
    }))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ jobs, hits: data.hits || jobs.length, pages: data.pages || 1 }),
    }
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ jobs: [], error: String(err) }),
    }
  }
}
