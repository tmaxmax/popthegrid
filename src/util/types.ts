export type IfElse<Condition, T, F> = [Condition] extends [true] ? T : F
export type If<Condition, T> = IfElse<Condition, T, undefined>
