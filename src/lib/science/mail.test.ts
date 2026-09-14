import { describe, expect, it } from "vitest";
import { createTransport } from "nodemailer";
import { composeScienceMail, mailConfiguration, mailFailure, tokenHash, unsubscribeToken, type MailConfiguration, type MailContext } from "./mail";

const config: MailConfiguration = { origin: "https://science.example.invalid", from: "sender@example.invalid", footer: "試験用の運営表示。外部配信しない。", unsubscribeSecret: "s".repeat(64), host: "smtp.example.invalid", port: 587, user: "test", password: "test" };
const person: MailContext = { id: "10000000-0000-4000-8000-000000000001", userId: "10000000-0000-4000-8000-000000000002", email: "recipient@example.invalid", nickname: "科学好き", interests: [], payload: { topic: "science", template: "welcome" }, active: null, latestResult: null, completedKinds: [] };

describe("consent-based science mail", () => {
  it("changes the next action for unfinished, completed and interested participants", () => {
    expect(composeScienceMail(person, config).text).toContain("kind=trial");
    const active = composeScienceMail({ ...person, active: { id: person.id, label: "保存した受験" }, completedKinds: ["trial"] }, config);
    expect(active.text).toContain(`attempt=${person.id}`); expect(active.text).not.toContain("kind=trial");
    const advanced = composeScienceMail({ ...person, completedKinds: ["trial", "full"], interests: ["物理"] }, config);
    expect(advanced.text).toContain("物理をもう20問"); expect(advanced.text).not.toContain("腕試しを始める");
    expect(composeScienceMail({ ...person, completedKinds: ["trial"] }, config).text).toContain("総合本試験へ進む");
  });
  it("keeps challenge mail free of answer keys and avoids conflicting active attempts", () => {
    const weekly = { ...person, payload: { template: "weekly", topic: "weekly", week: "2026-09-14" } };
    expect(composeScienceMail(weekly, config).subject).toContain("2026-09-14");
    expect(composeScienceMail(weekly, config).text).toContain("kind=weekly");
    const resumed = composeScienceMail({ ...weekly, active: { id: person.id, label: "本試験" } }, config);
    expect(resumed.text).not.toContain("kind=weekly"); expect(resumed.text).toContain("中断中の受験");
  });
  it("escapes user content and emits real MIME with opaque unsubscribe headers", async () => {
    const message = composeScienceMail({ ...person, nickname: '<img src="https://bad.invalid">' }, config);
    expect(message.html).not.toContain('<img src="https://bad.invalid">');
    expect(message.html).toContain("&lt;img");
    const unsubscribe = message.headers["List-Unsubscribe"];
    expect(unsubscribe).not.toContain(person.email); expect(unsubscribe).not.toContain(person.userId);
    const transport = createTransport({ streamTransport: true, buffer: true, newline: "windows" });
    const { digest: _digest, ...data } = message; void _digest;
    const mime = (await transport.sendMail(data)).message.toString();
    expect(mime).toContain("List-Unsubscribe-Post: List-Unsubscribe=One-Click");
    expect(mime).toContain("Content-Type: multipart/alternative");
    expect(mime.replace(/\r\n[ \t]+/g, " ")).toContain(`Message-ID: ${message.messageId}`);
    expect(message.digest).toMatch(/^[a-f0-9]{64}$/);
  });
  it("fails closed for absent or insecure mail configuration", () => {
    expect(mailConfiguration({})).toBeNull();
    const env = { SCIENCE_MAIL_ORIGIN: config.origin, SCIENCE_MAIL_FROM: config.from, SCIENCE_MAIL_FOOTER: config.footer, SCIENCE_MAIL_UNSUBSCRIBE_SECRET: config.unsubscribeSecret, SCIENCE_SMTP_HOST: config.host, SCIENCE_SMTP_PORT: "587", SCIENCE_SMTP_USER: "test", SCIENCE_SMTP_PASSWORD: "test" };
    expect(mailConfiguration(env)?.port).toBe(587);
    for (const origin of ["http://science.example.invalid", "https://science.example.invalid/secret", "https://user:password@science.example.invalid", "https://science.example.invalid/?redirect=evil"]) expect(mailConfiguration({ ...env, SCIENCE_MAIL_ORIGIN: origin })).toBeNull();
    expect(mailConfiguration({ ...env, SCIENCE_SMTP_PORT: "25" })).toBeNull();
  });
  it("never retries an ambiguous SMTP result and scopes opaque tokens to the recipient", () => {
    expect(mailFailure({ code: "ETIMEDOUT", command: "DATA" }).outcome).toBe("blocked");
    expect(mailFailure({ responseCode: 451 }).outcome).toBe("retryable");
    expect(mailFailure({ responseCode: 550 }).outcome).toBe("blocked");
    const one = unsubscribeToken(person.userId, config.unsubscribeSecret);
    expect(one).toHaveLength(64); expect(tokenHash(one)).not.toBe(one);
    expect(unsubscribeToken(person.id, config.unsubscribeSecret)).not.toBe(one);
    expect(unsubscribeToken(person.userId, "z".repeat(64))).not.toBe(one);
  });
});
