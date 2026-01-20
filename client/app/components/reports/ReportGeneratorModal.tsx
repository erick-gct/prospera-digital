"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, FileDown, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";

import { ApiRoutes } from "@/lib/api-routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export function ReportGeneratorModal() {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<"day" | "week">("day");
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      if (reportType === "day" && !selectedDay) {
        toast.error("Por favor selecciona un día");
        return;
      }
      if (reportType === "week" && (!selectedRange?.from || !selectedRange?.to)) {
        toast.error("Por favor selecciona un rango de fechas");
        return;
      }

      setIsGenerating(true);

      let startDate: string;
      let endDate: string;

      if (reportType === "day") {
        startDate = format(selectedDay!, "yyyy-MM-dd");
        endDate = format(selectedDay!, "yyyy-MM-dd");
      } else {
        startDate = format(selectedRange!.from!, "yyyy-MM-dd");
        endDate = format(selectedRange!.to!, "yyyy-MM-dd");
      }

      const res = await fetch(ApiRoutes.reports.citasPdf, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          type: reportType,
        }),
      });

      if (!res.ok) throw new Error("Error generando el reporte");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-citas-${reportType}-${startDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success("Reporte generado correctamente");
      setOpen(false);

    } catch (error) {
      console.error(error);
      toast.error("Error al generar el reporte PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Reporte PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generar Reporte de Citas</DialogTitle>
          <DialogDescription>
            Selecciona el tipo de reporte y el rango de fechas.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="day" onValueChange={(v) => setReportType(v as "day" | "week")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="day">Reporte Diario</TabsTrigger>
            <TabsTrigger value="week">Reporte Semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center border rounded-md p-4">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                locale={es}
                initialFocus
                className="rounded-md border shadow"
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Se generará un reporte detallado para el día seleccionado.
            </p>
          </TabsContent>

          <TabsContent value="week" className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Seleccionar Rango:</label>
              <DatePickerWithRange 
                date={selectedRange} 
                setDate={setSelectedRange} 
                className="w-full"
              />
            </div>
            <p className="text-sm text-center text-muted-foreground mt-8">
              Se generará un reporte acumulado para el rango de fechas seleccionado.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
