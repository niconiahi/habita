<script lang="ts">
  import SectionEight from "./components/section_eight.svelte"
  import SectionFifteen from "./components/section_fifteen.svelte"
  import SectionFourteen from "./components/section_fourteen.svelte"
  import SectionNine from "./components/section_nine.svelte"
  import SectionSeven from "./components/section_seven.svelte"
  import SectionSeventeen from "./components/section_seventeen.svelte"
  import SectionSix from "./components/section_six.svelte"
  import SectionSixteen from "./components/section_sixteen.svelte"
  import SectionThree from "./components/section_three.svelte"
  import SectionTwentyOne from "./components/section_twenty_one.svelte"
  import SectionTwo from "./components/section_two.svelte"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<SectionTwo {data} />
<SectionThree {data} />
<SectionSix {data} />
<SectionSeven {data} />
<SectionEight {data} />
<SectionNine {data} />
<SectionFourteen {data} />
<SectionFifteen {data} />
<SectionSixteen {data} />
<SectionSeventeen {data} />
<SectionTwentyOne {data} />
