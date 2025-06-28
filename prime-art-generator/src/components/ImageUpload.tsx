import React, { useState, ChangeEvent } from 'react';

interface ImageUploadProps {
  onImageUpload: (image: HTMLImageElement) => void;
  onError: (errorMessage: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, onError }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onError("Please upload a valid image file (PNG, JPG, GIF, etc.).");
        setImagePreview(null);
        setFileName('');
        event.target.value = ''; // Reset file input
        return;
      }

      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSizeInBytes) {
        onError(`File is too large. Maximum size is ${maxSizeInBytes / (1024 * 1024)}MB.`);
        setImagePreview(null);
        setFileName('');
        event.target.value = '';
        return;
      }

      onError("");
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        const img = new Image();
        img.onload = () => {
          onImageUpload(img);
        };
        img.onerror = () => {
          onError("Could not load image. The file might be corrupted or in an unsupported format.");
          setImagePreview(null);
          setFileName('');
        }
        if (reader.result) {
          img.src = reader.result as string;
        }
      };
      reader.onerror = () => {
        onError("Failed to read the file. Please try again.");
        setImagePreview(null);
        setFileName('');
      }
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setFileName('');
    }
  };

  return (
    <div className="component-container">
      <h3>Upload Image</h3>
      <label htmlFor="imageUploadInputCustom" className="button-primary" style={{display: 'inline-block', marginBottom: '10px', cursor: 'pointer'}}>
        Choose File
      </label>
      <input
        type="file"
        id="imageUploadInputCustom"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }} // Hide the default input
      />
      {fileName && <p style={{marginLeft: '10px', display: 'inline'}}>Selected: {fileName}</p>}

      {imagePreview && (
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <h4 style={{ marginBottom: '5px', color: '#555' }}>Preview:</h4>
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '250px',
              border: '2px solid #ddd',
              borderRadius: '4px',
              padding: '5px',
              backgroundColor: '#f9f9f9'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
