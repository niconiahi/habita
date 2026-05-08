<script lang="ts">
  import SectionCanon from "./components/section_canon.svelte"
  import SectionDestiny from "./components/section_destiny.svelte"
  import SectionEarlyTermination from "./components/section_early_termination.svelte"
  import SectionFine from "./components/section_fine.svelte"
  import SectionItems from "./components/section_items.svelte"
  import SectionJurisdiction from "./components/section_jurisdiction.svelte"
  import SectionPayment from "./components/section_payment.svelte"
  import SectionReturn from "./components/section_return.svelte"
  import SectionShowroom from "./components/section_showroom.svelte"
  import SectionTerm from "./components/section_term.svelte"
  import SectionWarranty from "./components/section_warranty.svelte"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<SectionItems {data} />
<SectionDestiny {data} />
<SectionTerm {data} />
<SectionCanon {data} />
<SectionPayment {data} />
<SectionFine {data} />
<SectionReturn {data} />
<SectionEarlyTermination {data} />
<SectionShowroom {data} />
<SectionWarranty {data} />
<SectionJurisdiction {data} />
