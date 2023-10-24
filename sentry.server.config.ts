// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://6a42cc2a6137871668b15aabceaf52c0@o4505652838596608.ingest.sentry.io/4505958926123008",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  enableTracing: process.env.NODE_ENV !== "development" || true,
  environment: process.env.NODE_ENV,
  debug: false,
});
