"use client";

import { useRef } from "react";
import Image from "next/image";
import Slider from "react-slick";
import styles from "./WatchMoves.module.scss";

// Import slick carousel CSS
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/**
 * props.items: [{ src: string, alt?: string }]
 * (You can swap Image for <video> if you have video URLs)
 */
export default function WatchMoves({ items = [] }) {
  const sliderRef = useRef(null);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: false, // We'll use custom arrows
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  const goToPrev = () => {
    sliderRef.current?.slickPrev();
  };

  const goToNext = () => {
    sliderRef.current?.slickNext();
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
          onClick={goToPrev}
        >
          ←
        </button>

        <div className={styles.sliderContainer}>
          <Slider ref={sliderRef} {...settings}>
            {items.map((item, i) => (
              <div className={styles.slideWrapper} key={i}>
                <div className={styles.card}>
                  <Image
                    src={item.src}
                    alt={item.alt || `Move ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 25vw"
                    priority={i < 2}
                  />
                </div>
              </div>
            ))}
          </Slider>
        </div>

        <button
          className={`${styles.navBtn} ${styles.right}`}
          aria-label="Next"
          onClick={goToNext}
        >
          →
        </button>
      </div>
    </section>
  );
}