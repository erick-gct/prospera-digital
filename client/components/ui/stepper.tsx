"use client"

import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"
import { Check, Loader2 } from "lucide-react"
import * as React from "react"
import { createContext, useContext, useMemo } from "react"

// --- Contexto y Tipos (Igual que antes) ---
type StepperContextValue = {
  activeStep: number
  orientation: "horizontal" | "vertical"
  isLoading: boolean
  isError: boolean
  steps: { label: string; description?: string }[]
}

const StepperContext = createContext<StepperContextValue | null>(null)

function useStepperContext() {
  const context = useContext(StepperContext)
  if (!context) {
    throw new Error(
      "useStepperContext debe ser usado dentro de un <Stepper />"
    )
  }
  return context
}

// --- Componente Principal Stepper (CAMBIADO) ---
type StepperProps = StepperContextValue &
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode
  }

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      activeStep,
      orientation,
      isLoading,
      isError,
      steps,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const contextValue = useMemo(
      () => ({
        activeStep,
        orientation,
        isLoading,
        isError,
        steps,
      }),
      [activeStep, orientation, isLoading, isError, steps]
    )

    // CAMBIO: Usamos 'grid' para espaciado perfecto.
    // El número de columnas se basa en la cantidad de pasos.
    const gridCols = `grid-cols-${steps.length}`

    return (
      <StepperContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            "grid w-full",
            gridCols, // Aplicamos las columnas dinámicas
            className
          )}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

// --- Componente Step (CAMBIADO) ---

const stepVariants = cva(
  "relative flex items-center justify-center rounded-full transition-all duration-300",
  {
    variants: {
      size: {
        sm: "size-8 text-sm",
        md: "size-10 text-md",
        lg: "size-12 text-lg",
      },
      state: {
        inactive:
          "border-2 bg-background text-muted-foreground border-border",
        active: "border-2 border-primary text-primary scale-110", // Efecto de escala
        completed: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      state: "inactive",
    },
  }
)

type StepProps = React.HTMLAttributes<HTMLDivElement> & {
  step: number
  label?: string
  description?: string
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ step, label, description, className, ...props }, ref) => {
    const { activeStep, steps } = useStepperContext()
    const state =
      step < activeStep
        ? "completed"
        : step === activeStep
        ? "active"
        : "inactive"
    const isCompleted = step < activeStep
    const isLastStep = step === steps.length

    const Icon =
      step < activeStep ? Check : isLoading && step === activeStep ? Loader2 : null
    
    const { isLoading } = useStepperContext()
    const shouldSpin = isLoading && step === activeStep

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-4 relative", // CAMBIO: Añadido 'relative'
          className
        )}
        {...props}
      >
        {/* Contenedor para el Círculo y el Label (para centrar) */}
        <div className="flex flex-col items-center gap-2 z-10">
          {/* Círculo */}
          <div
            className={stepVariants({
              state,
            })}
          >
            {Icon ? <Icon className={cn(shouldSpin && 'animate-spin')} /> : step}
          </div>
          {/* Label */}
          <div className="text-center">
            {label && <div className="text-md font-medium">{label}</div>}
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </div>
        </div>

        {/* CAMBIO: Barra Conectora (Añadido) */}
        {!isLastStep && (
          <div className="absolute left-1/2 top-5 h-0.5 w-full -translate-y-1/2 z-0">
            {/* Track de la barra (fondo gris) */}
            <div className="h-full w-full bg-border" />
            {/* Progreso de la barra (fondo azul) */}
            <div
              className={cn(
                "absolute top-0 left-0 h-full bg-primary transition-all duration-300",
                isCompleted ? "w-full" : "w-0" // Se llena si está completado
              )}
            />
          </div>
        )}
      </div>
    )
  }
)
Step.displayName = "Step"

export { Stepper, Step, useStepperContext }