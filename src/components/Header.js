"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.scss";
import UploadForm from "@/components/UploadForm";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setUploadOpen(false);
      }
    };
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

  const handleRegisterClick = (e) => {
    e.preventDefault();
    setUploadOpen(true);
    setOpen(false); // Close mobile menu if open
  };

  return (
    <>
      <header className={styles.header}>
       <div className={`${styles.inner} container`}>
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
            <Link href="/#how-to-join">How to Join</Link>
            <Link href="/#about">Who we are</Link>
            <Link href="/#rewards">Rewards</Link>
            <Link href="/#watch-moves">Watch the moves</Link>
            <Link href="#" className={styles.ctaDesktop} onClick={handleRegisterClick}>Register here</Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            ref={btnRef}
              className={`${styles.burger} ${open ? styles.burgerActive : ""}`}
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
          className={`container ${styles.mobileWrap} ${open ? styles.open : ""}`}
          aria-hidden={!open}
        >
          <div
            className={styles.mobilePanel}
            id="mobile-menu"
            ref={panelRef}
            role="menu"
          >
            <nav className={`container ${styles.navMobile}`}>
              <Link href="/#how-to-join" role="menuitem" onClick={closeAndGo}>
                How to Join
              </Link>
              <Link href="/#about" role="menuitem" onClick={closeAndGo}>
                Who we are
              </Link>
              <Link href="/#rewards" role="menuitem" onClick={closeAndGo}>
                Rewards
              </Link>
              {/* <Link href="/#watch-moves" role="menuitem" onClick={closeAndGo}>
                Watch the moves
              </Link> */}
              <Link href="#"  role="menuitem" className={styles.ctaMobile} onClick={handleRegisterClick}>Register here</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Upload Form Modal */}
      {uploadOpen && <UploadForm onClose={() => setUploadOpen(false)} />}
    </>
  );
}