/**
 * This is an example script to demonstrate the library.
 */

const path = require("path");
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs").promises;

const { Crawler } = require("../lib/crawler");
const logger = require("../lib/logger");
const {
	useS3Storage,
	s3BucketName,
	awsCredentials
} = require("../lib/constants");

const s3client = awsCredentials.accessKeyId
	? new S3({ ...awsCredentials })
	: new S3();

async function ScreenshotScript(params) {
	const crawler = await Crawler();
	let screenshotData;

	crawler.queue(params.url, async ({ page, data: url }) => {
		await page.goto(url);
		screenshotData = await page.screenshot({
			type: "jpeg",
			fullPage: true
		});
	});

	await crawler.idle();
	logger.info(`Screenshot taken of ${params.url}`);

	if (useS3Storage) {
		await s3client
			.upload({
				Bucket: s3BucketName,
				Key: "serverless-web-crawler/screenshot.jpg",
				Body: screenshotData,
				ContentType: "image/jpeg",
				ACL: "public-read"
			})
			.promise();
		logger.info(`Saved screenshot to S3.`);
	} else {
		const outputFilePath = path.resolve(__dirname, "../screenshot.jpg");
		try {
			await fs.writeFile(outputFilePath, screenshotData);
			logger.info("Saved screenshot to disk.");
		} catch (err) {
			logger.error("Failed to write screenshot to file", err);
		}
	}
}

module.exports = ScreenshotScript;
