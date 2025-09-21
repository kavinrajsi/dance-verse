// src/app/entries/page.js
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./entries.module.scss";

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, recent, popular
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      
      // Try main API first (works in production with Vercel Blob)
      let response = await fetch("/api/entries");
      let data = await response.json();
      
      // If main API fails and we're in development, try local API
      if (!response.ok && process.env.NODE_ENV === 'development') {
        console.log("Main API failed, trying local API for development");
        response = await fetch("/api/entries-local");
        data = await response.json();
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch entries");
      }
      
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "recent") {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return matchesSearch && new Date(entry.timestamp) > oneDayAgo;
    }
    
    return matchesSearch;
  });

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Entries</h2>
          <p>{error}</p>
          <button onClick={fetchEntries} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Dance Entries</h1>
          <p className={styles.subtitle}>
            Discover amazing dance performances from talented creators
          </p>
        </div>
        
        <Link href="/" className={styles.backBtn}>
          ← Back to Home
        </Link>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by name or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
            onClick={() => setFilter("all")}
          >
            All Entries ({entries.length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "recent" ? styles.active : ""}`}
            onClick={() => setFilter("recent")}
          >
            Recent (24h)
          </button>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎭</div>
          <h3>No entries found</h3>
          <p>
            {searchTerm 
              ? `No entries match "${searchTerm}"`
              : "No dance entries have been submitted yet."
            }
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredEntries.map((entry, index) => (
            <article key={index} className={styles.card}>
              <div className={styles.videoContainer}>
                {entry.url ? (
                  <video
                    className={styles.video}
                    controls
                    preload="metadata"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error("Video load error:", e);
                      // Fallback to placeholder on error
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  >
                    <source src={entry.url} type={entry.type || "video/mp4"} />
                    <source src={entry.downloadUrl} type={entry.type || "video/mp4"} />
                    Your browser does not support the video tag.
                  </video>
                ) : null}
                
                <div className={styles.placeholder} style={{ display: entry.url ? 'none' : 'flex' }}>
                  <span>🎬</span>
                  <p>{entry.url ? 'Loading video...' : 'Video not available'}</p>
                </div>
              </div>

              <div className={styles.content}>
                <h3 className={styles.entryTitle}>{entry.title}</h3>
                <p className={styles.entryName}>by {entry.name}</p>
                
                <div className={styles.metadata}>
                  <span className={styles.date}>
                    📅 {formatDate(entry.timestamp)}
                  </span>
                  {entry.size && (
                    <span className={styles.size}>
                      📁 {formatFileSize(entry.size)}
                    </span>
                  )}
                </div>

                {(entry.url || entry.downloadUrl) && (
                  <div className={styles.actions}>
                    <a
                      href={entry.url || entry.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.viewBtn}
                    >
                      View Full Video
                    </a>
                    {entry.downloadUrl && entry.downloadUrl !== entry.url && (
                      <a
                        href={entry.downloadUrl}
                        download={entry.filename}
                        className={styles.downloadBtn}
                      >
                        Download
                      </a>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <footer className={styles.pageFooter}>
        <p>
          Total Entries: <strong>{entries.length}</strong> | 
          Showing: <strong>{filteredEntries.length}</strong>
        </p>
      </footer>
    </div>
  );
}