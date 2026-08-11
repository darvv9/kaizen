import { DEFAULT_GYM_VARIANTS, DEFAULT_JIU_VARIANTS } from "../data/defaults";

export interface VariantKit {
  id: string;
  label: string;
  variants: { name: string; items: string[] }[];
}

const KITS: (VariantKit & { match: RegExp })[] = [
  {
    id: "gym",
    label: "Treino A · B · C",
    variants: DEFAULT_GYM_VARIANTS,
    match: /academ|muscula|muscul|gym|treino/i,
  },
  {
    id: "jiu",
    label: "No-gi · Gi · Livre",
    variants: DEFAULT_JIU_VARIANTS,
    match: /jiu|jitsu|bjj|grappl|luta/i,
  },
];

/**
 * Sugestão de variações a partir do nome da atividade.
 *
 * Um menu com todos os kits não tem lógica: No-gi/Gi não é opção de Academia.
 * Ou a sugestão nasce da atividade, ou não existe sugestão — quem não casa com
 * nenhum kit só ganha o "+ Nova", que é o certo pra Skincare ou Estudo.
 */
export function kitFor(name: string): VariantKit | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return KITS.find((k) => k.match.test(trimmed)) ?? null;
}
