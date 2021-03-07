export default class extends Error {
  constructor(_x: never, message: string) {
    super(`TypeScript thought we could never end up here\n${message}`)
  }
}
