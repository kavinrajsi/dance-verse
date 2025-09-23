// src/components/UploadForm.js - Direct Supabase Upload with Progress
"use client";

import { useRef, useState, useEffect } from "react";
import styles from "./UploadForm.module.scss";

export default function UploadForm({ onClose }) {
  const dropRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Form validation errors
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    form: "",
  });

  const uploadPromiseRef = useRef(null);
  const startTimeRef = useRef(null);

  // Max file size (45MB)
  const MAX_FILE_SIZE = 45 * 1024 * 1024;
  const MAX_FILE_SIZE_DISPLAY = "45MB";

  // Auto-close when upload is successful
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess, onClose]);

  // Formatters
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Validation
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) error = "Name is required";
        else if (value.trim().length < 2) error = "Name must be at least 2 characters";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Please enter a valid email address";
        break;
      case "phone":
        if (!value.trim()) error = "Mobile number is required";
        else if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(value.trim())) error = "Please enter a valid mobile number";
        break;
      case "title":
        if (!value.trim()) error = "Video title is required";
        else if (value.trim().length < 3) error = "Title must be at least 3 characters";
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const validateForm = (formData) => {
    const newErrors = {};
    const fields = ["name", "email", "phone", "title"];
    fields.forEach((field) => {
      const value = formData.get(field) || "";
      newErrors[field] = validateField(field, value);
    });
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === "");
  };

  // DnD
  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  // Direct upload to Next API (/api/upload => Supabase)
  const uploadToAppRoute = async (formData) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      startTimeRef.current = Date.now();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);

          const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
          const uploadedBytes = e.loaded;
          const speed = uploadedBytes / elapsedTime;
          const remainingBytes = e.total - e.loaded;
          const estimatedSeconds = remainingBytes / (speed || 1);

          setUploadSpeed(speed);
          setEstimatedTime(estimatedSeconds);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error("Invalid response from server"));
          }
        } else {
          let msg = `Upload failed: ${xhr.status} ${xhr.statusText}`;
          try {
            const errRes = JSON.parse(xhr.responseText);
            msg = errRes.error || msg;
          } catch {}
          reject(new Error(msg));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error during upload. Please check your connection.")));
      xhr.addEventListener("timeout", () => reject(new Error("Upload timed out. Please try again.")));
      xhr.addEventListener("abort", () => reject(new Error("Upload was cancelled.")));

      xhr.open("POST", "/api/upload");
      xhr.timeout = 300000; // 5 mins
      xhr.send(formData);
    });
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    setErrors((prev) => ({ ...prev, form: "" }));
    const isFormValid = validateForm(formData);

    if (!file || error) {
      setErrors((prev) => ({
        ...prev,
        form: `Please upload a valid video (≤ 1 min, ≤ ${MAX_FILE_SIZE_DISPLAY})`,
      }));
      return;
    }

    if (!isFormValid) {
      setErrors((prev) => ({
        ...prev,
        form: "Please fix the errors above before submitting",
      }));
      return;
    }

    // Build multipart form for /api/upload (server does Supabase + DB)
    const apiFormData = new FormData();
    apiFormData.append("file", file);
    apiFormData.append("name", formData.get("name").trim());
    apiFormData.append("email", formData.get("email").trim());
    apiFormData.append("phone", formData.get("phone").trim());
    apiFormData.append("title", formData.get("title").trim());

    setUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);
    setEstimatedTime(0);

    const uploadPromise = uploadToAppRoute(apiFormData)
      .then((res) => {
        if (!res?.ok) throw new Error(res?.error || "Upload failed");
        setUploadSuccess(true);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("DanceVerse Upload Complete!", {
            body: "Your dance video has been uploaded successfully!",
            icon: "/logo.svg",
          });
        }
        return res;
      })
      .catch((err) => {
        console.error("Upload error:", err);
        if (!uploadSuccess) {
          setErrors((prev) => ({ ...prev, form: err.message || "Upload failed. Please try again." }));
        }
        throw err;
      })
      .finally(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadSpeed(0);
        setEstimatedTime(0);
        uploadPromiseRef.current = null;
      });

    uploadPromiseRef.current = uploadPromise;
  };

  // Close (background upload notice)
  const handleClose = () => {
    if (uploading && uploadPromiseRef.current) {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      const notification = document.createElement("div");
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
      setTimeout(() => {
        if (document.body.contains(notification)) document.body.removeChild(notification);
      }, 3000);

      uploadPromiseRef.current
        .then(() => {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("DanceVerse Upload Complete!", {
              body: "Your dance video has been uploaded successfully!",
              icon: "/logo.svg",
            });
          } else {
            const successNotification = document.createElement("div");
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
              if (document.body.contains(successNotification)) document.body.removeChild(successNotification);
            }, 5000);
          }
        })
        .catch((err) => {
          const errorNotification = document.createElement("div");
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
            if (document.body.contains(errorNotification)) document.body.removeChild(errorNotification);
          }, 5000);
        });
    }

    onClose();
  };

  // Validate & set file
  const handleFile = (f) => {
    if (!f) return;

    console.log("📄 File details:", {
      name: f.name,
      size: f.size,
      sizeFormatted: formatFileSize(f.size),
      type: f.type,
    });

    if (!f.type.startsWith("video/")) {
      setError("Only video files are allowed.");
      setFile(null);
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      setError(`File size (${formatFileSize(f.size)}) exceeds the ${MAX_FILE_SIZE_DISPLAY} limit.`);
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
                  {errors.name && (
                    <span className={styles.errorText}>{errors.name}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    onChange={handleInputChange}
                    className={errors.email ? styles.inputError : ""}
                  />
                  {errors.email && (
                    <span className={styles.errorText}>{errors.email}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    name="phone"
                    onChange={handleInputChange}
                    className={errors.phone ? styles.inputError : ""}
                  />
                  {errors.phone && (
                    <span className={styles.errorText}>{errors.phone}</span>
                  )}
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
                {errors.title && (
                  <span className={styles.errorText}>{errors.title}</span>
                )}
              </div>

              {/* General form error */}
              {errors.form && (
                <div className={styles.formError}>{errors.form}</div>
              )}

              <div
                ref={dropRef}
                className={styles.dropzone}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                <div className={styles.dropContent}>
                  <div className={styles.cloud}>
                    <svg
                      width="56"
                      height="51"
                      viewBox="0 0 56 51"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M48.7821 17.9521V17.4111C48.6668 12.8307 46.7442 8.48191 43.4338 5.31411C40.1235 2.14631 35.6943 0.416781 31.1133 0.503081C27.7015 0.475242 24.3544 1.4339 21.4748 3.2637C18.5951 5.09349 16.3055 7.71646 14.8816 10.817C10.8724 11.2642 7.16675 13.1675 4.46774 16.1657C1.76874 19.1639 0.264091 23.0484 0.239258 27.0825C0.243691 29.2199 0.669364 31.3355 1.49194 33.3083C2.31452 35.2812 3.51787 37.0725 5.03319 38.58C6.54851 40.0875 8.3461 41.2815 10.3232 42.0938C12.3003 42.9061 14.418 43.3208 16.5555 43.3141H22.896V39.9325H16.5555C13.2874 39.7557 10.2079 38.3465 7.93762 35.989C5.66738 33.6316 4.37522 30.5011 4.32161 27.2287C4.268 23.9563 5.45692 20.7852 7.64872 18.3546C9.84053 15.9241 12.8722 14.4148 16.1328 14.1309H17.2656L17.6545 13.0657C18.7032 10.3421 20.5626 8.00598 22.9817 6.37313C25.4007 4.74028 28.2627 3.88937 31.1809 3.93541C34.8652 3.84884 38.4345 5.22204 41.1107 7.75575C43.7869 10.2894 45.3532 13.7783 45.4682 17.4618C45.4915 17.9124 45.4915 18.3639 45.4682 18.8144L45.3329 20.0318L46.4319 20.5391C48.5575 21.4967 50.2885 23.1572 51.3335 25.2413C52.3785 27.3253 52.6738 29.7057 52.1697 31.982C51.6657 34.2582 50.393 36.2913 48.5658 37.7394C46.7386 39.1874 44.4685 39.9619 42.1373 39.9325H33.0408V43.3141H42.1373C45.1443 43.3357 48.0728 42.3546 50.46 40.526C52.8472 38.6973 54.5569 36.1252 55.3191 33.2163C56.0812 30.3074 55.8523 27.2274 54.6685 24.4631C53.4847 21.6988 51.4134 19.4078 48.7821 17.9521Z"
                        fill="white"
                      />
                      <path
                        d="M35.2051 32.9156C35.5424 32.921 35.8736 32.8253 36.156 32.641C36.4385 32.4566 36.6594 32.192 36.7903 31.8811C36.9212 31.5702 36.9562 31.2273 36.8906 30.8964C36.825 30.5655 36.662 30.2618 36.4225 30.0243L27.9685 21.5703L19.5145 30.0243C19.2375 30.3478 19.0927 30.7638 19.1092 31.1894C19.1256 31.6149 19.302 32.0186 19.6031 32.3197C19.9043 32.6208 20.3079 32.7972 20.7335 32.8136C21.159 32.8301 21.5751 32.6853 21.8985 32.4083L26.2777 28.0968V48.8091C26.2777 49.2575 26.4558 49.6876 26.7729 50.0047C27.09 50.3218 27.5201 50.4999 27.9685 50.4999C28.4169 50.4999 28.847 50.3218 29.1641 50.0047C29.4811 49.6876 29.6593 49.2575 29.6593 48.8091V28.0968L34.0046 32.4422C34.3265 32.7525 34.7581 32.9227 35.2051 32.9156Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <p>Drag &amp; drop your edited video here</p>
                  <p className={styles.requirements}>
                    Max file size: <strong>45MB</strong> | Max duration:{" "}
                    <strong>1 minute</strong>
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
              Your video has been uploaded successfully. Thank you for being
              part of the DanceVerse!
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
