export function bytesToString(bytes){
  bytes = bytes.replace('0x','');
  let str = '';
  for (var n = 0; n < bytes.length; n += 2) {
    if(bytes.substr(n,2) == "00") break;
    str += String.fromCharCode(parseInt(bytes.substr(n, 2), 16));
  }
  return str;
}
