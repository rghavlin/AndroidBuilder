const path = require('path');
const npmPath = "C:/Program Files/nodejs/node_modules/npm";
const configPath = path.join(npmPath, 'node_modules', '@npmcli', 'config');

console.log('Testing dependencies for npm-prefix.js...');

try {
    console.log('Requiring path...');
    require('path');
    console.log('Requiring @npmcli/config...');
    const Config = require(configPath);
    console.log('Successfully required @npmcli/config');
    
    console.log('Requiring definitions...');
    const defPath = path.join(configPath, 'lib', 'definitions');
    const { definitions, flatten, shorthands } = require(defPath);
    console.log('Successfully required definitions');

    const config = new Config({
        npmPath: npmPath,
        argv: [],
        definitions,
        flatten,
        shorthands,
        excludeNpmCwd: false,
    });

    console.log('Loading config...');
    config.load().then(() => {
        console.log('Global Prefix:', config.globalPrefix);
    }).catch(err => {
        console.error('Error loading config:', err);
    });

} catch (err) {
    console.error('Caught error during require:', err);
}
