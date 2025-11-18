import * as v from "valibot"
import {
  PROPERTY_TYPE,
  get_property_type_label,
  type PropertyType,
  type ObjectValues,
} from "./property_type"

export const PropertyTypeSchema = v.picklist(
  Object.values(PROPERTY_TYPE),
)

export function get_property_types() {
  return Object.values(PROPERTY_TYPE)
}

export {
  PROPERTY_TYPE,
  get_property_type_label,
  type PropertyType,
  type ObjectValues,
}
