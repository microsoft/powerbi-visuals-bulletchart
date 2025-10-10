import powerbiVisualsConfigs from "eslint-plugin-powerbi-visuals";
import path from 'path';

// TEMPORARY SOLUTION: Setting tsconfigRootDir for parserOptions to fix ESLint config resolution.
// TODO: Update this approach when upgrading to newer versions of eslint-plugin-powerbi-visuals or ESLint.

const recommended = {
    ...powerbiVisualsConfigs.configs.recommended,
    languageOptions: {
        ...powerbiVisualsConfigs.configs.recommended.languageOptions,
        parserOptions: {
            ...powerbiVisualsConfigs.configs.recommended.languageOptions?.parserOptions,
            tsconfigRootDir: path.resolve(),
        },
    },
};

export default [
    recommended,
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            "coverage/**",
            "test/**",
            ".tmp/**",
            "karma.conf.ts",
            "test.webpack.config.js",
            ".github/**"
        ],
    },
];
