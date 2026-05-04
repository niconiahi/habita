import MiniSearch, {
  type SearchResult as MiniSearchResult,
} from "minisearch"

type IndexedDocument = {
  id: number
  title: string
  content: string
  source: string
  category: string
  route: string
  actor: string
}

export type SearchResult = {
  title: string
  content: string
  source: string
  category: string
  route: string
  score: number
}

export type PageSummary = {
  route: string
  summary: string
  link: string | null
}

export type ModuleSet = {
  descriptions: Record<string, string>
  journeys: Record<string, string>
  product: Record<string, string>
  technical: Record<string, string>
  security: Record<string, string>
  platform_technical: Record<string, string>
  jobs_to_be_done: Record<string, string>
}

export type SearchIndex = {
  search: (
    query: string,
    max_results?: number,
  ) => SearchResult[]
  list_pages: () => PageSummary[]
  get_page_details: (route: string) => string | null
  search_journeys: (
    query: string,
    actor?: string,
  ) => SearchResult[]
}

function extract_route_url(path: string): string | null {
  const match = path.match(/\/src\/routes\/(.+?)\/docs\//)
  if (!match) return null
  return (
    "/" +
    match[1]
      .replace(/\(.*?\)\//g, "")
      .replace(/\[.*?\]/g, ":id")
  )
}

function extract_actor(path: string): string | null {
  const journey_match = path.match(/user-journey\/(\w+)\//)
  if (journey_match) return journey_match[1]
  const jobs_match = path.match(
    /jobs_to_be_done\/(\w+)\.md/,
  )
  if (jobs_match) return jobs_match[1]
  return null
}

function extract_first_sentence(content: string): string {
  const cleaned = content
    .replace(/^#.*$/gm, "")
    .replace(/---/g, "")
    .trim()
  const first_line = cleaned
    .split("\n")
    .find((line) => line.trim().length > 0)
  if (!first_line) return ""
  const sentence_end = first_line.match(/^(.+?[.!?])\s/)
  return sentence_end
    ? sentence_end[1]
    : first_line.slice(0, 120)
}

function chunk_by_heading(
  content: string,
): Array<{ title: string; body: string }> {
  const chunks: Array<{ title: string; body: string }> = []
  const h2_sections = content.split(/^(?=## )/m)

  for (const section of h2_sections) {
    const trimmed = section.trim()
    if (!trimmed) continue

    const h2_match = trimmed.match(/^## (.+)$/m)
    if (h2_match) {
      const h2_title = h2_match[1]
      const h2_body = trimmed
        .slice(h2_match[0].length)
        .trim()

      const h3_sections = h2_body.split(/^(?=### )/m)

      if (h3_sections.length > 1) {
        const intro = h3_sections[0].trim()
        if (intro) {
          chunks.push({ title: h2_title, body: intro })
        }

        for (let i = 1; i < h3_sections.length; i++) {
          const h3_trimmed = h3_sections[i].trim()
          const h3_match = h3_trimmed.match(/^### (.+)$/m)
          if (h3_match) {
            const h3_title = `${h2_title} > ${h3_match[1]}`
            const h3_body = h3_trimmed
              .slice(h3_match[0].length)
              .trim()
            if (h3_body) {
              chunks.push({
                title: h3_title,
                body: h3_body,
              })
            }
          }
        }
      } else if (h2_body) {
        chunks.push({ title: h2_title, body: h2_body })
      }
    } else {
      const h1_match = trimmed.match(/^# (.+)$/m)
      const title = h1_match ? h1_match[1] : "Introducción"
      const newline_index = trimmed.indexOf("\n")
      const body =
        h1_match && newline_index >= 0
          ? trimmed.slice(newline_index + 1).trim()
          : h1_match
            ? ""
            : trimmed
      if (body) chunks.push({ title, body })
    }
  }

  return chunks
}

function to_search_result(
  result: MiniSearchResult,
): SearchResult {
  return {
    title: result.title as string,
    content: result.content as string,
    source: result.source as string,
    category: result.category as string,
    route: result.route as string,
    score: result.score,
  }
}

export function create_search_index(
  modules: ModuleSet,
  exclude_description: (path: string) => boolean,
  exclude_journey: (path: string) => boolean,
): SearchIndex {
  const documents: IndexedDocument[] = []
  let next_id = 0

  function add_document(input: {
    title: string
    content: string
    source: string
    category: string
    route?: string
    actor?: string
  }) {
    documents.push({
      id: next_id++,
      title: input.title,
      content: input.content,
      source: input.source,
      category: input.category,
      route: input.route ?? "",
      actor: input.actor ?? "",
    })
  }

  for (const [path, content] of Object.entries(
    modules.descriptions,
  )) {
    if (exclude_description(path)) continue
    const route = extract_route_url(path) ?? path
    const h1 = content.match(/^# (.+)$/m)
    add_document({
      title: h1 ? h1[1] : route,
      content,
      source: path,
      category: "description",
      route,
    })
  }

  for (const [path, content] of Object.entries(
    modules.journeys,
  )) {
    if (exclude_journey(path)) continue
    const h1 = content.match(/^# (.+)$/m)
    add_document({
      title: h1 ? h1[1] : path,
      content,
      source: path,
      category: "journey",
      actor: extract_actor(path) ?? undefined,
    })
  }

  for (const [path, content] of Object.entries(
    modules.product,
  )) {
    for (const chunk of chunk_by_heading(content)) {
      add_document({
        title: chunk.title,
        content: chunk.body,
        source: path,
        category: "product",
      })
    }
  }

  for (const [path, content] of Object.entries(
    modules.technical,
  )) {
    const route = extract_route_url(path) ?? path
    const h1 = content.match(/^# (.+)$/m)
    add_document({
      title: h1 ? h1[1] : route,
      content,
      source: path,
      category: "technical",
      route,
    })
  }

  for (const [path, content] of Object.entries(
    modules.security,
  )) {
    const h1 = content.match(/^# (.+)$/m)
    add_document({
      title: h1 ? h1[1] : path,
      content,
      source: path,
      category: "security",
    })
  }

  for (const [path, content] of Object.entries(
    modules.platform_technical,
  )) {
    for (const chunk of chunk_by_heading(content)) {
      add_document({
        title: chunk.title,
        content: chunk.body,
        source: path,
        category: "platform_technical",
      })
    }
  }

  for (const [path, content] of Object.entries(
    modules.jobs_to_be_done,
  )) {
    const actor = extract_actor(path)
    for (const chunk of chunk_by_heading(content)) {
      add_document({
        title: chunk.title,
        content: chunk.body,
        source: path,
        category: "jobs_to_be_done",
        actor: actor ?? undefined,
      })
    }
  }

  const index = new MiniSearch<IndexedDocument>({
    fields: ["title", "content"],
    storeFields: [
      "title",
      "content",
      "source",
      "category",
      "route",
      "actor",
    ],
    searchOptions: {
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  })

  index.addAll(documents)

  const page_content = new Map<string, string>()
  const page_list: PageSummary[] = []

  for (const [path, content] of Object.entries(
    modules.descriptions,
  )) {
    if (exclude_description(path)) continue
    const route = extract_route_url(path)
    if (!route) continue
    page_content.set(route, content)
    const has_link = !route.includes(":id")
    page_list.push({
      route,
      summary: extract_first_sentence(content),
      link: has_link ? route : null,
    })
  }

  return {
    search(query, max_results = 5) {
      return index
        .search(query)
        .slice(0, max_results)
        .map(to_search_result)
    },

    list_pages() {
      return page_list
    },

    get_page_details(route) {
      return page_content.get(route) ?? null
    },

    search_journeys(query, actor) {
      return index
        .search(query, {
          filter(result) {
            if ((result.category as string) !== "journey")
              return false
            if (actor && (result.actor as string) !== actor)
              return false
            return true
          },
        })
        .slice(0, 5)
        .map(to_search_result)
    },
  }
}
