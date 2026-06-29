"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/src/lib/utils";

type Props = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function AppModal({ open, title, children, onClose, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        aria-label="閉じる"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-card",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="app-modal-title" className="text-lg font-black">
            {title}
          </h2>
          <button
            aria-label="閉じる"
            className="rounded-xl p-2 text-[var(--color-muted)] hover:bg-[var(--color-primary-50)]"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
