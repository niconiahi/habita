import { useEffect, useRef, useState } from "react"
import { display_room_type } from "~/lib/room_type"

const PADDING = 20
const SNAP_THRESHOLD = 1
const ROOM_STROKE_WIDTH = 2

interface Room {
  id: number
  type: number
  width: string
  length: string
  position_x: string | null
  position_y: string | null
}

interface RoomMapProps {
  rooms: Room[]
  is_readonly?: boolean
  on_positions_change?: (
    positions: Map<number, Position>,
  ) => void
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

function get_room_at_point(
  canvas_x: number,
  canvas_y: number,
  room_bounds: RoomBounds[],
  padding: number,
): RoomBounds | null {
  const x = canvas_x - padding
  const y = canvas_y - padding
  for (let i = room_bounds.length - 1; i >= 0; i--) {
    const room = room_bounds[i]
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

function create_pointer_down_handler(deps: {
  canvas: HTMLCanvasElement
  room_bounds: RoomBounds[]
  set_dragging_state: (state: DraggingState | null) => void
}) {
  return function (event: PointerEvent): void {
    const rect = deps.canvas.getBoundingClientRect()
    const canvas_x = event.clientX - rect.left
    const canvas_y = event.clientY - rect.top
    const room = get_room_at_point(
      canvas_x,
      canvas_y,
      deps.room_bounds,
      PADDING,
    )
    if (room) {
      deps.canvas.setPointerCapture(event.pointerId)
      deps.set_dragging_state({
        room_id: room.id,
        start_x: canvas_x,
        start_y: canvas_y,
        room_start_x: room.x,
        room_start_y: room.y,
      })
      deps.canvas.style.cursor = "grabbing"
    }
  }
}

function create_pointer_move_handler(deps: {
  canvas: HTMLCanvasElement
  dragging_state: DraggingState | null
  room_bounds: RoomBounds[]
  update_room_position: (
    room_id: number,
    x: number,
    y: number,
  ) => void
}) {
  return function (event: PointerEvent): void {
    if (!deps.dragging_state) return
    const rect = deps.canvas.getBoundingClientRect()
    const canvas_x = event.clientX - rect.left
    const canvas_y = event.clientY - rect.top
    const delta_x = canvas_x - deps.dragging_state.start_x
    const delta_y = canvas_y - deps.dragging_state.start_y
    let new_x = deps.dragging_state.room_start_x + delta_x
    let new_y = deps.dragging_state.room_start_y + delta_y
    const dragging_room = deps.room_bounds.find(
      (room) => room.id === deps.dragging_state!.room_id,
    )
    if (!dragging_room) return
    const snapped = get_snapped_position(
      new_x,
      new_y,
      dragging_room,
      deps.room_bounds,
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
      deps.room_bounds,
    )
    if (!has_collision) {
      deps.update_room_position(
        deps.dragging_state.room_id,
        new_x,
        new_y,
      )
    }
  }
}

function create_pointer_up_handler(deps: {
  canvas: HTMLCanvasElement
  dragging_state: DraggingState | null
  set_dragging_state: (state: DraggingState | null) => void
}) {
  return function (event: PointerEvent): void {
    if (deps.dragging_state) {
      deps.canvas.releasePointerCapture(event.pointerId)
      deps.set_dragging_state(null)
      deps.canvas.style.cursor = "grab"
    }
  }
}

export function RoomMap({
  rooms,
  is_readonly = false,
  on_positions_change,
}: RoomMapProps) {
  const canvas_ref = useRef<HTMLCanvasElement>(null)
  const [room_positions, set_room_positions] = useState<
    Map<number, Position>
  >(new Map())
  const [dragging_state, set_dragging_state] =
    useState<DraggingState | null>(null)
  const [room_bounds, set_room_bounds] = useState<
    RoomBounds[]
  >([])
  const update_room_position = function (
    room_id: number,
    x: number,
    y: number,
  ): void {
    set_room_positions(function (prev) {
      const updated = new Map(prev)
      updated.set(room_id, { x, y })
      on_positions_change?.(updated)
      return updated
    })
  }
  useEffect(
    function () {
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
      set_room_positions(initial_positions)
    },
    [rooms],
  )
  useEffect(
    function () {
      const canvas = canvas_ref.current
      if (!canvas) return
      const ctx = canvas.getContext("2d", {
        alpha: false,
      })
      if (!ctx) return
      const device_pixel_ratio =
        window.devicePixelRatio || 1
      const padding = PADDING
      const room_data = rooms.map(function (r) {
        return {
          id: r.id,
          type: r.type,
          width: Number.parseFloat(r.width),
          length: Number.parseFloat(r.length),
        }
      })
      const total_width = room_data.reduce(function (
        sum,
        room,
      ) {
        return sum + room.width
      }, 0)
      const max_length = Math.max(
        ...room_data.map(function (r) {
          return r.length
        }),
      )
      const default_available_width = 600 - padding * 2
      const default_available_height = 300 - padding * 2
      const scale_x = default_available_width / total_width
      const scale_y = default_available_height / max_length
      const scale = Math.min(scale_x, scale_y)
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
      const display_width = Math.ceil(max_x + padding * 2)
      const display_height = Math.ceil(max_y + padding * 2)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      canvas.width = display_width * device_pixel_ratio
      canvas.height = display_height * device_pixel_ratio
      canvas.style.width = `${display_width}px`
      canvas.style.height = `${display_height}px`
      ctx.setTransform(
        device_pixel_ratio,
        0,
        0,
        device_pixel_ratio,
        0,
        0,
      )
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = "#ffffff"
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
      set_room_bounds(current_room_bounds)
      ctx.restore()
    },
    [rooms, room_positions],
  )
  useEffect(
    function () {
      if (is_readonly) return
      const canvas = canvas_ref.current
      if (!canvas) return
      const handle_pointer_down =
        create_pointer_down_handler({
          canvas: canvas,
          room_bounds: room_bounds,
          set_dragging_state: set_dragging_state,
        })
      const handle_pointer_move =
        create_pointer_move_handler({
          canvas: canvas,
          dragging_state: dragging_state,
          room_bounds: room_bounds,
          update_room_position: update_room_position,
        })
      const handle_pointer_up = create_pointer_up_handler({
        canvas: canvas,
        dragging_state: dragging_state,
        set_dragging_state: set_dragging_state,
      })
      canvas.addEventListener(
        "pointerdown",
        handle_pointer_down,
      )
      canvas.addEventListener(
        "pointermove",
        handle_pointer_move,
      )
      canvas.addEventListener(
        "pointerup",
        handle_pointer_up,
      )
      canvas.addEventListener(
        "pointercancel",
        handle_pointer_up,
      )
      canvas.style.cursor = "grab"
      return function () {
        canvas.removeEventListener(
          "pointerdown",
          handle_pointer_down,
        )
        canvas.removeEventListener(
          "pointermove",
          handle_pointer_move,
        )
        canvas.removeEventListener(
          "pointerup",
          handle_pointer_up,
        )
        canvas.removeEventListener(
          "pointercancel",
          handle_pointer_up,
        )
      }
    },
    [
      is_readonly,
      dragging_state,
      room_bounds,
      update_room_position,
    ],
  )
  return (
    <div
      style={{
        overflow: "auto",
        maxWidth: "100%",
        border: "1px solid #ccc",
      }}
    >
      <canvas
        ref={canvas_ref}
        style={{
          cursor: is_readonly ? "default" : undefined,
        }}
      />
    </div>
  )
}
