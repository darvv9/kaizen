import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

/**
 * O registrador padrão do plugin só chama register() — ele não recarrega a
 * página quando o service worker novo assume, e no iPhone o app reaberto
 * continua rodando o JS antigo. Este aqui recarrega na ativação e força a
 * checagem toda vez que o app volta pra frente.
 */
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const check = () => {
      if (document.visibilityState === "visible") registration.update();
    };
    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
