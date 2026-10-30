const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// La machine de dev a peu de mémoire : en LOCAL (eas update / export), on limite
// Metro à 1 worker pour éviter l'erreur « out of memory ». En cloud (EAS_BUILD),
// on garde le parallélisme par défaut pour ne pas ralentir les builds.
if (!process.env.EAS_BUILD) {
  config.maxWorkers = 1;
}

module.exports = config;
