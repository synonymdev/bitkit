const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    blacklistRE: exclusionList([
      /android\/build\/nodejs-native-assets-temp-build\/.*/,
      /\/nodejs-assets\/.*/,
      /\/android\/build\/*/,
    ])
  },
}

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = getDefaultConfig();
  customConfig.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
  customConfig.resolver.sourceExts = [...sourceExts, 'svg'];
  return mergeConfig(getDefaultConfig(__dirname), customConfig);
})();
