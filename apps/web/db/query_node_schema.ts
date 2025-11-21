import * as v from "valibot"

const IdentifierNodeSchema = v.object({
  kind: v.literal("IdentifierNode"),
  name: v.string(),
})

const SchemableIdentifierNodeSchema = v.object({
  kind: v.literal("SchemableIdentifierNode"),
  identifier: IdentifierNodeSchema,
  schema: v.optional(IdentifierNodeSchema),
})

const TableNodeSchema = v.object({
  kind: v.literal("TableNode"),
  table: SchemableIdentifierNodeSchema,
})

const FromNodeSchema = v.object({
  kind: v.literal("FromNode"),
  froms: v.array(TableNodeSchema),
})

export const SelectQueryNodeSchema = v.object({
  kind: v.literal("SelectQueryNode"),
  from: v.optional(FromNodeSchema),
})

export type SelectQueryNode = v.InferOutput<
  typeof SelectQueryNodeSchema
>
