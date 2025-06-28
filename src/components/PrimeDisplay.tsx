import React, { useState } from 'react';

// Make sure you have a CSS file for component-specific styles
// or add the new classes to your main App.css
import './PrimeDisplay.css'; 

interface PrimeDisplayProps {
  primeNumber: string | null;
  primeAsciiArt?: string[];
  isProcessing: boolean;
  error: string;
}

const PrimeDisplay = ({ primeNumber, primeAsciiArt, isProcessing, error }: PrimeDisplayProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!primeNumber) return;

    try {
      await navigator.clipboard.writeText(primeNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Optionally show an error message to the user
    }
  };

  // 1. Loading State
  if (isProcessing && !primeNumber && !error) {
    return <div className="skeleton-loader" style={{ minHeight: '300px' }} />;
  }

  // 2. Error State
  if (error) {
    return (
      <div className="display-message error">
        <p><strong>Generation Failed</strong></p>
        <p>The process could not be completed. Please try a different image.</p>
      </div>
    );
  }

  // 3. Idle / Initial State
  if (!primeAsciiArt || !primeNumber) {
    return (
      <div className="display-message">
        <p>The prime number art will be displayed here once an image is processed.</p>
      </div>
    );
  }

  // 4. Success State
  return (
    <div className="prime-display-container">
      <pre className="ascii-art-output">{primeAsciiArt.join('\n')}</pre>
      
      <div className="prime-number-section">
        <div className="prime-number-header">
          <h5>The Resulting Prime Number</h5>
          <button onClick={handleCopy} className="copy-button" disabled={isCopied}>
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="prime-number-value">
          <code>{primeNumber}</code>
        </div>
      </div>
    </div>
  );
};

export default PrimeDisplay;