const { PrismaClient } = require('@prisma/client');

async function detailedTableAnalysis() {
  const prisma = new PrismaClient();
  
  console.log('=== ANÁLISE DETALHADA DAS TABELAS ===\n');
  
  try {
    // Obter lista de todas as tabelas
    const tablesResult = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name != '_prisma_migrations'
    `;
    
    console.log(`🔍 Analisando ${tablesResult.length} tabelas do banco\n`);
    
    const tableAnalysis = [];
    
    // Verificar cada tabela
    for (const table of tablesResult) {
      try {
        const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table.name}`);
        const count = Number(countResult[0].count); // Converter para Number para evitar BigInt
        
        tableAnalysis.push({ name: table.name, count: count });
      } catch (error) {
        console.log(`⚠️  ${table.name}: Erro ao contar - ${error.message}`);
        tableAnalysis.push({ name: table.name, count: 0, error: error.message });
      }
    }
    
    // Ordenar por quantidade de registros
    tableAnalysis.sort((a, b) => (b.count || 0) - (a.count || 0));
    
    console.log('📊 TABELAS ORDENADAS POR QUANTIDADE DE DADOS:\n');
    
    const emptyTables = [];
    const lowDataTables = [];
    const wellPopulatedTables = [];
    
    tableAnalysis.forEach(table => {
      const count = table.count || 0;
      const status = table.error ? '❌' : count === 0 ? '🚫' : count < 100 ? '⚠️' : count < 1000 ? '🔶' : '✅';
      
      console.log(`${status} ${table.name}: ${count.toLocaleString()} registros${table.error ? ` (${table.error})` : ''}`);
      
      if (table.error || count === 0) {
        emptyTables.push(table);
      } else if (count < 1000) {
        lowDataTables.push(table);
      } else {
        wellPopulatedTables.push(table);
      }
    });
    
    console.log('\n=== CATEGORIZAÇÃO DAS TABELAS ===\n');
    
    if (emptyTables.length > 0) {
      console.log('🚫 TABELAS VAZIAS OU COM ERRO:');
      emptyTables.forEach(table => {
        console.log(`   - ${table.name}: ${table.count || 0} registros${table.error ? ` (${table.error})` : ''}`);
      });
      console.log();
    }
    
    if (lowDataTables.length > 0) {
      console.log('⚠️  TABELAS COM POUCOS DADOS (<1000 registros):');
      lowDataTables.forEach(table => {
        console.log(`   - ${table.name}: ${table.count} registros`);
      });
      console.log();
    }
    
    console.log('✅ TABELAS BEM POPULADAS (≥1000 registros):');
    wellPopulatedTables.forEach(table => {
      console.log(`   - ${table.name}: ${table.count.toLocaleString()} registros`);
    });
    console.log();
    
    console.log('=== OPORTUNIDADES DE ENRIQUECIMENTO ===\n');
    
    const enrichmentOpportunities = [
      {
        table: 'orpha_medical_classifications',
        current: 0,
        potential: '~20,000',
        source: 'Orphanet Classifications XML',
        description: 'Classificações médicas das doenças órfãs',
        priority: 'ALTA',
        effort: 'Médio'
      },
      {
        table: 'orpha_phenotypes', 
        current: 0,
        potential: '~50,000',
        source: 'Orphanet Phenotypes XML',
        description: 'Fenótipos associados às doenças',
        priority: 'ALTA',
        effort: 'Médio'
      },
      {
        table: 'orpha_clinical_signs',
        current: 0,
        potential: '~30,000',
        source: 'Orphanet Clinical Signs XML',
        description: 'Sinais clínicos das doenças',
        priority: 'ALTA',
        effort: 'Médio'
      },
      {
        table: 'orpha_gene_associations',
        current: 0,
        potential: '~15,000',
        source: 'Orphanet Genes XML',
        description: 'Associações gene-doença',
        priority: 'ALTA',
        effort: 'Médio'
      },
      {
        table: 'orpha_natural_history',
        current: 0,
        potential: '~8,000',
        source: 'Orphanet Natural History XML',
        description: 'História natural das doenças',
        priority: 'MÉDIA',
        effort: 'Alto'
      },
      {
        table: 'orpha_epidemiology',
        current: 0,
        potential: '~5,000',
        source: 'Orphanet Epidemiology XML',
        description: 'Dados epidemiológicos',
        priority: 'MÉDIA',
        effort: 'Alto'
      },
      {
        table: 'orpha_textual_information',
        current: 0,
        potential: '~10,000',
        source: 'Orphanet Textual Info XML',
        description: 'Informações textuais detalhadas',
        priority: 'BAIXA',
        effort: 'Alto'
      },
      {
        table: 'drug_disease_associations',
        current: 0,
        potential: '~5,000',
        source: 'DrugBank + Orphanet mapping',
        description: 'Associações medicamento-doença',
        priority: 'ALTA',
        effort: 'Alto'
      },
      {
        table: 'hpo_phenotype_associations',
        current: 0,
        potential: '~100,000',
        source: 'HPO phenotype.hpoa file',
        description: 'Associações fenótipo detalhadas',
        priority: 'ALTA',
        effort: 'Baixo'
      },
      {
        table: 'orpha_cplp_epidemiology',
        current: 0,
        potential: '~500',
        source: 'Dados coletados CPLP',
        description: 'Epidemiologia específica CPLP',
        priority: 'MÉDIA',
        effort: 'Muito Alto'
      }
    ];
    
    enrichmentOpportunities.forEach(opp => {
      console.log(`🎯 ${opp.table}:`);
      console.log(`   📊 Atual: ${opp.current} → Potencial: ${opp.potential}`);
      console.log(`   📥 Fonte: ${opp.source}`);
      console.log(`   📝 Descrição: ${opp.description}`);
      console.log(`   🔥 Prioridade: ${opp.priority} | 💪 Esforço: ${opp.effort}\n`);
    });
    
    console.log('=== PLANO DE AÇÃO RECOMENDADO ===\n');
    
    const actionPlan = [
      {
        phase: 1,
        title: 'Enriquecimento HPO (Baixo Esforço)',
        tables: ['hpo_phenotype_associations'],
        description: 'Usar arquivo phenotype.hpoa já baixado',
        estimatedTime: '1-2 horas',
        impact: 'ALTO'
      },
      {
        phase: 2,
        title: 'Enriquecimento Orphanet Core (Médio Esforço)',
        tables: ['orpha_medical_classifications', 'orpha_phenotypes', 'orpha_clinical_signs', 'orpha_gene_associations'],
        description: 'Baixar e processar XMLs principais do Orphanet',
        estimatedTime: '1-2 dias',
        impact: 'MUITO ALTO'
      },
      {
        phase: 3,
        title: 'Associações DrugBank (Alto Esforço)',
        tables: ['drug_disease_associations'],
        description: 'Criar mapeamentos entre medicamentos e doenças',
        estimatedTime: '2-3 dias',
        impact: 'ALTO'
      },
      {
        phase: 4,
        title: 'Dados Complementares Orphanet (Alto Esforço)',
        tables: ['orpha_natural_history', 'orpha_epidemiology', 'orpha_textual_information'],
        description: 'Dados detalhados adicionais do Orphanet',
        estimatedTime: '3-5 dias',
        impact: 'MÉDIO'
      },
      {
        phase: 5,
        title: 'Sistema CPLP (Muito Alto Esforço)',
        tables: ['orpha_cplp_epidemiology'],
        description: 'Desenvolver sistema de coleta de dados CPLP',
        estimatedTime: '2-4 semanas',
        impact: 'ESPECÍFICO CPLP'
      }
    ];
    
    actionPlan.forEach(phase => {
      console.log(`🚀 FASE ${phase.phase}: ${phase.title}`);
      console.log(`   📋 Tabelas: ${phase.tables.join(', ')}`);
      console.log(`   📝 Descrição: ${phase.description}`);
      console.log(`   ⏱️  Tempo Estimado: ${phase.estimatedTime}`);
      console.log(`   💥 Impacto: ${phase.impact}\n`);
    });
    
    console.log('=== RESUMO ESTATÍSTICO ===');
    const totalRecords = tableAnalysis.reduce((sum, table) => sum + (table.count || 0), 0);
    console.log(`📊 Total atual de registros: ${totalRecords.toLocaleString()}`);
    console.log(`🎯 Potencial com enriquecimento: ~${(totalRecords + 243500).toLocaleString()}`);
    console.log(`📈 Crescimento potencial: ~${Math.round(((243500) / totalRecords) * 100)}%`);
    
  } catch (error) {
    console.error('Erro ao analisar tabelas:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

detailedTableAnalysis();
