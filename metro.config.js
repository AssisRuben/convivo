const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Expo desativa inlineRequires por padrão, o que quebra a inicialização
// dos Worklets (react-native-reanimated 4 / react-native-worklets) —
// achado batendo um crash nativo real no Expo Go Android (libworklets.so
// na pilha), causa documentada e conhecida pra esse sintoma específico.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = withNativeWind(config, { input: "./src/global.css" });
