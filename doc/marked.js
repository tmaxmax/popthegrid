import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

marked.use(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  }),
)

marked.use(
  markedKatex({
    output: 'mathml',
    nonStandard: true,
  }),
)

import 'marked/bin/marked'

function fillGrid(n, w, h) {
  const r = w / h
  if (r < 1) {
    return fillGrid(n, h, w)
  }

  const s = (b) => Math.min(w / Math.ceil(n / b), h / b)
  const b0 = Math.ceil(Math.sqrt(n / r))

  return Math.max(s(b0 - 1), s(b0), s(b0 + 1))
}
