"use client";

import { useState } from "react";
import styles from "./StepInto.module.scss";
import UploadForm from "@/components/UploadForm";

export default function StepInto() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className={styles.stepinto}>
        <div className={styles.left}>
          <h2 className={styles.title}>Step Into the DanceVerse</h2>
          <p className={styles.subtitle}>
            Think you’ve got the moves? Show the world your talent, right from your
            screen.
          </p>
        </div>

        <div className={styles.right}>
          <p>
            Get ready to experience dance like never before! This groundbreaking
            digital dance show brings together top performers, innovative
            choreography, and immersive storytelling all streamed directly on
            YouTube.
          </p>
          <p>
            From electrifying solo acts to breathtaking group performances, the
            show celebrates creativity, passion, and the power of movement in a way
            that connects audiences worldwide. Don’t miss the chance to witness
            history in the making. Tune in, vibe with the rhythm, and be part of
            this first-of-its-kind global dance experience!
          </p>

          <button
            type="button"
            className={styles.btn}
            onClick={() => setOpen(true)}
          >
            Upload Your Entry Now
          </button>
        </div>
      </section>

      {open && <UploadForm onClose={() => setOpen(false)} />}
    </>
  );
}
