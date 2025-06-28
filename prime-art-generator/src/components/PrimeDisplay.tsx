import React from 'react';

interface PrimeDisplayProps {
  primeNumber: string | null;
  primeSearchStatus: string; // e.g., "Idle", "Searching...", "Found", "Error"
  searchProgress?: { attempts: number; currentCandidate: string };
  error?: string | null;
  primeAsciiArt?: string[]; // The prime number formatted as ASCII art
}

const PrimeDisplay: React.FC<PrimeDisplayProps> = ({
  primeNumber,
  primeSearchStatus,
  searchProgress,
  error, // Error is now passed from App.tsx only when relevant
  primeAsciiArt,
}) => {
  if (primeSearchStatus === 'Idle' && !primeNumber && !error) {
    return null;
  }

  return (
    <div className="component-container">
      <h3>Prime Number Search</h3>
      <p className="status-text">Status: {primeSearchStatus}</p>

      {primeSearchStatus === 'Searching...' && searchProgress && (
        <div className="progress-details">
          <p>Attempts: {searchProgress.attempts}</p>
          <p className="progress-candidate">
            Trying: {searchProgress.currentCandidate}
          </p>
        </div>
      )}

      {error && ( // Error is already styled by .error-message in App.tsx if passed globally
        <p className="error-message" style={{marginTop: '10px'}}>Specific Search Error: {error}</p>
      )}

      {primeNumber && primeSearchStatus === 'Found' && (
        <div>
          <h4 style={{ color: '#28a745', marginTop: '15px' }}>Prime Found!</h4>
          {primeAsciiArt && primeAsciiArt.length > 0 ? (
            <div>
              <p style={{marginTop: '5px', marginBottom: '5px'}}>Prime represented as ASCII Art:</p>
              <pre className="prime-output-ascii">
                {primeAsciiArt.join('\n')}
              </pre>
            </div>
          ) : (
            <p className="prime-number-text">
              {primeNumber}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PrimeDisplay;
