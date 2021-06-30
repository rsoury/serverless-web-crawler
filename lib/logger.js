const Pino = require("pino");
const { isProd, logLevel } = require("./constants");

const logger = Pino({
	level: logLevel || "info",
	prettyPrint: !isProd
});

module.exports = logger;

module.exports.withModule = module => logger.child({ module });
