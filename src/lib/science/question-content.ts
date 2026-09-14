import { z } from "zod";
export const questionContent = z.object({
  question:z.string().trim().min(8).max(2000),
  choices:z.array(z.string().trim().min(1).max(500)).length(4),
  correctIndex:z.number().int().min(0).max(3),
  explanation:z.string().trim().min(10).max(4000),
  distractorRationales:z.array(z.string().trim().min(3).max(1000)).length(4),
  sources:z.array(z.object({title:z.string().trim().min(2).max(300),url:z.preprocess(value=>value===""?undefined:value,z.string().url().refine(url=>/^https?:\/\//.test(url),"HTTP(S)の出典URLを入力してください").optional())}).strict()).min(1).max(5)
}).strict().refine(q=>new Set(q.choices.map(c=>c.normalize("NFKC").toLowerCase())).size===4,"選択肢を重複させないでください");
