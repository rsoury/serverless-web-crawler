const Sentry = require("@sentry/node");
const { SentryDSN } = require("../constants");
const logger = require("../logger");

if (SentryDSN) {
	Sentry.init({
		dsn: SentryDSN,
		environment: process.env.NODE_ENV || "development"
	});
} else {
	logger.warn(`Sentry DSN doesnt exist. Errors are not being tracked.`);
}

module.exports = Sentry;
