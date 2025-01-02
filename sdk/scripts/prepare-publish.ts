const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, '../packages');
const packages = fs.readdirSync(packagesDir);

// Read all package versions
const versions = {};
packages.forEach(pkg => {
  const pkgPath = path.join(packagesDir, pkg, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    versions[pkgJson.name] = pkgJson.version;
  }
});

// Update workspace dependencies
packages.forEach(pkg => {
  const pkgPath = path.join(packagesDir, pkg, 'package.json');
  if (fs.existsSync(pkgPath)) {
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
  }
});