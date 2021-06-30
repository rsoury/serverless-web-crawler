import Url from "url-parse";
import { homeUrl } from "../constants";
import logger from "./logger";

const home = new Url(homeUrl, true);

export default async (page, url, options = {}) => {
	const u = new Url(url, true);
	if (u.host === home.host) {
		u.set("query", { ...u.query, ...home.query });
	}
	logger.debug(`Navigate:`, u.href);

	const {
		retries = 3,
		wait: waitOptions = {},
		goto: gotoOptions = {}
	} = options;
	let isNavigated = false;
	let count = 0;
	while (!isNavigated) {
		try {
			await Promise.all([
				page.waitForNavigation({ timeout: 60000, ...waitOptions }),
				page.goto(u.href, { timeout: 60000, ...gotoOptions })
			]);
			isNavigated = true;
		} catch (e) {
			await page.reload();
			count++;
			if (count > retries - 1) {
				isNavigated = true;
				throw e;
			}
		}
	}
};
