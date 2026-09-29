import { useEffect, useRef } from "react";
import { getWebApp } from "./telegram";

interface UseMainButtonOptions {
  text: string;
  onClick: () => void;
  enabled?: boolean;
  loading?: boolean;
}

// Отдаёт основное действие экрана нативной кнопке Telegram (закреплена снизу,
// вне DOM страницы) вместо самодельной <button> — так Mini App ощущается
// частью Telegram, а не отдельным сайтом внутри него
export function useMainButton({ text, onClick, enabled = true, loading = false }: UseMainButtonOptions) {
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) return;

    const handler = () => onClickRef.current();
    webApp.MainButton.setText(text);
    webApp.MainButton.onClick(handler);
    webApp.MainButton.show();

    return () => {
      webApp.MainButton.offClick(handler);
      webApp.MainButton.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) return;

    if (loading) {
      webApp.MainButton.showProgress(false);
    } else {
      webApp.MainButton.hideProgress();
    }

    if (enabled && !loading) {
      webApp.MainButton.enable();
    } else {
      webApp.MainButton.disable();
    }
  }, [enabled, loading]);
}
