import { DOMParser, initParser, Element, HTMLDocument } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm-noinit.ts'
import prettyMs, { Options } from 'https://esm.sh/pretty-ms@8.0.0'
import { ContentType, parse } from 'https://deno.land/x/content_type@1.0.1/mod.ts'

export const parseHTML = (() => {
  let parser: DOMParser | undefined

  return async (text: string, { type }: ContentType) => {
    if (!parser) {
      await initParser()
      parser = new DOMParser()
    }

    if (type !== 'text/html' && type !== 'text/xml') {
      return null
    }

    return parser.parseFromString(text, type)
  }
})()

export type Change = {
  attrs?: Parameters<typeof setAttributes>['1']
  text?: string
  html?: string
} & ({ query: string; assert?: number | boolean } | { tag: string })

export const createOrChange = (base: Element, ...changes: Change[]) => {
  const document = base.ownerDocument
  if (!document) {
    throw new Error('Base has no document')
  }

  for (const change of changes) {
    let elements: Element[]
    if ('query' in change) {
      elements = [...document.querySelectorAll(change.query)] as Element[]

      switch (typeof change.assert) {
        case 'number':
          if (elements.length !== change.assert) {
            throw new Error(`Not ${change.assert}, only ${elements.length} nodes for selector '${change.query}'`)
          }
          break
        case 'boolean':
          if (!change.assert) {
            break
          }
        // falls through
        default:
          if (elements.length === 0) {
            throw new Error(`No elements for query '${change.query}'`)
          }
      }
    } else {
      const element = document.createElement(change.tag)
      base.appendChild(element)
      elements = [element]
    }

    const { attrs, html, text } = change

    if (attrs) {
      elements.forEach((element) => setAttributes(element, attrs))
    }

    if (html) {
      elements.forEach((element) => (element.innerHTML = html))
    } else if (text) {
      elements.forEach((element) => (element.textContent = text))
    }
  }
}

const setAttributes = (elem: Element, attrs: Record<string, string | undefined>) => {
  for (const [key, value] of Object.entries(attrs)) {
    if (value) {
      elem.setAttribute(key, value)
    } else {
      elem.removeAttribute(key)
    }
  }
}

export const getContentType = (headers: Headers) => parse(headers.get('Content-Type') || '')

export const toResponseBody = (document: HTMLDocument) => `
  <!DOCTYPE html>
  <html lang="en" prefix="og: https://ogp.me/ns#">
    <head>${document.head.innerHTML}</head>
    <body>${document.body.innerHTML}</body>
  </html>
`

export const toUpper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const formatDuration = (ms: number, opts?: Options) => prettyMs(ms, { secondsDecimalDigits: 2, verbose: ms <= 60000, ...opts })

export const makePossessive = (s: string) => {
  if (s.endsWith('s') || s.endsWith('z')) {
    return s + "'"
  }
  return s + "'s"
}

export const makePlural = (s: string, count: number) => {
  if (count > 1) {
    return s + 's'
  }
  return s
}
