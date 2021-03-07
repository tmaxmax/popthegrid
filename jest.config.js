import { resolve } from 'path'

export default {
  preset: 'ts-jest',
  roots: [resolve(__dirname, 'src')],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
}
