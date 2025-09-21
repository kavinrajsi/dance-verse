import Link from "next/link";
import Image from "next/image";
import styles from "./HowToJoin.module.scss";

const steps = [
  {
    step: "Step 1",
    title: "Upload",
    body: "Share your best dance video here",
    cta: { label: "Submit Now", href: "/upload" },
    icon: "/upload.svg", // replace with SVG if you like
  },
  {
    step: "Step 2",
    title: "Get Seen",
    body: "Our expert jury watches every move",
    icon: "/sceen.svg",
  },
  {
    step: "Step 3",
    title: "Shine Online",
    body: "Get a chance to participate in the first-ever digital dance show.",
    icon: "/shine.svg",
  },
];

export default function HowToJoin() {
  return (
    <section className={styles.section} id="how-to-join">
      <h2 className={styles.heading}>How to Join the DanceVerse</h2>

      <div className={styles.grid}>
        {steps.map((s, i) => (
          <article key={i} className={styles.card}>
            <div className={styles.topRow}>
              <div className={styles.stepLabel}>{s.step}</div>
              <div className={styles.icon} aria-hidden="true">
                               <Image
                  src={s.icon}
                  alt="" // decorative, so empty alt
                  width={48}
                  height={48}
                />
              </div>
            </div>

            <h3 className={styles.cardTitle}>{s.title}</h3>
            <p className={styles.cardBody}>{s.body}</p>

            {s.cta && (
              <div className={styles.ctaWrap}>
                <Link className={styles.ctaBtn} href={s.cta.href}>
                  {s.cta.label}
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
