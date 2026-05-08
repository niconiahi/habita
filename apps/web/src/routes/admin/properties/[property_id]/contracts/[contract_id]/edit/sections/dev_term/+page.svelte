<script lang="ts">
  import SectionTerm from "../components/section_term.svelte"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<h1>dev: section_term isolated</h1>

<SectionTerm {data} />

<details>
  <summary>raw contract dates from loader</summary>
  <pre>start_date: {data.contract.start_date?.toString() ?? "null"}</pre>
  <pre>end_date: {data.contract.end_date?.toString() ?? "null"}</pre>
</details>
