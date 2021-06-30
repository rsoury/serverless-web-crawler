import isUndefined from "lodash/isUndefined";

export default async function(page, selector, options = {}) {
	const { timeout = 10000, retries = 3, visible, hidden } = options;
	let isFound = false;
	let count = 0;
	while (!isFound) {
		try {
			const waitOptions = {
				timeout
			};
			if (!isUndefined(visible)) {
				waitOptions.visible = visible;
			}
			if (!isUndefined(hidden)) {
				waitOptions.hidden = hidden;
			}
			await page.waitForSelector(selector, waitOptions);
			isFound = true;
		} catch (e) {
			await page.reload();
			count++;
			if (count > retries - 1) {
				isFound = true;
				throw e;
			}
		}
	}
}
