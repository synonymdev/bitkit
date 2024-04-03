const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
	transformer: {
		// Need this here because of some metro weirdness
		getTransformOptions: async () => ({}),
		babelTransformerPath: require.resolve('react-native-svg-transformer'),
	},
	resolver: {
		assetExts: assetExts.filter((ext) => ext !== 'svg'),
		sourceExts: [...sourceExts, 'svg'],
		extraNodeModules: {
			buffer: path.resolve(__dirname, './node_modules/@craftzdog/react-native-buffer'),
			crypto: path.resolve(__dirname, './node_modules/react-native-quick-crypto'),
			stream: path.resolve(__dirname, './node_modules/stream-browserify'),
			'sodium-universal': path.resolve(__dirname, './node_modules/sodium-react-native-direct'),
		},
		blacklistRE: exclusionList([
			/\/node_modules\/sodium-universal\/.*/,
			/\/android\/build\/*/,
		]),
	},
};

module.exports = mergeConfig(defaultConfig, config);
