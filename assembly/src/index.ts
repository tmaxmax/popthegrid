const stride: u64 = 0xffffffff

function rand(cnt_mul: u32, n: u32, keya: u32, keyb: u32): f64 {
  const cnt = stride * cnt_mul + n
  const key = (u64(keya) << 32) | keyb

  let x = cnt * key
  const y = x
  const z = y + key

  x = x * x + y
  x = rotr(x, 32) // round 1
  x = x * x + z
  x = rotr(x, 32) // round 2
  x = x * x + y
  x = rotr(x, 32) // round 3

  const t = x * x + z
  x = rotr(t, 32)

  const res = t ^ ((x * x + y) >> 32)

  return f64((res << 11) >> 11) / f64(1 << 53)
}

export { rand }
