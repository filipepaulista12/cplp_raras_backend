# 🧬 GARD-BR: Sistema Completo de Doenças Raras

## 📋 Status do Projeto

### ✅ Implementação Concluída (Branch: main)
- **Sistema GARD-BR funcional** com 20 doenças CPLP
- **Estrutura bilíngue** PT/EN completa
- **Páginas dinâmicas** de listagem e detalhe
- **Schema PostgreSQL** completo
- **Interface responsiva** otimizada

### 🚧 Em Desenvolvimento (Branch: feature/populate-all-gard-diseases)
- **Scripts de scraping** para importar todas as ~7.000 doenças GARD
- **Pipeline de transformação** de dados
- **Sistema de tradução** automática PT/EN

## 🚀 Como Executar

### Desenvolvimento Local
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

### Testar Sistema GARD-BR
1. Abra http://localhost:3000
2. Navegue para "Recursos Digitais" → "Base de Dados de Doenças"
3. Teste as 20 doenças implementadas com busca e filtros

## 🏗️ Arquitetura

### Frontend
- **Next.js 15** com App Router
- **TypeScript** com validação Zod
- **Tailwind CSS** para styling
- **Componentes reutilizáveis** shadcn/ui

### Dados
- **20 doenças CPLP** detalhadas (Anemia Falciforme, Talassemia, G6PD, etc.)
- **Estrutura bilíngue** preparada para tradução IA
- **Códigos internacionais** ORPHA e CID-10
- **Metadados completos** por doença

### Scripts de População (Em desenvolvimento)
- `analyze-gard-structure.ts` - Análise da estrutura do GARD original
- `scrape-gard-diseases.ts` - Extração automatizada de dados
- `transform-gard-data.ts` - Conversão para formato GARD-BR
- `populate-database.ts` - Importação para PostgreSQL

## 📊 Doenças CPLP Implementadas

### 🌍 Altamente Prevalentes CPLP
- **Anemia Falciforme** - 1 em 600 nascimentos (população africana)
- **Talassemia Major** - Região mediterrânica (Portugal)
- **Deficiência G6PD** - Proteção contra malária (África)

### 🧬 Doenças Genéticas Raras Clássicas
- Síndrome de Marfan
- Fibrose Cística
- Doença de Huntington
- Distrofia Muscular de Duchenne
- Fenilcetonúria
- Esclerose Lateral Amiotrófica
- Ataxia de Friedreich
- Síndrome de Turner
- Hemofilia A
- Síndrome de Prader-Willi
- Osteogénese Imperfeita
- Síndrome de Angelman
- Doença de Wilson
- Síndrome de DiGeorge
- Neurofibromatose Tipo 1
- Síndrome de Rett
- Hiperplasia Adrenal Congénita

## 🔄 Próximas Etapas

### Fase 1: Finalização da População
1. **Resolver dependências** npm para scripts de scraping
2. **Executar análise** da estrutura do GARD original
3. **Implementar scraping** das ~7.000 doenças
4. **Transformar dados** para formato GARD-BR

### Fase 2: Tradução e Refinamento
1. **Integração OpenAI** para tradução automática PT
2. **Validação médica** de traduções críticas
3. **Otimização de performance** para grandes volumes
4. **Deploy em produção**

## 🛠️ Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Servidor desenvolvimento
npm run build               # Build produção
npm run lint               # Verificar código

# Scripts GARD (Em desenvolvimento)
npm run analyze-gard       # Analisar estrutura GARD
npm run scrape-gard        # Extrair dados GARD
npm run populate-db        # Popular banco de dados

# Scripts utilitários
npm run demo-data          # Gerar dados demo
npm run import-gard        # Importar dados específicos
```

## 📁 Estrutura do Projeto

```
src/
├── app/
│   └── recursos-digitais/
│       └── doencas/
│           ├── page.tsx              # Listagem de doenças
│           └── [id]/page.tsx         # Detalhes da doença
├── lib/
│   ├── database/                     # Schemas SQL
│   ├── types/                        # Tipos TypeScript
│   └── validation/                   # Schemas Zod
└── types/
    └── gard.ts                       # Interfaces GARD

scripts/
├── analyze-gard-structure.ts         # Análise estrutural
├── scrape-gard-diseases.ts          # Web scraping
├── transform-gard-data.ts            # Transformação dados
└── populate-database.ts              # Importação DB

prisma/
└── schema.prisma                     # Schema banco dados
```

## 🌐 Links Úteis

- **Site GARD Original**: https://rarediseases.info.nih.gov
- **Orphanet**: https://www.orpha.net
- **OMS Doenças Raras**: https://www.who.int/health-topics/rare-diseases

---

## 🔧 Resolução de Problemas

### Dependências npm
Se encontrar problemas com dependências:
```bash
npm cache clean --force
npm install
```

### Scripts de População
Para desenvolver scripts de scraping:
```bash
# Instalar dependências manualmente se necessário
npm install puppeteer zod lodash
npm install --save-dev @types/lodash
```

---

*Última atualização: 30 de Agosto de 2025*
*Branch atual: feature/populate-all-gard-diseases*
