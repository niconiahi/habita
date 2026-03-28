export type ObjectValues<T> = T[keyof T]

type Type = Record<string, number>
type UnionToIntersection<U> = (
  U extends any
    ? (k: U) => void
    : never
) extends (k: infer I) => void
  ? I
  : never
type MergeTypes<T extends readonly Type[]> =
  UnionToIntersection<T[number]>

export function compose_types<
  const T extends readonly Type[],
>(...types: T) {
  const result: Record<string, number> = {}
  let index = 0
  for (const type of types) {
    for (const key of Object.keys(type)) {
      result[key] = index
      index++
    }
  }
  return result as MergeTypes<T>
}
