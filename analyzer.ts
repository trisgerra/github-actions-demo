// analyzer.ts

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
  'fix'
];

const noisePatterns = [
  /^\s*$/, // empty lines
  /^\s*at\s/, // stack trace line details
  /warning/i,
  /npm notice/,
  /npm WARN/,
];

const isRelevant = (line: string): boolean => {
  const lower = line.toLowerCase();
  return keywords.some(k => lower.includes(k)) &&
         !noisePatterns.some(p => p.test(line));
};

async function analyze(file: string) {
  const fileStream = fs.createReadStream(file);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  console.log('📊 Filtered Log Output:\n');

  for await (const line of rl) {
    if (isRelevant(line)) {
      console.log(line);
    }
  }
}

analyze(filePath).catch(err => {
  console.error('❌ Error reading file:', err.message);
  process.exit(1);
});
