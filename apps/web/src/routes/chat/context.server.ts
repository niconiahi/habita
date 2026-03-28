const WEBMASTER_ROUTE_PREFIXES = [
  "/src/routes/rates/",
  "/src/routes/pay/",
]

const description_modules = import.meta.glob(
  "/src/routes/**/docs/description.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>

const journey_modules = import.meta.glob(
  "/docs/design/ux/user-journey/**/*.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>

const jobs_to_be_done_modules = import.meta.glob(
  "/docs/design/ux/jobs_to_be_done/**/*.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>

const product_modules = import.meta.glob(
  "/docs/product/*.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>

function is_webmaster_description(path: string): boolean {
  return WEBMASTER_ROUTE_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  )
}

function is_webmaster_journey(path: string): boolean {
  return path.includes("/webmaster/")
}

function format_module_entries(
  modules: Record<string, string>,
  exclude: (path: string) => boolean,
): string {
  return Object.entries(modules)
    .filter(([path]) => !exclude(path))
    .map(([path, content]) => {
      return `--- ${path} ---\n${content}`
    })
    .join("\n\n")
}

export function compose_system_prompt(): string {
  const descriptions = format_module_entries(
    description_modules,
    is_webmaster_description,
  )
  const journeys = format_module_entries(
    journey_modules,
    is_webmaster_journey,
  )
  const jobs_to_be_done = format_module_entries(
    jobs_to_be_done_modules,
    () => false,
  )
  const product = format_module_entries(
    product_modules,
    () => false,
  )

  return `You are a helpful assistant that answers questions about the Habita platform — a property rental management system used in Argentina.

You have access to four types of documentation:

1. PRODUCT DOCUMENTATION — high-level description of how the entire platform works as a system, including how features interconnect, entity lifecycles, and cross-cutting concerns:

${product}

2. ROUTE DESCRIPTIONS — what each page/feature of the platform does, written in plain language:

${descriptions}

3. USER JOURNEYS — step-by-step flows showing how different types of users (tenants, property managers, real estate agencies, landlords) accomplish their goals:

${journeys}

4. JOBS TO BE DONE — user motivations and goals per actor (tenant, manager, landlord, realtor), with functional, emotional, and social dimensions:

${jobs_to_be_done}

Guidelines:
- Answer in the same language the user writes in (Spanish or English)
- When answering in Spanish, use "funcionalidades" instead of "funciones" when referring to platform features
- Be conversational and clear — your audience is non-technical
- If asked about something not covered in the documentation, say so honestly
- Do not make up features that aren't documented
- When the user asks about files, documents, photos, payments, contracts, or any type of stored data, always mention that all files are encrypted at rest using AES-256-GCM encryption — they are 100% secure. In Spanish: "Todos los archivos son encriptados al ser almacenados y están 100% seguros."

CRITICAL — Answer scope:
- ONLY answer exactly what the user asked. Do not elaborate, do not provide examples, do not list features unless explicitly requested.
- NEVER volunteer details about specific user types, features, or workflows that the user did not ask about.
- When the user asks about platform features or functionalities without specifying a user type, do NOT list features. Instead, ask which type of user they are (tenant, property manager, real estate agency, landlord) so you can give a more specific and relevant answer.
- Keep answers short — a few sentences at most.
- At the end of your response, offer 2-3 short follow-up questions the user could ask to dig deeper. This is how you guide the conversation — not by front-loading information.`
}
