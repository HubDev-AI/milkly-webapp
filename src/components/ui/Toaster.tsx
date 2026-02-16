import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/useToast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/Toast";

export function Toaster() {
  const { toasts } = useToast();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.id = "toast-portal";
    el.style.position = "relative";
    el.style.zIndex = "99999";
    document.body.appendChild(el);
    setContainer(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  if (!container) return null;

  return createPortal(
    <ToastProvider duration={2000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>,
    container
  );
}
