const BASE_URL = "http://localhost:3000";

interface TestResult {
  testUserId: string;
  isIsolated: boolean;
  scope?: { userId?: string; operation?: string; currentUserId?: string };
  errorMessage?: string;
}

class RealAsyncContextTester {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async checkServer(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async testAPISimulation(concurrency: number = 30): Promise<void> {
    console.log(`Hitting API endpoint ${concurrency} times...`);

    const promises = Array.from({ length: concurrency }, async (_, i) => {
      const userId = `user_${i + 1}`;

      try {
        const response = await fetch(
          `${BASE_URL}/test-async-context/test/api-simulation`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          },
        );
        const data = await response.json();

        const result: TestResult = {
          testUserId: data.userId,
          isIsolated: data.isIsolated,
          scope: data.scope,
        };

        this.results.push(result);

        return result;
      } catch (error) {
        console.error(`❌ API request for ${userId} failed:`, error);

        const result: TestResult = {
          testUserId: userId,
          isIsolated: false,
          // @ts-ignore
          errorMessage: error.message,
        };
        this.results.push(result);
        return result;
      }
    });

    await Promise.all(promises);
    this.logTestResults();
  }

  private logTestResults(): void {
    const testResults = this.results;
    const total = testResults.length;
    const passed = testResults.filter((r) => r.isIsolated).length;
    const failed = total - passed;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;

    if (failed > 0) {
      console.log(`\nFailed Requests:`);
      testResults
        .filter((r) => !r.isIsolated)
        .forEach((r) => {
          console.log(
            `${r.testUserId}${r.scope ? ` - ${JSON.stringify(r.scope)}` : ""}${r.errorMessage ? ` (${r.errorMessage})` : ""}`,
          );
        });
    }

    console.log(`\nResults:`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
  }

  async runAllTests(): Promise<void> {
    console.log("Starting Async Context Strategy tests...\n");

    if (!(await this.checkServer())) {
      console.error("Server is not running. Please start the server first.");
      process.exit(1);
    }

    console.log("Server is running\n");

    try {
      await this.testAPISimulation(1000);
    } catch (error) {
      console.error("Test suite failed:", error);
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.main) {
  const tester = new RealAsyncContextTester();
  await tester.runAllTests();
}
