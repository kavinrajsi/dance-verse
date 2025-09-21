// src/app/admin/page.js
"use client";

import { useState, useEffect } from "react";
import styles from "./admin.module.scss";

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const authenticate = () => {
    if (apiKey.trim()) {
      localStorage.setItem('admin_api_key', apiKey);
      setAuthenticated(true);
      fetchSubmissions();
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_api_key');
    setAuthenticated(false);
    setApiKey("");
    setSubmissions([]);
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('admin_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setAuthenticated(true);
      fetchSubmissions();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const key = apiKey || localStorage.getItem('admin_api_key');
      
      const response = await fetch(`/api/admin/submissions?filter=${filter}&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch submissions");
      }
      
      setSubmissions(data.submissions || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      if (err.message === "Unauthorized") {
        setAuthenticated(false);
        localStorage.removeItem('admin_api_key');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the submission by ${name}?`)) {
      return;
    }

    try {
      const key = localStorage.getItem('admin_api_key');
      const response = await fetch(`/api/admin/submissions?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete submission");
      }
      
      // Remove from local state
      setSubmissions(prev => prev.filter(sub => sub.id !== id));
      alert("Submission deleted successfully");
    } catch (err) {
      alert(`Error deleting submission: ${err.message}`);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!authenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1>Admin Access</h1>
          <p>Enter your admin API key to access the dashboard</p>
          <div className={styles.loginForm}>
            <input
              type="password"
              placeholder="Admin API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && authenticate()}
            />
            <button onClick={authenticate} disabled={!apiKey.trim()}>
              Login
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>DanceVerse Admin Dashboard</h1>
        <button onClick={logout} className={styles.logoutBtn}>Logout</button>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={fetchSubmissions}>Search</button>
        </div>

        <div className={styles.filters}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Submissions</option>
            <option value="recent">Recent (24h)</option>
            <option value="week">This Week</option>
          </select>
          <button onClick={fetchSubmissions}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading submissions...</div>
      ) : error ? (
        <div className={styles.error}>
          <h3>Error: {error}</h3>
          <button onClick={fetchSubmissions}>Retry</button>
        </div>
      ) : (
        <div className={styles.submissionsTable}>
          <h2>Total Submissions: {submissions.length}</h2>
          
          {submissions.length === 0 ? (
            <div className={styles.empty}>No submissions found</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Title</th>
                  <th>File Size</th>
                  <th>Uploaded</th>
                  <th>Video</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>{submission.name}</td>
                    <td>{submission.email}</td>
                    <td>{submission.phone}</td>
                    <td>{submission.title}</td>
                    <td>{formatFileSize(submission.file_size)}</td>
                    <td>{formatDate(submission.created_at)}</td>
                    <td>
                      <a 
                        href={submission.blob_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.viewBtn}
                      >
                        View
                      </a>
                    </td>
                    <td>
                      <button 
                        onClick={() => deleteSubmission(submission.id, submission.name)}
                        className={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}