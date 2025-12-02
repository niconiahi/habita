import * as fs from "node:fs"
import * as path from "node:path"
import * as v from "valibot"
import * as XLSX from "xlsx"

const CourtSchema = v.object({
  department: v.string(),
  unit: v.string(),
  office: v.string(),
  address: v.string(),
  phone: v.string(),
  email: v.string(),
})

type Court = v.InferOutput<typeof CourtSchema>

const RowSchema = v.object({
  departamento_judicial: v.string(),
  unidad: v.string(),
  oficina: v.string(),
  direccion: v.string(),
  telefono: v.union([v.string(), v.number()]),
  email: v.string(),
})

function is_civil_related(office_name: string): boolean {
  const lower = office_name.toLowerCase()
  return lower.includes("civil")
}

function extract_courts(): Court[] {
  const file_path = path.join(
    import.meta.dir,
    "mapa-judicial-2025.xlsx",
  )
  if (!fs.existsSync(file_path)) {
    console.error(
      "Error: mapa-judicial-2025.xlsx not found in scripts folder",
    )
    process.exit(1)
  }
  const workbook = XLSX.readFile(file_path)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw_data = XLSX.utils.sheet_to_json(sheet)
  const courts: Court[] = []
  for (const row of raw_data) {
    const parsed = v.safeParse(RowSchema, row)
    if (!parsed.success) {
      continue
    }
    const {
      departamento_judicial,
      unidad,
      oficina,
      direccion,
      telefono,
      email,
    } = parsed.output
    if (!is_civil_related(oficina)) {
      continue
    }
    courts.push({
      department: departamento_judicial,
      unit: unidad,
      office: oficina,
      address: direccion,
      phone: String(telefono),
      email: email,
    })
  }
  return courts
}

const courts = extract_courts()
console.log(JSON.stringify(courts, null, 2))
console.log(
  `\nTotal civil-related offices found: ${courts.length}`,
)
