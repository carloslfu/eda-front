export function clone (object) {
  var out, v, key
  out = Array.isArray(object) ? [] : {}
  for (key in object) {
      v = object[key]
      out[key] = (typeof v === 'object') ? clone (v) : v
  }
  return out
}