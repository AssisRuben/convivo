import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { showAlert } from "@/lib/alert";

/**
 * Foto de perfil — estado compartilhado (Home, Menu, Meus dados mostram a
 * mesma foto) num cache de módulo, buscado uma vez por usuário logado.
 * Chaveado pelo id do usuário: trocar de conta no mesmo aparelho não pode
 * mostrar a foto da conta anterior.
 */
type AvatarState = { userId: string | null; dataUrl: string | null; loaded: boolean };

let shared: AvatarState = { userId: null, dataUrl: null, loaded: false };
const listeners = new Set<(s: AvatarState) => void>();

function setShared(next: AvatarState) {
  shared = next;
  listeners.forEach((l) => l(next));
}

// Reduz no aparelho antes de enviar: foto de câmera tem vários MB, e o
// avatar nunca aparece maior que ~100px — 400px de largura sobra.
const AVATAR_WIDTH = 400;

async function toSmallJpegBase64(uri: string): Promise<string> {
  const rendered = await ImageManipulator.manipulate(uri).resize({ width: AVATAR_WIDTH }).renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!saved.base64) throw new Error("Não foi possível processar a imagem");
  return saved.base64;
}

export function useAvatar() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<AvatarState>(shared);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (shared.userId === userId && shared.loaded) return;
    setShared({ userId, dataUrl: null, loaded: false });
    apiFetch("/api/mobile/profile/avatar")
      .then((res) => (res.ok ? res.json() : { avatar: null }))
      .then((data: { avatar: { dataUrl: string } | null }) => {
        if (shared.userId === userId) setShared({ userId, dataUrl: data.avatar?.dataUrl ?? null, loaded: true });
      })
      .catch(() => {});
  }, [userId]);

  async function upload(uri: string) {
    setBusy(true);
    try {
      const base64 = await toSmallJpegBase64(uri);
      const res = await apiFetch("/api/mobile/profile/avatar", {
        method: "PUT",
        body: JSON.stringify({ base64, mimeType: "image/jpeg" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar a foto");
      setShared({ userId, dataUrl: data.avatar?.dataUrl ?? null, loaded: true });
    } catch (error) {
      showAlert("Foto de perfil", error instanceof Error ? error.message : "Não foi possível salvar a foto");
    } finally {
      setBusy(false);
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) await upload(result.assets[0].uri);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert("Câmera", "Libere o acesso à câmera nas configurações do celular pra tirar a foto.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) await upload(result.assets[0].uri);
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await apiFetch("/api/mobile/profile/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setShared({ userId, dataUrl: null, loaded: true });
    } catch {
      showAlert("Foto de perfil", "Não foi possível remover a foto.");
    } finally {
      setBusy(false);
    }
  }

  return {
    dataUrl: state.userId === userId ? state.dataUrl : null,
    busy,
    pickFromLibrary,
    takePhoto,
    remove,
  };
}

/** Círculo com a foto (ou ícone de pessoa); tocar abre as opções de foto. */
export function UserAvatar({ size = 64, editable = true }: { size?: number; editable?: boolean }) {
  const avatar = useAvatar();
  const [menuOpen, setMenuOpen] = useState(false);

  function choose(action: () => Promise<void>) {
    setMenuOpen(false);
    // Deixa o modal fechar antes de abrir a galeria/câmera — abrir por cima
    // de um Modal ainda visível trava em alguns Androids.
    setTimeout(() => {
      action().catch(() => {});
    }, 250);
  }

  const circle = (
    <View
      className="items-center justify-center overflow-hidden rounded-full bg-navy/10"
      style={{ width: size, height: size }}
    >
      {avatar.dataUrl ? (
        <Image source={{ uri: avatar.dataUrl }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Ionicons name="person" size={size * 0.45} color="#0b1e3d" />
      )}
      {avatar.busy && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </View>
  );

  if (!editable) return circle;

  return (
    <>
      <Pressable onPress={() => setMenuOpen(true)} accessibilityLabel="Alterar foto de perfil">
        {circle}
        <View
          className="absolute bottom-0 right-0 items-center justify-center rounded-full border-2 border-cream bg-coral"
          style={{ width: size * 0.34, height: size * 0.34 }}
        >
          <Ionicons name="camera" size={size * 0.18} color="#fff" />
        </View>
      </Pressable>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setMenuOpen(false)}>
          <Pressable className="gap-2 rounded-t-3xl bg-cream p-5 pb-10" onPress={() => {}}>
            <Text className="mb-1 text-center text-base font-bold text-navy">Foto de perfil</Text>
            <SheetOption icon="images" label="Escolher da galeria" onPress={() => choose(avatar.pickFromLibrary)} />
            <SheetOption icon="camera" label="Tirar foto" onPress={() => choose(avatar.takePhoto)} />
            {avatar.dataUrl && (
              <SheetOption icon="trash" label="Remover foto" destructive onPress={() => choose(avatar.remove)} />
            )}
            <Pressable onPress={() => setMenuOpen(false)} className="mt-1 items-center rounded-full py-3">
              <Text className="text-sm font-semibold text-navy/60">Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function SheetOption({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const color = destructive ? "#e63946" : "#0b1e3d";
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 rounded-2xl bg-card p-4">
      <Ionicons name={icon} size={20} color={color} />
      <Text className="text-base font-medium" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}
