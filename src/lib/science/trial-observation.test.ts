import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { it, expect } from "vitest";

it("keeps 7-day maturity, consent, return visits and missing precision separate", async () => {
  const db = new PGlite();
  try {
    // Minimal read-only-report fixtures. No external database or real participant data.
    await db.exec(`
      create table science_attempts(id text,visitor_id text,user_id text,kind text,started_at timestamptz,completed_at timestamptz,state text,definition jsonb,release_id text,model_version text,needs_recalculation boolean default false,result jsonb);
      create table science_visitors(id text,route_group text);
      create table science_profiles(user_id text,created_at timestamptz);
      create table science_events(id serial,dedupe_key text,payload jsonb,visitor_id text,user_id text,event_name text,created_at timestamptz);
      create table science_issued(attempt_id text,ordinal int,predicted float,selection_reason text,is_repeat boolean);
      create table science_answers(attempt_id text,ordinal int,selected_index int,answered_at timestamptz);
      insert into science_visitors values('v1','A'),('v2','A'),('v3','A'),('v4','A');
      insert into science_attempts(id,visitor_id,user_id,kind,started_at,completed_at,state,definition,release_id,model_version,result) values
       ('new','v1','u1','trial',now()-interval '10 days',now()-interval '9 days','completed','{"selectionPolicy":"trial-fluency-v1"}','r1','p70','{"low":400,"high":600}'),
       ('young','v2','u2','trial',now()-interval '2 days',now()-interval '1 day','completed','{"selectionPolicy":"trial-fluency-v1"}','r1','p70','{"low":450,"high":550}'),
       ('old','v3',null,'trial',now()-interval '10 days',null,'abandoned','{}','r1','p70',null),
       ('existing','v4','u4','trial',now()-interval '10 days',null,'abandoned','{}','r1','p70',null),
       ('next','v1','u1','full',now()-interval '9 days',null,'active','{}','r1','p70',null);
      insert into science_profiles values('u1',now()-interval '9 days'),('u2',now()-interval '1 day'),('u4',now()-interval '20 days');
      insert into science_events(payload,visitor_id,user_id,event_name,created_at) values
       ('{}','v1','u1','email_verified',now()-interval '9 days'),
       ('{"topic":"science"}','v1','u1','mail_consent_granted',now()-interval '9 days'),
       ('{"topic":"science"}','v1','u1','mail_consent_revoked',now()-interval '5 days'),
       ('{}','v1','u1','site_visit',now()-interval '8 days');
      insert into science_issued values('new',0,.80,'trial-fluency-v1:short-in-range',false),('new',1,.68,'trial-fluency-v1:nearest-probability-fallback',true),('new',2,.81,'trial-fluency-v1:short-in-range',false);
      insert into science_answers values('new',0,1,now()-interval '9 days'),('new',1,2,now()-interval '9 days');
    `);
    const rows = (await db.query<Record<string, unknown>>(readFileSync("implementation/operations/observe-trial-fluency.sql", "utf8"))).rows;
    const trial = rows.find(r => r.policy === "trial-fluency-v1")!;
    expect(trial).toMatchObject({starters:2,mature_starters:1,completions_7d:1,next_exams_7d:1,verified_7d:1,registrations_7d:0,revisits_7d:1,precision_sample:1});
    expect(Number(trial.measured_answers)).toBe(2);
    expect(Number(trial.mean_total_interval_width)).toBe(200);
    expect(Number(trial.mean_predicted)).toBeCloseTo(.74);
    expect(Number(trial.target_fraction)).toBe(.5);
    expect(rows.find(r => r.policy === "measurement-v1")).toMatchObject({starters:1,revisits_7d:null,mean_total_interval_width:null,measured_answers:null});
  } finally { await db.close(); }
}, 15000);
