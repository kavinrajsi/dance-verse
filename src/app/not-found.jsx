import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main style={styles.container}>
      <Image
        src="/logo.svg" // replace with your logo path
        alt="DanceVerse Logo"
        width={123}
        height={80}
        priority
      />
      <h1 style={styles.heading}>404</h1>
      <h2 style={styles.subheading}>Page Not Found</h2>
      <p style={styles.text}>
        Sorry, the page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link href="/" style={styles.button}>
        Go Home
      </Link>
    </main>
  );
}

const styles = {
  container: {
    color: "#fff",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "1rem",
  },
  heading: {
    fontSize: "4rem",
    fontWeight: "bold",
    margin: "1rem 0 0.5rem",
  },
  subheading: {
    fontSize: "1.5rem",
    fontWeight: "600",
    margin: "0.5rem 0",
  },
  text: {
    maxWidth: "400px",
    margin: "1rem 0",
    lineHeight: "normal",
    color: "#fff",
  },
  button: {
    border: 0,
    padding: "12px 40px",
    background: "#7729aa",
    borderRadius: "8px",
    fontFamily: "var(--font-gamepaused)",
    fontStyle: "normal",
    fontWeight: 400,
    fontSize: "20px",
    lineHeight: "22px",
    color: "#ffffff",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    marginTop: "1rem",
  },
};
