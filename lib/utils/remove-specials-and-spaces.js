/**
 * Removes special characters and spaces
 *
 * @param {string} str
 * @return {string} stripped characters str
 */
const removeSpecialsAndSpaces = str => str.replace(/[^A-Z0-9]/gi, "");

module.exports = removeSpecialsAndSpaces;
