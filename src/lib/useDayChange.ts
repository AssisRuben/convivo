import { useEffect, useRef } from "react";
import { AppState } from "react-native";

/**
 * Chama `onNewDay` quando o dia (do aparelho) vira: ao voltar o app pro
 * primeiro plano num dia novo, ou à meia-noite com o app aberto. Sem isso,
 * uma aba que já estava em foco ao minimizar não roda useFocusEffect de
 * novo e segue mostrando o dia anterior.
 */
export function useDayChange(onNewDay: () => void): void {
  const callback = useRef(onNewDay);

  useEffect(() => {
    callback.current = onNewDay;
  }, [onNewDay]);

  useEffect(() => {
    let day = new Date().toDateString();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      const now = new Date().toDateString();
      if (now !== day) {
        day = now;
        callback.current();
      }
    };

    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 5, 0);
      timer = setTimeout(() => {
        check();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };

    scheduleMidnight();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => {
      sub.remove();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
