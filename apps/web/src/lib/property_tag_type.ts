import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const PROPERTY_TAG_TYPE = {
  CONTRAFRENTE: 0,
  A_ESTRENAR: 1,
  CON_BALCON: 2,
  ASCENSOR: 3,
  RAMPA: 4,
  BAULERA: 5,
  COCHERA: 6,
  AMOBLADO: 7,
  HELADERA: 8,
  COCINA_A_GAS: 9,
  TERMOTANQUE: 10,
  COCINA_ELECTRICA: 11,
  AIRE_ACONDICIONADO: 12,
  TIRO_BALANCEADO: 13,
  ESTUFA_A_GAS: 14,
  PILETA: 15,
  SUM: 16,
  SEGURIDAD: 17,
  GYM: 18,
  APTO_GATO: 19,
  APTO_PERRO: 20,
} as const
export const PropertyTagTypeSchema = v.picklist(
  Object.values(PROPERTY_TAG_TYPE),
)
export type PropertyTagType = ObjectValues<
  typeof PROPERTY_TAG_TYPE
>

export function get_property_tag_type_label(
  type: PropertyTagType,
) {
  switch (type) {
    case PROPERTY_TAG_TYPE.CONTRAFRENTE: {
      return "Contrafrente"
    }
    case PROPERTY_TAG_TYPE.A_ESTRENAR: {
      return "A estrenar"
    }
    case PROPERTY_TAG_TYPE.CON_BALCON: {
      return "Con balcón"
    }
    case PROPERTY_TAG_TYPE.ASCENSOR: {
      return "Ascensor"
    }
    case PROPERTY_TAG_TYPE.RAMPA: {
      return "Rampa"
    }
    case PROPERTY_TAG_TYPE.BAULERA: {
      return "Baulera"
    }
    case PROPERTY_TAG_TYPE.COCHERA: {
      return "Cochera"
    }
    case PROPERTY_TAG_TYPE.AMOBLADO: {
      return "Amoblado"
    }
    case PROPERTY_TAG_TYPE.HELADERA: {
      return "Heladera"
    }
    case PROPERTY_TAG_TYPE.COCINA_A_GAS: {
      return "Cocina a gas"
    }
    case PROPERTY_TAG_TYPE.TERMOTANQUE: {
      return "Termotanque"
    }
    case PROPERTY_TAG_TYPE.COCINA_ELECTRICA: {
      return "Cocina eléctrica"
    }
    case PROPERTY_TAG_TYPE.AIRE_ACONDICIONADO: {
      return "Aire acondicionado"
    }
    case PROPERTY_TAG_TYPE.TIRO_BALANCEADO: {
      return "Tiro balanceado"
    }
    case PROPERTY_TAG_TYPE.ESTUFA_A_GAS: {
      return "Estufa a gas"
    }
    case PROPERTY_TAG_TYPE.PILETA: {
      return "Pileta"
    }
    case PROPERTY_TAG_TYPE.SUM: {
      return "SUM"
    }
    case PROPERTY_TAG_TYPE.SEGURIDAD: {
      return "Seguridad"
    }
    case PROPERTY_TAG_TYPE.GYM: {
      return "GYM"
    }
    case PROPERTY_TAG_TYPE.APTO_GATO: {
      return "Apto gato"
    }
    case PROPERTY_TAG_TYPE.APTO_PERRO: {
      return "Apto perro"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function get_property_tag_slug(
  type: PropertyTagType,
) {
  switch (type) {
    case PROPERTY_TAG_TYPE.CONTRAFRENTE: {
      return "contrafrente"
    }
    case PROPERTY_TAG_TYPE.A_ESTRENAR: {
      return "a_estrenar"
    }
    case PROPERTY_TAG_TYPE.CON_BALCON: {
      return "con_balcon"
    }
    case PROPERTY_TAG_TYPE.ASCENSOR: {
      return "ascensor"
    }
    case PROPERTY_TAG_TYPE.RAMPA: {
      return "rampa"
    }
    case PROPERTY_TAG_TYPE.BAULERA: {
      return "baulera"
    }
    case PROPERTY_TAG_TYPE.COCHERA: {
      return "cochera"
    }
    case PROPERTY_TAG_TYPE.AMOBLADO: {
      return "amoblado"
    }
    case PROPERTY_TAG_TYPE.HELADERA: {
      return "heladera"
    }
    case PROPERTY_TAG_TYPE.COCINA_A_GAS: {
      return "cocina_a_gas"
    }
    case PROPERTY_TAG_TYPE.TERMOTANQUE: {
      return "termotanque"
    }
    case PROPERTY_TAG_TYPE.COCINA_ELECTRICA: {
      return "cocina_electrica"
    }
    case PROPERTY_TAG_TYPE.AIRE_ACONDICIONADO: {
      return "aire_acondicionado"
    }
    case PROPERTY_TAG_TYPE.TIRO_BALANCEADO: {
      return "tiro_balanceado"
    }
    case PROPERTY_TAG_TYPE.ESTUFA_A_GAS: {
      return "estufa_a_gas"
    }
    case PROPERTY_TAG_TYPE.PILETA: {
      return "pileta"
    }
    case PROPERTY_TAG_TYPE.SUM: {
      return "sum"
    }
    case PROPERTY_TAG_TYPE.SEGURIDAD: {
      return "seguridad"
    }
    case PROPERTY_TAG_TYPE.GYM: {
      return "gym"
    }
    case PROPERTY_TAG_TYPE.APTO_GATO: {
      return "apto_gato"
    }
    case PROPERTY_TAG_TYPE.APTO_PERRO: {
      return "apto_perro"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function get_property_tag_type_from_slug(
  slug: string,
) {
  for (const type of Object.values(PROPERTY_TAG_TYPE)) {
    if (get_property_tag_slug(type) === slug) {
      return type
    }
  }
  return null
}

export function get_property_tag_types() {
  return Object.values(PROPERTY_TAG_TYPE)
}

interface PropertyTagCategory {
  label: string
  tags: PropertyTagType[]
}

export const PROPERTY_TAG_CATEGORIES: PropertyTagCategory[] =
  [
    {
      label: "Unidad",
      tags: [
        PROPERTY_TAG_TYPE.CONTRAFRENTE,
        PROPERTY_TAG_TYPE.A_ESTRENAR,
      ],
    },
    {
      label: "Ambientes",
      tags: [PROPERTY_TAG_TYPE.CON_BALCON],
    },
    {
      label: "Edificio",
      tags: [
        PROPERTY_TAG_TYPE.ASCENSOR,
        PROPERTY_TAG_TYPE.RAMPA,
        PROPERTY_TAG_TYPE.BAULERA,
        PROPERTY_TAG_TYPE.COCHERA,
      ],
    },
    {
      label: "Equipamiento",
      tags: [
        PROPERTY_TAG_TYPE.AMOBLADO,
        PROPERTY_TAG_TYPE.HELADERA,
        PROPERTY_TAG_TYPE.COCINA_A_GAS,
        PROPERTY_TAG_TYPE.TERMOTANQUE,
        PROPERTY_TAG_TYPE.COCINA_ELECTRICA,
      ],
    },
    {
      label: "Climatización",
      tags: [
        PROPERTY_TAG_TYPE.AIRE_ACONDICIONADO,
        PROPERTY_TAG_TYPE.TIRO_BALANCEADO,
        PROPERTY_TAG_TYPE.ESTUFA_A_GAS,
      ],
    },
    {
      label: "Amenities",
      tags: [
        PROPERTY_TAG_TYPE.PILETA,
        PROPERTY_TAG_TYPE.SUM,
        PROPERTY_TAG_TYPE.SEGURIDAD,
        PROPERTY_TAG_TYPE.GYM,
      ],
    },
    {
      label: "Mascotas",
      tags: [
        PROPERTY_TAG_TYPE.APTO_GATO,
        PROPERTY_TAG_TYPE.APTO_PERRO,
      ],
    },
  ]
