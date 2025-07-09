import * as fs from 'fs';
import * as readline from 'readline';

const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Missing input file.');
  process.exit(1);
}

type Step = 'Install dependencies' | 'Run unit tests' | 'Run linter' | 'Unknown';

type Message = {
  step: Step;
  type: 'lint' | 'test' | 'dependency' | 'general';
  summary: string;
  details: string;
};

const keywords = [
  'error', 'failed', 'cannot', 'undefined', 'exception', 'stack trace',
  'unexpected', 'severity', 'critical', 'fatal', 'unhandled', 'unresolved',
  'unrecognized', 'unavailable', 'fix', '●', 'Expected:', 'Received:',
];

const noisePatterns = [
  /^\s*$/,
  /^\s*at\s/,
  /warning/i,
  /npm notice/,
  /npm WARN/,
  /✓/,
  /info:/,
  /debug:/,
  /verbose:/,
  /skipped/i,
  /passed/i,
  /completed/i,
  /success/i,
  /no issues found/i,
  /no (errors|warnings) found/i,
  /no changes/i,
];

const isRelevant = (line: string): boolean => {
  const lower = line.toLowerCase();
  return keywords.some(k => lower.includes(k)) &&
    !noisePatterns.some(p => p.test(line));
};

async function analyze(file: string) {
  const fileStream = fs.createReadStream(file);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const result: Message[] = [];

  let currentStep: Step = 'Unknown';
  let collectingTestBlock = false;
  let testBlockLines: string[] = [];

  for await (const line of rl) {
    if (line.includes('===== INSTALL STEP LOG =====')) {
      currentStep = 'Install dependencies';
      continue;
    }
    if (line.includes('===== TEST STEP LOG =====')) {
      currentStep = 'Run unit tests';
      continue;
    }
    if (line.includes('===== LINT STEP LOG =====')) {
      currentStep = 'Run linter';
      continue;
    }

    // === Blocchi di test Jest ===
    if (line.startsWith('● ')) {
      if (testBlockLines.length > 0) {
        result.push({
          step: currentStep,
          type: 'test',
          summary: testBlockLines[0],
          details: testBlockLines.join('\n'),
        });
        testBlockLines = [];
      }
      collectingTestBlock = true;
    }

    if (collectingTestBlock) {
      testBlockLines.push(line);

      if (line.trim() === '') {
        result.push({
          step: currentStep,
          type: 'test',
          summary: testBlockLines[0],
          details: testBlockLines.join('\n'),
        });
        testBlockLines = [];
        collectingTestBlock = false;
      }

      continue;
    }

    // === Analisi per riga singola ===
    if (isRelevant(line)) {
      let type: Message['type'] = 'general';
      if (currentStep === 'Run linter') type = 'lint';
      else if (currentStep === 'Run unit tests') type = 'test';
      else if (currentStep === 'Install dependencies') type = 'dependency';

      result.push({
        step: currentStep,
        type,
        summary: line.trim().slice(0, 100),
        details: line.trim(),
      });
    }
  }

  // Blocchi test rimasti alla fine
  if (testBlockLines.length > 0) {
    result.push({
      step: currentStep,
      type: 'test',
      summary: testBlockLines[0],
      details: testBlockLines.join('\n'),
    });
  }

  console.log(JSON.stringify(result, null, 2));
  fs.writeFileSync('analysis.json', JSON.stringify(result, null, 2));
}

analyze(filePath).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
