/**
 * Minimal Sentry initialisation shim.
 * Full SDK setup: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 *
 * Add NEXT_PUBLIC_SENTRY_DSN to your .env and Vercel env vars,
 * then replace this file with the output of `npx @sentry/wizard@latest -i nextjs`.
 */

export function captureException(err: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    // TODO: replace with Sentry.captureException(err, { extra: context })
    console.error("[sentry:captureException]", err, context);
  } else {
    console.error("[dev:error]", err, context);
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (process.env.NODE_ENV === "production") {
    // TODO: replace with Sentry.captureMessage(message, level)
    console.log(`[sentry:${level}]`, message);
  } else {
    console.log(`[dev:${level}]`, message);
  }
}
