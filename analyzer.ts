import * as fs from 'fs';
import * as readline from 'readline';

const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Missing input file.');
  process.exit(1);
}

const keywords = [
  'error',
  'failed',
  'cannot',
  'undefined',
  'exception',
  'stack trace',
  'unexpected',
  'severity',
  'critical',
  'fatal',
  'unhandled',
  'unresolved',
  'unrecognized',
  'unavailable',
  'fix',
  '✕',

];

const noisePatterns = [
  /^\s*$/, // empty lines
  /^\s*at\s/, // stack trace line details
  /warning/i,
  /npm notice/,
  /npm WARN/,
  /✓/, // success indicators
  /info:/, // informational messages
  /debug:/, // debug messages
  /verbose:/, // verbose messages
  /skipped/i, // skipped tests or steps
  /passed/i, // passed tests or steps
  /completed/i, // completed tasks
  /success/i, // success messages
  /no issues found/i, // no issues found messages
  /no errors found/i, // no errors found messages
  /no warnings found/i, // no warnings found messages
  /no changes/i, // no changes messages
];

const isRelevant = (line: string): boolean => {
  const lower = line.toLowerCase();
  return keywords.some(k => lower.includes(k)) &&
         !noisePatterns.some(p => p.test(line));
};

type Step = 'Install dependencies' | 'Run unit tests' | 'Run linter' | 'Unknown';

async function analyze(file: string) {
  const fileStream = fs.createReadStream(file);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const result: { step: Step; message: string }[] = [];

  let currentStep: Step = 'Unknown';

  let collectingBlock = false;
  let currentBlockLines: string[] = [];

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

    // Riconosci blocchi Jest
    if (line.startsWith('● ')) {
      if (currentBlockLines.length > 0) {
        result.push({
          step: currentStep,
          message: currentBlockLines.join('\n'),
        });
        currentBlockLines = [];
      }
      collectingBlock = true;
    }

    if (collectingBlock) {
      currentBlockLines.push(line);

      // Blocchi Jest di solito finiscono con riga vuota o nuova sezione
      if (line.trim() === '') {
        result.push({
          step: currentStep,
          message: currentBlockLines.join('\n'),
        });
        currentBlockLines = [];
        collectingBlock = false;
      }

      continue; // ignora filtro riga per riga durante raccolta blocco
    }

    // Se non stiamo raccogliendo un blocco, usa la logica originale
    if (isRelevant(line)) {
      result.push({ step: currentStep, message: line.trim() });
    }
  }

  // Fine file: se abbiamo un blocco ancora aperto
  if (currentBlockLines.length > 0) {
    result.push({
      step: currentStep,
      message: currentBlockLines.join('\n'),
    });
  }

  console.log(JSON.stringify(result, null, 2));
}

analyze(filePath).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
