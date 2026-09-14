import {describe,expect,it} from "vitest";
import {csvCell,csvDocument} from "./csv";
describe("consent CSV safety",()=>{
  it("neutralizes formulas and preserves quoted, multiline Unicode content",()=>{
    for(const input of ['=WEBSERVICE("https://example.invalid")',' +123','\t@SUM(1,2)','\n=1','-1'])expect(csvCell(input)).toMatch(/^"'/);
    expect(csvCell('科学,「好き」\n"研究"')).toBe('"科学,「好き」\n""研究"""');
    expect(csvCell('science@example.invalid')).toBe('"science@example.invalid"');
    expect(csvDocument([["メール","同意"],["a@example.invalid",true]])).toBe('\uFEFF"メール","同意"\r\n"a@example.invalid","true"\r\n');
  });
});
