"use client";

import { useRef, useState } from "react";
import styles from "./UploadForm.module.scss";

export default function UploadForm({ onClose }) {
  const dropRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);

  // Validate & set file
  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Only video files are allowed.");
      setFile(null);
      return;
    }

    const url = URL.createObjectURL(f);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (video.duration > 60) {
        setError("Video must be 1 minute or less.");
        setFile(null);
      } else {
        setError(null);
        setFile(f);
      }
    };
    video.src = url;
  };

  // Drag and drop
  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || error) {
      alert("Please upload a valid video (≤ 1 min).");
      return;
    }

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    fd.set("file", file);

    setUploading(true);
    setResultUrl(null);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResultUrl(data.url);
      alert("Upload complete!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button
          className={styles.close}
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className={styles.title}>Upload Your Dance Video</h2>
        <p className={styles.lead}>
          Share your performance with the world and be part of the digital
          dance revolution.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row3}>
            <div className={styles.field}>
              <label>Name / Dance Group Name</label>
              <input type="text" name="name" required />
            </div>
            <div className={styles.field}>
              <label>Email Address</label>
              <input type="email" name="email" required />
            </div>
            <div className={styles.field}>
              <label>Mobile Number</label>
              <input type="tel" name="phone" required />
            </div>
          </div>

          <div className={styles.field}>
            <label>Video Title</label>
            <input type="text" name="title" required />
          </div>

          <div
            ref={dropRef}
            className={styles.dropzone}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <div className={styles.dropContent}>
              <div className={styles.cloud}>☁️⬆️</div>
              <p>Drag &amp; drop your edited video here</p>

              <label className={styles.primaryBtn}>
                Upload Your Entry Now
                <input
                  type="file"
                  name="file"
                  accept="video/*"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  hidden
                />
              </label>

              {error && <div className={styles.error}>{error}</div>}
              {file && !error && (
                <div className={styles.fileNote}>Selected: {file.name}</div>
              )}
              {resultUrl && (
                <div className={styles.fileNote}>
                  Saved to:{" "}
                  <a href={resultUrl} target="_blank" rel="noreferrer">
                    {resultUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.submit}
              type="submit"
              disabled={!file || !!error || uploading}
            >
              {uploading ? "Uploading..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
