export default (element: Node): void => {
  const ev = document.createEvent('HTMLEvents')
  ev.initEvent('click', true, false)
  element.dispatchEvent(ev)
}
