module.exports = {
	preset: 'react-native',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	transformIgnorePatterns: ['<roodDir>/__mocks__'],
	setupFiles: [
		'<rootDir>/jest.setup.js',
		'./node_modules/react-native-gesture-handler/jestSetup.js',
	],
	moduleNameMapper: {
		'\\.(jpg|jpeg|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
	},
};
