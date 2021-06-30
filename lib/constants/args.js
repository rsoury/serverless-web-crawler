const { Command } = require("commander");
const isNumber = require("is-number");
const { isTest, isLambda } = require("./env");

const program = new Command();
let options = {};

const primitiveTyping = val => {
	if (val === "true") {
		return true;
	}
	if (val === "false") {
		return false;
	}
	if (isNumber(val)) {
		return parseInt(val, 10);
	}
	return val;
};

if (!isTest && !isLambda) {
	program
		.requiredOption(
			"-r, --run <string>",
			"The script name to run. 'pull-products' or 'pull-pricing'."
		)
		.option(
			"-p, --params <value>",
			"Parameters can be passed to the script in a comma-separated key value format. Array values are | separated. ie. key=value1|value2|value3. Wrap values with spaces in quotes. ie. categories='gift cards'",
			value => {
				const keyvals = value.split(",");
				const params = {};
				keyvals.forEach(keyval => {
					const [key, val] = keyval.split("=");
					let v = primitiveTyping(val);
					if (val.indexOf("|") > -1 && v === val) {
						v = val.split("|").map(arrVal => primitiveTyping(arrVal));
					}
					params[key] = v;
				});
				return params;
			}
		)
		.option(
			"-n, --concurrency <number>",
			"Set the number of concurrent Chrome instances. Defaults to 2.",
			value => parseInt(value, 10)
		)
		.option("-w, --with-ui", "Run with the Chrome UI. ie. Non-headless mode.")
		.option("-m, --monitor", "Monitor the status for the puppeteer cluster.")
		.option(
			"-sd, --same-domain-delay <value>",
			"Time in miliseconds to wait between each request to the same domain."
		)
		.option(
			"-s, --storage <value>",
			"By default, storage is 'local'. Valid values are 'local', 's3'"
		)
		.option("-t, --tor", "Use Tor Proxy Server to anonymously crawl.")
		.option(
			"-tp, --tor-proxy-port <port>",
			"Tor Proxy Sock5 Port to pass to Chrome. Defaults to 9050."
		)
		.option(
			"-l, --log-level <string>",
			"Set the log level. ie. 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'."
		)
		.option(
			"-d, --debug <items>",
			"Run in debug mode. All key data points will be stored for review. Does not respect target sites. Do not run in production.",
			value => {
				return value.split(",");
			}
		)
		.parse(process.argv);

	options = program.opts();
}

if (options.debug) {
	console.log(options);
}

let useLocalStorage = true;
let useS3Storage = false;
if (options.storage === "s3") {
	useLocalStorage = false;
	useS3Storage = true;
}

module.exports = {
	...options,
	params: options.params || {},
	sameDomainDelay: options.sameDomainDelay || 1000,
	concurrency: options.concurrency || 2,
	torProxyPort: options.torProxyPort || 9050,
	useLocalStorage,
	useS3Storage
};
