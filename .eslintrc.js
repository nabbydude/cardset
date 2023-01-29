module.exports = {
  parser: "@typescript-eslint/parser",
  env: "browser",
  // ignorePatterns: [".eslintrc.js"],
  plugins: [
    "@typescript-eslint",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  // rules: {
  //   semi: "always",
  // },
}
