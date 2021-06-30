/**
 * Simple util to download images.
 */

const axios = require("axios");
const axiosRetry = require("axios-retry");

axiosRetry(axios, { retries: 3 });

const fromImageUrl = (url, useBase64 = true) =>
	axios
		.get(url, {
			responseType: "arraybuffer"
		})
		.then(response =>
			useBase64
				? `data:${response.headers["content-type"]};base64,${Buffer.from(
						response.data,
						"binary"
				  ).toString("base64")}`
				: response.data
		);

module.exports = fromImageUrl;
