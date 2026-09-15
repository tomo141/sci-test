# Resend確認コードの接続記録

2026-09-15。Resendログイン完了を本人が回答。無料アカウントのログインを確認し、送信ドメイン `rikei-talk.com` をTokyoに登録した。DNS認証・キー発行・Supabase SMTP接続・実受信はまだ完了していない。

## DNSの確認と追加対象

公開DNSの管理先はns1〜ns5.xserver.jp。既存のルートMX、XserverとMyASPを含むルートSPF、DMARCは読み取りのみ。Resendでメール受信は有効化しない。

Resendの実画面が指定した値は次の3件。以前の一般的なSMTP解説にあるMX/TXTの例ではなく、このドメイン用の表示を採用する。

| 名前（rikei-talk.com配下） | 型 | 値 |
|---|---|---|
| resend._domainkey | TXT | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDboWUV3HLm2EXmImS7U6URcgSX0O8LNkfHM0HcmILM4rJV2tHX4Yr/gL5c8jc62KbqNY3sQPJDY8Ep71iB21sVD8C677jEMMiu8xq6JyqWGFYIVeRVfccZoH0ZN+5JRhA1UA97z0gV2ua76SeQMluxw2z5b8we5ebkMWQb6g/04QIDAQAB |
| rsend | CNAME | rsend-apne1.forge.rmta.net |
| send | CNAME | send.forge.rmta.net |

上記TXT/CNAMEは公開DNSで未観測。ただしsend・rsendのA問い合わせはXserverのIPを返す。ワイルドカード由来か既存の明示レコードかは、ゾーン設定画面で確認してから追加する。Xserverサーバーパネルへのログインを本人へ依頼中。

## SMTPとテンプレートの準備

- ドメイン：ResendのID `ffbf8815-49e3-4fc1-afaf-a8b8980a6e6d`。表示状態はNot Started。
- 専用キー名案：`science-test-supabase-auth-production`。Sending accessと当該ドメインのみに限定する。DNS認証前の選択肢に当該ドメインが現れず、キーは発行していない。
- SMTP：`smtp.resend.com:465`、ユーザー`resend`、パスワードは専用APIキー。
- 差出人：`tomoyoshi@rikei-talk.com`、表示名「ともよし｜全分野科学検定」。
- Confirm sign up / Magic link or OTPの件名案：「全分野科学検定の確認コード」。本文は[otp.html](mail/otp.html)。SupabaseのOTP有効期限を600秒に合わせてから保存する。現在のSMTPは無効で、テンプレートは未変更。
- 6桁のコード、再送間隔60秒、初期100通/時を設定候補とする。Resend無料枠の日次100通・月次3,000通が別途上限になる。課金変更は行っていない。
- 開封・クリック追跡は認証メールでは無効化する。登録・ログイン双方の受信とコード検証を確認するまで、設定済みを到達済みとしない。

参照：[ResendのSupabase SMTP設定](https://resend.com/docs/send-with-supabase-smtp)、[ドメイン管理](https://resend.com/docs/dashboard/domains/introduction)、[Supabaseのテンプレート](https://supabase.com/docs/guides/auth/auth-email-templates)、[XserverのDNS設定](https://www.xserver.ne.jp/manual/man_domain_dns_setting.php)。
