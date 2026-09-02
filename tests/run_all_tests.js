const { spawn } = require('child_process');
const path = require('path');

const testFiles = [
  'audit_suite.js',
  'frontend_routes_test.js',
  'mutations_test.js'
];

async function runScript(file) {
  return new Promise((resolve) => {
    console.log(`\n======================================================`);
    console.log(`▶️ RUNNING: ${file}`);
    console.log(`======================================================`);
    
    const proc = spawn('node', [path.join(__dirname, file)], {
      stdio: 'inherit'
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function runAll() {
  console.log("🏥 MEDICORE MASTER TEST RUNNER STARTED...\n");
  let passed = 0;

  for (const file of testFiles) {
    const ok = await runScript(file);
    if (ok) passed++;
  }

  console.log(`\n======================================================`);
  console.log(`🏁 TEST SUITE FINISHED: ${passed}/${testFiles.length} Test Sets Passed.`);
  console.log(`======================================================\n`);
}

runAll();
