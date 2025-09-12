const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

console.log('👀 VISUALIZADOR COMPLETO - DADOS DAS 2 BASES');
console.log('═'.repeat(50));

async function mostrarDadosCompletos() {
    const prisma = new PrismaClient();
    let mysqlConn;
    
    try {
        // ===== PRISMA/SQLITE =====
        console.log('\n🗃️ BASE 1: PRISMA/SQLITE');
        console.log('═'.repeat(40));
        
        await prisma.$connect();
        
        // Países CPLP
        console.log('\n🌍 PAÍSES CPLP (PRISMA):');
        console.log('─'.repeat(30));
        const paises = await prisma.cplpCountry.findMany({
            orderBy: { population: 'desc' }
        });
        
        paises.forEach((pais, index) => {
            const pop = parseInt(pais.population).toLocaleString();
            console.log(`${index + 1}. ${pais.flag_emoji} ${pais.name} (${pais.code})`);
            console.log(`   👥 ${pop} habitantes | 🗣️ ${pais.language}`);
            console.log(`   🏥 ${pais.health_system?.substring(0, 40)}...`);
            console.log('');
        });
        
        // HPO Terms
        console.log('\n🧬 HPO TERMS (PRISMA):');
        console.log('─'.repeat(25));
        const hpoTerms = await prisma.hpoTerm.findMany({
            take: 5 // Mostrar apenas 5 primeiros
        });
        
        hpoTerms.forEach((termo, index) => {
            console.log(`${index + 1}. ${termo.hpo_id}: ${termo.name}`);
            console.log(`   🇧🇷 ${termo.name_pt}`);
            console.log(`   📝 ${termo.definition_pt?.substring(0, 50)}...`);
            console.log('');
        });
        
        // Doenças Raras
        console.log('\n🔬 DOENÇAS RARAS (PRISMA):');
        console.log('─'.repeat(30));
        const doencas = await prisma.rareDisease.findMany();
        
        doencas.forEach((doenca, index) => {
            console.log(`${index + 1}. ${doenca.orphacode}: ${doenca.name}`);
            console.log(`   🇧🇷 ${doenca.name_pt}`);
            console.log(`   📊 Prevalência: ${doenca.prevalence}`);
            console.log(`   🧬 Herança: ${doenca.inheritance}`);
            console.log('');
        });
        
        // ===== MYSQL LOCAL =====
        console.log('\n🗃️ BASE 2: MYSQL LOCAL (XAMPP)');
        console.log('═'.repeat(40));
        
        try {
            mysqlConn = await mysql.createConnection({
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: '',
                database: 'cplp_raras'
            });
            
            console.log('✅ MySQL conectado');
            
            // Países CPLP MySQL
            console.log('\n🌍 PAÍSES CPLP (MYSQL):');
            console.log('─'.repeat(28));
            const [mysqlPaises] = await mysqlConn.query('SELECT * FROM cplp_countries ORDER BY CAST(population AS UNSIGNED) DESC');
            
            mysqlPaises.forEach((pais, index) => {
                const pop = parseInt(pais.population).toLocaleString();
                console.log(`${index + 1}. ${pais.name} (${pais.code})`);
                console.log(`   👥 ${pop} habitantes | 🗣️ ${pais.language}`);
                console.log('');
            });
            
            // HPO Terms MySQL
            console.log('\n🧬 HPO TERMS (MYSQL):');
            console.log('─'.repeat(23));
            const [mysqlHpo] = await mysqlConn.query('SELECT * FROM hpo_terms LIMIT 5');
            
            mysqlHpo.forEach((termo, index) => {
                console.log(`${index + 1}. ${termo.hpo_id}: ${termo.name}`);
                console.log(`   🇧🇷 ${termo.name_pt}`);
                console.log('');
            });
            
            // Doenças Raras MySQL
            console.log('\n🔬 DOENÇAS RARAS (MYSQL):');
            console.log('─'.repeat(28));
            const [mysqlDoencas] = await mysqlConn.query('SELECT * FROM rare_diseases');
            
            mysqlDoencas.forEach((doenca, index) => {
                console.log(`${index + 1}. ${doenca.orphacode}: ${doenca.name}`);
                console.log(`   🇧🇷 ${doenca.name_pt}`);
                console.log(`   📊 Prevalência: ${doenca.prevalence}`);
                console.log('');
            });
            
        } catch (mysqlError) {
            console.log('❌ MySQL não disponível:', mysqlError.message);
            console.log('💡 Inicie o MySQL no XAMPP Control Panel');
        }
        
        // ===== COMPARAÇÃO FINAL =====
        console.log('\n📊 RESUMO COMPARATIVO:');
        console.log('═'.repeat(35));
        
        const prismaStats = {
            paises: paises.length,
            hpo: (await prisma.hpoTerm.count()),
            doencas: (await prisma.rareDisease.count())
        };
        
        console.log('🗃️ PRISMA/SQLITE:');
        console.log(`   🌍 Países: ${prismaStats.paises}`);
        console.log(`   🧬 HPO Terms: ${prismaStats.hpo}`);
        console.log(`   🔬 Doenças: ${prismaStats.doencas}`);
        console.log(`   📈 Total: ${prismaStats.paises + prismaStats.hpo + prismaStats.doencas}`);
        
        if (mysqlConn) {
            const [mysqlStats] = await mysqlConn.query(`
                SELECT 
                    (SELECT COUNT(*) FROM cplp_countries) as paises,
                    (SELECT COUNT(*) FROM hpo_terms) as hpo,
                    (SELECT COUNT(*) FROM rare_diseases) as doencas
            `);
            
            console.log('\n🗃️ MYSQL LOCAL:');
            console.log(`   🌍 Países: ${mysqlStats[0].paises}`);
            console.log(`   🧬 HPO Terms: ${mysqlStats[0].hpo}`);
            console.log(`   🔬 Doenças: ${mysqlStats[0].doencas}`);
            console.log(`   📈 Total: ${mysqlStats[0].paises + mysqlStats[0].hpo + mysqlStats[0].doencas}`);
            
            // Verificar sincronização
            const totalPrisma = prismaStats.paises + prismaStats.hpo + prismaStats.doencas;
            const totalMySQL = mysqlStats[0].paises + mysqlStats[0].hpo + mysqlStats[0].doencas;
            
            if (totalPrisma === totalMySQL) {
                console.log('\n🎉 ✅ BASES PERFEITAMENTE SINCRONIZADAS!');
            } else {
                console.log('\n⚠️ ❌ Bases com diferenças');
            }
        }
        
        console.log('\n🔗 INTERFACES VISUAIS:');
        console.log('─'.repeat(25));
        console.log('• Prisma Studio: http://localhost:5555');
        console.log('• phpMyAdmin: http://localhost/phpmyadmin');
        console.log('• Backend APIs: http://localhost:3001');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
        if (mysqlConn) await mysqlConn.end();
    }
}

mostrarDadosCompletos();
