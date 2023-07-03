module.exports = {
	parser: "@typescript-eslint/parser",
	env: "browser",
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
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-explicit-any": "warn",
		"@typescript-eslint/no-inferrable-types": "off",
		"@typescript-eslint/no-empty-function": "off",
	},
}
