import Image from "next/image";
import styles from "./PrizeSection.module.scss";

const prizes = [
  {
    title: "Group dance",
    img: "/group-dance.png",
    winner: "₹ 25,000",
    runnerUp: "₹ 15,000",
  },
  {
    title: "Duet dance",
    img: "/duet-dance.png",
    winner: "₹ 15,000",
    runnerUp: "₹ 7,000",
  },
  {
    title: "Solo dance",
    img: "/solo-dance.png",
    winner: "₹ 10,000",
    runnerUp: "₹ 5,000",
  },
];

export default function PrizeSection() {
  return (
    <section className={styles.prizeSection} id="rewards">
      <div className={`container ${styles.prizeSectionWrapper}`}>
        <div className={styles.grid}>
          {prizes.map((item, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.bg}>
                <Image
                  src={item.img}
                  alt={item.title}
                  width={400}
                  height={363}
                  className={styles.image}
                  priority={i === 0}
                />
              </div>
              <div className={styles.detailsContent}>
              <h3 className={styles.title}>{item.title}</h3>
              <div className={styles.details}>
                <p>
                  <strong>Winners - </strong>
                  {item.winner}
                </p>
                <p>
                  <strong>Runner Up - </strong>
                  {item.runnerUp}
                </p>
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
