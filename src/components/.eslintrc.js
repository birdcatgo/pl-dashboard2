module.exports = {
    parser: '@babel/eslint-parser',
    parserOptions: {
      requireConfigFile: false,
      ecmaVersion: 2021,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true, // Enables JSX parsing
      },
    },
    env: {
      browser: true, // Enables browser globals like `window` and `document`
      node: true, // Enables Node.js globals like `global` and `process`
      es2021: true, // Supports ES2021 features
    },
    extends: [
      'eslint:recommended', // Base rules from ESLint
      'plugin:react/recommended', // Recommended React rules
      'plugin:react-hooks/recommended', // Recommended React Hooks rules
      'plugin:@next/next/recommended', // Next.js specific linting rules
    ],
    rules: {
      // Custom rules
      'react/react-in-jsx-scope': 'off', // Not required with React 17+
      'react/prop-types': 'off', // Disable prop-types if using TypeScript
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
  };
  