import type { ReactNode, RefObject } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/src/lib/utils";
import type { PublicQuestion } from "@/src/lib/science/types";
import { ScienceText } from "./ScienceText";

const choiceLabels = ["①", "②", "③", "④"];

// Reuse the pre-overhaul card layout with the current, server-owned answer flow.
export function ExamQuestionCard({ question, selected, answered, correctIndex, disabled, onChoice, titleRef, lab, children }: {
  question: Omit<PublicQuestion, "token">; selected: number | null; answered: boolean; correctIndex: number | null;
  disabled: boolean; onChoice: (index: number) => void; titleRef: RefObject<HTMLHeadingElement | null>; lab: boolean; children: ReactNode;
}) {
  return <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card md:p-6">
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <StatusBadge>第 {question.ordinal + 1} 問</StatusBadge>
      <StatusBadge tone="blue">{question.domain}</StatusBadge>
      {!question.withdrawn && <StatusBadge tone="yellow">レベル{question.level}</StatusBadge>}
      <span className="text-xs text-[var(--color-muted)]">{question.subdomain}</span>
    </div>
    <h2 ref={titleRef} tabIndex={-1} className="mb-6 scroll-mt-24 whitespace-pre-wrap break-words text-2xl font-black leading-10 outline-none md:text-3xl md:leading-relaxed"><ScienceText>{question.question}</ScienceText></h2>
    {lab && <p className="mb-4 text-xs text-[var(--color-muted)]">作問：{question.creditName || "匿名の投稿者"}{question.aiAssisted && " · AI補助あり（作者申告）"}</p>}
    <div className="grid gap-4 md:grid-cols-2" role="group" aria-label="回答の選択肢">
      {question.choices.map((choice, index) => {
        const isSelected = selected === index;
        const isCorrect = answered && correctIndex === index;
        const isWrong = answered && correctIndex !== null && isSelected && !isCorrect;
        return <button key={index} type="button" disabled={disabled || answered} onClick={() => onChoice(index)}
          aria-pressed={isSelected} aria-label={`選択肢${index + 1}：${choice}`}
          className={cn("relative flex min-h-24 min-w-0 items-center gap-4 rounded-2xl border px-5 py-4 text-left text-base font-bold transition",
            "border-[var(--color-border)] bg-white enabled:hover:border-[var(--color-border-strong)]",
            isSelected && !answered && "border-[var(--color-primary-700)] bg-[var(--color-primary-100)]",
            isSelected && answered && correctIndex === null && "border-[var(--color-primary-700)] bg-[var(--color-primary-50)]",
            isCorrect && "border-[var(--color-success-700)] bg-[var(--color-success-100)] text-[var(--color-success-700)]",
            isWrong && "border-[var(--color-danger-700)] bg-[var(--color-danger-100)] text-[var(--color-danger-700)]")}
        >
          {isCorrect && <CheckCircle2 aria-hidden="true" className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full bg-white" size={24} />}
          {isWrong && <XCircle aria-hidden="true" className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full bg-white" size={24} />}
          <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-white text-lg font-black">{choiceLabels[index]}</span>
          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words"><ScienceText>{choice}</ScienceText>
            {(isCorrect || isWrong) && <span className="mt-2 block text-xs font-black">{isCorrect ? isSelected ? "正解" : "正答" : "あなたの回答"}</span>}
          </span>
        </button>;
      })}
    </div>
    {children}
  </div>;
}
