"use client";

import { useRef, useState, useEffect } from "react";
import styles from "./UploadForm.module.scss";

export default function UploadForm({ onClose }) {
  const dropRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    form: "" // General form error
  });
  
  // Reference to ongoing upload
  const uploadPromiseRef = useRef(null);

  // Auto-close when upload is successful
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess, onClose]);

  // File size limit (50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate individual field
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "name":
        if (!value.trim()) {
          error = "Name is required";
        } else if (value.trim().length < 2) {
          error = "Name must be at least 2 characters";
        }
        break;
        
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
        
      case "phone":
        if (!value.trim()) {
          error = "Mobile number is required";
        } else if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(value.trim())) {
          error = "Please enter a valid mobile number";
        }
        break;
        
      case "title":
        if (!value.trim()) {
          error = "Video title is required";
        } else if (value.trim().length < 3) {
          error = "Title must be at least 3 characters";
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  // Handle input change and validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Validate all fields
  const validateForm = (formData) => {
    const newErrors = {};
    const fields = ['name', 'email', 'phone', 'title'];
    
    fields.forEach(field => {
      const value = formData.get(field) || "";
      newErrors[field] = validateField(field, value);
    });
    
    setErrors(newErrors);
    
    // Return true if no errors
    return Object.values(newErrors).every(error => error === "");
  };

  // Validate & set file
  const handleFile = (f) => {
    if (!f) return;
    
    if (!f.type.startsWith("video/")) {
      setError("Only video files are allowed.");
      setFile(null);
      return;
    }

    // Check file size
    if (f.size > MAX_FILE_SIZE) {
      setError(`File size (${formatFileSize(f.size)}) exceeds the 50MB limit.`);
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
    
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    
    // Clear previous form error
    setErrors(prev => ({ ...prev, form: "" }));
    
    // Validate form
    const isFormValid = validateForm(fd);
    
    if (!file || error) {
      setErrors(prev => ({ 
        ...prev, 
        form: "Please upload a valid video (≤ 1 min, ≤ 50MB)" 
      }));
      return;
    }
    
    if (!isFormValid) {
      setErrors(prev => ({ 
        ...prev, 
        form: "Please fix the errors above before submitting" 
      }));
      return;
    }

    fd.set("file", file);

    setUploading(true);
    setResultUrl(null);

    // Create upload promise and store reference
    const uploadPromise = fetch("/api/upload", { method: "POST", body: fd })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        return data;
      })
      .then((data) => {
        setResultUrl(data.url);
        setUploadSuccess(true);
        
        // Show browser notification if possible
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("DanceVerse Upload Complete!", {
            body: "Your dance video has been uploaded successfully!",
            icon: "/logo.svg" // You can use your logo here
          });
        }
        
        return data;
      })
      .catch((err) => {
        // Only show error if modal is still open
        if (!uploadSuccess) {
          setErrors(prev => ({ 
            ...prev, 
            form: err.message || "Upload failed. Please try again." 
          }));
        }
        console.error("Upload error:", err);
        throw err;
      })
      .finally(() => {
        setUploading(false);
        uploadPromiseRef.current = null;
      });

    // Store the promise reference
    uploadPromiseRef.current = uploadPromise;
  };

  // Handle modal close
  const handleClose = () => {
    if (uploading && uploadPromiseRef.current) {
      // Request notification permission if not already granted
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
      
      // Show a brief message that upload continues
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: system-ui, sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      notification.textContent = "Upload continuing in background...";
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
      
      // Upload will continue in background
      uploadPromiseRef.current.then((data) => {
        // Show success notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("DanceVerse Upload Complete!", {
            body: "Your dance video has been uploaded successfully!",
            icon: "/logo.svg"
          });
        } else {
          // Fallback: show another temporary notification
          const successNotification = document.createElement('div');
          successNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: system-ui, sans-serif;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          `;
          successNotification.textContent = "✅ Video uploaded successfully!";
          document.body.appendChild(successNotification);
          
          setTimeout(() => {
            if (document.body.contains(successNotification)) {
              document.body.removeChild(successNotification);
            }
          }, 5000);
        }
      }).catch((err) => {
        // Show error notification
        const errorNotification = document.createElement('div');
        errorNotification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f44336;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 10000;
          font-family: system-ui, sans-serif;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorNotification.textContent = "❌ Upload failed: " + err.message;
        document.body.appendChild(errorNotification);
        
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification);
          }
        }, 5000);
      });
    }
    
    // Close the modal
    onClose();
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {!uploadSuccess ? (
          <>
            <button
              className={styles.close}
              aria-label="Close"
              onClick={handleClose}
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
                  <input 
                    type="text" 
                    name="name" 
                    onChange={handleInputChange}
                    className={errors.name ? styles.inputError : ""}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>
                <div className={styles.field}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    onChange={handleInputChange}
                    className={errors.email ? styles.inputError : ""}
                  />
                  {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                </div>
                <div className={styles.field}>
                  <label>Mobile Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    onChange={handleInputChange}
                    className={errors.phone ? styles.inputError : ""}
                  />
                  {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                </div>
              </div>

              <div className={styles.field}>
                <label>Video Title</label>
                <input 
                  type="text" 
                  name="title" 
                  onChange={handleInputChange}
                  className={errors.title ? styles.inputError : ""}
                />
                {errors.title && <span className={styles.errorText}>{errors.title}</span>}
              </div>

              {/* General form error */}
              {errors.form && (
                <div className={styles.formError}>
                  {errors.form}
                </div>
              )}

              <div
                ref={dropRef}
                className={styles.dropzone}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                <div className={styles.dropContent}>
                  <div className={styles.cloud}>☁️⬆️</div>
                  <p>Drag &amp; drop your edited video here</p>
                  <p className={styles.requirements}>
                    Max file size: <strong>50MB</strong> | Max duration: <strong>1 minute</strong>
                  </p>

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
                    <div className={styles.fileNote}>
                      Selected: {file.name} ({formatFileSize(file.size)})
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
                {uploading && (
                  <p className={styles.uploadNote}>
                    Do not close the window
                    {/* You can close this window - upload will continue in background */}
                  </p>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className={styles.successScreen}>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.successTitle}>Successfully Uploaded!</h2>
            <p className={styles.successMessage}>
              Your video has been uploaded successfully. Thank you for being part of the DanceVerse!
            </p>
            <div className={styles.successFooter}>
              <p>This window will close automatically...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}