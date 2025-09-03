# CPLP-Raras Backend Database System

> **Sistema de Banco de Dados para Doenças Raras nos Países de Língua Portuguesa**

## 🎯 Visão Geral

Este é o projeto **backend dedicado** que contém **TODO** o sistema de banco de dados do CPLP-Raras, separado do projeto Next.js principal para:

- ✅ **Evitar acidentes** com comandos destrutivos
- ✅ **Isolamento completo** dos dados críticos  
- ✅ **Backup e recovery** independentes
- ✅ **Performance otimizada** para operações de BD
- ✅ **Deploy separado** do frontend

## 📊 Estrutura do Projeto

```
cplp_raras_backend/
├── database/              # Bancos SQLite (.db files)
├── schemas/              # Schemas Prisma
├── scripts/              # Scripts de população/importação
│   ├── 01-imports/       # Importação de dados fonte
│   ├── 03-translations/  # Traduções PT/BR
│   └── 04-hpo-system/    # Sistema HPO
├── relatorios/           # Scripts de análise
├── dados_fonte/          # Dados originais (XML, JSON, CSV)
│   ├── orphadata-sources/
│   ├── hpo-official/
│   └── drugbank/
├── backups/              # Backups automáticos
├── configs/              # Configurações (.env)
└── docs/                 # Documentação
```

## 🚀 Instalação Rápida

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Prisma
npm run prisma:generate

# 3. Testar conexão
npm run test:connection

# 4. Verificar dados
npm run check
```

## 📋 Comandos Principais

### 🔧 Desenvolvimento
```bash
npm run dev                 # Servidor de desenvolvimento
npm run prisma:studio      # Interface visual do BD
npm run check              # Verificar status das tabelas
npm run analyze            # Relatório completo
```

### 📦 População de Dados
```bash
npm run populate:orphanet  # Popular dados Orphanet
npm run populate:hpo       # Popular dados HPO
npm run populate:drugbank  # Popular dados DrugBank
```

### 💾 Backup & Recovery
```bash
npm run backup            # Criar backup
npm run restore           # Restaurar backup
```

### ⚠️ Comandos Perigosos (Bloqueados)
```bash
# BLOQUEADO - retorna erro
npm run prisma:reset      

# SÓ funciona com confirmação explícita
npm run prisma:reset:confirm  # ⚠️ APAGA TUDO!
```

## 🎯 Dados Disponíveis

### 📊 Status Atual
- **OrphaDisease**: ~10.000 doenças raras
- **HPOTerm**: ~17.000 termos fenótipicos  
- **GeneAssociation**: ~23.000 associações gene-doença
- **DrugBankDrug**: ~13.000 medicamentos
- **OrphaClassification**: ~500 classificações

### 📈 Fontes de Dados
1. **Orphanet** - Doenças raras europeias
2. **HPO** - Human Phenotype Ontology
3. **GARD** - Genetic and Rare Diseases
4. **DrugBank** - Base de medicamentos

## 🛡️ Segurança

### ✅ Proteções Implementadas
- **Reset bloqueado** por padrão
- **Backups automáticos** antes de operações
- **Scripts de verificação** pós-população
- **Logs detalhados** de todas operações

### ⚠️ Comandos Perigosos Removidos
- `--force-reset` **BLOQUEADO**
- `DROP TABLE` **BLOQUEADO**  
- `DELETE *` **PROTEGIDO**

## 📚 Documentação

- `docs/GARD_POPULATION_PLAN.md` - Plano de população GARD
- `docs/README_GARD_DEVELOPMENT.md` - Desenvolvimento GARD
- `docs/SOLUÇÃO-ERRO-PRISMA.md` - Soluções de problemas
- `docs/FEEDBACK_SYSTEM_README.md` - Sistema de feedback

## 🔄 Workflow Recomendado

```bash
# 1. Verificar status atual
npm run check

# 2. Fazer backup antes de mudanças
npm run backup

# 3. Executar população/atualização
npm run populate:orphanet

# 4. Verificar resultado
npm run analyze

# 5. Se deu erro, restaurar backup
npm run restore
```

## 🚨 Emergência - Recovery

Se algo der errado:

```bash
# 1. Parar tudo
Ctrl+C

# 2. Verificar backups disponíveis
ls backups/

# 3. Restaurar último backup bom
npm run restore

# 4. Verificar integridade
npm run check
```

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/filipepaulista12/cplp_raras/issues)
- **Email**: cplp.raras@gmail.com
- **Website**: [raras-cplp.org](https://raras-cplp.org)

## 📜 Licença

MIT License - Ver arquivo `LICENSE` para detalhes.

---

> ⚠️ **IMPORTANTE**: Este projeto foi separado do Next.js para **MÁXIMA SEGURANÇA** dos dados. Todos os comandos destrutivos foram bloqueados ou protegidos.
