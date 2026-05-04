import type { SearchIndex } from "./search_index"

export type ChatTool = {
  type: "function"
  function: {
    name: string
    description: string
    parameters: {
      type: "object"
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

export const TOOL_DEFINITIONS: ChatTool[] = [
  {
    type: "function",
    function: {
      name: "search_docs",
      description:
        "Search Habita platform documentation to find information about features, pages, and capabilities. Always use this before answering questions about the platform.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search query about a platform feature or capability",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pages",
      description:
        "List all pages in the platform with one-line summaries. Use this to verify a page exists before telling the user how to navigate to it.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_page_details",
      description:
        "Get the full description of a specific page by its route path. Use after search_docs or list_pages to get complete information about what a page does.",
      parameters: {
        type: "object",
        properties: {
          route: {
            type: "string",
            description:
              "The route path, e.g. '/admin/properties/:id/edit/members'",
          },
        },
        required: ["route"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_journey",
      description:
        "Search for step-by-step user workflows. Returns documented flows showing how users accomplish tasks on the platform.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "What the user wants to accomplish, e.g. 'invite landlord' or 'upload receipts'",
          },
          actor: {
            type: "string",
            enum: [
              "manager",
              "tenant",
              "landlord",
              "realtor",
            ],
            description: "Optional: filter by actor type",
          },
        },
        required: ["query"],
      },
    },
  },
]

export function create_tool_executor(
  index: SearchIndex,
): (name: string, args: Record<string, unknown>) => string {
  return function execute_tool(
    name: string,
    args: Record<string, unknown>,
  ): string {
    switch (name) {
      case "search_docs": {
        const query = args.query as string
        const results = index.search(query)
        if (results.length === 0) {
          return "No se encontraron resultados para esta búsqueda."
        }
        return results
          .map((r) => {
            const route_line = r.route
              ? `\nRuta: ${r.route}`
              : ""
            return `[${r.category}] ${r.title}${route_line}\n${r.content}`
          })
          .join("\n\n---\n\n")
      }

      case "list_pages": {
        const pages = index.list_pages()
        return pages
          .map((p) => {
            const link = p.link ? ` (LINK: ${p.link})` : ""
            return `${p.route}${link} — ${p.summary}`
          })
          .join("\n")
      }

      case "get_page_details": {
        const route = args.route as string
        const details = index.get_page_details(route)
        if (!details) {
          return `No se encontró la página con ruta "${route}".`
        }
        const has_link = !route.includes(":id")
        const link_line = has_link
          ? `LINK: [Ir a esta página](${route})\n\n`
          : ""
        return link_line + details
      }

      case "get_user_journey": {
        const query = args.query as string
        const actor = args.actor as string | undefined
        const results = index.search_journeys(query, actor)
        if (results.length === 0) {
          return "No se encontraron flujos de usuario para esta búsqueda."
        }
        return results
          .map((r) => `${r.title}\n${r.content}`)
          .join("\n\n---\n\n")
      }

      default:
        return `Herramienta desconocida: ${name}`
    }
  }
}
