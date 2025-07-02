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
  const [initialAsciiArt, setInitialAsciiArt] = useState<string[] | null>(null);
  const [initialNumberStr, setInitialNumberStr] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const numberToAsciiArt = (numberStr: string, width: number): string[] => {
    const rows: string[] = [];
    let currentIndex = 0;
    while (currentIndex < numberStr.length) {
      rows.push(numberStr.substring(currentIndex, currentIndex + width));
      currentIndex += width;
    }
    return rows;
  };

  const setPrimeAsciiArtFromNumber = (primeStr: string, width: number) => {
    setPrimeAsciiArt(numberToAsciiArt(primeStr, width));
  };

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

  // Effect to update initial ASCII art when width changes
  useEffect(() => {
    if (initialNumberStr) {
      const art = numberToAsciiArt(initialNumberStr, asciiWidth);
      setInitialAsciiArt(art);
    }
  }, [initialNumberStr, asciiWidth]);

  // Effect to update the final prime's ASCII art when width changes
  useEffect(() => {
    if (primeNumber) {
      setPrimeAsciiArtFromNumber(primeNumber, asciiWidth);
    }
  }, [primeNumber, asciiWidth]);


  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setPrimeNumber(null);
    setPrimeAsciiArt(undefined);
    setPrimeSearchStatus('Idle');
    setIsProcessing(false);
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsProcessing(false);
      setPrimeSearchStatus('Search cancelled.');
    }
  };

  const handleImageUpload = async (image: HTMLImageElement) => {
    // Reset state for a new run
    setIsProcessing(true);
    setError('');
    setPrimeNumber(null);
    setPrimeAsciiArt(undefined);
    setInitialAsciiArt(null);
    setInitialNumberStr(null);
    setCandidateAscii(null);
    setEstimatedTries(null);
    setEstimatedTime(null);
    setPrimeSearchStatus(''); // Clear previous status
    setSearchProgress(undefined);

    // Use a timeout to ensure the UI updates before blocking the main thread
    setTimeout(async () => {
      try {
        setPrimeSearchStatus('1. Converting image...');
        const cols = asciiWidth;
        const scale = 0.43;
        const generatedAscii = await convertImageToAscii(image, cols, scale, customDigits);

        if (generatedAscii.length === 0 || generatedAscii.join('').trim().length === 0) {
          throw new Error("Could not generate ASCII art. The image might be empty, transparent, or too small.");
        }

        const numberStr = generatedAscii.join('');
        setInitialNumberStr(numberStr);
        setPrimeSearchStatus('Ready to find prime. Click "Make it Prime" to start.');

        const d = numberStr.length;
        const tries = Math.round(1.15 * (d - 1));
        setEstimatedTries(tries);

        setIsProcessing(false);
      } catch (e: any) {
        handleError(e.message || 'An unexpected error occurred during image processing.');
      }
    }, 50); // A small delay to allow the UI to update

    try {
      const cols = asciiWidth;
      const scale = 0.43;
      const generatedAscii = await convertImageToAscii(image, cols, scale, customDigits);

      if (generatedAscii.length === 0 || generatedAscii.join('').trim().length === 0) {
        throw new Error("Could not generate ASCII art. The image might be empty, transparent, or too small.");
      }

      const numberStr = generatedAscii.join('');
      setInitialNumberStr(numberStr);
      setPrimeSearchStatus('Ready to find prime. Click "Make it Prime" to start.');

      // Calculate estimated tries
      const d = numberStr.length;
      const tries = Math.round(1.15 * (d - 1));
      setEstimatedTries(tries);

      // Set isProcessing to false AFTER other states are set to prevent race conditions.
      setIsProcessing(false);

    } catch (e: any) {
      handleError(e.message || 'An unexpected error occurred during image processing.');
    }
  };

  const startPrimeSearch = () => {
    if (!initialNumberStr) {
      handleError('Cannot start search without an initial number.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    setIsProcessing(true);
    setPrimeSearchStatus('2. Searching for prime...');
    setSearchProgress(undefined);
    setCandidateAscii(null);
    setSearchStartTime(Date.now());

    // Defer the heavy computation to the next event loop tick to allow the UI to update first.
    setTimeout(async () => {
      try {
        const foundPrime = await findPrimeByPerturbation(
        initialNumberStr,
        customDigits,
        (progress) => {
          setSearchProgress(progress);
          if (progress.charIndex !== undefined) {
            const art = numberToAsciiArt(progress.currentCandidate, asciiWidth);
            setCandidateAscii(art);
          }
        },
        controller.signal
      );

      setPrimeNumber(foundPrime);
      setPrimeSearchStatus('Success! Found a prime.');
      setCandidateAscii(null);
      setIsProcessing(false);

    } catch (e: any) {
      if (e.name === 'AbortError') {
        // Cancellation is handled by handleCancel, so we can just log it.
        console.log('Prime search was cancelled.');
        } else {
          handleError(e.message || 'An unexpected error occurred during the prime search.');
        }
      }
    }, 0);
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
                // Allow up to 10 numeric characters, with repeats.
                const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                setCustomDigits(digits);
              }}
              placeholder="e.g., 0123456789"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
              The set of digits (up to 10) used to construct the prime number.
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
                  <div className="realtime-counter">
                    <span className="counter-value">{searchProgress.attempts.toLocaleString()}</span>
                    <span className="counter-label">Candidates Tested</span>
                  </div>
                  {estimatedTries && (
                    <p className="tries-progress">
                      (out of an estimated ~{estimatedTries.toLocaleString()})
                    </p>
                  )}
                  {estimatedTime && <p>Est. Time Left: {estimatedTime}</p>}
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
        {/* Show placeholder only when truly idle */}
        {!initialAsciiArt && !primeNumber && !isProcessing && !error && (
          <div className="placeholder-container">
            <h2>Your Art Will Appear Here</h2>
            <p>Upload an image to see the prime number version.</p>
          </div>
        )}

        {/* Show the display component if there's anything to show */}
        {(initialAsciiArt || primeNumber || isProcessing || error) && (
          <div className="results-stack">
            <PrimeDisplay
              primeNumber={primeNumber}
              primeAsciiArt={primeAsciiArt}
              isProcessing={isProcessing}
              error={error}
              candidateAscii={candidateAscii}
              initialAsciiArt={initialAsciiArt}
              onStartSearch={startPrimeSearch}
              onCancel={handleCancel}
              onCopy={() => {
                if (primeNumber) {
                  navigator.clipboard.writeText(primeNumber);
                  // Optionally, provide feedback to the user
                  const originalStatus = primeSearchStatus;
                  setPrimeSearchStatus('Copied to clipboard!');
                  setTimeout(() => setPrimeSearchStatus(originalStatus), 2000);
                }
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;