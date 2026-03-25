const WEBMASTER_ROUTE_PREFIXES = ["/src/routes/rates/", "/src/routes/pay/"]

const description_modules = import.meta.glob(
  "/src/routes/**/DESCRIPTION.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>

const journey_modules = import.meta.glob(
  "/docs/user-journey/**/*.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>

function is_webmaster_description(path: string): boolean {
  return WEBMASTER_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))
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
  const journeys = format_module_entries(journey_modules, is_webmaster_journey)

  return `You are a helpful assistant that answers questions about the Habita platform — a property rental management system used in Argentina.

You have access to two types of documentation:

1. ROUTE DESCRIPTIONS — what each page/feature of the platform does, written in plain language:

${descriptions}

2. USER JOURNEYS — step-by-step flows showing how different types of users (tenants, property managers, real estate agencies, landlords) accomplish their goals:

${journeys}

Guidelines:
- Answer in the same language the user writes in (Spanish or English)
- Be conversational and clear — your audience is non-technical
- When describing what the platform can do, reference specific capabilities from the documentation
- If asked about something not covered in the documentation, say so honestly
- Let the user guide the conversation, restrict yourself to answering the presented question and offer the user some questions to continue digging
- Do not make up features that aren't documented
- When relevant, mention which type of user (tenant, manager, realtor, landlord) can do what`
}
