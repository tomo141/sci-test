import {describe,expect,it} from "vitest";
import {questionContent} from "./question-content";

const content={question:"Which genotype has two copies of allele A?",choices:["AA","Aa","aa","A"],correctIndex:0,explanation:"The notation AA specifies two copies of A.",distractorRationales:["Two A alleles.","One of each allele.","Two a alleles.","Only one allele is written."],sources:[{title:"Independently written validation fixture"}]};

describe("scientific choice identity",()=>{
  it("preserves case for alleles, units, and chemical symbols",()=>{
    for(const choices of [["AA","Aa","aa","A"],["m","M","mm","µm"],["Co","CO","C","O"]]){
      expect(questionContent.parse({...content,choices}).choices).toEqual(choices);
    }
  });
  it("still rejects exact duplicates, width variants, and surrounding whitespace",()=>{
    for(const choices of [["A","A","B","C"],["A","Ａ","B","C"],[" A ","A","B","C"],["1","１","3","4"]]){
      expect(questionContent.safeParse({...content,choices}).success).toBe(false);
    }
  });
});
