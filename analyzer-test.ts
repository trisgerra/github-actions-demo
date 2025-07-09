import * as fs from 'fs';
import * as readline from 'readline';

const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Missing input file.');
  process.exit(1);
}

type Step = 'Install dependencies' | 'Run unit tests' | 'Run linter' | 'Unknown';

const blockStartPattern = /^● /;
const sectionHeaders = {
  install: '===== INSTALL STEP LOG =====',
  test: '===== TEST STEP LOG =====',
  lint: '===== LINT STEP LOG =====',
};

async function analyze(file: string) {
  const fileStream = fs.createReadStream(file);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let currentStep: Step = 'Unknown';
  let collectingBlock = false;
  let currentBlockLines: string[] = [];
  const results: { step: Step; message: string }[] = [];

  for await (const line of rl) {
    if (line.includes(sectionHeaders.install)) {
      currentStep = 'Install dependencies';
      continue;
    }
    if (line.includes(sectionHeaders.test)) {
      currentStep = 'Run unit tests';
      continue;
    }
    if (line.includes(sectionHeaders.lint)) {
      currentStep = 'Run linter';
      continue;
    }

    // Start of a test failure block
    if (blockStartPattern.test(line)) {
      if (currentBlockLines.length > 0) {
        results.push({
          step: currentStep,
          message: currentBlockLines.join('\n'),
        });
        currentBlockLines = [];
      }
      collectingBlock = true;
    }

    if (collectingBlock) {
      // End of block: empty line or start of new test block
      if (line.trim() === '' && currentBlockLines.length > 0) {
        results.push({
          step: currentStep,
          message: currentBlockLines.join('\n'),
        });
        currentBlockLines = [];
        collectingBlock = false;
        continue;
      }

      currentBlockLines.push(line);
    } else {
      // Non-block logic — catch common error lines
      const lower = line.toLowerCase();
      if (
        ['error', 'failed', 'vulnerability', 'exception', 'undefined'].some(k => lower.includes(k)) &&
        !/^npm WARN/.test(line)
      ) {
        results.push({ step: currentStep, message: line.trim() });
      }
    }
  }

  // push last block if file ends during a block
  if (currentBlockLines.length > 0) {
    results.push({
      step: currentStep,
      message: currentBlockLines.join('\n'),
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

analyze(filePath).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
