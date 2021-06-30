const promiseRetry = async (requestFn, config = {}) => {
	const { retries = 3, onRetry = () => {} } = config;
	let count = 0;
	let isWorking = false;
	let resp;
	while (isWorking === false) {
		try {
			resp = await requestFn();
			isWorking = true;
		} catch (e) {
			count++;
			if (count >= retries) {
				throw e;
			} else {
				onRetry(count, e);
			}
		}
	}
	return resp;
};

module.exports = promiseRetry;
