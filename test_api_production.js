const https = require('https');
const http = require('http');

// Função para fazer requisição
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DevHub-Trader-Test/1.0'
      }
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Testes
async function testAPI() {
  console.log('🧪 Testando API em produção...\n');
  
  const tests = [
    {
      name: 'Teste 1: Health Check (HTTPS)',
      url: 'https://api.devhubtrader.com.br/health',
      method: 'GET'
    },
    {
      name: 'Teste 2: Root Endpoint (HTTPS)',
      url: 'https://api.devhubtrader.com.br/',
      method: 'GET'
    },
    {
      name: 'Teste 3: Health Check (HTTP)',
      url: 'http://api.devhubtrader.com.br/health',
      method: 'GET'
    },
    {
      name: 'Teste 4: Root Endpoint (HTTP)',
      url: 'http://api.devhubtrader.com.br/',
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}`);
      const result = await makeRequest(test.url, test.method);
      console.log(`   ✅ Status: ${result.status}`);
      console.log(`   📄 Response: ${result.data.substring(0, 200)}...`);
      console.log('');
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('✅ Testes concluídos!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Verifique se o backend está rodando na VPS');
  console.log('2. Verifique se o Nginx está configurado corretamente');
  console.log('3. Teste o frontend em https://devhubtrader.com.br');
}

testAPI().catch(console.error); 