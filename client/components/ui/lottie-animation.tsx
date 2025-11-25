"use client";

import React from "react";
import Lottie, { LottieComponentProps } from "lottie-react";

interface LottieAnimationProps extends LottieComponentProps {
  animationData: any; // El JSON de la animación
  className?: string;
}

export function LottieAnimation({
  animationData,
  className,
  loop = true,
  ...props
}: LottieAnimationProps) {
  return (
    <div className={className}>
      <Lottie animationData={animationData} loop={loop} {...props} />
    </div>
  );
}