const { formatPlayerName, isAbbreviatedName, getMappedPlayerName } = require('./lib/utils');

// Test the name mapping functionality
console.log('Testing name mapping functionality...\n');

// Test cases
const testNames = [
  'A L',
  'M L', 
  'L S',
  'C B',
  'J N',
  'S F',
  'E P',
  'R F',
  'E L',
  'K H',
  'B B',
  'N A',
  'L P',
  'J S',
  'A H',
  'C S',
  'T B',
  'L M',
  'L B',
  'S R',
  'E A'
];

console.log('Testing abbreviated name detection:');
testNames.forEach(name => {
  const isAbbreviated = isAbbreviatedName(name);
  const formatted = formatPlayerName(name);
  console.log(`${name} -> Abbreviated: ${isAbbreviated}, Formatted: "${formatted}"`);
});

console.log('\nTesting name mapping (before any mappings):');
testNames.slice(0, 5).forEach(name => {
  const mapped = getMappedPlayerName(name);
  console.log(`${name} -> "${mapped}"`);
});

// Simulate adding a mapping
console.log('\nSimulating adding mapping for "A L" -> "Alex Lee"...');
// In a real browser environment, this would be stored in localStorage
const mockMappings = [{ abbreviated: 'A L', fullName: 'Alex Lee' }];

// Test with mock mapping
console.log('Testing with mock mapping:');
testNames.slice(0, 5).forEach(name => {
  let mapped;
  if (name === 'A L') {
    mapped = 'Alex Lee'; // Simulate the mapping
  } else {
    mapped = formatPlayerName(name);
  }
  console.log(`${name} -> "${mapped}"`);
});

console.log('\nName mapping test completed!'); 