const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// .lottie (animações do bichinho/troféu) é um zip binário — precisa ser
// tratado como asset (igual imagem/fonte), não como módulo JS.
config.resolver.assetExts.push("lottie");

module.exports = withNativeWind(config, { input: "./src/global.css" });
