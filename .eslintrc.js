module.exports = {
	parser: "@typescript-eslint/parser",
	env: {
		browser: true
	},
	ignorePatterns: [".eslintrc.js"],
	plugins: [
		"@typescript-eslint",
	],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
	],
	rules: {
		semi: "warn",
		camelcase: "warn",
		quotes: ["warn", "double"],
		indent: ["warn", "tab", { "SwitchCase": 1 }],
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-explicit-any": "warn",
		"@typescript-eslint/no-inferrable-types": "off",
		"@typescript-eslint/no-empty-function": "off",
	},
}
