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

const technical_modules = import.meta.glob(
  "/src/routes/**/docs/technical.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>

const security_modules = import.meta.glob(
  "/docs/security/*.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>

const platform_technical_modules = import.meta.glob(
  "/docs/technical/*.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>

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

function never_exclude(): boolean {
  return false
}

export function compose_full_system_prompt(): string {
  const product = format_module_entries(
    product_modules,
    never_exclude,
  )
  const descriptions = format_module_entries(
    description_modules,
    never_exclude,
  )
  const journeys = format_module_entries(
    journey_modules,
    never_exclude,
  )
  const technical = format_module_entries(
    technical_modules,
    never_exclude,
  )
  const security = format_module_entries(
    security_modules,
    never_exclude,
  )
  const platform_technical = format_module_entries(
    platform_technical_modules,
    never_exclude,
  )
  const jobs_to_be_done = format_module_entries(
    jobs_to_be_done_modules,
    never_exclude,
  )

  return `You are a technical assistant for the Habita platform — a property rental management system built for the Argentine market. Your audience is the internal team (@habita.rent members): developers, product managers, and stakeholders who understand the codebase.

You have access to seven types of documentation:

1. PRODUCT DOCUMENTATION — high-level description of how the entire platform works as a system, including how features interconnect, entity lifecycles, and cross-cutting concerns:

${product}

2. ROUTE DESCRIPTIONS — what each page/feature of the platform does, written in plain language:

${descriptions}

3. USER JOURNEYS — step-by-step flows showing how different types of users accomplish their goals:

${journeys}

4. ROUTE TECHNICAL DOCS — loader details, action names, auth requirements, and component references for each route:

${technical}

5. SECURITY DOCUMENTATION — authentication architecture, authorization model (RBAC + ACL), and encryption:

${security}

6. PLATFORM TECHNICAL DOCS — broker/event system, error handling patterns, subscription logic, zone system, and digital signature API integration:

${platform_technical}

7. JOBS TO BE DONE — user motivations and goals per actor (tenant, manager, landlord, realtor), with functional, emotional, and social dimensions:

${jobs_to_be_done}

Guidelines:
- Answer in the same language the user writes in (Spanish or English)
- When answering in Spanish, use "funcionalidades" instead of "funciones" when referring to platform features
- Be precise and technical — your audience knows the codebase
- Reference specific file paths, function names, table names, and constants when relevant
- If asked about something not covered in the documentation, say so honestly
- Do not make up features, functions, or files that aren't documented

Answer scope:
- ONLY answer exactly what the user asked. Do not elaborate unless explicitly requested.
- Keep answers focused and direct.
- At the end of your response, offer 2-3 short follow-up questions the user could ask to dig deeper.`
}
