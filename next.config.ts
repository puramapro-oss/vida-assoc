import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  // Package workspace `@purama/smarana` livré en source TS (pas de build step) —
  // Next.js n'applique SWC qu'aux packages listés ici, sinon node_modules est ignoré par défaut.
  transpilePackages: ['@purama/smarana'],
  // `@purama/smarana` vit hors de `vida-assoc/` (lié par symlink npm `file:../packages/smarana`) —
  // sans ce flag, Next refuse de bundler un module résolu en dehors du dossier racine du projet.
  // uuid@11 dropped the legacy `uuid/v4` deep import that the abandoned
  // `request` package (pulled in transitively via javascript-opentimestamps)
  // still uses. Alias it to a shim so the CVE-fixed uuid version resolves.
}

export default withNextIntl(nextConfig)
