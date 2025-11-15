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

export default function HomePage() {
  const { ref: animatedListRef, isInView: isAnimatedListVisible } = useInView();
  return (
    <div className="scroll-snap-type-y-mandatory overflow-y-auto">
      {/* SECCIÓN 1: Bienvenida
       */}
      <section className="h-screen w-full scroll-snap-align-start flex items-center bg-background text-foreground">
        <div className="container mx-auto grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          {/* Lado Izquierdo: Placeholder para Imagen/Animación */}
          <div className="flex h-[400px] w-full items-center justify-center rounded-lg bg-muted">
            <span className="text-muted-foreground">
              [Aquí va tu imagen/animación del pie]
            </span>
          </div>

          {/* Lado Derecho: Título y CTA */}
          <div className="flex flex-col items-start gap-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              El consultorio que
              <AuroraText
                colors={["#86efac", "#4ade80", "#22c55e", "#16a34a", "#166534"]}
                speed={2}
              >
                tus pies amarán
              </AuroraText>
            </h1>
            <p className="max-w-[600px] text-lg text-muted-foreground py-6">
              Gestión moderna y profesional para el cuidado podológico. Accede a
              tu historial, agenda citas y recibe notificaciones, todo en un
              solo lugar.
            </p>
            <Button asChild size="lg">
              <Link href="/login">Comienza aquí</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: Ventajas
       */}
      <section className="min-h-screen w-full scroll-snap-align-start flex items-center bg-primary text-primary-foreground py-24">
        <div className="container mx-auto text-center py-8">
          <h2 className="text-3xl font-bold  md:text-4xl">
            ¿Por qué Elegirnos?
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-lg ">
            Prospera Digital LLC es el consultorio podológico de confianza,
            dedicado a brindar atención precisa, segura y personalizada. Aquí
            encontraras un servicio pensado completamente para ti, donde
            gestionar tu cita nunca había sido tan sencillo
          </p>

          <Carousel
            opts={{
              align: "start",
              loop: false, // Hacemos que el carrusel sea infinito (opcional)
            }}
            className="w-full max-w-6xl mx-auto mt-12" // Centramos el carrusel y le damos un ancho máximo
          >
            <CarouselContent className="-ml-4">
              {/* Card 1 */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg">
                  <CardHeader className="items-center">
                    <CardTitle>Atención Profesional y Especializada</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">
                      Ofrecemos un enfoque podológico basado en experiencia
                      clínica y diagnóstico preciso para cada paciente
                    </p>
                    <UserStar className="h-20 w-20 text-primary items-center" />
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Card 2 */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg">
                  <CardHeader className="items-center">
                    <CardTitle>Trato Cercano y Humanizado</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">
                      Cada consulta se desarrolla con acompañamiento, claridad y
                      orientación, creando un ambiente de confianza y
                      tranquilidad para el paciente
                    </p>
                    <HeartPulse className="h-20 w-20 text-primary items-center" />
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Card 3 */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg">
                  <CardHeader className="items-center">
                    <CardTitle>Tu información Actualizada</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">
                      El podólogo cuenta con un registro de tu información y tus
                      citas, por lo que no necesitará recordar tu historial
                    </p>
                    <Database className="h-20 w-20 text-primary " />
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Card 4  */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg">
                  <CardHeader className="items-center">
                    <CardTitle>Agenda Fácil</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">
                      Reserva o reprograma tus citas en segundos, sin llamadas
                      ni esperas
                    </p>
                    <CalendarDays className="h-20 w-20 text-primary" />
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Card 5  */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg">
                  <CardHeader className="items-center">
                    <CardTitle>Tus Citas Gestionadas</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">
                      Accede a tu citas realizadas, recetas, documentos clínicos
                      y observaciones del podólogo en cualquier momento.
                    </p>
                    <FileUser className="h-20 w-20 text-primary" />
                  </CardContent>
                </Card>
              </CarouselItem>

              {/* Card 6  */}
              <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 flex py-4">
                <Card className="h-full transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg">
                  <CardHeader className="items-center">
                    <CardTitle>Notificaciones Automáticas</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">
                      Recibe recordatorios automáticos por correo electrónico
                      para no olvidar nunca una cita.
                    </p>
                    <Mail className="h-20 w-20 text-primary " />
                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
            {/* 3. Añadimos los botones de navegación */}
            <CarouselPrevious className="[&_svg]:text-primary" />
            <CarouselNext className="[&_svg]:text-primary" />
          </Carousel>
        </div>
      </section>

      {/* SECCIÓN 3: Más Información (Ej. Sobre el Doctor)
       */}
      <section className="h-screen w-full scroll-snap-align-start flex flex-col items-center justify-center bg-background">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">
            Agilidad y Seguridad, lo que Tú Necesitas
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-lg text-muted-foreground">
            Una interfaz diseñada para ti: Simple, con la información a la mano,
            rápida y eficiente, todos los procesos e información necesaria en un
            solo lugar (FOTO DE PANTALLA DEL PANEL DE CITAS).
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card 1 */}
            <Card className="transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg">
              <CardHeader>
                <CardTitle>Nuestra Misión</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Proveer un servicio de podología excepcional, centrado en el
                paciente y apoyado por un sistema de gestión eficiente y seguro.
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="transform-gpu transition-transform duration-200 hover:-translate-y-2 hover:shadow-lg">
              <CardHeader>
                <CardTitle>Tecnología a tu Servicio</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Este sistema web personalizado asegura la confidencialidad y el
                control total de tus datos clínicos, adaptándose al flujo de
                trabajo del consultorio.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: Por que cuidarse
       */}
      <section className="h-screen w-full scroll-snap-align-start flex items-center bg-muted/50">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          {/* Lado Derecho: Placeholder para Imagen */}
          <div className="flex h-[400px] w-full items-center justify-center rounded-lg bg-muted">
            <span className="text-muted-foreground">
              [Aquí va tu imagen de un pie]
            </span>
          </div>

          {/* Lado Izquierdo: Argumentos */}
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-3xl font-bold text-primary md:text-4xl">
              ¿Por qué es vital revisar tus pies?
            </h2>
            <p className="max-w-[600px] text-lg text-muted-foreground">
              Tus pies son más que solo tu base; son indicadores clave de tu
              salud general. Ignorar pequeñas molestias puede llevar a problemas
              crónicos.
            </p>

            {/* Lista de 3 Puntos Argumentativos */}
            <ul className="mt-6 space-y-4" ref={animatedListRef}>
              <AnimatedList isVisible={isAnimatedListVisible}>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Prevención de Problemas</h4>
                    <p className="text-muted-foreground">
                      Detectar a tiempo deformidades, problemas de pisada o
                      infecciones fúngicas evita complicaciones futuras.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">
                      Indicador de Salud General
                    </h4>
                    <p className="text-muted-foreground">
                      Problemas en los pies pueden ser el primer síntoma de
                      condiciones serias como diabetes, artritis o mala
                      circulación.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Mejora tu Calidad de Vida</h4>
                    <p className="text-muted-foreground">
                      Unos pies sanos te permiten moverte sin dolor, mantenerte
                      activo y disfrutar tu día a día sin limitaciones.
                    </p>
                  </div>
                </li>
              </AnimatedList>
            </ul>
          </div>
        </div>
      </section>

      {/* SECCIÓN 5: CTA Final
       */}
      <section
        className="h-screen w-full scroll-snap-align-start flex flex-col items-center justify-center bg-primary text-primary-foreground"
        style={{
          backgroundImage:
            "linear-gradient(135deg,   #14b8a6, #0d9488,  #0f766e )",
        }}
      >
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            ¿Listo para dar el primer paso?
          </h2>
          <p className="mx-auto mt-4 max-w-[600px] text-lg text-primary-foreground/90">
            Únete a nuestro sistema y descubre una nueva forma de gestionar tu
            salud podológica. Prospera Digital LLC es tu espacio seguro para
            recibir atención podológica con profesionalismo y dedicación. Desde
            el primer contacto hasta el seguimiento de tus consultas,
            encontrarás un servicio confiable, organizado y centrado en tu
            bienestar.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link href="/register">Comienza y agenda tu cita ahora</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
