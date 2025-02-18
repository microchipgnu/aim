const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, '../packages');

// Recursively find all package.json files
function findPackageJsonFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(findPackageJsonFiles(fullPath));
    } else if (item === 'package.json') {
      results.push(fullPath);
    }
  }

  return results;
}

// Read all package versions
const versions = {};
const packagePaths = findPackageJsonFiles(packagesDir);

packagePaths.forEach(pkgPath => {
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkgJson.name) {
    versions[pkgJson.name] = pkgJson.version;
  }
});

// Update workspace dependencies
packagePaths.forEach(pkgPath => {
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
    if (pkgJson[depType]) {
      Object.keys(pkgJson[depType]).forEach(dep => {
        if (pkgJson[depType][dep] === 'workspace:*' && versions[dep]) {
          pkgJson[depType][dep] = `^${versions[dep]}`;
        }
      });
    }
  });

  fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2));
});