module.exports = {
	root: true,
	extends: '@react-native-community',
	parser: '@typescript-eslint/parser',
	// parserOptions: {
	// 	project: ['./tsconfig.json'], // Specify it only for TypeScript files
	// },
	plugins: ['@typescript-eslint'],
	globals: {
		localStorage: false,
	},
	rules: {
		'brace-style': [2, '1tbs', { allowSingleLine: true }],
		// 'implicit-arrow-linebreak': [2, 'beside'],
		indent: [
			2,
			'tab',
			{ SwitchCase: 1, ignoredNodes: ['ConditionalExpression'] },
		],
		'no-async-promise-executor': 0,
		'no-buffer-constructor': 0,
		'no-case-declarations': 0,
		'no-console': 0,
		'no-empty': [2, { allowEmptyCatch: true }],
		'no-shadow': 0,
		'no-undef': 0,
		'no-useless-escape': 0,
		'object-curly-spacing': [
			2,
			'always',
			{
				objectsInObjects: true,
			},
		],
		'require-atomic-updates': 0,
		semi: 2,

		// TypeScript Plugin
		// The following rules are made available via `@typescript-eslint/eslint-plugin`.
		'@typescript-eslint/explicit-function-return-type': 2,
		'@typescript-eslint/semi': 2,
		// '@typescript-eslint/no-misused-promises': 2,
		'@typescript-eslint/no-shadow': 2,
		'@typescript-eslint/no-unused-vars': 2,
		'@typescript-eslint/prefer-optional-chain': 2,

		// React Plugin
		// The following rules are made available via `eslint-plugin-react`.
		'react/default-props-match-prop-types': 2,
		'react/jsx-equals-spacing': [2, 'never'],
		'react/jsx-curly-spacing': [
			2,
			{
				when: 'never',
				attributes: { allowMultiline: true },
				children: true,
			},
		],
		'react/jsx-uses-vars': 2,
		'react/jsx-wrap-multilines': 2,
		'react/jsx-tag-spacing': [
			2,
			{
				closingSlash: 'never',
				beforeSelfClosing: 'always',
				afterOpening: 'never',
				beforeClosing: 'never',
			},
		],
		'react/jsx-indent': [2, 'tab', { indentLogicalExpressions: false }],
		'react/jsx-child-element-spacing': 2,
		'react/no-unsafe': [2, { checkAliases: true }],
		'react/no-unused-prop-types': 2,
		'react/prop-types': 2,

		// React-Native Plugin
		// The following rules are made available via `eslint-plugin-react-native`
		// 'react-native/no-color-literals': 2,
		'react-native/no-single-element-style-arrays': 2,
		'react-native/no-unused-styles': 2,
		'react-native/no-raw-text': 0,

		// Jest Plugin
		// The following rules are made available via `eslint-plugin-jest`.
		'jest/no-disabled-tests': 0,
		'react-hooks/exhaustive-deps': [
			'error',
			{
				additionalHooks: 'useDebouncedEffect',
			},
		],
	},
};
