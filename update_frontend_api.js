const fs = require('fs');
const path = require('path');

// Função para atualizar um arquivo
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir localhost:5002 por api.devhubtrader.com.br
    const originalContent = content;
    content = content.replace(/http:\/\/localhost:5002/g, 'https://api.devhubtrader.com.br');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Atualizado: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️ Nenhuma mudança: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${filePath}:`, error.message);
    return false;
  }
}

// Lista de arquivos para verificar
const filesToCheck = [
  'project/src/pages/BacktestAnalysisPage.tsx',
  'project/src/components/AIResponseChat.tsx',
  'project/src/components/Metrics.tsx'
];

console.log('🔄 Atualizando frontend para usar API em produção...\n');

let updatedCount = 0;
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    if (updateFile(file)) {
      updatedCount++;
    }
  } else {
    console.log(`⚠️ Arquivo não encontrado: ${file}`);
  }
});

console.log(`\n✅ Atualização concluída! ${updatedCount} arquivo(s) atualizado(s)`);
console.log('\n🌐 Agora o frontend usará:');
console.log('   - Desenvolvimento: http://localhost:5002');
console.log('   - Produção: https://api.devhubtrader.com.br');
console.log('\n📋 Próximos passos:');
console.log('1. Faça build do frontend: npm run build');
console.log('2. Deploy na VPS: ./deploy.sh');
console.log('3. Teste em produção'); 