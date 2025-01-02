import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

const files = glob.sync('dist/src/**/*.js');

files.forEach(file => {
    let content = readFileSync(file, 'utf8');
    content = content.replace(/\.ts"/g, '.js"');
    content = content.replace(/\.ts'/g, ".js'");
    writeFileSync(file, content);
});
