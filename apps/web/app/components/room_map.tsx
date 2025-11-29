import { useEffect, useRef } from "react"
import { display_room_type } from "~/lib/room_type"
// Force HMR update
interface Room {
  id: number
  type: number
  width: string
  length: string
}
interface RoomMapProps {
  rooms: Room[]
}
export function RoomMap({ rooms }: RoomMapProps) {
  const canvas_ref = useRef<HTMLCanvasElement>(null)
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
      const display_width = 600
      const display_height = 300
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
      const padding = 40
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
        r,
      ) {
        return sum + r.width
      }, 0)
      const max_length = Math.max(
        ...room_data.map(function (r) {
          return r.length
        }),
      )
      const available_width = display_width - padding * 2
      const available_height = display_height - padding * 2
      const scale_x = available_width / total_width
      const scale_y = available_height / max_length
      const scale = Math.min(scale_x, scale_y)
      const colors = [
        "#d0d0d0",
        "#a0c4ff",
        "#ffadad",
        "#c9f0c9",
        "#ffe4b3",
      ]
      ctx.save()
      ctx.translate(padding, padding)
      let x_offset = 0
      for (const room of room_data) {
        const w = room.width * scale
        const h = room.length * scale
        const x = Math.round(x_offset)
        const y = 0
        ctx.fillStyle = colors[room.type] ?? "#cccccc"
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = "#333"
        ctx.lineWidth = 1
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
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
        x_offset += w + 10
      }
      ctx.restore()
    },
    [rooms],
  )
  return (
    <>
      <canvas
        ref={canvas_ref}
        style={{
          border: "1px solid #ccc",
          width: "600px",
          height: "300px",
        }}
      />
    </>
  )
}
