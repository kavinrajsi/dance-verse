import Image from "next/image";
import styles from "./AboutSection.module.scss";

export default function AboutSection() {
  return (
    <section className={styles.about} id="about">
      <div className={`container ${styles.about__wrapper}`}>
      <div className={styles.imageWrap}>
        <Image
          src="/about.png" // replace with your actual image
          alt="DanceVerse graphic"
          width={400}
          height={498}
          className={styles.image}
          priority
        />
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>About Danceverse</h2>
        <p className={styles.text}>
          DanceVerse is India’s first digital-first dance competition, made for the creator generation. No stage, no boundaries, just pure talent. This show brings dancers from every corner of the country onto one stage. With legendary choreographers Nagendra Prasad and Gayathri Raghuramm on the jury, every step you take has a chance to go viral.
        </p>
      </div>
      </div>
    </section>
  );
}
