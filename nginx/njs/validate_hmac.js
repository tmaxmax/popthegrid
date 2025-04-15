/**
 * @param {NginxHTTPRequest} r
 */
async function validate_hmac(r) {
  const algorithm = { name: 'HMAC', hash: 'SHA-256' }
  const key = await crypto.subtle.importKey('raw', Buffer.from(process.env.HMAC_SECRET, 'base64'), algorithm, false, ['verify'])
  const parts = r.variables.session.split('.').map((s) => Buffer.from(s, 'base64url'))
  const valid = await crypto.subtle.verify(algorithm, key, parts[1], parts[0])

  if (valid) {
    r.return(204)
  } else {
    r.headersOut['Content-Type'] = 'application/problem+json'
    r.return(401, JSON.stringify({ title: '401 Unauthorized', status: 401 }))
  }
}

export default { validate_hmac }
