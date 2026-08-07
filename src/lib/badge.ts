type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/**
 * Badge no ícone do app (iOS 16.4+, só com o app instalado na tela de início
 * e com permissão de notificação concedida).
 *
 * Sem servidor não existe push: o badge só é atualizado quando o app roda.
 * Push de verdade exigiria VAPID + backend agendando o envio.
 */
export function supportsBadge(): boolean {
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

export function notificationPermission(): NotificationPermission | null {
  if (typeof Notification === "undefined") return null;
  return Notification.permission;
}

/** Precisa sair de um gesto do usuário (requisito do iOS). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

export async function syncBadge(count: number): Promise<void> {
  const nav = navigator as BadgeNavigator;
  try {
    if (count > 0) await nav.setAppBadge?.(count);
    else await nav.clearAppBadge?.();
  } catch {
    // sem permissão ou fora do PWA instalado: silencioso de propósito
  }
}
