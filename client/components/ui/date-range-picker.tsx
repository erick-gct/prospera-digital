"use client"

import * as React from "react"
import { addDays, format, subDays, startOfWeek, endOfWeek } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  // Manejador de preajustes rápidos
  const handlePresetChange = (value: string) => {
    const today = new Date()
    
    switch (value) {
      case "today":
        setDate({
          from: today,
          to: today,
        })
        break
      case "yesterday":
        const yesterday = subDays(today, 1)
        setDate({
          from: yesterday,
          to: yesterday,
        })
        break
      case "thisWeek":
        setDate({
          from: startOfWeek(today, { weekStartsOn: 1 }), // Lunes
          to: endOfWeek(today, { weekStartsOn: 1 }),
        })
        break
      case "last7days":
        setDate({
          from: subDays(today, 7),
          to: today,
        })
        break
      case "lastWeek":
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 })
        const lastWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 1 })
        setDate({
          from: lastWeekStart,
          to: lastWeekEnd,
        })
        break
      case "thisMonth": // No implementado en el select, pero útil saber
        break
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "P", { locale: es })} -{" "}
                  {format(date.to, "P", { locale: es })}
                </>
              ) : (
                format(date.from, "P", { locale: es })
              )
            ) : (
              <span>Filtrar por fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b space-y-3">
             <Select onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar periodo rápido" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="yesterday">Ayer</SelectItem>
                <SelectItem value="thisWeek">Esta semana (Lun-Dom)</SelectItem>
                <SelectItem value="last7days">Últimos 7 días</SelectItem>
                <SelectItem value="lastWeek">Semana pasada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            locale={es}
          />
          <div className="p-3 border-t flex justify-end">
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setDate(undefined)}
               disabled={!date}
             >
               Limpiar Filtro
             </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
