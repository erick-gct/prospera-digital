"use client"

import { useState } from "react"
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateFilterProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateFilter({ selectedDate, onDateChange }: DateFilterProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date)
      setOpen(false)
    }
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className="flex items-center gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              <span className="font-medium">
                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            ) : (
              <span>Selecciona una fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={es}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {!isToday(selectedDate) && (
        <Button variant="ghost" size="sm" onClick={goToToday} className="gap-2">
          <CalendarDays className="h-4 w-4" />
          Ir a hoy
        </Button>
      )}

      {isToday(selectedDate) && (
        <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
          Hoy
        </span>
      )}
    </div>
  )
}
