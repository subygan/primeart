import React, { useState, useEffect } from 'react';
import './App.css'; // We will replace the content of this file
import ImageUpload from './components/ImageUpload';

import PrimeDisplay from './components/PrimeDisplay';
import { convertImageToAscii } from './utils/imageToAscii';
import { findPrimeByPerturbation } from './utils/primality';

function App() {

  const [primeNumber, setPrimeNumber] = useState<string | null>(null);
  const [primeSearchStatus, setPrimeSearchStatus] = useState<string>('Idle');
  const [searchProgress, setSearchProgress] = useState<{ attempts: number; currentCandidate: string; charIndex?: number } | undefined>(undefined);
  const [primeAsciiArt, setPrimeAsciiArt] = useState<string[] | undefined>(undefined);
  const [candidateAscii, setCandidateAscii] = useState<string[] | null>(null);
  const [estimatedTries, setEstimatedTries] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [asciiWidth, setAsciiWidth] = useState<number>(80);
  const [customDigits, setCustomDigits] = useState<string>('0123456789');

  function formatDuration(ms: number): string {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `~${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `~${minutes}m ${seconds}s`;
    }
    if (totalSeconds > 10) {
        return `~${totalSeconds}s`;
    }
    if (totalSeconds > 0) {
        return `< 10s`;
    }
    return `a few moments`;
  }

  useEffect(() => {
    if (isProcessing && searchProgress && searchStartTime && estimatedTries) {
        const elapsedTimeMs = Date.now() - searchStartTime;
        const attempts = searchProgress.attempts;
        if (attempts > 0) {
            const timePerAttempt = elapsedTimeMs / attempts;
            const remainingAttempts = estimatedTries - attempts;
            if (remainingAttempts > 0) {
                const remainingTimeMs = remainingAttempts * timePerAttempt;
                setEstimatedTime(formatDuration(remainingTimeMs));
            } else {
                setEstimatedTime("Finishing up...");
            }
        }
    }
  }, [searchProgress, isProcessing, searchStartTime, estimatedTries]);


  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setPrimeNumber(null);
    setPrimeAsciiArt(undefined);
    setPrimeSearchStatus('Idle');
    setIsProcessing(false);
  };

  const handleImageUpload = async (image: HTMLImageElement) => {
    // Reset state for a new run
    setIsProcessing(true);
    setError('');
    setPrimeNumber(null);
    setPrimeAsciiArt(undefined);
    setCandidateAscii(null);
    setEstimatedTries(null);
    setEstimatedTime(null);
    setPrimeSearchStatus('1. Converting image...');
    setSearchProgress(undefined);

    try {
      const cols = asciiWidth;
      const scale = 0.43;
      const generatedAscii = await convertImageToAscii(image, cols, scale, customDigits);

      if (generatedAscii.length === 0 || generatedAscii.join('').trim().length === 0) {
        throw new Error("Could not generate ASCII art. The image might be empty, transparent, or too small.");
      }


      setPrimeSearchStatus('2. Searching for prime...');
      const initialNumberStr = generatedAscii.join('');

      const d = initialNumberStr.length;
      const estimated = Math.max(1, Math.round(1.15 * (d - 1)));
      setEstimatedTries(estimated);
      setSearchStartTime(Date.now());

            const foundPrime = await findPrimeByPerturbation(initialNumberStr, customDigits, (progress) => {
        setSearchProgress(progress);

        // Convert the candidate string back to ASCII art for live display
        const candidateRows: string[] = [];
        let currentIndex = 0;
        for (const row of generatedAscii) { // `generatedAscii` is from the outer scope
            const rowLength = row.length;
            candidateRows.push(progress.currentCandidate.substring(currentIndex, currentIndex + rowLength));
            currentIndex += rowLength;
        }
        setCandidateAscii(candidateRows);
      });

      setPrimeNumber(foundPrime);
      setPrimeSearchStatus('3. Found!');

      const primeRows: string[] = [];
      let currentIndex = 0;
      for (const row of generatedAscii) {
        const rowLength = row.length;
        primeRows.push(foundPrime.substring(currentIndex, currentIndex + rowLength));
        currentIndex += rowLength;
      }
      setPrimeAsciiArt(primeRows);

    } catch (e: any) {
      const errorMessage = e.message || 'An unexpected error occurred.';
      handleError(errorMessage); // Use handleError to consolidate state reset
      setPrimeSearchStatus('Error'); // Set status after resetting
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      {/* --- Left Control Panel --- */}
      <aside className="control-panel">
        <header className="panel-header">
          <h1>Prime Art</h1>
          <p>Turn any image into a prime number that looks like it.</p>
        </header>

        <main className="panel-content">
          <section className="control-section">
            <h3>1. Upload Image</h3>
            <ImageUpload onImageUpload={handleImageUpload} onError={handleError} />
          </section>

          <section className="control-section">
            <label htmlFor="width-slider" style={{ display: 'block', marginBottom: '5px' }}>
              ASCII Art Width: <strong>{asciiWidth}</strong>
            </label>
            <input
              type="range"
              id="width-slider"
              min="40"
              max="200"
              step="1"
              value={asciiWidth}
              onChange={(e) => setAsciiWidth(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </section>

          <section className="control-section">
            <label htmlFor="custom-digits-input" style={{ display: 'block', marginBottom: '5px' }}>
              Allowed Digits:
            </label>
            <input
              type="text"
              id="custom-digits-input"
              value={customDigits}
              onChange={(e) => {
                // Allow only unique digits
                const uniqueDigits = Array.from(new Set(e.target.value.replace(/[^0-9]/g, ''))).join('');
                setCustomDigits(uniqueDigits);
              }}
              placeholder="e.g., 0123456789"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
              The set of digits used to construct the prime number.
            </p>
          </section>

          <section className="status-section">
            <h3>2. Processing Status</h3>
            <div className="status-box">
              {error && <p className="error-message">{error}</p>}
              <p><strong>Status:</strong> {primeSearchStatus}</p>
              {isProcessing && <div className="spinner" />}
              {isProcessing && searchProgress && primeSearchStatus === '2. Searching for prime...' && (
                <div className="progress-details">
                  {estimatedTries ? (
                    <p>
                      Tries: {searchProgress.attempts.toLocaleString()} / {estimatedTries.toLocaleString()}
                    </p>
                  ) : (
                    <p>Attempts: {searchProgress.attempts.toLocaleString()}</p>
                  )}

                  {estimatedTime && <p>Est. Time Left: {estimatedTime}</p>}

                  {searchProgress.charIndex !== undefined && (
                    <p>
                      Testing digit at index: {searchProgress.charIndex}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="panel-footer">
          <p>Built with React & Number Theory</p>
        </footer>
      </aside>

      {/* --- Right Display Panel --- */}
      <main className="display-panel">
        {!isProcessing && !primeNumber && !error && (
          <div className="placeholder-container">
            <h2>Your Art Will Appear Here</h2>
            <p>Upload an image to see the prime number version.</p>
          </div>
        )}

        {(isProcessing || primeNumber) && (
          <div className="results-stack">
            <div className="result-card">
              <h4>Prime Number as ASCII Art</h4>
              <PrimeDisplay
                primeNumber={primeNumber}
                primeAsciiArt={primeAsciiArt}
                isProcessing={isProcessing}
                error={error}
                candidateAscii={candidateAscii}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;