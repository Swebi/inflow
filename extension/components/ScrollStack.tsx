import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";

/**
 * Scroll-driven card stack for the "Needs review" queue — a port of
 * https://reactbits.dev/components/scroll-stack (container-scroll variant),
 * tuned for the side panel.
 *
 * Each card scrolls up at full size and pins near the top; the next card
 * slides over it and it recedes — shrinking a little and dimming under an
 * OPAQUE page-colour veil (`--veil`, painted by PendingActionCard). Opaque so
 * a card's text never bleeds through the cards in front of it.
 *
 * Recede is driven by `depth` — a fractional count of how many cards are
 * currently settling ON TOP of a given card — not by that card's own pin
 * progress. So the front / incoming card is always depth 0 (full size,
 * un-veiled), and a card starts receding only once something covers it.
 *
 * Adaptations from the source: container scroll only; the recede model above
 * in place of the raw scale ramp; re-measures itself on add/remove
 * (MutationObserver) so a dismiss doesn't remount/scroll-to-top; Lenis scoped
 * to this wrapper.
 */

interface ScrollStackItemProps {
  children: ReactNode;
  itemClassName?: string;
}

export function ScrollStackItem({
  children,
  itemClassName = "",
}: ScrollStackItemProps) {
  return (
    <div className={`scroll-stack-card ${itemClassName}`.trim()}>
      {children}
    </div>
  );
}

interface ScrollStackProps {
  children: ReactNode;
  className?: string;
  itemDistance?: number;
  itemStackDistance?: number;
  /** Pin line from the top. px ("14px") or % ("20%"). */
  stackPosition?: string;
  /** Scroll distance (px) over which a card settling onto the stack takes
   *  full effect — the runway for the recede. */
  rampDistance?: number;
  /** Scale removed per card stacked on top of this one. */
  scalePerDepth?: number;
  minScale?: number;
  /** Page-colour veil opacity added per card of depth — an OPAQUE fade, so
   *  the cards behind never bleed their text through. */
  veilPerDepth?: number;
  maxVeil?: number;
  /** Cap on how many stacked cards keep receding (deeper ones hold). */
  maxDepth?: number;
  rotationAmount?: number;
}

interface Transform {
  translateY: number;
  scale: number;
  rotation: number;
  veil: number;
}

export function ScrollStack({
  children,
  className = "",
  itemDistance = 14,
  itemStackDistance = 12,
  stackPosition = "10px",
  rampDistance = 90,
  scalePerDepth = 0.045,
  minScale = 0.82,
  veilPerDepth = 0.16,
  maxVeil = 0.64,
  maxDepth = 5,
  rotationAmount = 0,
}: ScrollStackProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const lastRef = useRef(new Map<number, Transform>());
  const busyRef = useRef(false);
  const settleTimerRef = useRef<number | undefined>(undefined);

  const progress = useCallback(
    (scrollTop: number, start: number, end: number) => {
      if (scrollTop < start) return 0;
      if (scrollTop > end) return 1;
      return (scrollTop - start) / (end - start);
    },
    []
  );

  const parseLen = useCallback((value: string, containerHeight: number) => {
    if (value.includes("%")) return (parseFloat(value) / 100) * containerHeight;
    return parseFloat(value);
  }, []);

  const updateCardTransforms = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !cardsRef.current.length || busyRef.current) return;
    busyRef.current = true;

    const scrollTop = scroller.scrollTop;
    const containerHeight = scroller.clientHeight;
    const stackPositionPx = parseLen(stackPosition, containerHeight);
    const cards = cardsRef.current;
    const pinLineOf = (i: number) =>
      cards[i].offsetTop - stackPositionPx - itemStackDistance * i;

    cards.forEach((card, i) => {
      if (!card) return;
      const cardTop = card.offsetTop;
      const pinLine = pinLineOf(i);

      // How many cards are currently settling onto the stack ON TOP of this
      // one — a fractional count: each higher card contributes 0→1 as it
      // rides its `rampDistance` runway into place. So the front / incoming
      // card is always depth 0 (full size), and a card only recedes once
      // something actually covers it.
      let depth = 0;
      for (let j = i + 1; j < cards.length; j++) {
        depth += progress(
          scrollTop,
          pinLineOf(j) - rampDistance,
          pinLineOf(j)
        );
      }
      const d = Math.min(depth, maxDepth);

      const scale = Math.max(minScale, 1 - d * scalePerDepth);
      const rotation = rotationAmount ? -d * rotationAmount : 0;
      const veil = Math.min(d * veilPerDepth, maxVeil);

      // Pin when reached and stay pinned — there's nothing after the stack
      // to scroll to, so the reactbits "release" would just drift the whole
      // deck up off the top once you hit the last card.
      let translateY = 0;
      if (scrollTop >= pinLine) {
        translateY =
          scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
      }

      const next: Transform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        veil: Math.round(veil * 100) / 100,
      };
      const last = lastRef.current.get(i);
      const changed =
        !last ||
        Math.abs(last.translateY - next.translateY) > 0.1 ||
        Math.abs(last.scale - next.scale) > 0.001 ||
        Math.abs(last.rotation - next.rotation) > 0.1 ||
        Math.abs(last.veil - next.veil) > 0.01;
      if (changed) {
        card.style.transform = `translate3d(0, ${next.translateY}px, 0) scale(${next.scale}) rotate(${next.rotation}deg)`;
        card.style.setProperty("--veil", String(next.veil));
        lastRef.current.set(i, next);
      }
    });

    busyRef.current = false;
  }, [
    itemStackDistance,
    stackPosition,
    rampDistance,
    scalePerDepth,
    minScale,
    veilPerDepth,
    maxVeil,
    maxDepth,
    rotationAmount,
    progress,
    parseLen,
  ]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const inner = scroller.querySelector(
      ".scroll-stack-inner"
    ) as HTMLElement | null;

    const collect = () => {
      const cards = Array.from(
        scroller.querySelectorAll(".scroll-stack-card")
      ) as HTMLElement[];
      cardsRef.current = cards;
      cards.forEach((card, i) => {
        card.style.marginBottom =
          i < cards.length - 1 ? `${itemDistance}px` : "";
        card.style.willChange = "transform";
        card.style.transformOrigin = "top center";
        card.style.backfaceVisibility = "hidden";
      });
    };

    collect();

    const lenis = new Lenis({
      wrapper: scroller,
      content: inner ?? undefined,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      gestureOrientation: "vertical",
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075,
    });
    lenis.on("scroll", updateCardTransforms);
    const raf = (time: number) => {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);
    lenisRef.current = lenis;

    updateCardTransforms();

    // Re-measure when a card is added or removed, and briefly transition the
    // remaining cards so they glide up into the gap.
    let mo: MutationObserver | undefined;
    if (inner) {
      mo = new MutationObserver(() => {
        collect();
        lastRef.current.clear();
        cardsRef.current.forEach((c) => {
          c.style.transition =
            "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease";
        });
        updateCardTransforms();
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = window.setTimeout(() => {
          cardsRef.current.forEach((c) => (c.style.transition = ""));
        }, 320);
      });
      mo.observe(inner, { childList: true });
    }

    return () => {
      mo?.disconnect();
      window.clearTimeout(settleTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      cardsRef.current = [];
      lastRef.current.clear();
      busyRef.current = false;
    };
  }, [itemDistance, updateCardTransforms]);

  return (
    <div
      ref={scrollerRef}
      className={`scroll-stack-scroller ${className}`.trim()}
    >
      <div className="scroll-stack-inner">{children}</div>
    </div>
  );
}
