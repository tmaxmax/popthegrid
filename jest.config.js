'use strict'

import path from 'path'

export default {
  preset: 'ts-jest',
  roots: [path.resolve(__dirname, 'src')],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
}
