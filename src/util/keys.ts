export default <T extends Record<string, unknown>>(o: T): (keyof T)[] => Object.keys(o) as (keyof T)[]
