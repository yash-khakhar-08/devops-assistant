const fs = require('fs');
['ChatPage.jsx', 'EnvironmentsPage.jsx', 'SettingsPage.jsx'].forEach(file => {
    const p = 'frontend/src/pages/' + file;
    let content = fs.readFileSync(p, 'utf8');
    // Replace literal backslash followed by ${ with just ${
    content = content.replace(/\\\${/g, '${');
    fs.writeFileSync(p, content);
});
console.log('Fixed variable interpolation in JSX files');
