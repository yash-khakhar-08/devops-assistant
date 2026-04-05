const fs = require('fs');

const files = [
  'backend/services/llm.js',
  'backend/routes/environments.js',
  'backend/routes/accounts.js',
  'backend/routes/chat.js',
  'backend/services/terraform.js',
  'backend/server.js'
];

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    // The previous tool calls wrote literally \` instead of ` in template literals
    content = content.replace(/\\\`/g, '\`');
    fs.writeFileSync(file, content);
  } catch (e) {
    // ignore
  }
}
console.log('Fixed backticks.');
