import React from 'react';

interface AsciiDisplayProps {
  asciiArt: string[]; // Array of strings, each representing a row
}

const AsciiDisplay: React.FC<AsciiDisplayProps> = ({ asciiArt }) => {
  if (!asciiArt || asciiArt.length === 0) {
    return null;
  }

  return (
    <div className="component-container">
      <h3>Generated ASCII Art</h3>
      <pre className="ascii-output">
        {asciiArt.join('\n')}
      </pre>
    </div>
  );
};

export default AsciiDisplay;
