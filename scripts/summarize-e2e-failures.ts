#!/usr/bin/env bun

/**
 * Generate a markdown summary of e2e test failures from Playwright JSON report
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

const jsonReportPath = join(process.cwd(), "e2e/test-results.json");
const outputPath = join(process.cwd(), "e2e/FAILURES.md");

if (!existsSync(jsonReportPath)) {
  console.error("❌ No test results found at:", jsonReportPath);
  console.error("Run tests first with: make e2e");
  process.exit(1);
}

const report = JSON.parse(readFileSync(jsonReportPath, "utf-8"));

const failures: any[] = [];
const passes: any[] = [];

function processSuite(suite: any) {
  // Process specs in this suite
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const result = test.results?.[0];
      if (result?.status === "failed" || result?.status === "timedOut") {
        failures.push({
          file: spec.file,
          title: spec.title,
          error: result.error?.message || "Unknown error",
          location: `${spec.file}:${spec.line}:${spec.column}`,
        });
      } else if (result?.status === "passed") {
        passes.push(spec.title);
      }
    }
  }

  // Recursively process nested suites
  for (const nestedSuite of suite.suites || []) {
    processSuite(nestedSuite);
  }
}

// Process all top-level suites
for (const suite of report.suites || []) {
  processSuite(suite);
}

const total = failures.length + passes.length;
const passRate = total > 0 ? ((passes.length / total) * 100).toFixed(1) : "0.0";

let markdown = `# E2E Test Failures Summary\n\n`;
markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
markdown += `**Stats:** ${passes.length}/${total} passed (${passRate}%), ${failures.length} failed\n\n`;

if (failures.length === 0) {
  markdown += `✅ All tests passed!\n`;
} else {
  markdown += `## Failed Tests (${failures.length})\n\n`;

  for (const failure of failures) {
    markdown += `### ${failure.title}\n\n`;
    markdown += `**Location:** \`${failure.location}\`\n\n`;
    markdown += `**Error:**\n\`\`\`\n${failure.error}\n\`\`\`\n\n`;
    markdown += `---\n\n`;
  }
}

writeFileSync(outputPath, markdown, "utf-8");

console.log(`\n📊 Test Summary:`);
console.log(`   Passed: ${passes.length}/${total} (${passRate}%)`);
console.log(`   Failed: ${failures.length}`);
console.log(`\n📄 Failure report written to: ${outputPath}`);

if (failures.length > 0) {
  console.log(`\n🔍 View HTML report: make e2e-report`);
  process.exit(1);
}
