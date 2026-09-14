/** Prevent spreadsheet formula execution, including formulas preceded by whitespace/control characters. */
export function csvCell(value:unknown){
  let text=value==null?"":String(value);
  if(/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)||/^[\t\r\n]/u.test(text))text="'"+text;
  return `"${text.replaceAll('"','""')}"`;
}
export function csvDocument(rows:unknown[][]){return "\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";}
