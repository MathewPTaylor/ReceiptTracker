import { useState, useRef, useEffect, ChangeEvent, SyntheticEvent } from 'react';

interface UploadResponse {
  filename: string;
  content_type: string;
  size_bytes: number;
  message: string;
  ocr_text?: string;
}

export default function ImageCapture() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string>('');

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setError('');
    setResult(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(heic|heif|jpg|jpeg|png|webp)$/i.test(file.name);
    if (!isImage) {
      setError('Please select a valid image file.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleClear = (): void => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
  };

  const handleUpload = async (e: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('http://localhost:8000/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Upload failed (${res.status})`);
      }

      const data: UploadResponse = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '32px auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <h2 style={{ marginTop: 0 }}>Capture or Upload Image for OCR</h2>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          style={{
            flex: 1, minHeight: '48px', padding: '12px', background: '#2563eb',
            color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Take Photo
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          style={{
            flex: 1, minHeight: '48px', padding: '12px', background: '#f1f5f9',
            color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Choose File
        </button>
      </div>

      {previewUrl && selectedFile && (
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc' }}>
            <img
              src={previewUrl}
              alt="Selected preview"
              style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', display: 'block' }}
            />
            <div style={{ padding: '10px', fontSize: '13px', color: '#475569', borderTop: '1px solid #e2e8f0' }}>
              <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={uploading}
              style={{
                flex: 2, minHeight: '48px', background: uploading ? '#94a3b8' : '#16a34a',
                color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? 'Processing OCR...' : 'Run Gemini OCR'}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={uploading}
              style={{
                flex: 1, minHeight: '48px', background: '#fff', color: '#dc2626',
                border: '1px solid #fecaca', borderRadius: '8px', fontSize: '16px', cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </form>
      )}

      {error && (
        <div role="alert" style={{ marginTop: '16px', padding: '12px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '16px', padding: '14px', background: '#f0fdf4', color: '#166534', borderRadius: '8px', fontSize: '14px' }}>
          <strong>OCR Complete!</strong>
          <p style={{ margin: '6px 0 8px' }}>{result.message}</p>
          {result.ocr_text && (
            <div style={{ marginTop: '8px', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', whiteSpace: 'pre-wrap', color: '#0f172a', fontFamily: 'monospace', fontSize: '13px', maxHeight: '200px', overflowY: 'auto' }}>
              {result.ocr_text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}