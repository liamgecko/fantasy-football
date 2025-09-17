import {
  DEFAULT_HEADERS,
  DEFAULT_REVALIDATE_SECONDS,
  ESPN_CORE_BASE_URL,
  ESPN_CORE_V3_BASE_URL,
  ESPN_SITE_BASE_URL,
  ESPN_SITE_WEB_BASE_URL,
} from "./config"

export class ESPNApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string
  ) {
    super(message)
    this.name = "ESPNApiError"
  }
}

type FetchOptions = {
  searchParams?: Record<string, string | number | boolean | undefined>
  init?: RequestInit
  revalidate?: number
  cacheTags?: string[]
}

function buildUrl(base: string, path: string, searchParams?: FetchOptions["searchParams"]) {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path
  const url = new URL(`${base}/${normalizedPath}`)

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined) return
      url.searchParams.set(key, String(value))
    })
  }

  return url.toString()
}

async function doFetch<T>(url: string, { init, revalidate, cacheTags }: Omit<FetchOptions, "searchParams"> = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...init?.headers,
    },
    next: {
      revalidate: revalidate ?? DEFAULT_REVALIDATE_SECONDS,
      tags: cacheTags,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new ESPNApiError(message || response.statusText, response.status, url)
  }

  return (await response.json()) as T
}

export async function espnSiteFetch<T>(path: string, options: FetchOptions = {}) {
  const url = buildUrl(ESPN_SITE_BASE_URL, path, options.searchParams)
  return doFetch<T>(url, options)
}

export async function espnCoreFetch<T>(path: string, options: FetchOptions = {}) {
  const url = buildUrl(ESPN_CORE_BASE_URL, path, options.searchParams)
  return doFetch<T>(url, options)
}

export async function espnCoreV3Fetch<T>(path: string, options: FetchOptions = {}) {
  const url = buildUrl(ESPN_CORE_V3_BASE_URL, path, options.searchParams)
  return doFetch<T>(url, options)
}

export async function espnSiteWebFetch<T>(path: string, options: FetchOptions = {}) {
  const url = buildUrl(ESPN_SITE_WEB_BASE_URL, path, options.searchParams)
  return doFetch<T>(url, options)
}
