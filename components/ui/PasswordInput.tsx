"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/src/lib/utils";

type Props = {
  name: string;
  label: string;
  hint: string;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  className?: string;
};

export function PasswordInput({
  name,
  label,
  hint,
  placeholder = "",
  minLength,
  required = true,
  className
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={cn("grid gap-2 font-bold", className)}>
      {label}
      <div className="relative">
        <input
          name={name}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          className="h-14 w-full rounded-2xl border border-[var(--color-border)] px-4 pr-12 focus:border-[var(--color-primary-700)] invalid:[&:not(:placeholder-shown)]:border-red-400"
        />
        <button
          type="button"
          className="absolute right-4 top-4 text-[var(--color-muted)]"
          aria-label={visible ? "パスワードを隠す" : "パスワードを表示"}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      <span className="text-xs font-bold text-[var(--color-muted)]">{hint}</span>
    </label>
  );
}
