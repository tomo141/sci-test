import {readFileSync} from 'node:fs';
import {domains} from '../src/lib/data/taxonomy';
import {scoreResponses,type Response} from '../src/lib/science/model';
const bank=JSON.parse(readFileSync('implementation/local/question-bank/candidate.json','utf8')).candidates.filter((q:{use:string})=>q.use==='formal');
for(const count of [5,10]){
 const responses=domains.flatMap(domain=>bank.filter((q:Response)=>q.domain===domain).sort((a:{parameters:Response},b:{parameters:Response})=>b.parameters.b-a.parameters.b).slice(0,count).map((q:{parameters:Response})=>({...q.parameters,domain,correct:true,eligible:true})));
 const r=scoreResponses(responses); console.log(JSON.stringify({count:count*10,total:r.total,domains:domains.map(d=>({d,score:r.domains[d].score,mean:r.domains[d].mean}))}));
}
