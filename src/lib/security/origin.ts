// NextURL normalizes loopback addresses and may contain an internal server host.
// Host is the browser's request destination. Do not accept an arbitrary forwarded host.
export function sameRequestOrigin(request: {url:string;headers:Headers}):boolean {
  const origin=request.headers.get("origin"),host=request.headers.get("host");
  if(!origin||!host||request.headers.get("sec-fetch-site")==="cross-site")return false;
  if(/[\s,/@?#\\]/.test(host))return false;
  try {
    const protocol=new URL(request.url).protocol;
    if(protocol!=="http:"&&protocol!=="https:")return false;
    return origin===new URL(`${protocol}//${host}`).origin;
  } catch {return false;}
}
