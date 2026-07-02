export type AuthFormVariant = "login" | "signup" | "reset-password";

type MessageParams = {
  error?: string;
  sent?: string;
  demo?: string;
};

type FormMessage = {
  text: string;
  tone: "error" | "success" | "warning";
};

const knownErrors: Record<string, string> = {
  invalid: "入力内容を確認してください。",
  turnstile: "セキュリティ確認に失敗しました。ページを再読み込みして、もう一度お試しください。",
  auth: "認証に失敗しました。もう一度ログインしてください。",
  passwords: "パスワードが一致しません。",
  terms: "利用規約への同意が必要です。",
  "too-many-requests": "試行回数が多すぎます。しばらく時間をおいてから再度お試しください。"
};

function decodeError(error?: string) {
  if (!error) return null;
  const decoded = decodeURIComponent(error);
  return knownErrors[decoded] || knownErrors[error] || decoded;
}

export function getAuthFormMessage(variant: AuthFormVariant, params: MessageParams): FormMessage | null {
  if (params.demo === "1") {
    return {
      text: "デモ環境のため、認証機能は利用できません。",
      tone: "warning"
    };
  }

  if (params.sent === "1" && variant === "reset-password") {
    return {
      text: "再設定用のメールを送信しました。メール内のリンクからパスワードを変更してください。",
      tone: "success"
    };
  }

  const errorText = decodeError(params.error);
  if (!errorText) return null;

  if (variant === "signup" && params.error === "invalid") {
    return {
      text: "入力内容に不備があります。メールアドレス、パスワード（8文字以上）、ニックネーム、利用規約への同意を確認してください。",
      tone: "error"
    };
  }

  return {
    text: errorText,
    tone: "error"
  };
}
