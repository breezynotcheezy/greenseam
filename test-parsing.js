// Test the improved parsing logic
const fs = require('fs');

// Read the context.txt file
const contextText = fs.readFileSync('context.txt', 'utf8');

// Simple test of the result-only patterns
const resultOnlyPatterns = [
  /^(Single|Double|Triple|Home\s+Run|Walk|Strikeout|Strike\s+Out|Fly\s+Out|Ground\s+Out|Pop\s+Out|Fielder'?s?\s+Choice|Infield\s+Fly|Error|Hit\s+by\s+Pitch|HBP)$/i,
  /^\d+\s+Outs?$/i,
  /^In\s+play\.$/i,
  /^Ball\s+\d+/i,
  /^Strike\s+\d+/i,
  /^Foul/i,
  /^WDST\s+\d+\s*-\s*FRNT\s+\d+/i
];

// Test play patterns
const playPatterns = [
  /^([A-Za-z\s\-\.]+)\s+singles?\s+on\s+(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive|pop\s+fly)\s+(?:to\s+)?([A-Za-z\s]+)/i,
  /^([A-Za-z\s\-\.]+)\s+walks?\s+(?:,?\s+[A-Za-z\s]+)?(?:pitching)?/i,
  /^([A-Za-z\s\-\.]+)\s+strikes?\s+out\s+(?:swinging|looking)?(?:,?\s+[A-Za-z\s]+)?(?:pitching)?/i,
  /^([A-Za-z\s\-\.]+)\s+doubles?\s+on\s+(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive)\s+(?:to\s+)?([A-Za-z\s]+)/i
];

console.log('Testing parsing logic...\n');

const lines = contextText.split('\n');

console.log('Lines that should be skipped (result-only):');
lines.forEach((line, index) => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return;
  
  let isResultOnly = false;
  for (const pattern of resultOnlyPatterns) {
    if (pattern.test(trimmedLine)) {
      isResultOnly = true;
      break;
    }
  }
  if (isResultOnly) {
    console.log(`Line ${index + 1}: "${trimmedLine}"`);
  }
});

console.log('\nLines that should be parsed (player actions):');
lines.forEach((line, index) => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return;
  
  // Check if it's result-only
  let isResultOnly = false;
  for (const pattern of resultOnlyPatterns) {
    if (pattern.test(trimmedLine)) {
      isResultOnly = true;
      break;
    }
  }
  
  if (!isResultOnly) {
    // Check if it matches play patterns
    let hasPlayerAction = false;
    for (const pattern of playPatterns) {
      if (pattern.test(trimmedLine)) {
        hasPlayerAction = true;
        break;
      }
    }
    
    if (hasPlayerAction) {
      console.log(`Line ${index + 1}: "${trimmedLine}"`);
    }
  }
});

console.log('\nTesting specific problematic lines:');
const problematicLines = [
  'Single',
  '2 Outs',
  '1 Out',
  '3 Outs',
  'In play.',
  'M L singles on a ground ball to center fielder R F, M M scores, L S advances to 3rd.',
  'L S singles on a ground ball to second baseman K H, M M advances to 2nd.',
  'J N strikes out swinging, S F pitching.',
  'L M walks, S F pitching, M L remains at 3rd, A L advances to 2nd.'
];

problematicLines.forEach(line => {
  let isResultOnly = false;
  for (const pattern of resultOnlyPatterns) {
    if (pattern.test(line)) {
      isResultOnly = true;
      break;
    }
  }
  
  if (isResultOnly) {
    console.log(`SKIP: "${line}" (result-only)`);
  } else {
    // Check for player action
    let playerName = null;
    for (const pattern of playPatterns) {
      const match = line.match(pattern);
      if (match) {
        playerName = match[1].trim();
        break;
      }
    }
    
    if (playerName) {
      console.log(`PARSE: "${line}" -> Player: "${playerName}"`);
    } else {
      console.log(`UNKNOWN: "${line}"`);
    }
  }
}); 