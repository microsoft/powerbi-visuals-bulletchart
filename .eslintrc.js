module.exports = {
    env: {
        "browser": true,
        "es6": true,
        "es2017": true,
    },
    root: true,
    parserOptions: {
        parser: "@typescript-eslint/parser",
        project: "tsconfig.json",
        tsconfigRootDir: ".",
    },
    plugins: [
        "powerbi-visuals"
    ],
    extends: [
        "plugin:powerbi-visuals/recommended"
    ],
    rules: {}
};