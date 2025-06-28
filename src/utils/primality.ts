// BigInt constants
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const THREE = BigInt(3);
const FOUR = BigInt(4);
const FIVE = BigInt(5);
const SIX = BigInt(6);
const SEVEN = BigInt(7);
const EIGHT = BigInt(8);
const NINE = BigInt(9);

/**
 * Calculates (base^exponent) % modulus efficiently.
 */
function power(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let res = ONE;
  base %= modulus;
  while (exponent > ZERO) {
    if (exponent % TWO === ONE) res = (res * base) % modulus;
    base = (base * base) % modulus;
    exponent /= TWO;
  }
  return res;
}

/**
 * Miller-Rabin primality test.
 * A return value of false means n is certainly not prime.
 * A return value of true means n is very likely a prime.
 * @param n The number to test for primality.
 * @param k The number of trials (iterations). Higher k means more accuracy.
 */
export function isPrime(n: bigint, k: number = 8): boolean {
  if (n <= ONE) return false;
  if (n <= THREE) return true;
  if (n % TWO === ZERO || n % THREE === ZERO) return false;
  if (n === FIVE || n === SEVEN) return true;
  if (n === FOUR || n === SIX || n === EIGHT || n === NINE) return false;


  let s = ZERO;
  let d = n - ONE;
  while (d % TWO === ZERO) {
    d /= TWO;
    s++;
  }

  for (let i = 0; i < k; i++) {
    // Pick a random number 'a' in [2, n-2]
    // Secure random number generation is not strictly necessary for Miller-Rabin's probabilistic nature,
    // but good practice if available. For simplicity, Math.random is used.
    // Need to generate a BigInt random number.
    const a = BigInt(Math.floor(Math.random() * (Number(n - TWO) - 2 + 1))) + TWO;


    if (trialComposite(a, d, n, s)) {
      return false;
    }
  }

  return true;
}

/**
 * Helper function for Miller-Rabin test.
 * Returns true if n is composite, false otherwise.
 */
function trialComposite(a: bigint, d: bigint, n: bigint, s: bigint): boolean {
  let x = power(a, d, n);

  if (x === ONE || x === n - ONE) {
    return false; // n is probably prime
  }

  for (let r = ONE; r < s; r++) {
    x = power(x, TWO, n);
    if (x === n - ONE) {
      return false; // n is probably prime
    }
  }
  return true; // n is composite
}


/**
 * Mutates a number string by randomly changing some of its digits.
 * @param numStr The number string to mutate.
 * @param mutationCount The number of digits to change.
 */
export function mutate(numStr: string, mutationCount: number = 103): string {
  let numArr = numStr.split('');
  const len = numArr.length;

  if (len <= 1) return numStr; // Cannot mutate if too short

  // Ensure mutationCount is not greater than the length of the number string
  const actualMutationCount = Math.min(mutationCount, len);

  for (let k = 0; k < actualMutationCount; k++) {
    // Ensure pos is a valid index, not 0 to avoid changing the leading digit to 0 easily,
    // unless it's a single digit number (handled by len <=1).
    // And not the last digit if we want to preserve length roughly.
    // For this version, any position is fine.
    const pos = Math.floor(Math.random() * len);
    const newDigit = String(Math.floor(Math.random() * 10));

    // Avoid leading zero if the number has more than one digit
    if (pos === 0 && newDigit === '0' && len > 1) {
        numArr[pos] = String(Math.floor(Math.random() * 9) + 1); // 1-9
    } else {
        numArr[pos] = newDigit;
    }
  }
  return numArr.join('');
}

/**
 * Finds a prime number by mutating the input number string and testing for primality.
 * This function can be long-running and is intended to be used in a Web Worker.
 * @param initialNumStr The initial number string.
 * @param onProgress Optional callback to report progress (e.g., attempts, current number).
 */
export async function findPrime(
  initialNumStr: string,
  onProgress?: (progress: { attempts: number; currentCandidate: string }) => void
): Promise<string> {
  console.log("Starting prime search...");
  let attempts = 0;
  let foundPrime = false;
  let candidateStr = initialNumStr;

  if (initialNumStr.length === 0) {
      throw new Error("Initial number string cannot be empty.");
  }

  // Ensure the first candidate is not empty or just "0" if initialNumStr is "0"
  if (BigInt(candidateStr) === ZERO && candidateStr.length > 1) {
      candidateStr = mutate(candidateStr); // Mutate if it's like "000"
  } else if (candidateStr === "0") {
      // If it's just "0", mutation might not make it non-zero quickly.
      // Start with a small random number.
      candidateStr = String(Math.floor(Math.random() * 100) + 1);
  }


  while (!foundPrime) {
    attempts++;
    candidateStr = mutate(candidateStr);

    // Ensure candidateStr is not all zeros or otherwise invalid before BigInt conversion
    if (candidateStr.match(/^0+$/)) {
        candidateStr = String(Math.floor(Math.random() * 10) +1); // if "000", make it "1" or something small
    }


    if (onProgress) {
      onProgress({ attempts, currentCandidate: candidateStr });
    }

    // Throttle console logging for very fast loops if not using onProgress
    if (attempts % 100 === 0 && !onProgress) {
        console.log(`Attempt: ${attempts}, trying: ${candidateStr.substring(0, Math.min(20, candidateStr.length))}...`);
    }

    try {
        const candidateBigInt = BigInt(candidateStr);
        if (isPrime(candidateBigInt)) {
            foundPrime = true;
            console.log(`Prime found after ${attempts} attempts: ${candidateStr}`);
        }
    } catch (e) {
        console.error("Error converting candidate to BigInt or during primality test:", candidateStr, e);
        // If conversion fails, mutate again or handle error appropriately
        candidateStr = mutate(initialNumStr); // Reset to a mutation of the original
    }

    // Add a small delay to allow other operations if this is running on the main thread
    // (though it's intended for a worker)
    // await new Promise(resolve => setTimeout(resolve, 0)); // For very tight loops
  }
  return candidateStr;
}
