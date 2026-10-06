/**
 * Os scripts do package.json não mudam nada nativo, mas por padrão entram
 * no fingerprint (runtimeVersion). Trocar o script de build do servidor
 * (build:server) fez os OTAs pararem de chegar no APK instalado — passou a
 * ser preciso voltar o script na mão só pra publicar. Ignorando os
 * scripts, o runtime só muda quando muda algo nativo de verdade.
 *
 * @type {import('expo/fingerprint').Config}
 */
const config = {
  sourceSkips: ["PackageJsonScriptsAll"],
};

module.exports = config;
