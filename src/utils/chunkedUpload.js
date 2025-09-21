// utils/chunkedUpload.js (Optional - for very large files)

export async function uploadFileInChunks(file, onProgress) {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = Date.now().toString();
  
  const chunks = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', i.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('uploadId', uploadId);
    formData.append('fileName', file.name);
    
    const response = await fetch('/api/upload-chunk', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Chunk ${i} upload failed`);
    }
    
    const result = await response.json();
    chunks.push(result);
    
    // Call progress callback
    if (onProgress) {
      onProgress((i + 1) / totalChunks * 100);
    }
  }
  
  // Finalize upload
  const finalizeResponse = await fetch('/api/finalize-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId, chunks, fileName: file.name })
  });
  
  if (!finalizeResponse.ok) {
    throw new Error('Failed to finalize upload');
  }
  
  return await finalizeResponse.json();
}