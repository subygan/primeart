import React from 'react';
import './PrimeDisplay.css';

export interface PrimeDisplayProps {
  primeNumber: string | null;
  primeAsciiArt: string[] | undefined;
  isProcessing: boolean;
  error: string;
  candidateAscii: string[] | null;
  initialAsciiArt: string[] | null;
  onStartSearch: () => void;
  onCancel: () => void;
  onCopy: () => void;
}

const PrimeDisplay = ({
  primeNumber,
  primeAsciiArt,
  isProcessing,
  error,
  candidateAscii,
  initialAsciiArt,
  onStartSearch,
  onCancel,
  onCopy,
}: PrimeDisplayProps) => {
  // 1. Error State
  if (error) {
    return (
      <div className="display-message error">
        <p><strong>An Error Occurred</strong></p>
        <p>{error}</p>
      </div>
    );
  }

  // 2. Success State: Prime has been found
  if (primeNumber && primeAsciiArt) {
    return (
      <div className="prime-display-container">
        <pre className="ascii-art-output">{primeAsciiArt.join('\n')}</pre>
        <div className="action-bar">
          <button onClick={onCopy} className="copy-button">
            Copy Prime Number
          </button>
        </div>
      </div>
    );
  }

  // 3. Intermediate State: Initial art is generated, waiting to start or in progress of prime search
  if (initialAsciiArt) {
    const displayArt = isProcessing && candidateAscii ? candidateAscii : initialAsciiArt;

    return (
      <div className="prime-display-container">
        <pre className="ascii-art-output">{displayArt.join('\n')}</pre>

        {isProcessing && (
          <div className="status-overlay">
            <div className="spinner" />
            <p>Searching for a prime...</p>
          </div>
        )}

        <div className="action-bar">
          {isProcessing ? (
            <button onClick={onCancel} className="cancel-button">
              Cancel Search
            </button>
          ) : (
            <button onClick={onStartSearch} className="start-button">
              Make it Prime
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Initial Loading State (when converting image)
  if (isProcessing) {
    return (
      <div className="display-message">
        <div className="spinner" />
        <p>Processing Image...</p>
      </div>
    );
  }

  return null;
};

export default PrimeDisplay;