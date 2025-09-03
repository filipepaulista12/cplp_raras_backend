#!/usr/bin/env node

/**
 * 🔄 PRISMA SYNC SCHEMA - CPLP Raras
 * Mantém o schema principal sincronizado na raiz
 */

const fs = require('fs');
const path = require('path');

const MAIN_SCHEMA = 'prisma/01-active-schemas/schema.prisma';
const ROOT_SCHEMA = 'prisma/schema.prisma';

function syncSchema() {
    console.log('🔄 SINCRONIZANDO SCHEMA PRINCIPAL...');
    console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
    
    try {
        // Verificar se o schema principal existe
        if (!fs.existsSync(MAIN_SCHEMA)) {
            console.error(`❌ Schema principal não encontrado: ${MAIN_SCHEMA}`);
            return;
        }
        
        // Ler schema principal
        const schemaContent = fs.readFileSync(MAIN_SCHEMA, 'utf8');
        
        // Escrever na raiz para compatibilidade
        fs.writeFileSync(ROOT_SCHEMA, schemaContent);
        
        console.log(`✅ Schema sincronizado!`);
        console.log(`📁 Origem: ${MAIN_SCHEMA}`);
        console.log(`📁 Destino: ${ROOT_SCHEMA}`);
        
        // Verificar tamanho
        const stats = fs.statSync(ROOT_SCHEMA);
        console.log(`📊 Tamanho: ${stats.size} bytes`);
        
        console.log(`
🎯 AGORA VOCÊ PODE USAR:
  npx prisma studio          # Interface visual
  npx prisma generate        # Gerar cliente
  npx prisma db push         # Aplicar mudanças
  npx prisma migrate dev     # Criar migrações

💡 OU USE O GERENCIADOR:
  node prisma/prisma-manager.js studio main
  node prisma/prisma-manager.js generate portuguese
        `);
        
    } catch (error) {
        console.error(`❌ Erro ao sincronizar schema:`, error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    syncSchema();
}

module.exports = { syncSchema };
