/**
 * Força o app a pegar a versão nova.
 *
 * No iPhone o service worker às vezes continua servindo o app antigo do cache
 * mesmo depois do deploy — e sem isso não existe jeito, pelo app, de sair
 * dessa situação. Apaga só o cache de arquivos: rotina, logs e vídeos ficam
 * onde estão (localStorage e IndexedDB não são tocados).
 */
export async function forceUpdate(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // Se algo falhar, recarregar mesmo assim já resolve a maioria dos casos.
  }
  window.location.reload();
}
