import { useEffect, useState } from 'react'

export function useCountdown(targetHour = 0) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const next = new Date()
      next.setHours(targetHour, 0, 0, 0)
      if (next <= now) next.setDate(next.getDate() + 1)
      const diff = next.getTime() - now.getTime()
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [targetHour])

  return timeLeft
}
