<script lang="ts">
  import {
    Root as CarouselRoot,
    type CarouselImage,
  } from "$lib/components/Carousel";

  interface Props {
    images: CarouselImage[];
    label: string;
  }

  let { images, label }: Props = $props();
</script>

<CarouselRoot {images} {label} />
