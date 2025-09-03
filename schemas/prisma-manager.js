#!/usr/bin/env node

/**
 * 🎯 PRISMA SCHEMA MANAGER - CPLP Raras
 * Utilitário para gerenciar schemas organizados
 */

const { execSync } = require('child_process');
const path = require('path');

const SCHEMAS = {
  'main': '01-active-schemas/schema.prisma',
  'portuguese': '01-active-schemas/schema-complete-pt.prisma', 
  'expanded': '01-active-schemas/schema-expanded.prisma',
  'sqlite': '03-database-variants/schema.sqlite.prisma',
  'orphanet': '03-database-variants/schema.orphanet.prisma'
};

function showUsage() {
  console.log(`
🎯 PRISMA SCHEMA MANAGER - CPLP Raras
=====================================

📋 Schemas Disponíveis:
${Object.entries(SCHEMAS).map(([name, path]) => 
  `  ${name.padEnd(12)} → ${path}`
).join('\n')}

💡 Comandos Disponíveis:
  node prisma-manager.js push <schema>       # Aplicar schema ao DB
  node prisma-manager.js generate <schema>   # Gerar cliente Prisma
  node prisma-manager.js studio <schema>     # Abrir Prisma Studio
  node prisma-manager.js migrate <schema>    # Criar migração
  node prisma-manager.js list               # Listar schemas
  
🚀 Exemplos:
  node prisma-manager.js push main          # Schema principal
  node prisma-manager.js generate portuguese # Schema PT/EN
  node prisma-manager.js studio expanded    # Visualizar schema expandido
  
🎉 Nossa Conquista HPO: Use 'portuguese' para o sistema multilíngue!
  `);
}

function runCommand(schema, command) {
  if (!SCHEMAS[schema]) {
    console.error(`❌ Schema '${schema}' não encontrado!`);
    console.log(`📋 Schemas disponíveis: ${Object.keys(SCHEMAS).join(', ')}`);
    return;
  }

  const schemaPath = `prisma/${SCHEMAS[schema]}`;
  let cmd;

  switch (command) {
    case 'push':
      cmd = `npx prisma db push --schema=${schemaPath}`;
      break;
    case 'generate':
      cmd = `npx prisma generate --schema=${schemaPath}`;
      break;
    case 'studio':
      cmd = `npx prisma studio --schema=${schemaPath}`;
      break;
    case 'migrate':
      cmd = `npx prisma migrate dev --schema=${schemaPath}`;
      break;
    default:
      console.error(`❌ Comando '${command}' não reconhecido!`);
      return;
  }

  console.log(`🚀 Executando: ${cmd}`);
  console.log(`📁 Schema: ${schemaPath}`);
  console.log('⏳ Aguarde...\n');

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`\n✅ Comando executado com sucesso!`);
  } catch (error) {
    console.error(`\n❌ Erro ao executar comando:`, error.message);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'help') {
  showUsage();
} else if (args[0] === 'list') {
  console.log('\n📋 SCHEMAS DISPONÍVEIS:');
  Object.entries(SCHEMAS).forEach(([name, path]) => {
    console.log(`  ✅ ${name.padEnd(12)} → prisma/${path}`);
  });
  console.log('\n🎯 Use: node prisma-manager.js <comando> <schema>');
} else if (args.length === 2) {
  const [command, schema] = args;
  runCommand(schema, command);
} else {
  console.error('❌ Uso incorreto!');
  showUsage();
}
