import { describe, expect, test } from 'bun:test'
import { extractAccessToken, normalizeTeamDomain } from './cloudflareAccess'

describe('cloudflareAccess', () => {
  test('prefers the Cloudflare Access assertion header over the cookie', () => {
    const headers = new Headers({
      'Cf-Access-Jwt-Assertion': 'header-token',
      cookie: 'CF_Authorization=cookie-token',
    })

    expect(extractAccessToken(headers)).toBe('header-token')
  })

  test('falls back to the Cloudflare Access cookie when the header is absent', () => {
    const headers = new Headers({
      cookie: 'other=value; CF_Authorization=cookie-token',
    })

    expect(extractAccessToken(headers)).toBe('cookie-token')
  })

  test('normalizes the team domain to an https origin', () => {
    expect(normalizeTeamDomain('example.cloudflareaccess.com/')).toBe(
      'https://example.cloudflareaccess.com',
    )
  })
})
