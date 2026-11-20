import { useState, useRef, useEffect, ChangeEvent, SyntheticEvent } from 'react';
import './styles/home.css';

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
    <div className="home-panel">
      <h2 className="home-title">Capture or Upload Image for OCR</h2>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="home-file-input"
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        className="home-file-input"
      />

      <div className="home-capture-actions">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="home-camera-button"
        >
          Take Photo
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="home-gallery-button"
        >
          Choose File
        </button>
      </div>

      {previewUrl && selectedFile && (
        <form onSubmit={handleUpload} className="home-upload-form">
          <div className="home-preview">
            <img
              src={previewUrl}
              alt="Selected preview"
              className="home-preview-image"
            />
            <div className="home-preview-details">
              <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          </div>

          <div className="home-upload-actions">
            <button
              type="submit"
              disabled={uploading}
              className="home-submit"
            >
              {uploading ? 'Processing OCR...' : 'Run Gemini OCR'}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={uploading}
              className="home-clear-button"
            >
              Clear
            </button>
          </div>
        </form>
      )}

      {error && (
        <div role="alert" className="home-error">
          {error}
        </div>
      )}

      {result && (
        <div className="home-result">
          <strong>OCR Complete!</strong>
          <p className="home-result-message">{result.message}</p>
          {result.ocr_text && (
            <div className="home-ocr-text">
              {result.ocr_text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}