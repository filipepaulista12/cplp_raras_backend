/**
 * 🔍 COMPARAÇÃO COMPLETA: MySQL vs Prisma
 * Verificar se Prisma tem TODAS as tabelas do MySQL
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function compararTabelasCompletas() {
    console.log('🔍 COMPARAÇÃO COMPLETA: MySQL vs Prisma');
    console.log('=' + '='.repeat(50));
    
    let mysqlConn;
    
    try {
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexões estabelecidas');
        
        // 1. TODAS AS TABELAS MYSQL
        console.log('\n📊 TABELAS NO MYSQL:');
        console.log('-'.repeat(40));
        
        const [mysqlTables] = await mysqlConn.query('SHOW TABLES');
        
        let mysqlData = {};
        let totalMysqlRecords = 0;
        
        for (let table of mysqlTables) {
            const tableName = Object.values(table)[0];
            try {
                const [count] = await mysqlConn.query(`SELECT COUNT(*) as c FROM ${tableName}`);
                const records = count[0].c;
                mysqlData[tableName] = records;
                totalMysqlRecords += records;
                
                const status = records > 0 ? '✅' : '⚪';
                console.log(`   ${status} ${tableName}: ${records.toLocaleString()} registros`);
            } catch (e) {
                console.log(`   ❌ ${tableName}: erro`);
            }
        }
        
        console.log(`\n📊 TOTAL MYSQL: ${totalMysqlRecords.toLocaleString()} registros em ${mysqlTables.length} tabelas`);
        
        // 2. VERIFICAR PRISMA - MODELOS DISPONÍVEIS
        console.log('\n💎 MODELOS NO PRISMA:');
        console.log('-'.repeat(40));
        
        let prismaData = {};
        let totalPrismaRecords = 0;
        
        // Listar todos os modelos disponíveis no Prisma
        const prismaModels = [
            'cplpCountry',
            'rareDisease', 
            'hpoTerm',
            'drugbankDrug',
            'drugDiseaseAssociation',
            'drugInteraction',
            'hpoDiseasAssociation',
            'hpoGeneAssociation',
            'hpoPhenotypeAssociation',
            'countryStatistics',
            'countryDiseaseData',
            'diseasePhenotype',
            'diseaseClinicalSign',
            'diseaseGene',
            'diseaseExternalMapping',
            'diseaseClassification',
            'diseaseDiagnostic',
            'diseaseEpidemiology',
            'diseaseManagement',
            'diseaseSummary',
            'orphaImportLog'
        ];
        
        for (let modelName of prismaModels) {
            try {
                const count = await prisma[modelName].count();
                prismaData[modelName] = count;
                totalPrismaRecords += count;
                
                const status = count > 0 ? '✅' : '⚪';
                console.log(`   ${status} ${modelName}: ${count.toLocaleString()} registros`);
            } catch (e) {
                console.log(`   ❌ ${modelName}: não existe ou erro`);
            }
        }
        
        console.log(`\n📊 TOTAL PRISMA: ${totalPrismaRecords.toLocaleString()} registros`);
        
        // 3. COMPARAÇÃO DIRETA - TABELAS EQUIVALENTES
        console.log('\n🔄 COMPARAÇÃO DIRETA:');
        console.log('-'.repeat(50));
        
        const equivalencias = {
            'cplp_countries': 'cplpCountry',
            'hpo_terms': 'hpoTerm', 
            'orpha_diseases': 'rareDisease',
            'drugbank_drugs': 'drugbankDrug',
            'drug_interactions': 'drugInteraction',
            'drug_disease_associations': 'drugDiseaseAssociation'
        };
        
        let tabelasCompletas = 0;
        let tabelasParciais = 0;
        let tabelasFaltando = 0;
        
        for (let [mysqlTable, prismaModel] of Object.entries(equivalencias)) {
            const mysqlCount = mysqlData[mysqlTable] || 0;
            const prismaCount = prismaData[prismaModel] || 0;
            
            let status;
            if (prismaCount === mysqlCount && prismaCount > 0) {
                status = '✅ IDÊNTICO';
                tabelasCompletas++;
            } else if (prismaCount > 0 && prismaCount < mysqlCount) {
                status = '⚠️  PARCIAL';
                tabelasParciais++;
            } else if (prismaCount === 0 && mysqlCount > 0) {
                status = '❌ FALTANDO';
                tabelasFaltando++;
            } else {
                status = '⚪ VAZIO';
            }
            
            const percentage = mysqlCount > 0 ? ((prismaCount / mysqlCount) * 100).toFixed(1) : '0.0';
            
            console.log(`   ${status} ${mysqlTable} → ${prismaModel}`);
            console.log(`      MySQL: ${mysqlCount.toLocaleString()} | Prisma: ${prismaCount.toLocaleString()} | Sync: ${percentage}%`);
        }
        
        // 4. TABELAS SÓ NO MYSQL (NÃO MAPEADAS)
        console.log('\n🗄️  TABELAS SÓ NO MYSQL:');
        console.log('-'.repeat(30));
        
        const tabelasMapeadas = Object.keys(equivalencias);
        const tabelasNaoMapeadas = Object.keys(mysqlData).filter(table => !tabelasMapeadas.includes(table));
        
        for (let table of tabelasNaoMapeadas) {
            const records = mysqlData[table];
            const status = records > 0 ? '❌ DADOS PERDIDOS' : '⚪ VAZIA';
            console.log(`   ${status} ${table}: ${records.toLocaleString()}`);
        }
        
        // 5. ANÁLISE FINAL
        console.log('\n🎯 ANÁLISE FINAL:');
        console.log('=' + '='.repeat(40));
        
        const totalTabelasEquivalentes = Object.keys(equivalencias).length;
        const porcentagemCompleta = ((tabelasCompletas / totalTabelasEquivalentes) * 100).toFixed(1);
        const porcentagemDados = ((totalPrismaRecords / totalMysqlRecords) * 100).toFixed(1);
        
        console.log(`📊 ESTATÍSTICAS GERAIS:`);
        console.log(`   🗄️  MySQL: ${mysqlTables.length} tabelas, ${totalMysqlRecords.toLocaleString()} registros`);
        console.log(`   💎 Prisma: ${prismaModels.length} modelos, ${totalPrismaRecords.toLocaleString()} registros`);
        console.log(`   📈 Sincronização de dados: ${porcentagemDados}%`);
        
        console.log(`\n📋 STATUS DAS TABELAS PRINCIPAIS:`);
        console.log(`   ✅ Completas: ${tabelasCompletas}/${totalTabelasEquivalentes} (${porcentagemCompleta}%)`);
        console.log(`   ⚠️  Parciais: ${tabelasParciais}`);
        console.log(`   ❌ Faltando: ${tabelasFaltando}`);
        console.log(`   📊 Não mapeadas: ${tabelasNaoMapeadas.length}`);
        
        // 6. RESULTADO FINAL
        console.log('\n🏆 CONCLUSÃO:');
        console.log('=' + '='.repeat(30));
        
        if (tabelasCompletas === totalTabelasEquivalentes && totalPrismaRecords > 10000) {
            console.log('🎉 PRISMA ESTÁ 100% SINCRONIZADO!');
            console.log('✅ Todas as tabelas principais estão completas');
            console.log('✅ Dados científicos completos disponíveis');
        } else if (porcentagemDados > 50) {
            console.log('✅ PRISMA TEM DADOS SUBSTANCIAIS');
            console.log(`📊 ${porcentagemDados}% dos dados sincronizados`);
            console.log(`📋 ${tabelasCompletas} de ${totalTabelasEquivalentes} tabelas completas`);
        } else {
            console.log('⚠️  PRISMA PRECISA DE MAIS SINCRONIZAÇÃO');
            console.log(`📊 Apenas ${porcentagemDados}% dos dados sincronizados`);
            console.log(`❌ ${tabelasFaltando} tabelas principais estão faltando dados`);
        }
        
        // 7. RECOMENDAÇÕES
        console.log('\n💡 RECOMENDAÇÕES:');
        if (tabelasFaltando > 0) {
            console.log('• Sincronizar tabelas faltando dados');
        }
        if (tabelasParciais > 0) {
            console.log('• Completar tabelas parciais');
        }
        if (tabelasNaoMapeadas.length > 0) {
            console.log('• Mapear tabelas não cobertas pelo Prisma');
        }
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

compararTabelasCompletas();
