import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("separates survey respondents, test lengths, prediction coverage and missing data", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create table science_events(attempt_id text,created_at timestamptz,event_name text,payload jsonb);
      create table science_issued(attempt_id text,ordinal int,predicted float,is_repeat boolean);
      create table science_answers(attempt_id text,ordinal int,selected_index int,is_correct boolean);`);
    const add = async (id: string, kind: string, count: number, tempo = "smooth") => db.query("insert into science_events values($1,now(),'exam_experience_submitted',$2)", [id, JSON.stringify({ response: { version: "exam-experience-v1", difficulty: "hard", tempo, comment: "private-not-in-report" }, context: { kind, questionCount: count, definitionVersion: "fixture", selectionPolicy: "trial-fluency-v1", releaseId: "r", modelVersion: "p70", answerCount: 2, correctCount: 1, low: id === "a" ? 300 : null, high: id === "a" ? 700 : null } })]);
    await add("a", "trial", 20); await add("b", "full", 50, "unsure"); await add("c", "full", 100);
    await db.exec(`insert into science_issued values('a',0,.8,false),('a',1,.7,true),('a',2,.9,false);
      insert into science_answers values('a',0,1,true),('a',1,1,false),('a',2,null,null);`);
    const rows = (await db.query<Record<string, unknown>>(readFileSync("implementation/operations/observe-experience-survey.sql", "utf8"))).rows;
    expect(rows).toHaveLength(3);
    const trial = rows.find(r => r.kind === "trial")!;
    expect(trial).toMatchObject({ submitted_surveys: 1, difficult_ratings: 1, precision_samples: 1 });
    expect(Number(trial.predicted_answer_count)).toBe(2);
    expect(Number(trial.mean_predicted)).toBeCloseTo(.75); expect(Number(trial.prediction_residual)).toBeCloseTo(-.25);
    expect(Number(trial.repeat_fraction)).toBe(.5); expect(Number(trial.observed_correct_rate)).toBe(.5);
    expect(rows.find(r => r.question_count === 50)).toMatchObject({ tempo_unknown: 1, mean_interval_width: null, mean_predicted: null });
    expect(JSON.stringify(rows)).not.toContain("private-not-in-report");
  } finally { await db.close(); }
}, 15000);
