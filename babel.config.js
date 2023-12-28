const { types } = require('@babel/core');
const { E2E_TESTS } = process.env;

module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		// Support bigint literal `0n`
		transformBigIntLiteral,
		// Support `for await () {}`
		'@babel/plugin-proposal-async-generator-functions',
		[
			'module:react-native-dotenv',
			{
				safe: true,
				allowUndefined: false,
			},
		],
		'react-native-reanimated/plugin',
	],
	env: {
		production: {
			// do not use `transform-remove-console` in e2e tests
			// so we can see all the logs
			plugins: E2E_TESTS ? [] : ['transform-remove-console'],
		},
	},
};

// Copied from unsupported https://github.com/babel/babel/pull/10102/files
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function transformBigIntLiteral() {
	return {
		visitor: {
			// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			BigIntLiteral(path) {
				const bigintCall = types.callExpression(types.identifier('BigInt'), [
					types.stringLiteral(path.node.value),
				]);
				path.replaceWith(bigintCall);
			},
		},
	};
}
