const http = require('http');

// Função para testar redirecionamento
function testRedirect(hostname, port, path = '/') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Host': `${hostname}:${port}`,
        'User-Agent': 'DevHub-Trader-Redirect-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200)
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// Testes
async function testRedirects() {
  console.log('🔄 Testando redirecionamentos...\n');

  const tests = [
    {
      name: 'Teste 1: Chamada direta na porta 5002',
      hostname: 'localhost',
      port: 5002,
      path: '/api/tabela'
    },
    {
      name: 'Teste 2: Health check na porta 5002',
      hostname: 'localhost',
      port: 5002,
      path: '/health'
    },
    {
      name: 'Teste 3: Root na porta 5002',
      hostname: 'localhost',
      port: 5002,
      path: '/'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}`);
      const result = await testRedirect(test.hostname, test.port, test.path);
      console.log(`   📊 Status: ${result.status}`);
      console.log(`   📄 Response: ${result.data}`);
      
      // Verificar se foi redirecionado
      if (result.status === 301 || result.status === 302) {
        const location = result.headers.location;
        console.log(`   🔄 Redirecionado para: ${location}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      console.log('');
    }
  }

  console.log('✅ Testes de redirecionamento concluídos!');
  console.log('\n📋 Verificações:');
  console.log('1. Se o status for 301/302, o redirecionamento está funcionando');
  console.log('2. Se o status for 200, a API está respondendo diretamente');
  console.log('3. Se houver erro, verifique se o backend está rodando');
}

testRedirects().catch(console.error); 