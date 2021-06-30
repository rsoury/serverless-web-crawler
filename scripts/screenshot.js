/**
 * This is an example script to demonstrate the library.
 */

const { Crawler } = require("../lib/crawler");
const logger = require("../lib/logger");

const navigate = require("./utils/navigate");

async function ScreenshotScript(params) {
	const crawler = await Crawler();
	crawler.queue(params.url, async ({ page, data: url }) => {
		await navigate(page, url);
		await page.screeshot();
	});

	await crawler.idle();
	logger.info(`Screenshot taken of ${params.url}`);
}

module.exports = ScreenshotScript;
