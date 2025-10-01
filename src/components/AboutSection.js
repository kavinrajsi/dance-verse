import Image from "next/image";
import styles from "./AboutSection.module.scss";

export default function AboutSection() {
  return (
    <section className={styles.about} id="about">
      <div className={`container ${styles.about__wrapper}`}>
        <div className={styles["about-moves__card"]}>
          <video
            autoPlay={true}
            className={styles["about-moves__media"]}
            src="/video/about.mp4"
            poster="/video/about.png"
            controls={false}
            muted={true}
            loop={true}
            playsInline={true}
            preload={"metadata"}
          />
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>About Danceverse</h2>
          <p className={styles.text}>
            DanceVerse is India’s first digital-first dance competition, made
            for the creator generation. No stage, no boundaries, just pure
            talent. This show brings dancers from every corner of the country
            onto one stage. With legendary choreographers Nagendra Prasad and
            Gayathri Raghuramm on the jury, every step you take has a chance to
            go viral.
          </p>
        </div>
      </div>
    </section>
  );
}
