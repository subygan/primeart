import React, { useState } from 'react';
import './App.css'; // We will replace the content of this file
import ImageUpload from './components/ImageUpload';

import PrimeDisplay from './components/PrimeDisplay';
import { convertImageToAscii } from './utils/imageToAscii';
import { findPrimeByPerturbation } from './utils/primality';

function App() {

  const [primeNumber, setPrimeNumber] = useState<string | null>(null);
  const [primeSearchStatus, setPrimeSearchStatus] = useState<string>('Idle');
  const [searchProgress, setSearchProgress] = useState<{ attempts: number; currentCandidate: string } | undefined>(undefined);
  const [primeAsciiArt, setPrimeAsciiArt] = useState<string[] | undefined>(undefined);
  const [currentCandidateAscii, setCurrentCandidateAscii] = useState<string[] | undefined>(undefined);
  const [error, setError] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [asciiWidth, setAsciiWidth] = useState<number>(80);

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
    setCurrentCandidateAscii(undefined);
    setPrimeSearchStatus('1. Converting image...');
    setSearchProgress(undefined);

    try {
      const cols = asciiWidth;
      const scale = 0.43;
      const generatedAscii = await convertImageToAscii(image, cols, scale);

      if (generatedAscii.length === 0 || generatedAscii.join('').trim().length === 0) {
        throw new Error("Could not generate ASCII art. The image might be empty, transparent, or too small.");
      }


      setPrimeSearchStatus('2. Searching for prime...');
      const initialNumberStr = generatedAscii.join('');

            const foundPrime = await findPrimeByPerturbation(initialNumberStr, (progress) => {
        setSearchProgress(progress);

        // Convert the candidate string back to ASCII art for live display
        const candidateRows: string[] = [];
        let currentIndex = 0;
        for (const row of generatedAscii) { // `generatedAscii` is from the outer scope
            const rowLength = row.length;
            candidateRows.push(progress.currentCandidate.substring(currentIndex, currentIndex + rowLength));
            currentIndex += rowLength;
        }
        setCurrentCandidateAscii(candidateRows);
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

          <section className="status-section">
            <h3>2. Processing Status</h3>
            <div className="status-box">
              {error && <p className="error-message">{error}</p>}
              <p><strong>Status:</strong> {primeSearchStatus}</p>
              {isProcessing && <div className="spinner" />}
              {isProcessing && searchProgress && primeSearchStatus === '2. Searching for prime...' && (
                <div className="progress-details">
                  <p>Attempts: {searchProgress.attempts.toLocaleString()}</p>
                  <p>Candidate: <span>{searchProgress.currentCandidate.substring(0, 30)}...</span></p>
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
                currentCandidateAscii={currentCandidateAscii}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;