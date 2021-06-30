const programArgs = require("./args");
const envArgs = require("./env");

module.exports = {
	...programArgs,
	...envArgs
};
