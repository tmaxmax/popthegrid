'use strict'

import path from 'path'

export default {
  preset: 'ts-jest',
  roots: [path.resolve(path.resolve(), 'src')],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
}
