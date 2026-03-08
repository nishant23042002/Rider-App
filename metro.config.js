const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    blockList: [/android\/app\/\.cxx\/.*/, /android\/\.cxx\/.*/],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
