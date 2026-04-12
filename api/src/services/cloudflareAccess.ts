import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { MiddlewareHandler } from 'hono'

const ACCESS_HEADER_NAME = 'Cf-Access-Jwt-Assertion'
const ACCESS_COOKIE_NAME = 'CF_Authorization'
const ACCESS_CERT_PATH = '/cdn-cgi/access/certs'

type AccessBindings = {
  TEAM_DOMAIN?: string
  POLICY_AUD?: string
}

type AccessConfigurationError = {
  message: string
  status: number
}

type RemoteJwks = ReturnType<typeof createRemoteJWKSet>

const remoteJwksCache = new Map<string, RemoteJwks>()

/**
 * Creates middleware that validates Cloudflare Access JWTs on incoming origin requests.
 *
 * Example:
 * ```ts
 * app.use('*', createCloudflareAccessMiddleware())
 * ```
 */
export function createCloudflareAccessMiddleware(): MiddlewareHandler<{ Bindings: AccessBindings }> {
  return async (context, next) => {
    const configurationError = getConfigurationError(context.env)
    if (configurationError) {
      return context.json({ error: configurationError.message }, configurationError.status)
    }

    const accessToken = extractAccessToken(context.req.raw.headers)
    if (!accessToken) {
      return context.json({ error: 'Cloudflare Access token is required' }, 401)
    }

    try {
      await verifyAccessToken(accessToken, context.env)
      return next()
    } catch {
      return context.json({ error: 'Invalid Cloudflare Access token' }, 403)
    }
  }
}

/**
 * Extracts the Cloudflare Access JWT from the origin request.
 *
 * The header is preferred because Cloudflare forwards it reliably for origin requests.
 *
 * Example:
 * ```ts
 * const token = extractAccessToken(request.headers)
 * ```
 */
export function extractAccessToken(headers: Headers): string | null {
  const headerToken = headers.get(ACCESS_HEADER_NAME)?.trim()
  if (headerToken) {
    return headerToken
  }

  return getCookieValue(headers.get('cookie'), ACCESS_COOKIE_NAME)
}

/**
 * Verifies a Cloudflare Access JWT using the account's public JWKS endpoint.
 *
 * Example:
 * ```ts
 * const payload = await verifyAccessToken(token, {
 *   TEAM_DOMAIN: 'https://example.cloudflareaccess.com',
 *   POLICY_AUD: 'audience-id',
 * })
 * ```
 */
export async function verifyAccessToken(token: string, env: AccessBindings): Promise<JWTPayload> {
  const issuer = normalizeTeamDomain(env.TEAM_DOMAIN ?? '')
  const audience = env.POLICY_AUD ?? ''
  const jwks = getRemoteJwks(issuer)
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience,
    algorithms: ['RS256'],
  })

  return payload
}

export function normalizeTeamDomain(teamDomain: string): string {
  const trimmedTeamDomain = teamDomain.trim().replace(/\/+$/, '')
  if (trimmedTeamDomain.startsWith('http://') || trimmedTeamDomain.startsWith('https://')) {
    return trimmedTeamDomain
  }

  return `https://${trimmedTeamDomain}`
}

function getConfigurationError(env: AccessBindings): AccessConfigurationError | null {
  if (!env.TEAM_DOMAIN) {
    return { message: 'TEAM_DOMAIN environment variable is required', status: 500 }
  }

  if (!env.POLICY_AUD) {
    return { message: 'POLICY_AUD environment variable is required', status: 500 }
  }

  return null
}

function getRemoteJwks(teamDomain: string): RemoteJwks {
  const normalizedTeamDomain = normalizeTeamDomain(teamDomain)
  const cachedJwks = remoteJwksCache.get(normalizedTeamDomain)

  if (cachedJwks) {
    return cachedJwks
  }

  const certsUrl = new URL(ACCESS_CERT_PATH, normalizedTeamDomain)
  const remoteJwks = createRemoteJWKSet(certsUrl)
  remoteJwksCache.set(normalizedTeamDomain, remoteJwks)

  return remoteJwks
}

function getCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) {
    return null
  }

  const matchingCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))

  if (!matchingCookie) {
    return null
  }

  const cookieValue = matchingCookie.slice(cookieName.length + 1).trim().replace(/^"|"$/g, '')

  try {
    return decodeURIComponent(cookieValue)
  } catch {
    return cookieValue
  }
}
