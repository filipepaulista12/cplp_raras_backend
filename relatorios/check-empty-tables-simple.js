const { PrismaClient } = require('@prisma/client');

async function checkEmptyTables() {
  const prisma = new PrismaClient();
  
  console.log('=== ANÁLISE DE TABELAS VAZIAS ===\n');
  
  try {
    // Obter lista de todas as tabelas
    const tablesResult = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name != '_prisma_migrations'
    `;
    
    console.log(`🔍 Encontradas ${tablesResult.length} tabelas no banco\n`);
    
    const emptyTables = [];
    const populatedTables = [];
    
    // Verificar cada tabela
    for (const table of tablesResult) {
      try {
        const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table.name}`);
        const count = countResult[0].count;
        
        if (count === 0) {
          emptyTables.push(table.name);
          console.log(`❌ ${table.name}: 0 registros`);
        } else {
          populatedTables.push({ name: table.name, count: count });
          console.log(`✅ ${table.name}: ${count.toLocaleString()} registros`);
        }
      } catch (error) {
        console.log(`⚠️  ${table.name}: Erro ao contar - ${error.message}`);
        emptyTables.push(table.name);
      }
    }
    
    console.log('\n=== TABELAS VAZIAS E COMO POPULÁ-LAS ===\n');
    
    const populationGuide = {
      'OrphaDisease': {
        description: 'Doenças órfãs do Orphanet',
        source: 'Orphanet XML ou API',
        files: ['orphanet_rare_diseases.xml'],
        script: 'Já temos: scripts/import-orphanet-complete.js'
      },
      
      'OrphaClassification': {
        description: 'Classificações hierárquicas Orphanet',
        source: 'Orphanet Classifications XML',
        files: ['Orphanet_classification.xml'],
        script: 'Criar: scripts/import-orphanet-classifications.js'
      },
      
      'OrphaGene': {
        description: 'Associações gene-doença Orphanet',
        source: 'Orphanet Genes XML',
        files: ['Orphanet_genes.xml'],
        script: 'Criar: scripts/import-orphanet-genes.js'
      },
      
      'OrphaPhenotype': {
        description: 'Fenótipos associados às doenças Orphanet',
        source: 'Orphanet Phenotypes XML',
        files: ['Orphanet_phenotypes.xml'],
        script: 'Criar: scripts/import-orphanet-phenotypes.js'
      },
      
      'HpoTerm': {
        description: 'Termos da Human Phenotype Ontology',
        source: 'HPO Official JSON',
        files: ['hp-full.json'],
        script: 'Já temos: scripts/process-official-hpo-complete.js'
      },
      
      'HpoDiseaseAnnotation': {
        description: 'Anotações doença-fenótipo HPO',
        source: 'HPO Annotations File',
        files: ['phenotype.hpoa'],
        script: 'Criar: scripts/import-hpo-disease-annotations.js'
      },
      
      'HpoGeneAssociation': {
        description: 'Associações gene-fenótipo HPO',
        source: 'HPO Gene Files',
        files: ['genes_to_phenotype.txt', 'phenotype_to_genes.txt'],
        script: 'Já temos: scripts/process-hpo-massive-associations.js'
      },
      
      'DrugbankDrug': {
        description: 'Medicamentos do DrugBank',
        source: 'DrugBank XML Database',
        files: ['drugbank_all_full_database.xml'],
        script: 'Já temos: scripts/import-drugbank-complete.js'
      },
      
      'DrugbankInteraction': {
        description: 'Interações medicamentosas DrugBank',
        source: 'DrugBank XML (seção interactions)',
        files: ['drugbank_all_full_database.xml'],
        script: 'Criar: scripts/import-drugbank-interactions.js'
      },
      
      'DrugbankTarget': {
        description: 'Alvos moleculares DrugBank',
        source: 'DrugBank XML (seção targets)',
        files: ['drugbank_all_full_database.xml'],
        script: 'Criar: scripts/import-drugbank-targets.js'
      },
      
      'DrugbankPathway': {
        description: 'Vias metabólicas DrugBank',
        source: 'DrugBank XML (seção pathways)',
        files: ['drugbank_all_full_database.xml'],
        script: 'Criar: scripts/import-drugbank-pathways.js'
      },
      
      'CplpDisease': {
        description: 'Doenças específicas dos países CPLP',
        source: 'Dados internos CPLP + mapeamento',
        files: ['Dados coletados pelos pesquisadores'],
        script: 'Criar: scripts/import-cplp-diseases.js'
      },
      
      'CplpPatient': {
        description: 'Pacientes registrados CPLP',
        source: 'Formulários de registro + REDCap',
        files: ['Formulários web + base REDCap'],
        script: 'Integração com REDCap (já planejada)'
      },
      
      'CplpResearcher': {
        description: 'Pesquisadores da rede CPLP',
        source: 'Cadastro manual + ORCID',
        files: ['Formulário de cadastro'],
        script: 'Criar: scripts/import-researchers.js'
      },
      
      'CplpPublication': {
        description: 'Publicações científicas CPLP',
        source: 'PubMed + Scopus + Web of Science',
        files: ['APIs das bases acadêmicas'],
        script: 'Criar: scripts/import-publications.js'
      },
      
      'GardDisease': {
        description: 'Doenças do GARD (NIH)',
        source: 'GARD API',
        files: ['API calls'],
        script: 'Já temos: scripts/import-gard-complete.js'
      },
      
      'GardSynonym': {
        description: 'Sinônimos GARD',
        source: 'GARD API (campo synonyms)',
        files: ['Extrair da API GARD'],
        script: 'Modificar: scripts/import-gard-complete.js'
      },
      
      'GardSubtype': {
        description: 'Subtipos GARD',
        source: 'GARD API (campo subtypes)',
        files: ['Extrair da API GARD'],
        script: 'Modificar: scripts/import-gard-complete.js'
      },
      
      'GardExternalReference': {
        description: 'Referências externas GARD',
        source: 'GARD API (campo external_references)',
        files: ['Extrair da API GARD'],
        script: 'Modificar: scripts/import-gard-complete.js'
      },
      
      'GardClassification': {
        description: 'Classificações GARD',
        source: 'GARD API (campo classifications)',
        files: ['Extrair da API GARD'],
        script: 'Modificar: scripts/import-gard-complete.js'
      }
    };
    
    emptyTables.forEach(tableName => {
      const guide = populationGuide[tableName];
      if (guide) {
        console.log(`🔍 ${tableName}:`);
        console.log(`   📝 Descrição: ${guide.description}`);
        console.log(`   📥 Fonte: ${guide.source}`);
        console.log(`   📁 Arquivos: ${guide.files.join(', ')}`);
        console.log(`   🔧 Script: ${guide.script}\n`);
      } else {
        console.log(`❓ ${tableName}: Guia de população não definido\n`);
      }
    });
    
    console.log('=== PRIORIDADES DE POPULAÇÃO ===\n');
    
    const priorities = [
      {
        priority: 1,
        tables: ['HpoTerm', 'OrphaDisease', 'DrugbankDrug', 'GardDisease'],
        description: 'Tabelas principais - já temos scripts funcionais',
        action: 'Executar scripts existentes'
      },
      {
        priority: 2,
        tables: ['HpoDiseaseAnnotation', 'HpoGeneAssociation'],
        description: 'Associações HPO - dados já baixados',
        action: 'Adaptar scripts existentes'
      },
      {
        priority: 3,
        tables: ['OrphaClassification', 'OrphaGene', 'OrphaPhenotype'],
        description: 'Dados complementares Orphanet',
        action: 'Baixar XMLs e criar scripts'
      },
      {
        priority: 4,
        tables: ['DrugbankInteraction', 'DrugbankTarget', 'DrugbankPathway'],
        description: 'Dados complementares DrugBank',
        action: 'Extrair do XML existente'
      },
      {
        priority: 5,
        tables: ['GardSynonym', 'GardSubtype', 'GardExternalReference', 'GardClassification'],
        description: 'Dados complementares GARD',
        action: 'Expandir script GARD existente'
      },
      {
        priority: 6,
        tables: ['CplpDisease', 'CplpPatient', 'CplpResearcher', 'CplpPublication'],
        description: 'Sistema CPLP interno',
        action: 'Desenvolver sistema de cadastro'
      }
    ];
    
    priorities.forEach(p => {
      console.log(`🎯 PRIORIDADE ${p.priority}: ${p.description}`);
      console.log(`   📊 Tabelas: ${p.tables.join(', ')}`);
      console.log(`   ⚡ Ação: ${p.action}\n`);
    });
    
    console.log('=== RESUMO FINAL ===');
    console.log(`📈 Tabelas populadas: ${populatedTables.length}`);
    console.log(`📉 Tabelas vazias: ${emptyTables.length}`);
    console.log(`🎯 Total de tabelas: ${tablesResult.length}`);
    
    if (populatedTables.length > 0) {
      const totalRecords = populatedTables.reduce((sum, table) => sum + table.count, 0);
      console.log(`📊 Total de registros: ${totalRecords.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('Erro ao analisar tabelas:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmptyTables();
