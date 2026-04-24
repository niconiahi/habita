<script lang="ts">
  interface Props {
    latitude: string
    longitude: string
  }

  let { latitude, longitude }: Props = $props()

  let container_element: HTMLDivElement | undefined =
    $state()

  const MARKER_COLOR = "#1599ba"
  const ZOOM = 14

  $effect(() => {
    if (!container_element) return

    const lat = Number.parseFloat(latitude)
    const lon = Number.parseFloat(longitude)

    if (Number.isNaN(lat) || Number.isNaN(lon)) return

    const style_url = `${window.location.origin}/tiles/styles/positron/style.json`

    let map:
      | InstanceType<typeof import("maplibre-gl").Map>
      | undefined
    let cancelled = false

    import("maplibre-gl").then(({ Map, Marker }) => {
      if (cancelled) return

      map = new Map({
        container: container_element!,
        style: style_url,
        center: [lon, lat],
        zoom: ZOOM,
        attributionControl: false,
        localFontFamily: "DM Sans, sans-serif",
      } as ConstructorParameters<typeof Map>[0])

      new Marker({ color: MARKER_COLOR })
        .setLngLat([lon, lat])
        .addTo(map)
    })

    return () => {
      cancelled = true
      map?.remove()
    }
  })
</script>

<svelte:head>
  <link rel="stylesheet" href="/maplibre-gl.css" />
</svelte:head>

<div
  class="property-map"
  bind:this={container_element}
></div>

<style>
  .property-map {
    width: 100%;
    height: 500px;
    border-radius: var(--dimension-radius-lg);
    overflow: hidden;
  }
</style>
