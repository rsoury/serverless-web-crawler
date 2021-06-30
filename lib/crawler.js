const vanillaPuppeteer = require("puppeteer");
const { addExtra } = require("puppeteer-extra");
const { Cluster } = require("puppeteer-cluster");
const Adblocker = require("puppeteer-extra-plugin-adblocker");
const Stealth = require("puppeteer-extra-plugin-stealth");
const AnonymizeUA = require("puppeteer-extra-plugin-anonymize-ua");
const UserDataDir = require("puppeteer-extra-plugin-user-data-dir");
const isUndefined = require("lodash/isUndefined");
const isEmpty = require("is-empty");
const treekill = require("tree-kill");
const get = require("lodash/get");
const UserAgent = require("user-agents");
const ono = require("ono");

const { withModule } = require("./logger");
const {
	withUi,
	monitor,
	concurrency,
	tor,
	torProxyPort,
	sameDomainDelay
} = require("./constants");

const logger = withModule("crawler");
let headless = true;
if (!isUndefined(withUi)) {
	headless = !withUi;
}

// Setup puppeteer plugins
const puppeteer = addExtra(vanillaPuppeteer);
puppeteer.use(Adblocker());
puppeteer.use(Stealth());
puppeteer.use(
	AnonymizeUA({
		makeWindows: false,
		stripHeadless: false,
		customFn() {
			const ua = new UserAgent();
			return ua.toString();
		}
	})
);
puppeteer.use(UserDataDir()); // Manages temp store and clean at launch/close for user data dir.

// Outside of the exported function to ensure a singleton. ie. cannot launch multiple clusters per execution.
const crawlerInstancePromise = Cluster.launch({
	concurrency: Cluster.CONCURRENCY_CONTEXT,
	maxConcurrency: concurrency,
	timeout: 10800000, // 3 hours
	monitor: !isUndefined(monitor),
	puppeteer,
	puppeteerOptions: {
		headless,
		ignoreHTTPSErrors: true,
		defaultViewport: {
			width: 1280,
			height: 900
		},
		dumpio: false,
		args: [
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--no-sandbox"
		].concat(tor ? [`--proxy-server=socks5://127.0.0.1:${torProxyPort}`] : [])
	},
	retryLimit: 3,
	retryDelay: 3000,
	sameDomainDelay
});

let instance;

const getCrawlerInstance = () => instance;

const destroyCrawler = async () => {
	if (!isEmpty(instance)) {
		// Gracefully close
		await instance.close();

		if (typeof get(instance, "browser.browser.process") === "function") {
			const { pid } = instance.browser.browser.process();
			if (!isUndefined(pid)) {
				treekill(pid, "SIGKILL");
			}
		}
	}
};

process.on("SIGTERM", () => destroyCrawler());
process.on("exit", () => destroyCrawler());

async function Crawler() {
	if (!isEmpty(instance)) {
		return instance;
	}
	try {
		instance = await crawlerInstancePromise;
		// Event handler to be called in case of problems
		instance.on("taskerror", (err, data) => {
			const args = [`Error crawling:`, err.message, err.stack];
			if (!isEmpty(data)) {
				args.push(typeof data === "object" ? JSON.stringify(data) : data);
			}
			logger.error(...args);
		});

		if (tor) {
			logger.info(`Establishing Tor Proxy connection: ${torProxyPort}`);
			let isOperational = false;
			instance.queue(
				"https://check.torproject.org/",
				async ({ page, data: url }) => {
					await Promise.all([page.waitForNavigation(), page.goto(url)]);
					const isUsingTor = await page.$eval("body", el =>
						el.innerHTML.includes(
							"Congratulations. This browser is configured to use Tor"
						)
					);
					isOperational = isUsingTor;
				}
			);
			await instance.idle();
			if (isOperational) {
				logger.info(`Browser is using Tor successfully.`);
			} else {
				throw new Error(`Browser failed to use Tor.`);
			}
		}

		return instance;
	} catch (e) {
		logger.error(e);
		throw ono(e, "Cannot initiate Crawler");
	}
}

module.exports.Crawler = Crawler;
module.exports.getCrawlerInstance = getCrawlerInstance;
module.exports.destroyCrawler = destroyCrawler;
