const { PrismaClient } = require('@prisma/client');

console.log('=== ANÁLISE DE TABELAS VAZIAS E FONTES DE DADOS ===\n');

const prisma = new PrismaClient();

async function analyzeDatabase() {
  const emptyTables = [];
  const populatedTables = [];

  console.log('📊 ANÁLISE COMPLETA DAS TABELAS:\n');

  // Analisar cada tabela usando Prisma
  const tables = [
    'orpha_diseases', 'orpha_classifications', 'orpha_genes', 'orpha_phenotypes',
    'hpo_terms', 'hpo_disease_annotations', 'hpo_gene_associations', 
    'drugbank_drugs', 'drugbank_interactions', 'drugbank_targets', 'drugbank_pathways',
    'cplp_diseases', 'cplp_patients', 'cplp_researchers', 'cplp_publications',
    'gard_diseases', 'gard_synonyms', 'gard_subtypes', 'gard_external_references', 'gard_classifications'
  ];

  for (const tableName of tables) {
    try {
      let count = 0;
      
      switch(tableName) {
        case 'orpha_diseases':
          count = await prisma.orpha_diseases.count();
          break;
        case 'orpha_classifications':
          count = await prisma.orpha_classifications.count();
          break;
        case 'orpha_genes':
          count = await prisma.orpha_genes.count();
          break;
        case 'orpha_phenotypes':
          count = await prisma.orpha_phenotypes.count();
          break;
        case 'hpo_terms':
          count = await prisma.hpo_terms.count();
          break;
        case 'hpo_disease_annotations':
          count = await prisma.hpo_disease_annotations.count();
          break;
        case 'hpo_gene_associations':
          count = await prisma.hpo_gene_associations.count();
          break;
        case 'drugbank_drugs':
          count = await prisma.drugbank_drugs.count();
          break;
        case 'drugbank_interactions':
          count = await prisma.drugbank_interactions.count();
          break;
        case 'drugbank_targets':
          count = await prisma.drugbank_targets.count();
          break;
        case 'drugbank_pathways':
          count = await prisma.drugbank_pathways.count();
          break;
        case 'cplp_diseases':
          count = await prisma.cplp_diseases.count();
          break;
        case 'cplp_patients':
          count = await prisma.cplp_patients.count();
          break;
        case 'cplp_researchers':
          count = await prisma.cplp_researchers.count();
          break;
        case 'cplp_publications':
          count = await prisma.cplp_publications.count();
          break;
        case 'gard_diseases':
          count = await prisma.gard_diseases.count();
          break;
        case 'gard_synonyms':
          count = await prisma.gard_synonyms.count();
          break;
        case 'gard_subtypes':
          count = await prisma.gard_subtypes.count();
          break;
        case 'gard_external_references':
          count = await prisma.gard_external_references.count();
          break;
        case 'gard_classifications':
          count = await prisma.gard_classifications.count();
          break;
        default:
          count = 0;
      }
      
      if (count === 0) {
        emptyTables.push(tableName);
        console.log(`❌ ${tableName}: 0 registros`);
      } else {
        populatedTables.push({ name: tableName, count: count });
        console.log(`✅ ${tableName}: ${count.toLocaleString()} registros`);
      }
    } catch (error) {
      console.log(`⚠️  ${tableName}: Erro ao acessar - ${error.message}`);
      emptyTables.push(tableName);
    }
  }

console.log('\n=== TABELAS VAZIAS E POSSÍVEIS FONTES DE DADOS ===\n');

const dataSources = {
  // Orphanet relacionadas
  'orpha_classifications': {
    source: 'Orphanet API ou XML',
    endpoint: 'https://www.orpha.net/orphacom/cahiers/docs/GB/Orphanet_classification.xml',
    description: 'Classificações hierárquicas das doenças órfãs'
  },
  
  'orpha_genes': {
    source: 'Orphanet API ou XML',
    endpoint: 'https://www.orpha.net/orphacom/cahiers/docs/GB/Orphanet_genes.xml',
    description: 'Associações gene-doença órfã'
  },
  
  'orpha_phenotypes': {
    source: 'Orphanet API ou XML', 
    endpoint: 'https://www.orpha.net/orphacom/cahiers/docs/GB/Orphanet_phenotypes.xml',
    description: 'Fenótipos associados às doenças órfãs'
  },

  // HPO relacionadas  
  'hpo_disease_annotations': {
    source: 'HPO Official Files',
    endpoint: 'phenotype.hpoa do GitHub HPO',
    description: 'Anotações de doenças com fenótipos HPO'
  },

  'hpo_gene_associations': {
    source: 'HPO Official Files',
    endpoint: 'genes_to_phenotype.txt e phenotype_to_genes.txt',
    description: 'Associações gene-fenótipo'
  },

  // DrugBank relacionadas
  'drugbank_interactions': {
    source: 'DrugBank XML ou API',
    endpoint: 'DrugBank full database XML',
    description: 'Interações medicamentosas'
  },

  'drugbank_targets': {
    source: 'DrugBank XML ou API', 
    endpoint: 'DrugBank full database XML',
    description: 'Alvos moleculares dos medicamentos'
  },

  'drugbank_pathways': {
    source: 'DrugBank XML ou API',
    endpoint: 'DrugBank full database XML',
    description: 'Vias metabólicas dos medicamentos'
  },

  // CPLP relacionadas
  'cplp_patients': {
    source: 'Sistema CPLP interno',
    endpoint: 'Formulários de registro de pacientes',
    description: 'Pacientes registrados nos países CPLP'
  },

  'cplp_researchers': {
    source: 'Sistema CPLP interno',
    endpoint: 'Cadastro de pesquisadores',
    description: 'Pesquisadores da rede CPLP'
  },

  'cplp_publications': {
    source: 'Bases acadêmicas',
    endpoint: 'PubMed, Scopus, Web of Science',
    description: 'Publicações científicas relacionadas'
  },

  // GARD relacionadas
  'gard_synonyms': {
    source: 'GARD API',
    endpoint: 'https://rarediseases.info.nih.gov/api/gard/',
    description: 'Sinônimos das doenças GARD'
  },

  'gard_subtypes': {
    source: 'GARD API',
    endpoint: 'https://rarediseases.info.nih.gov/api/gard/',
    description: 'Subtipos das doenças GARD'
  },

  'gard_external_references': {
    source: 'GARD API',
    endpoint: 'https://rarediseases.info.nih.gov/api/gard/',
    description: 'Referências externas das doenças GARD'
  },

  'gard_classifications': {
    source: 'GARD API',
    endpoint: 'https://rarediseases.info.nih.gov/api/gard/',
    description: 'Classificações das doenças GARD'
  }
};

emptyTables.forEach(tableName => {
  const source = dataSources[tableName];
  if (source) {
    console.log(`🔍 ${tableName}:`);
    console.log(`   Fonte: ${source.source}`);
    console.log(`   Endpoint: ${source.endpoint}`);
    console.log(`   Descrição: ${source.description}\n`);
  } else {
    console.log(`❓ ${tableName}: Fonte de dados não identificada\n`);
  }
});

console.log('\n=== RESUMO FINAL ===');
console.log(`📈 Tabelas populadas: ${populatedTables.length}`);
console.log(`📉 Tabelas vazias: ${emptyTables.length}`);
console.log(`🎯 Total de tabelas: ${populatedTables.length + emptyTables.length}`);

const totalRecords = populatedTables.reduce((sum, table) => sum + table.count, 0);
console.log(`📊 Total de registros: ${totalRecords.toLocaleString()}`);

await prisma.$disconnect();
}

analyzeDatabase().catch(console.error);
