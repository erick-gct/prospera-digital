import AgendarCitaPodologo from "@/app/components/features/citas/AgendarCitaPodologo";

export default function AgendarPacientePage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Agendar Cita</h1>
        <p className="text-muted-foreground mt-2">
          Reserve una cita para un paciente registrado en el sistema.
        </p>
      </div>
      <AgendarCitaPodologo />
    </div>
  );
}
