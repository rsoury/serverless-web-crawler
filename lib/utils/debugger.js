/**
 * Our own debugger that accepts objects, and writes to console/file if a --debug flag is passed.
 */

const util = require("util");
const path = require("path");
const { writeJsonSync, emptyDirSync } = require("fs-extra");
const isUndefined = require("lodash/isUndefined");
const filenamify = require("filenamify");
const debugLog = require("debug-logfmt");
const { isTest, debug: debugArg } = require("../constants");

let dir;
let debug = debugArg;
if (isTest) {
	debug = ["file"];
}
const enabled = !isUndefined(debug);

if (enabled) {
	console.log(`Log id is: ${process.pid}`);
	dir = path.resolve(
		__dirname,
		`../../debug/${isTest ? "test" : "logs"}/${Date.now()}-${process.pid}`
	);
	emptyDirSync(dir);
}

export const DebugLogger = debugLog;

export const getDebugPath = (additionalPath) => {
	if (!enabled) {
		throw new Error("Debug not set. Cannot return Debug path.");
	}
	return path.resolve(dir, additionalPath);
};

export const debugScreenshot = (page, name, options = {}) => {
	if (!enabled) {
		return;
	}

	const baseOptions = {
		path: path.resolve(dir, filenamify(name, { replacement: "-" })),
		type: "jpeg",
		quality: 100
	};

	return page.screenshot({
		...baseOptions,
		...options
	});
};

export default (data, filename = "debug.log") => {
	if (!enabled) {
		return;
	}

	if (typeof data === "function") {
		const fn = data;
		return fn(dir);
	}

	// Sanitize file name.
	filename = filenamify(filename, { replacement: "-" });

	let toConsole = true;
	let toFile = true;

	if (Array.isArray(debug)) {
		if (!debug.includes("console")) {
			toConsole = false;
		}
		if (!debug.includes("file")) {
			toFile = false;
		}
	} else if (typeof debug === "string") {
		switch (debug) {
			case "file":
				toConsole = false;
				toFile = true;
				break;
			case "console":
				toConsole = true;
				toFile = false;
				break;
			default:
				break;
		}
	}

	if (toConsole) {
		console.log(util.inspect(data, false, null, true));
	}

	if (toFile) {
		writeJsonSync(
			path.resolve(dir, filename),
			data,
			{
				spaces: "\t"
			},
			(err) => {
				if (err) console.error(err);
			}
		);
	}
};
