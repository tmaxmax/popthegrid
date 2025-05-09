const rand = new WebAssembly.Instance(
  new WebAssembly.Module(
    new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x09, 0x01, 0x60, 0x04, 0x7f, 0x7f, 0x7f, 0x7f, 0x01, 0x7c, 0x03, 0x02, 0x01,
      0x00, 0x05, 0x03, 0x01, 0x00, 0x00, 0x07, 0x11, 0x02, 0x04, 0x72, 0x61, 0x6e, 0x64, 0x00, 0x00, 0x06, 0x6d, 0x65, 0x6d, 0x6f, 0x72,
      0x79, 0x02, 0x00, 0x0a, 0x75, 0x01, 0x73, 0x01, 0x03, 0x7e, 0x20, 0x03, 0xad, 0x20, 0x02, 0xad, 0x42, 0x20, 0x86, 0x84, 0x22, 0x05,
      0x20, 0x01, 0xad, 0x20, 0x00, 0xad, 0x42, 0x20, 0x86, 0x84, 0x7e, 0x22, 0x04, 0x20, 0x05, 0x7c, 0x22, 0x05, 0x20, 0x04, 0x20, 0x04,
      0x20, 0x04, 0x7e, 0x20, 0x04, 0x7c, 0x42, 0x20, 0x8a, 0x22, 0x06, 0x20, 0x06, 0x7e, 0x20, 0x05, 0x7c, 0x42, 0x20, 0x8a, 0x22, 0x05,
      0x20, 0x05, 0x7e, 0x7c, 0x42, 0x20, 0x8a, 0x22, 0x05, 0x20, 0x05, 0x7e, 0x7c, 0x22, 0x05, 0x42, 0x20, 0x8a, 0x21, 0x06, 0x20, 0x04,
      0x20, 0x06, 0x20, 0x06, 0x7e, 0x7c, 0x42, 0x20, 0x88, 0x20, 0x05, 0x85, 0x42, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x0f, 0x83,
      0xba, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa0, 0x3c, 0xa2, 0x0b,
    ])
  )
).exports.rand as (cntMul: number, cnt: number, keya: number, keyb: number) => number

export type RandConfig = {
  key: [number, number]
  mask: number
}

export type RandState = RandConfig & {
  off: number
}

const max = Number((1n << 32n) - 1n)
const valid = (n: number) => n >= 0 && n <= max

class Rand {
  #state?: RandState

  set({ key, mask, off }: RandConfig & { off?: number }) {
    if (off == null) {
      off = 0
    }

    if (!valid(off)) {
      throw new Error('tried to set invalid offset')
    }

    this.#state = { key, mask, off: off >>> 0 }

    return this
  }

  get() {
    if (this.#state == null) {
      throw new Error('used uninitialised Rand object')
    }

    return rand(this.#state.mask, this.#state.off, this.#state.key[0], this.#state.key[1])
  }

  next() {
    const v = this.get()
    this.#state!.off = (this.#state!.off + 1) >>> 0
    return v
  }

  rewind(off: number) {
    if (this.#state == null) {
      throw new Error('used uninitialised Rand object')
    }

    if (!valid(off)) {
      throw new Error('tried to rewind to invalid offset')
    }

    this.#state.off = off >>> 0
  }

  state(): Readonly<RandState> {
    if (this.#state == null) {
      throw new Error('used uninitialised Rand object')
    }

    return Object.freeze({ ...this.#state })
  }
}

export default new Rand()
