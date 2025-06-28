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

// Cache for primality test results
const primeCache = new Map<bigint, boolean>();
let primalityTestTries = 0;

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
 * Generates a random BigInt within a given range [min, max].
 * This is a simplified, non-cryptographically secure implementation suitable for Miller-Rabin.
 */
function getRandomBigInt(min: bigint, max: bigint): bigint {
  if (min >= max) {
    return min;
  }
  const range = max - min + ONE;
  const bitLength = range.toString(2).length;

  let randomBigInt;
  do {
    let randomBits = '0b';
    for (let i = 0; i < bitLength; i++) {
      randomBits += Math.random() < 0.5 ? '0' : '1';
    }
    randomBigInt = BigInt(randomBits);
  } while (randomBigInt >= range);

  return randomBigInt + min;
}

/**
 * Miller-Rabin primality test.
 * A return value of false means n is certainly not prime.
 * A return value of true means n is very likely a prime.
 * @param n The number to test for primality.
 * @param k The number of trials (iterations). Higher k means more accuracy.
 */
export function isPrime(n: bigint, k: number = 8): boolean {
  if (primeCache.has(n)) {
    return primeCache.get(n)!;
  }

  primalityTestTries++;
  // console.log(`Primality test tries: ${primalityTestTries}`);

  let result: boolean;

  if (n <= ONE) result = false;
  else if (n <= THREE) result = true;
  else if (n % TWO === ZERO || n % THREE === ZERO) result = false;
  else if (n === FIVE || n === SEVEN) result = true;
  else if (n === FOUR || n === SIX || n === EIGHT || n === NINE) result = false;
  else {
    let s = ZERO;
    let d = n - ONE;
    while (d % TWO === ZERO) {
      d /= TWO;
      s++;
    }

    let isComposite = false;
    for (let i = 0; i < k; i++) {
      const a = getRandomBigInt(TWO, n - TWO);
      if (trialComposite(a, d, n, s)) {
        isComposite = true;
        break;
      }
    }
    result = !isComposite;
  }

  primeCache.set(n, result);
  return result;
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
 * Finds a prime number by perturbing the initial number string.
 * @param initialNumberStr The starting number as a string.
 * @param onProgress Callback to report progress.
 * @returns A prime number string.
 */
export async function findPrimeByPerturbation(
  initialNumberStr: string,
  customDigits: string,
  onProgress: (progress: { attempts: number; currentCandidate: string; charIndex?: number }) => void
): Promise<string> {
  let attempts = 0;

  // First, check if the original number is prime.
  const originalCandidate = BigInt(initialNumberStr);
  if (isPrime(originalCandidate)) {
    console.log(`Original number is prime!`);
    onProgress({ attempts: 1, currentCandidate: initialNumberStr });
    return initialNumberStr;
  }

  while (true) {
    attempts++;

    // Perturb 1-2 digits from the original string
    const numDigitsToChange = 1 + Math.floor(Math.random() * 2);
    let newNumStrArr = initialNumberStr.split('');
    let lastChangedIndex = -1;
    for (let i = 0; i < numDigitsToChange; i++) {
      const randomIndex = Math.floor(Math.random() * newNumStrArr.length);
      lastChangedIndex = randomIndex;

      let newDigit: string;
      if (randomIndex === 0 && newNumStrArr.length > 1) {
        const nonZeroDigits = customDigits.replace('0', '');
        if (nonZeroDigits.length > 0) {
          newDigit = nonZeroDigits[Math.floor(Math.random() * nonZeroDigits.length)];
        } else {
          newDigit = '0'; // Only '0' was provided
        }
      } else {
        newDigit = customDigits[Math.floor(Math.random() * customDigits.length)];
      }
      newNumStrArr[randomIndex] = newDigit;
    }
    const numStr = newNumStrArr.join('');
    const candidate = BigInt(numStr);

    if (isPrime(candidate)) {
      console.log(`Found prime after ${attempts} attempts.`);
      onProgress({ attempts, currentCandidate: numStr, charIndex: lastChangedIndex });
      return numStr;
    }

    // Report progress more frequently for a "real-time" feel.
    if (attempts % 20 === 0) { // Update every 20 attempts
      onProgress({ attempts, currentCandidate: numStr, charIndex: lastChangedIndex });
      await new Promise(resolve => setTimeout(resolve, 0)); // Yield to the event loop
    }
  }
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
    await new Promise(resolve => setTimeout(resolve, 0)); // For very tight loops
  }
  return candidateStr;
}
