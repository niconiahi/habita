<script lang="ts">
  import { display_room_type } from "$lib/room_type"

  const PADDING = 20
  const SNAP_THRESHOLD = 1
  const ROOM_STROKE_WIDTH = 2
  const MIN_HEIGHT = 500

  interface Room {
    id: number
    type: number
    width: string
    length: string
    position_x: string | null
    position_y: string | null
  }

  interface Position {
    x: number
    y: number
  }

  interface RoomBounds {
    id: number
    x: number
    y: number
    w: number
    h: number
  }

  interface DraggingState {
    room_id: number
    start_x: number
    start_y: number
    room_start_x: number
    room_start_y: number
  }

  interface Props {
    rooms: Room[]
    is_readonly?: boolean
    on_positions_change?: (
      positions: Map<number, Position>,
    ) => void
  }

  let {
    rooms,
    is_readonly = false,
    on_positions_change,
  }: Props = $props()

  let canvas_el: HTMLCanvasElement | undefined = $state()
  let container_el: HTMLDivElement | undefined = $state()
  let room_positions = $state<Map<number, Position>>(
    new Map(),
  )
  let dragging_state = $state<DraggingState | null>(null)
  let room_bounds = $state<RoomBounds[]>([])

  function get_room_at_point(
    canvas_x: number,
    canvas_y: number,
    bounds: RoomBounds[],
    padding: number,
  ): RoomBounds | null {
    const x = canvas_x - padding
    const y = canvas_y - padding
    for (let i = bounds.length - 1; i >= 0; i--) {
      const room = bounds[i]
      if (
        x >= room.x &&
        x <= room.x + room.w &&
        y >= room.y &&
        y <= room.y + room.h
      ) {
        return room
      }
    }
    return null
  }

  function check_collision(
    dragging_room: RoomBounds,
    new_x: number,
    new_y: number,
    all_rooms: RoomBounds[],
  ): boolean {
    const new_rect = {
      x: new_x,
      y: new_y,
      w: dragging_room.w,
      h: dragging_room.h,
    }
    for (const other_room of all_rooms) {
      if (other_room.id === dragging_room.id) continue
      if (
        new_rect.x < other_room.x + other_room.w &&
        new_rect.x + new_rect.w > other_room.x &&
        new_rect.y < other_room.y + other_room.h &&
        new_rect.y + new_rect.h > other_room.y
      ) {
        return true
      }
    }
    return false
  }

  function get_snapped_position(
    new_x: number,
    new_y: number,
    dragging_room: RoomBounds,
    all_rooms: RoomBounds[],
    snap_threshold: number,
  ): Position {
    let snapped_x = new_x
    let snapped_y = new_y
    const room_rect = {
      left: new_x,
      right: new_x + dragging_room.w,
      top: new_y,
      bottom: new_y + dragging_room.h,
    }
    for (const other of all_rooms) {
      if (other.id === dragging_room.id) continue
      const other_rect = {
        left: other.x,
        right: other.x + other.w,
        top: other.y,
        bottom: other.y + other.h,
      }
      if (
        Math.abs(room_rect.right - other_rect.left) <
        snap_threshold
      ) {
        snapped_x = other_rect.left - dragging_room.w
      } else if (
        Math.abs(room_rect.left - other_rect.right) <
        snap_threshold
      ) {
        snapped_x = other_rect.right
      }
      if (
        Math.abs(room_rect.bottom - other_rect.top) <
        snap_threshold
      ) {
        snapped_y = other_rect.top - dragging_room.h
      } else if (
        Math.abs(room_rect.top - other_rect.bottom) <
        snap_threshold
      ) {
        snapped_y = other_rect.bottom
      }
      if (
        Math.abs(room_rect.top - other_rect.top) <
        snap_threshold
      ) {
        snapped_y = other_rect.top
      } else if (
        Math.abs(room_rect.bottom - other_rect.bottom) <
        snap_threshold
      ) {
        snapped_y = other_rect.bottom - dragging_room.h
      }
      if (
        Math.abs(room_rect.left - other_rect.left) <
        snap_threshold
      ) {
        snapped_x = other_rect.left
      } else if (
        Math.abs(room_rect.right - other_rect.right) <
        snap_threshold
      ) {
        snapped_x = other_rect.right - dragging_room.w
      }
    }
    return { x: snapped_x, y: snapped_y }
  }

  function update_room_position(
    room_id: number,
    x: number,
    y: number,
  ): void {
    const updated = new Map(room_positions)
    updated.set(room_id, { x, y })
    room_positions = updated
    on_positions_change?.(updated)
  }

  function handle_pointer_down(event: PointerEvent): void {
    if (!canvas_el || is_readonly) return
    const rect = canvas_el.getBoundingClientRect()
    const canvas_x = event.clientX - rect.left
    const canvas_y = event.clientY - rect.top
    const room = get_room_at_point(
      canvas_x,
      canvas_y,
      room_bounds,
      PADDING,
    )
    if (room) {
      canvas_el.setPointerCapture(event.pointerId)
      dragging_state = {
        room_id: room.id,
        start_x: canvas_x,
        start_y: canvas_y,
        room_start_x: room.x,
        room_start_y: room.y,
      }
      canvas_el.style.cursor = "grabbing"
    }
  }

  function handle_pointer_move(event: PointerEvent): void {
    if (!canvas_el || !dragging_state) return
    const rect = canvas_el.getBoundingClientRect()
    const canvas_x = event.clientX - rect.left
    const canvas_y = event.clientY - rect.top
    const delta_x = canvas_x - dragging_state.start_x
    const delta_y = canvas_y - dragging_state.start_y
    let new_x = dragging_state.room_start_x + delta_x
    let new_y = dragging_state.room_start_y + delta_y
    const dragging_room = room_bounds.find(
      (room) => room.id === dragging_state?.room_id,
    )
    if (!dragging_room) return
    const snapped = get_snapped_position(
      new_x,
      new_y,
      dragging_room,
      room_bounds,
      SNAP_THRESHOLD,
    )
    new_x = snapped.x
    new_y = snapped.y
    new_x = Math.max(0, new_x)
    new_y = Math.max(0, new_y)
    const has_collision = check_collision(
      dragging_room,
      new_x,
      new_y,
      room_bounds,
    )
    if (!has_collision) {
      update_room_position(
        dragging_state.room_id,
        new_x,
        new_y,
      )
    }
  }

  function handle_pointer_up(event: PointerEvent): void {
    if (!canvas_el) return
    if (dragging_state) {
      canvas_el.releasePointerCapture(event.pointerId)
      dragging_state = null
      canvas_el.style.cursor = "grab"
    }
  }

  // Initialize positions from rooms
  $effect(() => {
    const initial_positions = new Map<number, Position>()
    for (const room of rooms) {
      if (
        room.position_x !== null &&
        room.position_y !== null
      ) {
        initial_positions.set(room.id, {
          x: Number.parseFloat(room.position_x),
          y: Number.parseFloat(room.position_y),
        })
      }
    }
    room_positions = initial_positions
  })

  // Render canvas
  $effect(() => {
    if (!canvas_el) return
    const ctx = canvas_el.getContext("2d", {
      alpha: false,
    })
    if (!ctx) return
    const device_pixel_ratio = window.devicePixelRatio || 1
    const padding = PADDING
    const room_data = rooms.map((r) => ({
      id: r.id,
      type: r.type,
      width: Number.parseFloat(r.width),
      length: Number.parseFloat(r.length),
    }))
    const total_width = room_data.reduce(
      (sum, room) => sum + room.width,
      0,
    )
    const max_length = Math.max(
      ...room_data.map((r) => r.length),
      1,
    )
    const PIXELS_PER_METER = 50
    const scale = PIXELS_PER_METER
    let max_x = 0
    let max_y = 0
    let x_offset_calc = 0
    for (const room of room_data) {
      const w = room.width * scale
      const h = room.length * scale
      const position = room_positions.get(room.id) || {
        x: x_offset_calc,
        y: 0,
      }
      const right_edge = position.x + w
      const bottom_edge = position.y + h
      if (right_edge > max_x) max_x = right_edge
      if (bottom_edge > max_y) max_y = bottom_edge
      if (!room_positions.has(room.id)) {
        x_offset_calc += w + 10
      }
    }
    const container_width = container_el?.clientWidth ?? 600
    const rooms_width = Math.ceil(max_x + padding * 2)
    const display_width = Math.max(rooms_width, container_width)
    const display_height = Math.max(Math.ceil(max_y + padding * 2), MIN_HEIGHT)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    canvas_el.width = display_width * device_pixel_ratio
    canvas_el.height = display_height * device_pixel_ratio
    canvas_el.style.width = `${display_width}px`
    canvas_el.style.height = `${display_height}px`
    ctx.setTransform(
      device_pixel_ratio,
      0,
      0,
      device_pixel_ratio,
      0,
      0,
    )
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = "#252420"
    ctx.fillRect(0, 0, display_width, display_height)
    const colors = [
      "#d0d0d0",
      "#a0c4ff",
      "#ffadad",
      "#c9f0c9",
      "#ffe4b3",
    ]
    ctx.save()
    ctx.translate(padding, padding)
    const current_room_bounds: RoomBounds[] = []
    let x_offset = 0
    for (const room of room_data) {
      const w = room.width * scale
      const h = room.length * scale
      const position = room_positions.get(room.id) || {
        x: x_offset,
        y: 0,
      }
      const x = Math.round(position.x)
      const y = Math.round(position.y)
      current_room_bounds.push({
        id: room.id,
        x: position.x,
        y: position.y,
        w: w,
        h: h,
      })
      ctx.fillStyle = colors[room.type] ?? "#cccccc"
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = "#333"
      ctx.lineWidth = ROOM_STROKE_WIDTH
      ctx.strokeRect(x, y, w, h)
      ctx.fillStyle = "#000"
      ctx.font = "16px Arial, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const type_label = display_room_type(room.type)
      ctx.fillText(type_label, x + w / 2, y + h / 2)
      ctx.fillStyle = "#000"
      ctx.font = "14px Arial, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(`${room.width}m`, x + w / 2, y + h - 4)
      ctx.save()
      ctx.translate(x + w - 8, y + h / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`${room.length}m`, 0, 0)
      ctx.restore()
      if (!room_positions.has(room.id)) {
        x_offset += w + 10
      }
    }
    room_bounds = current_room_bounds
    ctx.restore()
  })
</script>

<div class="room-map-container" bind:this={container_el}>
  <canvas
    bind:this={canvas_el}
    style:cursor={is_readonly ? "default" : "grab"}
    onpointerdown={handle_pointer_down}
    onpointermove={handle_pointer_move}
    onpointerup={handle_pointer_up}
    onpointercancel={handle_pointer_up}
  ></canvas>
</div>

<style>
  .room-map-container {
    width: fit-content;
    min-width: 100%;
    border-radius: var(--dimension-radius-lg);
  }

  .room-map-container canvas {
    display: block;
  }
</style>
