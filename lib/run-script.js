const logger = require("./logger");
const Sentry = require("./utils/sentry");
const { params } = require("./constants");

async function runScript(scriptPath) {
	console.time("Finished in");
	const die = async (signalNumber) => {
		console.timeEnd("Finished in");
		// Exit fires an even in crawler that will destroy remaining crawler zombie processes.
		process.exit(signalNumber);
	};
	try {
		const scriptFn = require(scriptPath);
		await scriptFn(params);
		die(0);
	} catch (e) {
		Sentry.captureException(e);
		logger.error(e.message, e.stack);
		Sentry.flush(2500)
			.catch((flushErr) => {
				logger.error(flushErr.message, flushErr.stack);
			})
			.finally(() => {
				die(1);
			});
	}
}

module.exports = runScript;
