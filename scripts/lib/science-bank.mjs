import {createHash} from 'node:crypto';
import {z} from 'zod';
import {domains,isSubdomainOf} from '../../src/lib/data/taxonomy.ts';
import {questionContent} from '../../src/lib/science/question-content.ts';

export const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export const digest=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const stem=value=>value.normalize('NFKC').toLowerCase().replace(/\s+/gu,'').replace(/[?？。、「」『』]/gu,'');
const allStems=row=>[row.question_text,...(row.previous_question_texts??[])].map(stem);
const uuid=z.string().uuid();
const initialFocusPerDomain=20;
const patchSchema=z.object({
  legacyId:uuid.optional(),familyKey:z.string().regex(/^[a-z0-9][a-z0-9:_-]{2,120}$/).optional(),
  equivalentLegacyIds:z.array(uuid).default([]),version:z.number().int().positive().default(1),
  domain:z.enum(domains),subdomain:z.string(),content:questionContent,reason:z.string().min(5),
  use:z.enum(['formal','weekly-reserve']).default('formal'),
  parameters:z.object({b:z.number().min(-5).max(5),basis:z.string().min(10),focus:z.boolean().default(false),anchor:z.boolean().default(false)}).strict().optional(),
  review:z.object({status:z.literal('content_checked'),reviewer:z.string().min(1),observedAt:z.string().date(),sourceLocation:z.string().min(10),sourceChecked:z.literal(true),uniqueAnswerChecked:z.literal(true),distractorRationalesChecked:z.literal(true),releaseApproval:z.enum(['pending','approved']),rightsBasis:z.string().min(10).optional()}).strict()
}).strict().refine(q=>!!q.legacyId!==!!q.familyKey,'Choose one stable family identifier').refine(q=>isSubdomainOf(q.domain,q.subdomain),'Wrong subdomain');

