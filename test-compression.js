const http = require('http');

// Test with different encodings
const encodings = ['zstd', 'gzip', 'deflate', ''];

function testCompression(encoding) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test-compression',
    method: 'GET',
    headers: {}
  };
  
  // Add encoding header if specified
  if (encoding) {
    options.headers['Accept-Encoding'] = encoding;
  }

  console.log(`\nTesting with Accept-Encoding: ${encoding || 'none'}`);
  
  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Content-Encoding:', res.headers['content-encoding'] || 'none');
    
    const chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log('Response size:', buffer.length, 'bytes');
      
      // Test the next encoding
      const nextIndex = encodings.indexOf(encoding) + 1;
      if (nextIndex < encodings.length) {
        testCompression(encodings[nextIndex]);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.end();
}

// Start with the first encoding
testCompression(encodings[0]);