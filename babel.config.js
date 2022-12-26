module.exports = {
	presets: ['module:metro-react-native-babel-preset'],
	plugins: ['module:react-native-dotenv', 'react-native-reanimated/plugin'],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
};
