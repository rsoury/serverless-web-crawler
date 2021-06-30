import * as Sentry from "@sentry/node";
import { SentryDSN } from "../constants";
import logger from "./logger";

if (SentryDSN) {
	Sentry.init({
		dsn: SentryDSN,
		environment: process.env.NODE_ENV || "development"
	});
} else {
	logger.warn(`Sentry DSN doesnt exist. Errors are not being tracked.`);
}

export default Sentry;
