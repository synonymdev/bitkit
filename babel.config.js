module.exports = {
	presets: ['module:metro-react-native-babel-preset'],
	plugins: [
		// needed to make `for await (` work in js
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
			plugins: ['transform-remove-console'],
		},
	},
};
