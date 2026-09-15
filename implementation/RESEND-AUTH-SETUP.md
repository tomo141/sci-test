# Resend確認コードの接続記録

観測・記録日：2026-09-16。無料アカウントの送信ドメイン `rikei-talk.com`（Tokyo）は認証完了。送信専用・同ドメイン限定のキーを発行し、本人がSupabase SMTPの入力値を確認して保存した。運営者本人がメールを受信し、コードを入力してログインできたと回答。本番候補のマイページと管理画面で認証成功を確認した。その候補を本番へ昇格し、新規登録用・ログイン用の両テンプレートを日本語の確認コードに統一した。

## DNSの確認と追加対象

公開DNSの管理先はns1〜ns5.xserver.jp。既存のルートMX、XserverとMyASPを含むルートSPF、DMARCは読み取りのみ。Resendでメール受信は有効化しない。

Resendの実画面が指定した値は次の3件。以前の一般的なSMTP解説にあるMX/TXTの例ではなく、このドメイン用の表示を採用する。

| 名前（rikei-talk.com配下） | 型 | 値 |
|---|---|---|
| resend._domainkey | TXT | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDboWUV3HLm2EXmImS7U6URcgSX0O8LNkfHM0HcmILM4rJV2tHX4Yr/gL5c8jc62KbqNY3sQPJDY8Ep71iB21sVD8C677jEMMiu8xq6JyqWGFYIVeRVfccZoH0ZN+5JRhA1UA97z0gV2ua76SeQMluxw2z5b8we5ebkMWQb6g/04QIDAQAB |
| rsend | CNAME | rsend-apne1.forge.rmta.net |
| send | CNAME | send.forge.rmta.net |

9/16にXserverログインを確認。send・rsendの既存A応答はワイルドカード由来で、個別レコードはなかった。上記3件をTTL 3600で追加し、画面上の既存40行が追加後の43行にも保持されていることを照合した。ルートMX・SPF・DMARC、MyASP・既存サイトの設定は維持。権威DNSと公開リゾルバで反映を確認し、Resendの表示もVerifiedとなった。

## SMTPとテンプレートの準備

- ドメイン：ResendのID `ffbf8815-49e3-4fc1-afaf-a8b8980a6e6d`。表示状態はVerified。ReceivingはOFF。
- 専用キー：`science-test-supabase-auth-production`。認証完了後にSending access・rikei-talk.com限定で発行済み。キーはGit・チャット・ローカルファイルへ保存していない。
- SMTP：`smtp.resend.com:465`、ユーザー`resend`、パスワードは専用APIキー。
- 差出人：`tomoyoshi@rikei-talk.com`、表示名「ともよし｜全分野科学検定」。
- Magic link or OTPとConfirm sign upの件名「全分野科学検定の確認コード」、本文[otp.html](mail/otp.html)を保存。本文は1,155文字、SHA-256 `86d9c8db6447ce2557e3dbcfcfcfd390acf69111a80e4fe1d7395332ab9becb6`。旧版の確認リンクを維持するため、Confirm sign upは新版の本番昇格後に変更。貼り付け後の全文一致と、保存後に開き直した件名・Reset template表示を確認した。
- 6桁・600秒を保存して再度設定画面で確認。SMTPは再送間隔60秒、毎時上限100通を保存。Resend無料枠の日次100通・月次3,000通が別途上限になる。課金変更は行っていない。
- SMTPの差出人・ユーザー名はスクリーンショットで指定値を確認できたが、DOM/クリップボードの読取は空・古い値を返し、保存を自動承認レビューが拒否した。発行キーの一致確認と入力を完了して本人に保存操作を依頼し、本人から確認・保存済みの回答を受領。再読込後のSMTP有効、接続先・表示名・465番・60秒と、テンプレート編集の解放を確認した。未解消の承認待ちではない。
- 追跡ドメインは作成していない。受信・コード検証の実績は既存の運営者アカウントでのログイン。未登録アドレスでの初回登録、各メール事業者・迷惑メール分類まで検証した意味ではない。コードは本人が画面へ入力し、チャットやGitへ保存していない。

参照：[ResendのSupabase SMTP設定](https://resend.com/docs/send-with-supabase-smtp)、[ドメイン管理](https://resend.com/docs/dashboard/domains/introduction)、[Supabaseのテンプレート](https://supabase.com/docs/guides/auth/auth-email-templates)、[XserverのDNS設定](https://www.xserver.ne.jp/manual/man_domain_dns_setting.php)。
