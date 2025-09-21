"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.scss";

export default function Header() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close when clicking outside panel (on overlay)
  useEffect(() => {
    const onClick = (e) => {
      if (!open) return;
      // If click is outside the panel and not the button, close
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  const closeAndGo = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="DanceVerse home">
          <Image
            src="/logo.svg" // replace with your logo
            alt="DanceVerse Logo"
            width={123}
            height={80}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.navDesktop} aria-label="Primary">
          <Link href="#how-to-join">How to Join</Link>
          <Link href="#about">Who we are</Link>
          <Link href="#prizes">Prices</Link>
          <Link href="#watch-moves">Watch the moves</Link>
        </nav>

        {/* Desktop CTA */}
        <Link href="/register" className={styles.ctaDesktop}>
          Register here
        </Link>

        {/* Mobile hamburger */}
        <button
          ref={btnRef}
          className={styles.burger}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`${styles.mobileWrap} ${open ? styles.open : ""}`}
        aria-hidden={!open}
      >
        <div
          className={styles.mobilePanel}
          id="mobile-menu"
          ref={panelRef}
          role="menu"
        >
          <nav className={styles.navMobile}>
            <Link href="#how-to-join" role="menuitem" onClick={closeAndGo}>
              How to Join
            </Link>
            <Link href="#about" role="menuitem" onClick={closeAndGo}>
              Who we are
            </Link>
            <Link href="#prizes" role="menuitem" onClick={closeAndGo}>
              Prices
            </Link>
            <Link href="#watch-moves" role="menuitem" onClick={closeAndGo}>
              Watch the moves
            </Link>
          </nav>

          <Link
            href="/register"
            className={styles.ctaMobile}
            role="menuitem"
            onClick={closeAndGo}
          >
            Register here
          </Link>
        </div>
      </div>
    </header>
  );
}
