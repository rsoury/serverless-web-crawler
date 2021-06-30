/**
 * This Util is great if you're iterating over S3 Objects and need to run some browser related functions as per data in each S3 Object.
 */

async function asyncForEach(array, callback, untilFn = () => false) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
		if (untilFn(array[index], index, array)) {
			break;
		}
	}
}

module.exports = asyncForEach;
