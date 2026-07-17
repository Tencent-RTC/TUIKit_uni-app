// publish to github - strip credentials from debug files
const fs = require('fs');
const path = require('path');

const debugDir = path.resolve(__dirname, '../debug');
const targetFile = path.join(debugDir, 'GenerateTestUserSig-es.js');

if (!fs.existsSync(targetFile)) {
  console.error(`File not found: ${targetFile}`);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, { encoding: 'utf8' });

// Replace SDKAPPID and SECRETKEY with empty/default values
content = content.replace(
  /let SDKAPPID = \d+;/,
  'let SDKAPPID = 0;'
);
content = content.replace(
  /let SECRETKEY = '[^']*';/,
  "let SECRETKEY = '';"
);

fs.writeFileSync(targetFile, content, { encoding: 'utf8' });
console.log('Credentials stripped successfully for github publish.');
