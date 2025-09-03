#!/usr/bin/env node

/**
 * 🔍 ANÁLISE COMPLETA DO BANCO ORIGINAL
 * Vamos ver TODAS as tabelas e dados que tínhamos
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function analisarBancoCompleto() {
    console.log('🔍 ANALISANDO BANCO ORIGINAL COMPLETO...');
    console.log(`📅 ${new Date().toLocaleString('pt-BR')}`);
    
    let totalGeralRecords = 0;
    const tabelas = [];
    
    try {
        // Conectar
        await prisma.$connect();
        
        // Listar TODAS as tabelas usando query raw
        console.log('\n📊 DESCOBRINDO TODAS AS TABELAS...');
        
        const tabelasResult = await prisma.$queryRaw`
            SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
        `;
        
        console.log('📋 TABELAS ENCONTRADAS:');
        for (const row of tabelasResult) {
            console.log(`  - ${row.name}`);
        }
        
        // Contar registros em cada tabela
        console.log('\n📊 CONTANDO REGISTROS POR TABELA:');
        
        for (const row of tabelasResult) {
            try {
                const tableName = row.name;
                const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
                const count = countResult[0].count;
                
                tabelas.push({
                    nome: tableName,
                    registros: count
                });
                
                totalGeralRecords += count;
                console.log(`  ✅ ${tableName}: ${count.toLocaleString('pt-BR')} registros`);
                
            } catch (error) {
                console.log(`  ❌ ${row.name}: erro - ${error.message}`);
            }
        }
        
        console.log(`\n🎯 TOTAL GERAL: ${totalGeralRecords.toLocaleString('pt-BR')} REGISTROS`);
        
        // Ver estrutura de algumas tabelas importantes
        console.log('\n🏗️ ESTRUTURA DAS PRINCIPAIS TABELAS:');
        
        const tabelasImportantes = ['HPOTerm', 'OrphanetDisorder', 'DrugBankDrug', 'GardDisease'];
        
        for (const tableName of tabelasImportantes) {
            try {
                const estrutura = await prisma.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`);
                console.log(`\n📋 ${tableName}:`);
                estrutura.forEach(col => {
                    console.log(`   - ${col.name}: ${col.type}`);
                });
            } catch (error) {
                console.log(`\n❌ ${tableName}: não encontrada ou erro`);
            }
        }
        
        // Salvar resultado completo
        const relatorio = {
            dataAnalise: new Date().toISOString(),
            totalTabelas: tabelasResult.length,
            totalRegistros: totalGeralRecords,
            tabelas: tabelas.sort((a, b) => b.registros - a.registros)
        };
        
        fs.writeFileSync('database/ANALISE_BANCO_COMPLETO.json', JSON.stringify(relatorio, null, 2));
        
        console.log('\n🎉 ANÁLISE COMPLETA!');
        console.log(`📁 Resultado salvo: database/ANALISE_BANCO_COMPLETO.json`);
        console.log(`📊 Total de tabelas: ${tabelasResult.length}`);
        console.log(`📊 Total de registros: ${totalGeralRecords.toLocaleString('pt-BR')}`);
        
        console.log('\n🚀 AGORA VAMOS EXPORTAR TODAS AS TABELAS PARA O SERVIDOR!');
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analisarBancoCompleto();
