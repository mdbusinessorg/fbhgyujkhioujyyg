const REFERER = 'https://www.mosalo.eu.cc/vagas/'
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

const mapJobs = (data) => (Array.isArray(data?.jobs) ? data.jobs : []).map((j) => ({
  title: j?.title || '',
  company: j?.company || '',
  locations: j?.locations || '',
  salary: j?.salary || '',
  url: j?.url || '',
  description: j?.description || '',
  date: j?.date || '',
  source: 'CareerJet',
}))

const fetchJson = async (url, requestHeaders = {}) => {
  const res = await fetch(url, { headers: requestHeaders })
  return res.json()
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const params = event.queryStringParameters || {}
    const keywords = params.keywords || ''
    const location = params.location || 'Luanda, Angola'
    const page = params.page || '1'
    const pageSize = params.page_size || '20'
    const sort = params.sort || 'date'
    const userIp = ((event.headers && (event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'])) || '8.8.8.8').split(',')[0].trim()
    const userAgent = (event.headers && (event.headers['user-agent'] || event.headers['User-Agent'])) || 'Mozilla/5.0'

    const apiKey = process.env.CAREERJET_API_KEY
    const affid = process.env.CAREERJET_AFFID

    const v4Url = new URL('https://search.api.careerjet.net/v4/query')
    v4Url.searchParams.set('locale_code', 'pt_AO')
    v4Url.searchParams.set('keywords', keywords)
    v4Url.searchParams.set('location', location)
    v4Url.searchParams.set('page', page)
    v4Url.searchParams.set('page_size', pageSize)
    v4Url.searchParams.set('sort', sort)
    v4Url.searchParams.set('user_ip', userIp)
    v4Url.searchParams.set('user_agent', userAgent)

    const v4Headers = {
      Authorization: 'Basic ' + Buffer.from(`${apiKey || ''}:`).toString('base64'),
      Referer: REFERER,
      'User-Agent': userAgent,
    }

    let data = null
    let jobs = []
    let source = 'v4'

    if (apiKey) {
      data = await fetchJson(v4Url.toString(), v4Headers)
      jobs = mapJobs(data)
    }

    if (!jobs.length) {
      source = 'public'

      if (!affid) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ jobs: [], pages: 1, hits: 0, source: 'public', error: 'CAREERJET_AFFID not configured' }),
        }
      }

      const search = async (loc) => {
        const apiUrl = new URL('http://public.api.careerjet.net/search')
        apiUrl.searchParams.set('affid', affid)
        apiUrl.searchParams.set('keywords', keywords)
        apiUrl.searchParams.set('location', loc)
        apiUrl.searchParams.set('locale_code', 'pt_PT')
        apiUrl.searchParams.set('pagesize', pageSize)
        apiUrl.searchParams.set('page', page)
        apiUrl.searchParams.set('sort', 'date')
        apiUrl.searchParams.set('user_ip', userIp)
        apiUrl.searchParams.set('user_agent', userAgent)
        apiUrl.searchParams.set('url', 'https://www.mosalo.eu.cc')

        return fetchJson(apiUrl.toString(), {
          Referer: REFERER,
          'User-Agent': userAgent,
        })
      }

      data = await search(location)
      jobs = mapJobs(data)

      if (!jobs.length) {
        data = await search('')
        jobs = mapJobs(data)
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jobs,
        pages: data?.pages || 1,
        hits: data?.hits || jobs.length,
        source,
      }),
    }
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ jobs: [], pages: 1, error: String(err) }),
    }
  }
}
