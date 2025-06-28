import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ImageUpload from './components/ImageUpload';
import AsciiDisplay from './components/AsciiDisplay';
import PrimeDisplay from './components/PrimeDisplay';
import { convertImageToAscii } from './utils/imageToAscii';

const DEFAULT_COLS = 80;
const DEFAULT_SCALE = 0.43;

function App() {
  const [asciiArt, setAsciiArt] = useState<string[]>([]);
  const [asciiNumberString, setAsciiNumberString] = useState<string>('');

  const [primeNumber, setPrimeNumber] = useState<string | null>(null);
  const [primeAsciiArt, setPrimeAsciiArt] = useState<string[]>([]);
  const [primeSearchStatus, setPrimeSearchStatus] = useState<string>('Idle');
  const [searchProgress, setSearchProgress] = useState<{ attempts: number; currentCandidate: string } | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(process.env.PUBLIC_URL + '/primeWorker.js');

      workerRef.current.onmessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        setError(null); // Clear previous worker errors on new message
        if (type === 'progress') {
          setSearchProgress(payload);
        } else if (type === 'result') {
          setPrimeNumber(payload);
          setPrimeSearchStatus('Found');
          if (asciiArt.length > 0 && payload && asciiArt[0]?.length > 0) {
            const rowLength = asciiArt[0].length;
            const formattedPrime: string[] = [];
            for (let i = 0; i < payload.length; i += rowLength) {
              formattedPrime.push(payload.substring(i, i + rowLength));
            }
            setPrimeAsciiArt(formattedPrime);
          } else if (payload) {
            setPrimeAsciiArt([payload]);
          }
        } else if (type === 'error') {
          setError(`Worker error: ${payload.message || payload}`);
          setPrimeSearchStatus('Error');
        }
      };

      workerRef.current.onerror = (err: ErrorEvent) => {
        console.error("Worker error:", err);
        setError(`Unhandled worker error: ${err.message}. Check console for details.`);
        setPrimeSearchStatus('Error');
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [asciiArt]);

  const handleImageUpload = async (image: HTMLImageElement) => {
    setError(null);
    setAsciiArt([]);
    setAsciiNumberString('');
    setPrimeNumber(null);
    setPrimeAsciiArt([]);
    setPrimeSearchStatus('Idle');
    setSearchProgress(undefined);

    try {
      const art = await convertImageToAscii(image, DEFAULT_COLS, DEFAULT_SCALE);
      setAsciiArt(art);
      const numString = art.join('');
      if (numString.length === 0) {
        setError("Generated ASCII art is empty. Cannot proceed with prime search.");
        return;
      }
      if (BigInt(numString) === BigInt(0)) {
         setError("Generated ASCII art results in '0'. Cannot search for prime based on zero.");
         setAsciiNumberString('0'); // still set it for display purposes if needed
         return;
      }
      setAsciiNumberString(numString);
    } catch (err: any) {
      console.error("Error converting image to ASCII:", err);
      setError(err.message || "Failed to convert image to ASCII.");
    }
  };

  const handleStartPrimeSearch = () => {
    if (!asciiNumberString || BigInt(asciiNumberString) === BigInt(0)) {
      setError("Cannot start prime search: ASCII number is unavailable or zero.");
      return;
    }
    if (primeSearchStatus === 'Searching...') return;

    setError(null);
    setPrimeNumber(null);
    setPrimeAsciiArt([]);
    setPrimeSearchStatus('Searching...');
    setSearchProgress({ attempts: 0, currentCandidate: 'Initializing worker...' });

    if (workerRef.current) {
      workerRef.current.postMessage({ initialNumStr: asciiNumberString });
    } else {
      setError("Prime search worker is not available. It might have failed to initialize.");
      setPrimeSearchStatus("Error");
    }
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setAsciiArt([]);
    setAsciiNumberString('');
  };

  const isSearchDisabled = primeSearchStatus === 'Searching...' ||
                           asciiNumberString.length === 0 ||
                           (asciiNumberString.length > 0 && BigInt(asciiNumberString) === BigInt(0));

  return (
    <div className="App">
      <header className="App-header">
        <h1>Prime Art Generator</h1>
      </header>
      <main>
        <ImageUpload onImageUpload={handleImageUpload} onError={handleUploadError} />

        {error && <p className="error-message"><strong>Error:</strong> {error}</p>}

        {asciiArt.length > 0 && (
          <>
            <AsciiDisplay asciiArt={asciiArt} />
            <div style={{ textAlign: 'center', margin: '25px 0' }}>
              <button
                onClick={handleStartPrimeSearch}
                className="button-primary"
                disabled={isSearchDisabled}
              >
                {primeSearchStatus === 'Searching...' ? 'Searching for Prime...' : 'Find Prime from ASCII'}
              </button>
            </div>
          </>
        )}

        {(primeSearchStatus !== 'Idle' || primeNumber || (primeSearchStatus === 'Error' && error)) && (
            <PrimeDisplay
                primeNumber={primeNumber}
                primeSearchStatus={primeSearchStatus}
                searchProgress={searchProgress}
                error={primeSearchStatus === 'Error' ? error : null} // Pass down error only if current status is Error
                primeAsciiArt={primeAsciiArt}
            />
        )}
      </main>
      <footer className="app-footer">
        <p>Upload an image, see it converted to ASCII numbers, then find a large prime number derived from that art!</p>
        <p><small>Note: Primality testing for very large numbers can take a significant amount of time.</small></p>
      </footer>
    </div>
  );
}

export default App;
