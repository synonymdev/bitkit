/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const { getDefaultConfig } = require('metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const path = require('path');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();
  return {
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
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
      extraNodeModules: {
        ...require('node-libs-react-native'),
        "sodium-native": path.resolve(__dirname, './node_modules/react-native-libsodium'),
      },
      blacklistRE: exclusionList([
        /android\/build\/nodejs-native-assets-temp-build\/.*/,
        /\/nodejs-assets\/.*/,
        /\/node_modules\/sodium-native\/.*/
      ])
    },
  };
})();