function revisionId(family,version){
  const namespace=Buffer.from('7d6301863e714c409d84a95173a680ec','hex');
  const bytes=createHash('sha1').update(namespace).update(`${family}:${version}`).digest().subarray(0,16);
  bytes[6]=(bytes[6]&15)|0x50;bytes[8]=(bytes[8]&63)|0x80;
  const h=bytes.toString('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

function initializeFocus(candidates){
  for(const row of candidates){
    if(row.parameters.focus&&(row.use!=='formal'||row.parameters.anchor))throw new Error(`Focus must be a non-anchor formal question: ${row.family_id}`);
  }
  for(const domain of domains){
    const pool=candidates.filter(q=>q.domain===domain&&q.use==='formal'&&!q.parameters.anchor);
    const chosen=pool.filter(q=>q.parameters.focus),manual=new Set(chosen);
    if(chosen.length>initialFocusPerDomain)throw new Error(`Too many initial focus questions: ${domain}`);
    const gap=(q,rows)=>rows.length?Math.min(...rows.map(r=>Math.abs(q.parameters.b-r.parameters.b))):-Math.abs(q.parameters.b);
    while(chosen.length<Math.min(initialFocusPerDomain,pool.length)){
      const remaining=pool.filter(q=>!chosen.includes(q));
      remaining.sort((a,b)=>{
        const localA=chosen.filter(q=>q.subdomain===a.subdomain),localB=chosen.filter(q=>q.subdomain===b.subdomain);
        return localA.length-localB.length
          ||(localB.length?gap(b,localB):0)-(localA.length?gap(a,localA):0)
          ||gap(b,chosen)-gap(a,chosen)||a.family_id.localeCompare(b.family_id,'en');
      });
      chosen.push(remaining[0]);
    }
    for(const row of chosen){
      row.parameters.focus=true;
      row.parameter_evidence.focusCampaign={version:'initial-coverage-v1',targetPerDomain:initialFocusPerDomain,selection:manual.has(row)?'reviewer':'subdomain-and-initial-difficulty'};
    }
  }
}

/** Prepare an immutable candidate. This function never connects to a service or publishes questions. */
export function prepareBank(legacy,patches){
  const originals=new Map(),stems=new Map();
  for(const row of legacy){
    if(originals.has(row.id))throw new Error(`Duplicate legacy ID: ${row.id}`);
    originals.set(uuid.parse(row.id),row);
    for(const key of allStems(row)){const ids=stems.get(key)??[];ids.push(row.id);stems.set(key,ids);}
  }
  const reviewed=patches.map(row=>patchSchema.parse(row));
  const familyOwners=new Map(),legacyOwners=new Map(),proposedStems=new Map(),candidates=[],pending=[];
  for(const q of reviewed){
    const family=q.legacyId?`legacy:${q.legacyId}`:`operator:${q.familyKey}`;
    if(familyOwners.has(family))throw new Error(`More than one proposed revision for family: ${family}`);
    familyOwners.set(family,true);
    const questionStem=stem(q.content.question);
    if(proposedStems.has(questionStem))throw new Error(`Duplicate proposed question stem: ${family}`);
    proposedStems.set(questionStem,family);
    const aliases=new Set(q.legacyId?[q.legacyId,...q.equivalentLegacyIds]:q.equivalentLegacyIds);
    for(const id of aliases){
      const original=originals.get(id);if(!original)throw new Error(`Unknown legacy alias: ${id}`);
      for(const key of allStems(original))for(const same of stems.get(key))aliases.add(same);
    }
    for(const id of aliases){
      if(legacyOwners.has(id)&&legacyOwners.get(id)!==family)throw new Error(`Legacy alias belongs to multiple families: ${id}`);
      legacyOwners.set(id,family);
    }
    if(q.review.releaseApproval!=='approved'){pending.push({familyId:family,domain:q.domain,reason:'release_approval_pending'});continue;}
    if(!q.review.rightsBasis)throw new Error(`Rights evidence required: ${family}`);
    if(!q.parameters)throw new Error(`Initial difficulty and its basis required: ${family}`);
    const contentSha256=digest({domain:q.domain,subdomain:q.subdomain,content:q.content});
    candidates.push({id:revisionId(family,q.version),family_id:family,version:q.version,legacy_id:q.legacyId??null,legacy_ids:[...aliases].sort(),domain:q.domain,subdomain:q.subdomain,content:q.content,use:q.use,
      parameters:{a:1,b:q.parameters.b,c:.25,focus:q.parameters.focus,anchor:q.parameters.anchor},
      parameter_evidence:{stage:'initial_assumption',basis:q.parameters.basis,aFixed:true,cFixed:true,calibrated:false},
      review_evidence:{...q.review,reason:q.reason,contentSha256},quality_passed:true,rights_checked:true});
  }
  candidates.sort((a,b)=>a.family_id.localeCompare(b.family_id,'en'));
  // This initializes a candidate only. Published campaigns remain frozen in their release.
  initializeFocus(candidates);
  const capacities=domains.map(domain=>{
    const rows=candidates.filter(q=>q.domain===domain),formal=rows.filter(q=>q.use==='formal');
    return {domain,formal:formal.length,weeklyReserve:rows.filter(q=>q.use==='weekly-reserve').length,focus:formal.filter(q=>q.parameters.focus).length,anchors:formal.filter(q=>q.parameters.anchor).length,subdomains:[...new Set(formal.map(q=>q.subdomain))].sort(),distinctInitialDifficulties:new Set(formal.map(q=>q.parameters.b)).size,
      requiredForTwoMaxLengthJourneys:64,canSupplyTwoMaxLengthJourneys:formal.length>=64};
  });
  const blockers=capacities.flatMap(c=>[...(c.formal<100?[{domain:c.domain,reason:'formal_bank_below_100',available:c.formal,required:100}]:[]),...(c.weeklyReserve<2?[{domain:c.domain,reason:'current_and_next_week_not_reserved',available:c.weeklyReserve,required:2}]:[])]);
  const report={legacyRecords:legacy.length,contentChecked:reviewed.length,approved:candidates.length,pending,capacities,blockers,readyForInitialRelease:blockers.length===0,scope:'Content/rights attestations and supply counts; not empirical score calibration or legal review'};
  return {format:'science-bank-v2',candidates,contentDigest:digest(candidates),report};
}
