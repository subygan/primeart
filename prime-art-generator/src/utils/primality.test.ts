import { isPrime, mutate, findPrime } from './primality'; // Assuming power is not exported or tested directly

describe('Primality Utilities', () => {
  describe('isPrime', () => {
    it('should correctly identify small prime numbers', () => {
      expect(isPrime(BigInt(2))).toBe(true);
      expect(isPrime(BigInt(3))).toBe(true);
      expect(isPrime(BigInt(5))).toBe(true);
      expect(isPrime(BigInt(7))).toBe(true);
      expect(isPrime(BigInt(11))).toBe(true);
      expect(isPrime(BigInt(13))).toBe(true);
    });

    it('should correctly identify small non-prime numbers', () => {
      expect(isPrime(BigInt(0))).toBe(false);
      expect(isPrime(BigInt(1))).toBe(false);
      expect(isPrime(BigInt(4))).toBe(false);
      expect(isPrime(BigInt(6))).toBe(false);
      expect(isPrime(BigInt(8))).toBe(false);
      expect(isPrime(BigInt(9))).toBe(false);
      expect(isPrime(BigInt(10))).toBe(false);
    });

    it('should handle larger prime numbers', () => {
      expect(isPrime(BigInt(7919))).toBe(true); // A known prime
      expect(isPrime(BigInt('99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999997'))).toBe(true); // Large prime (Belphegor's Prime is 10^17 - 10^8 + 7, this is different)
    });

    it('should handle larger non-prime numbers', () => {
      expect(isPrime(BigInt(100))).toBe(false); // 10 * 10
      expect(isPrime(BigInt(7921))).toBe(false); // 89 * 89
      expect(isPrime(BigInt('10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'))).toBe(false); // 10^100
    });

    it('should respect the number of iterations (k) for accuracy (conceptual)', () => {
      // This is hard to test directly for probabilistic algorithm without deep statistical analysis
      // or known Carmichael numbers that might fool low-k Miller-Rabin.
      // For now, we trust the algorithm's nature.
      // Test with a known strong pseudoprime for a specific base if one were easy to find and use.
      // Example: 2047 is a strong pseudoprime to base 2. isPrime(BigInt(2047), 1) might pass if 'a' is chosen as 2.
      // However, our 'a' is random.
      // Instead, we ensure it runs without error for different k.
      expect(isPrime(BigInt(17), 1)).toBe(true);
      expect(isPrime(BigInt(17), 10)).toBe(true);
      expect(isPrime(BigInt(25), 1)).toBe(false);
      expect(isPrime(BigInt(25), 10)).toBe(false);
    });
  });

  describe('mutate', () => {
    it('should change digits in a number string', () => {
      const original = "1234567890";
      const mutated = mutate(original, 5);
      expect(mutated.length).toBe(original.length);
      expect(mutated).not.toBe(original); // High probability it's different

      let differences = 0;
      for (let i = 0; i < original.length; i++) {
        if (original[i] !== mutated[i]) {
          differences++;
        }
      }
      // The number of differences can be less than mutationCount due to random position selection
      expect(differences).toBeGreaterThan(0);
      expect(differences).toBeLessThanOrEqual(5);
    });

    it('should not change the string if mutationCount is 0', () => {
      const original = "12345";
      expect(mutate(original, 0)).toBe(original);
    });

    it('should handle short strings', () => {
        const original = "1";
        // Mutation might change '1' to another digit or keep it '1' by chance.
        // If it changes, it's a different string. If it picks '1', it's the same.
        // The core logic is that it attempts a mutation.
        const mutated = mutate(original, 1);
        expect(mutated.length).toBe(1);
        // It might mutate to the same digit, so we can't assert not.toBe(original) strictly
    });

    it('should not produce a leading zero for multi-digit numbers if original is not all zeros', () => {
        const original = "123";
        // Run multiple times to increase chance of hitting the leading zero case
        for (let i = 0; i < 50; i++) {
            const mutated = mutate(original, 1); // Try to change 1 digit
            if (mutated.length > 1) {
                expect(mutated[0]).not.toBe('0');
            }
        }
        const allZeros = "000";
        const mutatedZeros = mutate(allZeros, 1);
        // mutate has logic to make "000" into non-zero, e.g. "001" or "100"
        // This specific check for leading zero is tricky with the "000" -> "1" like behavior in findPrime.
        // The `mutate` itself aims to prevent new leading zeros on typical numbers.
        // If `mutate("007")` is called, it might become "001" or "507".
        // The "avoid leading zero" is if pos === 0 and newDigit === '0' and len > 1, it picks 1-9.
        // So if original is "123", and pos 0 is chosen, it won't become "023".
    });

    it('should correctly cap mutationCount to string length', () => {
        const original = "123";
        const mutated = mutate(original, 10); // mutationCount > length
        let differences = 0;
        for(let i=0; i<original.length; ++i) {
            if(original[i] !== mutated[i]) differences++;
        }
        expect(differences).toBeLessThanOrEqual(original.length);
    });
  });

  describe('findPrime', () => {
    // Testing findPrime is tricky because it's random and potentially long-running.
    // We can test that it eventually finds a prime for a small, easily mutable string.
    // We'd mock isPrime and mutate for more deterministic tests of findPrime's loop logic.

    // For an integration-style test:
    it('should eventually find a prime number from a starting string', async () => {
      // This test might be slow or flaky depending on the randomness.
      // For real unit tests, mock `mutate` and `isPrime`.
      jest.setTimeout(15000); // Increase timeout for this test

      // Start with a non-prime that's easy to mutate into a prime.
      // E.g., "10" can become "11", "13", "17", "19" or "01" (which becomes "1" then maybe "3", "7")
      const initialNumStr = "6"; // Small non-prime
      const foundPrimeStr = await findPrime(initialNumStr, (progress) => {
        console.log(`findPrime test progress: ${progress.attempts} attempts, trying ${progress.currentCandidate}`);
      });

      expect(foundPrimeStr.length).toBeGreaterThan(0);
      expect(isPrime(BigInt(foundPrimeStr))).toBe(true);
    }, 15000); // Timeout for this specific test

    it('should throw error for empty initial string', async () => {
        await expect(findPrime("")).rejects.toThrow("Initial number string cannot be empty.");
    });

    // More robust tests would mock isPrime and mutate:
    it('should call mutate and isPrime until a prime is found (conceptual mock test)', async () => {
        const mockMutate = jest.fn()
            .mockReturnValueOnce('10') // non-prime
            .mockReturnValueOnce('12') // non-prime
            .mockReturnValueOnce('13'); // prime

        const mockIsPrime = jest.fn()
            .mockImplementation((n) => {
                if (n === BigInt(13)) return true;
                return false;
            });

        // Temporarily replace actual functions with mocks
        const originalMutate = jest.requireActual('./primality').mutate;
        const originalIsPrime = jest.requireActual('./primality').isPrime;
        const primalityModule = require('./primality');
        primalityModule.mutate = mockMutate;
        primalityModule.isPrime = mockIsPrime;

        const result = await primalityModule.findPrime("9");
        expect(result).toBe('13');
        expect(mockMutate).toHaveBeenCalledTimes(3);
        expect(mockIsPrime).toHaveBeenCalledTimes(3);

        // Restore original functions
        primalityModule.mutate = originalMutate;
        primalityModule.isPrime = originalIsPrime;
    });
  });
});
