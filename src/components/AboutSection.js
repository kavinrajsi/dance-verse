import Image from "next/image";
import styles from "./AboutSection.module.scss";

export default function AboutSection() {
  return (
    <section className={styles.about} id="about">
      <div className={styles.imageWrap}>
        <Image
          src="/about.png" // replace with your actual image
          alt="DanceVerse graphic"
          fill
          className={styles.image}
          priority
        />
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>About Danceverse</h2>
        <p className={styles.text}>
          DanceVerse is India’s first digital-first dance competition, made for
          the creator generation. No stage, no boundaries, just pure talent. This
          show brings dancers from every corner of the country onto one stage. With
          legendary choreographers <strong>Nagendra Prasad</strong> and{" "}
          <strong>Gayathri Raghuramm</strong> on the jury, every step you take has
          a chance to go viral.
        </p>
      </div>
    </section>
  );
}
