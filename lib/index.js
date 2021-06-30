/**
 * Entry point for the library that manages the process of running the Puppeteer script(s).
 */

const path = require("path");
const fs = require("fs");
const isUndefined = require("lodash/isUndefined");
const { run: runScriptName, executionName } = require("./constants");
const logger = require("./logger");
const runScript = require("./run-script");

logger.info(`Job Tasked: ${runScriptName}`);
logger.info(`Execution: ${executionName || "test"}`);

if (isUndefined(runScriptName)) {
	throw new Error("Script name is undefined.");
}

const scriptPath = path.resolve(__dirname, `../scripts/${runScriptName}.js`);

if (!fs.existsSync(scriptPath)) {
	throw new Error("Invalid script name.");
}

runScript(scriptPath);
