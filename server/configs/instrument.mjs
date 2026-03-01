import * as Sentry from "@sentry/node" 


Sentry.init({
  dsn: "https://d3f68a82a665e49f416194edd1bbfdc0@o4510968682774528.ingest.us.sentry.io/4510968687099905",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});