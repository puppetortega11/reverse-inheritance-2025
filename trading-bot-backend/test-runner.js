const { spawn } = require('child_process');
const http = require('http');

// Test 1: Node.js Version
function testNodeVersion() {
  return new Promise((resolve, reject) => {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 20) {
      resolve(`Node.js version ${version} is compatible`);
    } else {
      reject(`Node.js version ${version} is too old - need >= 20`);
    }
  });
}

// Test 2: Server Startup
function testServerStartup() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['server.js'], { 
      stdio: 'pipe',
      env: { ...process.env, PORT: '8001' }
    });
    
    let output = '';
    let errorOutput = '';
    
    server.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Server running')) {
        server.kill();
        resolve('Server starts successfully');
      }
    });
    
    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    server.on('close', (code) => {
      if (code !== 0 && !output.includes('Server running')) {
        reject(`Server startup failed with code ${code}: ${errorOutput}`);
      }
    });
    
    setTimeout(() => {
      server.kill();
      if (output.includes('Server running')) {
        resolve('Server starts successfully');
      } else {
        reject('Server startup timeout - no startup message received');
      }
    }, 5000);
  });
}

// Test 3: Health Endpoint
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['server.js'], { 
      stdio: 'pipe',
      env: { ...process.env, PORT: '8002' }
    });
    
    // Wait for server to start
    setTimeout(() => {
      const req = http.get('http://localhost:8002/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.kill();
          try {
            const response = JSON.parse(data);
            if (response.status === 'healthy' && response.nodeVersion) {
              resolve('Health endpoint works correctly');
            } else {
              reject('Health endpoint returned invalid response');
            }
          } catch (e) {
            reject(`Health endpoint returned invalid JSON: ${data}`);
          }
        });
      });
      
      req.on('error', (e) => {
        server.kill();
        reject(`Health endpoint failed: ${e.message}`);
      });
      
      setTimeout(() => {
        req.destroy();
        server.kill();
        reject('Health endpoint timeout');
      }, 5000);
    }, 2000);
  });
}

// Test 4: Status Endpoint
function testStatusEndpoint() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['server.js'], { 
      stdio: 'pipe',
      env: { ...process.env, PORT: '8003' }
    });
    
    // Wait for server to start
    setTimeout(() => {
      const req = http.get('http://localhost:8003/api/status', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.kill();
          try {
            const response = JSON.parse(data);
            if (response.message === 'Backend is running') {
              resolve('Status endpoint works correctly');
            } else {
              reject('Status endpoint returned invalid response');
            }
          } catch (e) {
            reject(`Status endpoint returned invalid JSON: ${data}`);
          }
        });
      });
      
      req.on('error', (e) => {
        server.kill();
        reject(`Status endpoint failed: ${e.message}`);
      });
      
      setTimeout(() => {
        req.destroy();
        server.kill();
        reject('Status endpoint timeout');
      }, 5000);
    }, 2000);
  });
}

// Test 5: CORS Headers
function testCORSHeaders() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['server.js'], { 
      stdio: 'pipe',
      env: { ...process.env, PORT: '8004' }
    });
    
    // Wait for server to start
    setTimeout(() => {
      const req = http.get('http://localhost:8004/health', (res) => {
        server.kill();
        if (res.headers['access-control-allow-origin']) {
          resolve('CORS headers are present');
        } else {
          reject('CORS headers are missing');
        }
      });
      
      req.on('error', (e) => {
        server.kill();
        reject(`CORS test failed: ${e.message}`);
      });
      
      setTimeout(() => {
        req.destroy();
        server.kill();
        reject('CORS test timeout');
      }, 5000);
    }, 2000);
  });
}

// Run all tests
async function runTests() {
  console.log('🧪 Running validation tests...\n');
  
  const tests = [
    { name: 'Node.js Version', test: testNodeVersion },
    { name: 'Server Startup', test: testServerStartup },
    { name: 'Health Endpoint', test: testHealthEndpoint },
    { name: 'Status Endpoint', test: testStatusEndpoint },
    { name: 'CORS Headers', test: testCORSHeaders }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      console.log(`✅ ${name}: ${result}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Ready for deployment.');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Fix issues before deploying.');
    process.exit(1);
  }
}

runTests();