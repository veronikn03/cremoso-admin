"use client";

import { useState } from "react";

export default function HeroLogo({ src, alt }: { src: string; alt: string }) {
  const [spin, setSpin] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`hero-logo${spin ? " spin" : ""}`}
      src={src}
      alt={alt}
      onClick={() => setSpin(true)}
      onAnimationEnd={() => setSpin(false)}
    />
  );
}
