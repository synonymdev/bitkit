const { types } = require('@babel/core');

module.exports = {
	presets: ['module:metro-react-native-babel-preset'],
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
		['@babel/plugin-proposal-private-methods', { loose: true }],
	],
	env: {
		production: {
			plugins: ['transform-remove-console'],
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
