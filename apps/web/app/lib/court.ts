export const TRIBUNAL = {
  CIUDAD_DE_BUENOS_AIRES: 0,
  LOMAS_DE_ZAMORA: 1,
} as const

export function get_tribunal_label(type: number) {
  switch (type) {
    case TRIBUNAL.CIUDAD_DE_BUENOS_AIRES: {
      return "Ciudad de Buenos Aires"
    }
    case TRIBUNAL.LOMAS_DE_ZAMORA: {
      return "Lomas de Zamora"
    }
  }
}
