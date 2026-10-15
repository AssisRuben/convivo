import { useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { parseRedeemQr } from "@/lib/wallet/walletRules";

/**
 * Leitor de QR ao vivo (câmera traseira) pro resgate de créditos: aponta
 * pra tela do cliente e devolve o código de 6 dígitos. QR de outra coisa
 * mostra aviso e continua lendo. Pede a permissão da câmera na primeira vez.
 */
export function QrScannerModal({
  visible,
  onClose,
  onCode,
}: {
  visible: boolean;
  onClose: () => void;
  onCode: (code: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [wrongQr, setWrongQr] = useState(false);
  // A câmera dispara várias leituras por segundo: só a primeira vale.
  const handled = useRef(false);

  function handleScan(result: BarcodeScanningResult) {
    if (handled.current) return;
    const code = parseRedeemQr(result.data);
    if (!code) {
      setWrongQr(true);
      return;
    }
    handled.current = true;
    onCode(code);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onShow={() => {
        handled.current = false;
        setWrongQr(false);
      }}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {!permission ? null : !permission.granted ? (
          <View className="flex-1 items-center justify-center gap-4 p-8">
            <Ionicons name="camera-outline" size={48} color="#fff" />
            <Text className="text-center text-base text-white">
              Pra ler o QR do cliente, o app precisa usar a câmera.
            </Text>
            <Pressable onPress={requestPermission} className="rounded-full bg-mint px-6 py-3">
              <Text className="font-semibold text-white">Permitir câmera</Text>
            </Pressable>
          </View>
        ) : (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={visible ? handleScan : undefined}
          />
        )}

        {/* Moldura e instrução por cima da câmera */}
        {permission?.granted && (
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <View className="h-64 w-64 rounded-3xl border-4 border-mint" />
            <Text className="mt-6 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
              {wrongQr ? "Esse QR não é de créditos do Convivo" : "Aponte para o QR na tela do cliente"}
            </Text>
          </View>
        )}

        <Pressable
          onPress={onClose}
          accessibilityLabel="Fechar leitor"
          className="absolute right-5 top-12 h-11 w-11 items-center justify-center rounded-full bg-black/60"
        >
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}
