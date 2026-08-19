import { View } from "react-native";
import { DotLottie } from "@lottiefiles/dotlottie-react-native";
import { LADDER_LENGTHS } from "@/constants/petStages";

// Metro só resolve assets estáticos (imagem, fonte, .lottie) com
// require() literal — import() dinâmico não bundleia o arquivo.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BEAR = require("../../assets/animations/bear.lottie");

const BASE_SIZE = 200;

/**
 * O bichinho (urso acenando) representando o progresso de uma meta —
 * cresce visualmente (escala) conforme o estágio avança, já que a mesma
 * animação em loop não tem estágios distintos embutidos.
 */
export function PetAnimation({
  goalType,
  stage,
}: {
  goalType: "PESO" | "ROTINA";
  stage: number;
}) {
  const ladderLength = LADDER_LENGTHS[goalType];
  const ratio = ladderLength <= 1 ? 1 : stage / (ladderLength - 1);
  const scale = 0.7 + ratio * 0.5;

  return (
    <View className="items-center justify-center" style={{ transform: [{ scale }] }}>
      <DotLottie
        source={BEAR}
        autoplay
        loop
        style={{ width: BASE_SIZE, height: BASE_SIZE }}
      />
    </View>
  );
}
