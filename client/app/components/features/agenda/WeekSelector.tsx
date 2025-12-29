"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  subWeeks, 
  format,
  isSameWeek
} from "date-fns"
import { es } from "date-fns/locale"

interface WeekSelectorProps {
  selectedDate: Date
  onWeekChange: (date: Date) => void
}

export function WeekSelector({ selectedDate, onWeekChange }: WeekSelectorProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Lunes
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 }) // Domingo
  const isCurrentWeek = isSameWeek(selectedDate, new Date(), { weekStartsOn: 1 })

  const handlePrevWeek = () => {
    onWeekChange(subWeeks(selectedDate, 1))
  }

  const handleNextWeek = () => {
    onWeekChange(addWeeks(selectedDate, 1))
  }

  const handleToday = () => {
    onWeekChange(new Date())
  }

  // Formatear el rango de fechas
  const formatWeekRange = () => {
    const startMonth = format(weekStart, "MMM", { locale: es })
    const endMonth = format(weekEnd, "MMM", { locale: es })
    const startDay = format(weekStart, "d")
    const endDay = format(weekEnd, "d")
    const year = format(weekEnd, "yyyy")

    // Si es el mismo mes
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth} ${year}`
    }
    // Si cruza meses
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border">
      {/* Navegación de semanas */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevWeek}
          className="h-10 w-10 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-sm border min-w-[220px] justify-center">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-semibold text-gray-800 capitalize">
            {formatWeekRange()}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          className="h-10 w-10 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Botón Hoy */}
      <Button
        variant={isCurrentWeek ? "default" : "outline"}
        onClick={handleToday}
        className="gap-2"
        disabled={isCurrentWeek}
      >
        <Calendar className="h-4 w-4" />
        {isCurrentWeek ? "Semana actual" : "Ir a hoy"}
      </Button>
    </div>
  )
}
