module.exports = {
	env: {
		node: true
	},
	globals: {
		// For use in page.evaluate()
		document: "readonly",
		window: "readonly"
	},
	extends: [
		"airbnb-base",
		"plugin:prettier/recommended",
		"prettier",
		"plugin:import/errors",
		"plugin:import/warnings"
	],
	plugins: [],
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: "module",
		allowImportExportEverywhere: true
	},
	settings: {
		"import/resolver": {
			alias: {
				extensions: [".js", ".jsx", ".json"]
			}
		}
	},
	rules: {
		"no-console": "off",
		"no-shadow": "off",
		"no-unused-vars": ["error", { ignoreRestSiblings: true }],
		// See: https://github.com/benmosher/eslint-plugin-import/issues/496
		// https://stackoverflow.com/questions/44939304/eslint-should-be-listed-in-the-projects-dependencies-not-devdependencies
		"import/no-extraneous-dependencies": ["error", { devDependencies: true }],
		"import/prefer-default-export": 0,
		"no-template-curly-in-string": 0,
		"no-underscore-dangle": 0,
		"class-methods-use-this": 0,
		"no-param-reassign": 0
	}
};
