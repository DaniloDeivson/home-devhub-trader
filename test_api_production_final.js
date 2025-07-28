const https = require('https');

// Função para fazer requisição HTTPS
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DevHub-Trader-Test/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
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

// Testes da API
async function testAPI() {
  console.log('🧪 Testando API em produção...\n');
  
  const tests = [
    {
      name: 'Teste 1: Health Check',
      url: 'https://api.devhubtrader.com.br/health',
      method: 'GET'
    },
    {
      name: 'Teste 2: Root Endpoint',
      url: 'https://api.devhubtrader.com.br/',
      method: 'GET'
    },
    {
      name: 'Teste 3: API Tabela (GET)',
      url: 'https://api.devhubtrader.com.br/api/tabela',
      method: 'GET'
    },
    {
      name: 'Teste 4: API Tabela (OPTIONS)',
      url: 'https://api.devhubtrader.com.br/api/tabela',
      method: 'OPTIONS'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}`);
      const result = await makeRequest(test.url, test.method);
      console.log(`   ✅ Status: ${result.status}`);
      console.log(`   📄 Response: ${result.data.substring(0, 200)}...`);
      
      // Verificar headers CORS
      if (result.headers['access-control-allow-origin']) {
        console.log(`   🌐 CORS Origin: ${result.headers['access-control-allow-origin']}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('✅ Testes concluídos!');
  console.log('\n📋 Status:');
  console.log('1. Se todos os testes passaram, a API está funcionando');
  console.log('2. Se houver erros, verifique o backend na VPS');
  console.log('3. O frontend deve usar https://api.devhubtrader.com.br');
}

testAPI().catch(console.error); 