export type ExperimentRow={route_group:string;starters:number;mature_starters:number;verified_7d:number;registrations_7d:number;share_registrations_7d:number;completions_7d:number;shared_7d:number;withdrawn:number;mixed_assignment:number};
export function wilson(successes:number,total:number){
  if(!total)return null;
  const z=1.96,p=successes/total,denominator=1+z*z/total;
  const center=(p+z*z/(2*total))/denominator,half=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/denominator;
  return {rate:p,low:Math.max(0,center-half),high:Math.min(1,center+half)};
}
export function allocationCheck(counts:number[]){
  if(counts.length!==4||counts.some(n=>n<0||!Number.isFinite(n)))return null;
  const total=counts.reduce((a,b)=>a+b,0);if(total<20)return null;
  const expected=total/4,chiSquare=counts.reduce((sum,n)=>sum+(n-expected)**2/expected,0),x=Math.sqrt(chiSquare/2),t=1/(1+.3275911*x);
  const erfc=(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);
  const p=Math.min(1,erfc+2/Math.sqrt(Math.PI)*x*Math.exp(-x*x));
  return {chiSquare,p,alert:p<.001};
}
