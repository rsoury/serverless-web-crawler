const Sentry = require("@sentry/node");
const { sentryDSN } = require("../constants");
const logger = require("../logger");

if (sentryDSN) {
	Sentry.init({
		dsn: sentryDSN,
		environment: process.env.NODE_ENV || "development"
	});
} else {
	logger.warn(`Sentry DSN doesnt exist. Errors are not being tracked.`);
}

module.exports = Sentry;
