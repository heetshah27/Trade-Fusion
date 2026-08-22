import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";

type MacbookScrollProps = {
  title: React.ReactNode;
  badge?: React.ReactNode;
  src: string;
  alt: string;
  showGradient?: boolean;
};

export function MacbookScroll({ title, badge, src, alt, showGradient = true }: MacbookScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const rotation = useTransform(scrollYProgress, [0, 0.46, 1], reducedMotion ? [0, 0, 0] : [15, 0, -2.5]);
  const translateY = useTransform(scrollYProgress, [0, 0.46, 1], reducedMotion ? [0, 0, 0] : [54, 0, -24]);
  const scale = useTransform(scrollYProgress, [0, 0.46, 1], reducedMotion ? [1, 1, 1] : [0.91, 1, 0.985]);

  return (
    <section ref={sectionRef} data-testid="macbook-scroll" data-scroll-presentation="true" data-motion={reducedMotion ? "disabled" : "enabled"} className="tf-macbook-scroll relative mx-auto max-w-6xl overflow-visible py-6">
      {showGradient && <div aria-hidden="true" className="tf-macbook-scroll-glow" />}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        {badge && <div className="mb-4 flex justify-center">{badge}</div>}
        <div className="tf-macbook-scroll-title">{title}</div>
      </div>
      <div className="relative z-10 mt-8 px-2 [perspective:1400px] sm:mt-10 sm:px-6">
        <motion.div style={{ rotateX: rotation, y: translateY, scale }} className="tf-macbook-scroll-device origin-bottom" data-testid="macbook-scroll-device">
          <div className="tf-macbook-scroll-lid">
            <div aria-hidden="true" className="tf-macbook-scroll-camera"><span /></div>
            <div className="tf-macbook-scroll-screen">
              <img src={src} alt={alt} className="block h-auto w-full" />
            </div>
          </div>
          <div aria-hidden="true" className="tf-macbook-scroll-hinge" />
          <div aria-hidden="true" className="tf-macbook-scroll-base"><span /></div>
        </motion.div>
      </div>
    </section>
  );
}
