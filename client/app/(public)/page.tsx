"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatedList } from "@/components/ui/animated-list";
import { AuroraText } from "@/components/ui/aurora-text";
import { useInView } from "@/app/hooks/useInView";
import {
  CheckCircle, // Lo dejamos por si acaso
  CalendarDays, // Para "Agenda Fácil"
  History, // Para "Historial Digital"
  Bell, // Para "Notificaciones"
  ShieldCheck, // Para "Prevención"
  HeartPulse, // Para "Indicador de Salud"
  Star, // Para "Calidad de Vida"
  ClipboardPlus,
  UserStar,
  Mail,
  Database,
  FileUser,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import doctorAnimation from "@/public/assets/animations/doctor-animation.json";
import mainAnimation from "@/public/assets/animations/medicine-online.json";

export default function HomePage() {
  const { ref: animatedListRef, isInView: isAnimatedListVisible } = useInView();
  return (
    <div className="w-full overflow-x-hidden">
      {/* SECCIÓN 1: Bienvenida */}
      <section className="min-h-[90vh] md:min-h-screen w-full flex items-center bg-background text-foreground py-12 md:py-0">
        <div className="container mx-auto grid grid-cols-1 items-center gap-8 md:grid-cols-2 px-4 md:px-6">
          {/* Lado Izquierdo: Placeholder para Imagen/Animación */}
          <div className="flex h-[300px] md:h-[400px] w-full items-center justify-center rounded-lg overflow-hidden order-1 md:order-none">
            {/* <Image ... /> */}
            <LottieAnimation
              animationData={mainAnimation}
              className="w-full h-full max-w-[280px] md:max-w-[500px]"
            />
          </div>

          {/* Lado Derecho: Título y CTA */}
          <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left order-2 md:order-none">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl flex flex-col items-center md:items-start gap-2">
              <span>El consultorio que</span>
              <AuroraText
                colors={["#86efac", "#4ade80", "#22c55e", "#16a34a", "#166534"]}
                speed={2}
              >
                tus pies amarán
              </AuroraText>
            </h1>
            <p className="max-w-[600px] text-base md:text-lg text-muted-foreground py-4 md:py-6">
              Gestión moderna y profesional para el cuidado podológico. Accede a
              tu historial, agenda citas y recibe notificaciones, todo en un
              solo lugar.
            </p>
            <Button asChild size="lg" className="w-full md:w-auto">
              <Link href="/login">Comienza aquí</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: Ventajas */}
      <section className="min-h-screen w-full flex items-center bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-2xl font-bold md:text-4xl">
            ¿Por qué Elegirnos?
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-base md:text-lg text-primary-foreground/90">
            Prospera Digital LLC es el consultorio podológico de confianza,
            dedicado a brindar atención precisa, segura y personalizada.
          </p>

          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full max-w-6xl mx-auto mt-8 md:mt-12"
          >
            <CarouselContent className="-ml-4">
              {/* Card 1 */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full w-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg bg-background text-foreground">
                  <CardHeader className="items-center">
                    <CardTitle className="text-lg md:text-xl">Atención Profesional</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-sm md:text-base text-muted-foreground">
                      Ofrecemos un enfoque podológico basado en experiencia
                      clínica y diagnóstico preciso.
                    </p>
                    <UserStar className="h-12 w-12 md:h-20 md:w-20 text-primary" />
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Card 2 */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full w-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg bg-background text-foreground">
                  <CardHeader className="items-center">
                    <CardTitle className="text-lg md:text-xl">Trato Cercano</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-sm md:text-base text-muted-foreground">
                      Creando un ambiente de confianza y tranquilidad para el paciente.
                    </p>
                    <HeartPulse className="h-12 w-12 md:h-20 md:w-20 text-primary" />
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Card 3 */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full w-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg bg-background text-foreground">
                  <CardHeader className="items-center">
                    <CardTitle className="text-lg md:text-xl">Información Actualizada</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-sm md:text-base text-muted-foreground">
                      Registro completo de tu historial para un seguimiento preciso.
                    </p>
                    <Database className="h-12 w-12 md:h-20 md:w-20 text-primary" />
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Card 4 */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full w-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg bg-background text-foreground">
                  <CardHeader className="items-center">
                    <CardTitle className="text-lg md:text-xl">Agenda Fácil</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-sm md:text-base text-muted-foreground">
                      Reserva o reprograma tus citas en segundos.
                    </p>
                    <CalendarDays className="h-12 w-12 md:h-20 md:w-20 text-primary" />
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Card 5 */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full w-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg bg-background text-foreground">
                  <CardHeader className="items-center">
                    <CardTitle className="text-lg md:text-xl">Gestión Total</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-sm md:text-base text-muted-foreground">
                      Accede a tus citas, recetas y documentos cuando quieras.
                    </p>
                    <FileUser className="h-12 w-12 md:h-20 md:w-20 text-primary" />
                  </CardContent>
                </Card>
              </CarouselItem>

               {/* Card 6 */}
               <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full w-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg bg-background text-foreground">
                  <CardHeader className="items-center">
                    <CardTitle className="text-lg md:text-xl">Notificaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-sm md:text-base text-muted-foreground">
                      Recordatorios automáticos para que no olvides tu cita.
                    </p>
                    <Mail className="h-12 w-12 md:h-20 md:w-20 text-primary" />
                  </CardContent>
                </Card>
              </CarouselItem>

            </CarouselContent>
            {/* Navegación móvil oculta/ajustada */}
            <div className="hidden md:block">
              <CarouselPrevious className="[&_svg]:text-primary" />
              <CarouselNext className="[&_svg]:text-primary" />
            </div>
            {/* Indicador visual para móvil (opcional, o dejar swipe nativo) */}
            <p className="md:hidden text-sm text-primary-foreground/70 mt-4">Desliza para ver más →</p>
          </Carousel>
        </div>
      </section>

      {/* SECCIÓN 3: Más Información */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center bg-background py-16 md:py-24">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-2xl font-bold text-primary md:text-4xl">
            Agilidad y Seguridad
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-base md:text-lg text-muted-foreground">
            Una interfaz diseñada para ti: Simple, con la información a la mano,
            rápida y eficiente, todos los procesos e información necesaria en un
            solo lugar.
          </p>

          <div className="mt-8 md:mt-12 flex justify-center w-full">
            <div className="relative w-full max-w-5xl  shadow-2xl overflow-hidden border border-border/50">
              <Image
                src="/assets/interfaz/interfaz-paciente.png"
                alt="Interfaz del sistema Prospera Digital"
                width={1200}
                height={800}
                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: Por que cuidarse */}
      <section className="min-h-screen w-full flex items-center bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 md:grid-cols-2 px-4">
          {/* Lado Derecho: Imagen */}
          <div className="flex h-[300px] md:h-[400px] w-full items-center justify-center rounded-lg bg-muted order-1 md:order-2">
             <LottieAnimation
              animationData={doctorAnimation}
              className="w-full h-full max-w-[280px] md:max-w-[500px]"
            />
          </div>

          {/* Lado Izquierdo: Argumentos */}
          <div className="flex flex-col items-start gap-4 order-2 md:order-1">
            <h2 className="text-2xl font-bold text-primary md:text-4xl">
              ¿Por qué es vital revisar tus pies?
            </h2>
            <p className="max-w-[600px] text-base md:text-lg text-muted-foreground">
              Tus pies son más que solo tu base; son indicadores clave de tu
              salud general.
            </p>

            <ul className="mt-6 space-y-4 w-full" ref={animatedListRef}>
              <AnimatedList isVisible={isAnimatedListVisible}>
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold text-base md:text-lg">Prevención</h4>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Detectar a tiempo deformidades o infecciones evita complicaciones.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold text-base md:text-lg">
                      Salud General
                    </h4>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Sntoma temprano de diabetes, artritis o mala circulación.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold text-base md:text-lg">Calidad de Vida</h4>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Muévete sin dolor y mantente activo día a día.
                    </p>
                  </div>
                </li>
              </AnimatedList>
            </ul>
          </div>
        </div>
      </section>

      {/* SECCIÓN 5: CTA Final */}
      <section
        className="min-h-[50vh] md:min-h-screen w-full flex flex-col items-center justify-center bg-primary text-primary-foreground py-16 px-4"
        style={{
          backgroundImage:
            "linear-gradient(135deg,   #14b8a6, #0d9488,  #0f766e )",
        }}
      >
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold md:text-4xl">
            ¿Listo para dar el primer paso?
          </h2>
          <p className="mx-auto mt-4 max-w-[600px] text-base md:text-lg text-primary-foreground/90">
            Únete a nuestro sistema y descubre una nueva forma de gestionar tu
            salud podológica.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 w-full md:w-auto">
            <Link href="/register">Agenda tu cita ahora</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
