import React, { useState } from 'react';

// Make sure you have a CSS file for component-specific styles
// or add the new classes to your main App.css
import './PrimeDisplay.css'; 

interface PrimeDisplayProps {
  primeNumber: string | null;
  primeAsciiArt?: string[];
  isProcessing: boolean;
  error: string;
  currentCandidateAscii?: string[];
}

const PrimeDisplay = ({ primeNumber, primeAsciiArt, isProcessing, error, currentCandidateAscii }: PrimeDisplayProps) => {

  // 1. Live Processing State
  if (isProcessing && currentCandidateAscii) {
    return (
      <div className="live-view-container">
        <pre className="ascii-art-output">{currentCandidateAscii.join('\n')}</pre>
        <div className="status-overlay">
          <p>Checking for primality...</p>
        </div>
      </div>
    );
  }

  // 2. Initial Loading State (before first candidate)
  if (isProcessing && !primeNumber && !error) {
    return <div className="skeleton-loader" style={{ minHeight: '300px' }} />;
  }

  // 3. Error State
  if (error) {
    return (
      <div className="display-message error">
        <p><strong>Generation Failed</strong></p>
        <p>The process could not be completed. Please try a different image.</p>
      </div>
    );
  }

  // 4. Idle / Initial State
  if (!primeAsciiArt || !primeNumber) {
    return (
      <div className="display-message">
        <p>The prime number art will be displayed here once an image is processed.</p>
      </div>
    );
  }

  // 5. Success State
  return (
    <div className="prime-display-container">
      <pre className="ascii-art-output">{primeAsciiArt.join('\n')}</pre>
    </div>
  );
};

export default PrimeDisplay;