import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  // uuid@11 dropped the legacy `uuid/v4` deep import that the abandoned
  // `request` package (pulled in transitively via javascript-opentimestamps)
  // still uses. Alias it to a shim so the CVE-fixed uuid version resolves.
  turbopack: {
    resolveAlias: {
      "uuid/v4": "./shims/uuid-v4.js",
    },
  },
}

export default withNextIntl(nextConfig)
