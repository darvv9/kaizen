import { useStore } from "./useStore";
import { useFeedback } from "./useFeedback";

/**
 * Executa algo destrutivo guardando o estado anterior e oferecendo "Desfazer"
 * no toast.
 *
 * Cada mutação do store cria um `AppData` novo, então a referência de antes
 * continua íntegra e serve de snapshot — não precisa de histórico nem de clone.
 * Só vale pra dados da rotina: vídeo apagado do IndexedDB não volta.
 */
export function destructive(text: string, mutate: () => void) {
  const before = useStore.getState().data;
  mutate();
  useFeedback.getState().push(text, "success", {
    label: "Desfazer",
    onPress: () => useStore.getState().restoreData(before),
  });
}
