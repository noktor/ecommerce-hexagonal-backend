function readPackage(pkg, context) {
  // Allow bcrypt to run build scripts
  if (pkg.name === 'bcrypt') {
    pkg.scripts = pkg.scripts || {};
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};

