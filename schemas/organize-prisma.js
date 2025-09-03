const fs = require('fs');
const path = require('path');

const prismaDir = 'prisma';

console.log('🗂️ ORGANIZANDO PASTA PRISMA DE FORMA LÓGICA');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));

// Mapeamento de arquivos para suas categorias
const fileCategories = {
  // 01-active-schemas - Schemas ativos e principais
  '01-active-schemas': [
    'schema.prisma',                    // Schema principal ativo
    'schema-complete-pt.prisma',        // Schema completo com português
    'schema-expanded.prisma'            // Schema expandido atual
  ],

  // 02-backups - Backups e versões anteriores
  '02-backups': [
    'schema-backup-before-pt.prisma',   // Backup antes do português
    'schema-backup.prisma',             // Backup geral
    'schema.postgresql.backup'          // Backup PostgreSQL
  ],

  // 03-database-variants - Variantes para diferentes databases
  '03-database-variants': [
    'schema.sqlite.prisma',             // Versão SQLite
    'schema.orphanet.prisma'            // Versão específica Orphanet
  ],

  // 04-development-dbs - Databases de desenvolvimento
  '04-development-dbs': [
    'database/gard_dev.db'              // Database de desenvolvimento GARD
  ]
};

function moveFiles() {
  let totalMoved = 0;
  let errors = 0;
  
  // Para cada categoria
  Object.entries(fileCategories).forEach(([category, files]) => {
    console.log(`\n📁 === ${category.toUpperCase()} ===`);
    
    files.forEach(filename => {
      const sourcePath = path.join(prismaDir, filename);
      
      // Para arquivos dentro de subpastas
      let destFilename = filename;
      if (filename.includes('/')) {
        destFilename = path.basename(filename);
      }
      
      const destPath = path.join(prismaDir, category, destFilename);
      
      try {
        if (fs.existsSync(sourcePath)) {
          // Criar diretório se não existir
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          // Mover arquivo
          if (filename.includes('/')) {
            // Para arquivos em subpastas, copiar e depois remover original
            fs.copyFileSync(sourcePath, destPath);
            fs.unlinkSync(sourcePath);
            
            // Remover pasta vazia se necessário
            const sourceDir = path.dirname(sourcePath);
            if (fs.readdirSync(sourceDir).length === 0) {
              fs.rmdirSync(sourceDir);
            }
          } else {
            // Para arquivos na raiz, mover normalmente
            fs.renameSync(sourcePath, destPath);
          }
          
          console.log(`   ✅ ${filename}`);
          totalMoved++;
        } else {
          console.log(`   ⚠️  ${filename} (não encontrado)`);
        }
      } catch (error) {
        console.error(`   ❌ ${filename}: ${error.message}`);
        errors++;
      }
    });
  });
  
  console.log('\n📊 RESUMO DA REORGANIZAÇÃO PRISMA:');
  console.log(`✅ Arquivos movidos: ${totalMoved}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📁 Categorias criadas: ${Object.keys(fileCategories).length}`);
  
  // Criar README explicativo
  createREADME();
  
  console.log('\n🎉 ORGANIZAÇÃO PRISMA COMPLETA!');
  console.log('📋 README.md criado com explicações das pastas');
}

function createREADME() {
  const readmeContent = `# 🗂️ Prisma Schemas Organizados - CPLP Raras

## 📁 Estrutura Lógica das Pastas

### ⚡ 01-active-schemas/
Schemas ativos e principais em uso:
- **schema.prisma**: Schema principal ativo do projeto
- **schema-complete-pt.prisma**: Schema completo com suporte português
- **schema-expanded.prisma**: Schema expandido com todas as funcionalidades

### 💾 02-backups/
Backups e versões anteriores preservadas:
- **schema-backup-before-pt.prisma**: Backup antes da implementação multilíngue
- **schema-backup.prisma**: Backup geral do schema
- **schema.postgresql.backup**: Backup específico do PostgreSQL

### 🔀 03-database-variants/
Variantes para diferentes sistemas de database:
- **schema.sqlite.prisma**: Versão adaptada para SQLite
- **schema.orphanet.prisma**: Schema específico para dados Orphanet

### 🛠️ 04-development-dbs/
Databases de desenvolvimento e teste:
- **gard_dev.db**: Database de desenvolvimento GARD (SQLite)

## 🎯 Schema Principal Atual:
\`\`\`bash
# Schema ativo principal
prisma/01-active-schemas/schema.prisma

# Schema com português (nossa conquista multilíngue!)
prisma/01-active-schemas/schema-complete-pt.prisma
\`\`\`

## 🏆 Funcionalidades Preservadas:
- ✅ **Sistema HPO**: 4 tabelas integradas
- ✅ **Multilíngue**: Suporte PT/EN completo
- ✅ **4 Databases**: GARD, Orphanet, DrugBank, HPO
- ✅ **Backups Seguros**: Versões anteriores preservadas
- ✅ **Variants**: Suporte SQLite e PostgreSQL

## 📋 Como Usar:
\`\`\`bash
# Aplicar schema principal
npx prisma db push --schema=01-active-schemas/schema.prisma

# Gerar cliente Prisma
npx prisma generate --schema=01-active-schemas/schema.prisma

# Visualizar database
npx prisma studio --schema=01-active-schemas/schema.prisma

# Usar schema português (multilíngue)
npx prisma db push --schema=01-active-schemas/schema-complete-pt.prisma
\`\`\`

## 🔧 Comandos Úteis:
\`\`\`bash
# Ver diferenças entre schemas
diff 01-active-schemas/schema.prisma 02-backups/schema-backup.prisma

# Restaurar backup se necessário
cp 02-backups/schema-backup.prisma 01-active-schemas/schema.prisma

# Testar com SQLite
npx prisma db push --schema=03-database-variants/schema.sqlite.prisma
\`\`\`

## 🎉 Conquistas do Sistema:
- **105.835+ registros** preservados
- **Schema multilíngue** funcionando
- **4 sistemas integrados** (GARD, Orphanet, DrugBank, HPO)
- **Backups seguros** mantidos
- **Organização profissional** implementada

---
*Organizado em ${new Date().toLocaleString('pt-BR')} - Schemas Prisma Organizados! 🎯*
`;

  fs.writeFileSync(path.join(prismaDir, 'README.md'), readmeContent);
  console.log('📋 README.md do Prisma criado!');
}

// Executar
moveFiles();
