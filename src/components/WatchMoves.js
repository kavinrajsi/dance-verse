"use client";

import { useRef } from "react";
import Image from "next/image";
import styles from "./WatchMoves.module.scss";

/**
 * props.items: [{ src: string, alt?: string }]
 * (You can swap Image for <video> if you have video URLs)
 */
export default function WatchMoves({ items = [] }) {
  const trackRef = useRef(null);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(`.${styles.card}`);
    const amount = card ? card.clientWidth + 24 : 320; // card width + gap
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className={styles.wrap} aria-label="Watch the Moves">
      <header className={styles.header}>
        <h2 className={styles.title}>Watch the Moves</h2>
        <p className={styles.subtitle}>
          Catch every uploaded performance and relive the energy of the digital stage.
        </p>
      </header>

      <div className={styles.carousel}>
        <button
          className={`${styles.navBtn} ${styles.left}`}
          aria-label="Previous"
          onClick={() => scrollBy(-1)}
        >
          ←
        </button>

        <div className={styles.track} ref={trackRef}>
          {items.map((item, i) => (
            <div className={styles.card} key={i}>
              <Image
                src={item.src}
                alt={item.alt || `Move ${i + 1}`}
                fill
                sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 25vw"
                priority={i < 2}
              />
            </div>
          ))}
        </div>

        <button
          className={`${styles.navBtn} ${styles.right}`}
          aria-label="Next"
          onClick={() => scrollBy(1)}
        >
          →
        </button>
      </div>
    </section>
  );
}
