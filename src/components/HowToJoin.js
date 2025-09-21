"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./HowToJoin.module.scss";
import UploadForm from "@/components/UploadForm";

const steps = [
  {
    step: "Step 1",
    title: "Upload",
    body: "Share your best dance video here",
    cta: { label: "Submit Now" },
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
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleSubmitClick = () => {
    setUploadOpen(true);
  };

  return (
    <>
      <section className={styles.howtojoin} id="how-to-join">
        <div className={`container ${styles.howtojoinWrapper}`}>
          <h2 className={styles.heading}>How to Join the DanceVerse</h2>
          <div className={styles.grid}>
            {steps.map((s, i) => (
              <article key={i} className={styles.card}>
                <div className={styles.topRow}>
                  <div>
                    <div className={styles.stepLabel}>{s.step}</div>
                    <h3 className={styles.cardTitle}>{s.title}</h3>
                  </div>
                  <div className={styles.icon} aria-hidden="true">
                    <Image
                      src={s.icon}
                      alt="" // decorative, so empty alt
                      width={48}
                      height={48}
                    />
                  </div>
                </div>

                <p className={styles.cardBody}>{s.body}</p>

                {s.cta && (
                  <div className={styles.ctaWrap}>
                    <button
                      className={styles.ctaBtn}
                      onClick={handleSubmitClick}
                    >
                      {s.cta.label}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Upload Form Modal */}
      {uploadOpen && <UploadForm onClose={() => setUploadOpen(false)} />}
    </>
  );
}
