// Learn more https://docs.expo.dev/guides/monorepos
// SDK 52+ automatically configures Metro for monorepos

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { FileStore } = require("metro-cache");
const path = require("path");

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, "node_modules", ".cache", "metro"),
  }),
];

module.exports = withNativeWind(config, {
  input: "./src/app/global.css",
  inlineRem: 16,
});
