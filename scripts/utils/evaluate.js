const evaluate = (page, ...params) => browserFn => {
	const fnIndexes = [];
	params = params.map((param, i) => {
		if (typeof param === "function") {
			fnIndexes.push(i);
			return param.toString();
		}
		return param;
	});
	return page.evaluate(
		(fnIndexes, browserFnStr, ...params) => {
			for (let i = 0; i < fnIndexes.length; i++) {
				params[fnIndexes[i]] = new Function(
					" return (" + params[fnIndexes[i]] + ").apply(null, arguments)"
				);
			}
			browserFn = new Function(
				" return (" + browserFnStr + ").apply(null, arguments)"
			);
			return browserFn(...params);
		},
		fnIndexes,
		browserFn.toString(),
		...params
	);
};

module.exports = evaluate;
