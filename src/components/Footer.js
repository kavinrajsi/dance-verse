import Link from "next/link";
import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms and Conditions</Link>
        <Link href="/contact">Contact</Link>
      </div>
      <div className={styles.copy}>
        &copy; Dance Verse All Rights Reserved
      </div>
    </footer>
  );
}
