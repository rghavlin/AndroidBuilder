import fs from 'fs';
import path from 'path';

const dir = path.resolve('client/src/game/components');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.js')) {
    const filepath = path.join(dir, file);
    let content = fs.readFileSync(filepath, 'utf8');

    if (!content.includes('toJSON() {') && !content.includes('toJSON:')) {
      // Find the last closing brace of the file (assuming it's the class closing brace)
      const lastBraceIndex = content.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        const inject = `
  toJSON() {
    return { ...this };
  }
`;
        content = content.substring(0, lastBraceIndex) + inject + content.substring(lastBraceIndex);
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Added toJSON to ${file}`);
      }
    }
  }
}
