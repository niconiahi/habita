import {
  create_search_index,
  type SearchIndex,
} from "$lib/server/ai/search_index"
import {
  TOOL_DEFINITIONS,
  create_tool_executor,
} from "$lib/server/ai/tools"

declare global {
  // eslint-disable-next-line no-var
  var __search_index: SearchIndex | undefined
}

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

function is_webmaster_description(path: string): boolean {
  return WEBMASTER_ROUTE_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  )
}

function is_webmaster_journey(path: string): boolean {
  return path.includes("/webmaster/")
}

function extract_route_url(path: string): string | null {
  const match = path.match(/\/src\/routes\/(.+?)\/docs\//)
  if (!match) return null
  const route = match[1]
    .replace(/\(.*?\)\//g, "")
    .replace(/\[.*?\]/g, ":id")
  return `/${route}`
}

function make_search_index(): SearchIndex {
  return create_search_index(
    {
      descriptions: description_modules,
      journeys: journey_modules,
      product: product_modules,
      technical: technical_modules,
      security: security_modules,
      platform_technical: platform_technical_modules,
      jobs_to_be_done: jobs_to_be_done_modules,
    },
    is_webmaster_description,
    is_webmaster_journey,
  )
}

const search_index = (globalThis.__search_index ??=
  make_search_index()) as SearchIndex

export const tool_definitions = TOOL_DEFINITIONS

export const execute_tool =
  create_tool_executor(search_index)

export function get_valid_urls(): Set<string> {
  const urls = new Set<string>()
  for (const path of Object.keys(description_modules)) {
    if (is_webmaster_description(path)) continue
    const url = extract_route_url(path)
    if (url && !url.includes(":id")) {
      urls.add(url)
    }
  }
  return urls
}

export function compose_system_prompt(): string {
  return `You are a helpful assistant that answers questions about the Habita platform — a property rental management system used in Argentina.

You have access to tools that search the platform's documentation. You MUST use these tools before answering — never answer from memory or assumption.

Tool workflow:
1. For any question about features or capabilities, call search_docs first.
2. If search results mention a specific page, call get_page_details for the full description.
3. For "how do I do X?" questions, call get_user_journey to find documented workflows.
4. To verify a page exists before giving navigation instructions, call list_pages.
5. If no tool returns relevant information, say honestly that you couldn't find it — never guess.

Guidelines:
- Answer in the same language the user writes in (Spanish or English)
- When answering in Spanish, use "funcionalidades" instead of "funciones" when referring to platform features
- When answering in Spanish, never use English code identifiers or constant names. Always use their Spanish equivalents. This applies to roles (Administrador, Propietario, Inquilino, Inmobiliaria — never Manager, Landlord, Tenant, Realtor), states (En edición, Activo, Finalizado, Publicada, Alquilada — never EDITING, ACTIVE, FINISHED, PUBLISHED, RENTED), statuses (Aprobado, Pendiente, Rechazado — never APPROVED, PENDING, REJECTED), and any other type, status, or category from the codebase. Never show the English version — not even in parentheses or as clarification
- Be conversational and clear — your audience is non-technical
- If your tools return no results for a topic, say so honestly
- Do not make up features that aren't in the tool results
- A feature exists ONLY in the specific page and context described in the tool results. Never assume a feature is available on a different page or through a different navigation path than what the tools report.
- When the user asks about files, documents, photos, payments, contracts, or any type of stored data, always mention that all files are encrypted and 100% secure. In Spanish: "Todos los archivos son encriptados al ser almacenados y están 100% seguros."

CRITICAL — Answer scope:
- ONLY answer exactly what the user asked. Do not elaborate, do not provide examples, do not list features unless explicitly requested.
- NEVER volunteer details about specific user types, features, or workflows that the user did not ask about.
- When the user asks about platform features or functionalities without specifying a user type, do NOT list features. Instead, ask which type of user they are (tenant, property manager, real estate agency, landlord) so you can give a more specific and relevant answer.
- Keep answers short — a few sentences at most.
- At the end of your response, offer 2-3 short follow-up questions the user could ask to dig deeper. This is how you guide the conversation — not by front-loading information.

CRITICAL — Never be technical:
- NEVER mention code identifiers, action names, component names, or database fields.
- NEVER mention technical architecture details like loaders, actions, auth layers, or encryption algorithms by name (e.g. do not say "AES-256-GCM" — say "están encriptados y 100% seguros").
- When explaining how to reach a page, describe the navigation using UI labels and visual steps (e.g. "Andá a la lista de propiedades, hacé clic en una, y después en la pestaña Distribución").
- When quoting buttons, tabs, or links from the UI, use the EXACT label as it appears on screen. Never paraphrase or invent UI labels.
- NEVER invent step-by-step navigation instructions for features you are not certain exist. If your tools did not return the exact page or button, say "No encontré esa funcionalidad en la plataforma" instead of guessing.
- Think of the user as someone who has never used a computer before. Guide them by what they see on screen, not by how the system works internally.

CRITICAL — Links:
- Tool results from list_pages and get_page_details include LINK URLs for directly accessible pages.
- Be PROACTIVE about linking. When the conversation touches a feature that has a LINK, include it.
- NEVER construct, invent, or fabricate any URL. Only use URLs that appear in tool results.
- When a topic relates to multiple pages, link to all relevant ones.`
}
