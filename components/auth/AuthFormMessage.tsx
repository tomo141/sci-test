import type { AuthFormVariant } from "@/src/lib/auth/messages";
import { getAuthFormMessage } from "@/src/lib/auth/messages";

type Props = {
  variant: AuthFormVariant;
  error?: string;
  sent?: string;
  demo?: string;
};

export function AuthFormMessage({ variant, error, sent, demo }: Props) {
  const message = getAuthFormMessage(variant, { error, sent, demo });
  if (!message) return null;

  return (
    <div
      className={`rounded-2xl p-4 text-sm font-bold leading-7 ${
        message.tone === "success"
          ? "bg-[var(--color-success-100)] text-[var(--color-success-700)]"
          : message.tone === "warning"
            ? "bg-[var(--color-warning-100)] text-[var(--color-warning-700)]"
            : "bg-[var(--color-danger-100)] text-[var(--color-danger-700)]"
      }`}
      role="status"
    >
      {message.text}
    </div>
  );
}
