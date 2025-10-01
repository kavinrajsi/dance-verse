"use client";

import { useRef } from "react";
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
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
           centerMode: true,
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const goToPrev = () => {
    sliderRef.current?.slickPrev();
  };

  const goToNext = () => {
    sliderRef.current?.slickNext();
  };

  return (
    <section className={styles["watch-moves"]} id="watch-moves" aria-label="Watch the Moves">
      <div className="container">
        <header className={styles["watch-moves__header"]}>
          <div>
            <h2 className={styles["watch-moves__title"]}>Watch the Moves</h2>
            <p className={styles["watch-moves__subtitle"]}>
              Catch every uploaded performance and relive the energy of the digital stage.
            </p>
          </div>

          <div>
            <button
              className={`${styles["watch-moves__nav-btn"]} ${styles["watch-moves__nav-btn--left"]}`}
              aria-label="Previous"
              onClick={goToPrev}
            >
              {/* left arrow svg */}
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 40 40">
                <rect width="40" height="40" fill="#F5F3F4" rx="20" />
                <path
                  fill="#7729AA"
                  fillRule="evenodd"
                  d="M30 20a.66.66 0 0 0-.199-.471.685.685 0 0 0-.48-.196H13.319l4.27-4.194a.665.665 0 0 0 .148-.727.666.666 0 0 0-.368-.361.691.691 0 0 0-.74.144L11.2 19.528A.667.667 0 0 0 11 20a.657.657 0 0 0 .2.472l5.428 5.332a.679.679 0 0 0 .48.196.691.691 0 0 0 .48-.195.666.666 0 0 0 .2-.472.656.656 0 0 0-.2-.472l-4.27-4.194H29.32c.18 0 .353-.07.48-.196A.66.66 0 0 0 30 20Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              className={`${styles["watch-moves__nav-btn"]} ${styles["watch-moves__nav-btn--right"]}`}
              aria-label="Next"
              onClick={goToNext}
            >
              {/* right arrow svg */}
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 40 40">
                <rect width="40" height="40" fill="#F5F3F4" rx="20" transform="matrix(-1 0 0 1 40 0)" />
                <path
                  fill="#7729AA"
                  fillRule="evenodd"
                  d="M10 20a.66.66 0 0 1 .199-.471.685.685 0 0 1 .48-.196h16.003l-4.27-4.194a.665.665 0 0 1-.148-.727.666.666 0 0 1 .368-.361.691.691 0 0 1 .74.144l5.429 5.333A.667.667 0 0 1 29 20a.657.657 0 0 1-.2.472l-5.428 5.332a.679.679 0 0 1-.48.196.691.691 0 0 1-.48-.195.666.666 0 0 1-.2-.472.656.656 0 0 1 .2-.472l4.27-4.194H10.68a.685.685 0 0 1-.48-.196A.66.66 0 0 1 10 20Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className={styles["watch-moves__carousel"]}>
          <div className={styles["watch-moves__slider-container"]}>
            <Slider ref={sliderRef} {...settings}>
              {items.map((item, i) => (
                <div className={styles["watch-moves__slide-wrapper"]} key={i}>
                  <div className={styles["watch-moves__card"]}>
                    <video
                      autoPlay={true}
                      className={styles["watch-moves__media"]}
                      src={item.src}
                      poster={item.poster}
                      controls={false}
                      muted={true}
                      loop={true}
                      playsInline={true}
                      preload={"metadata"}
                      onPlay={() => sliderRef.current?.slickPause()}
                      onPause={() => sliderRef.current?.slickPlay()}
                    />
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </div>
    </section>
  );
}
