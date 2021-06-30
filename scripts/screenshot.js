/**
 * This is an example script to demonstrate the library.
 */

const path = require("path");

const { Crawler } = require("../lib/crawler");
const logger = require("../lib/logger");

async function ScreenshotScript(params) {
	const crawler = await Crawler();
	crawler.queue(params.url, async ({ page, data: url }) => {
		await page.goto(url);
		await page.screenshot({
			path: path.resolve(__dirname, "../screenshot.jpg"),
			type: "jpeg",
			fullPage: true
		});
	});

	await crawler.idle();
	logger.info(`Screenshot taken of ${params.url}`);
}

module.exports = ScreenshotScript;
