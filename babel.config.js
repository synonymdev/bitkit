const { E2E_TESTS } = process.env;

module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
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
