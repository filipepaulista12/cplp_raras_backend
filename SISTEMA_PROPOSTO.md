# 🚀 Sistema Backend Modular CPLP-Raras

## 🎯 Objetivo
Criar um sistema backend robusto, modular e escalável para gerenciar múltiplas bases de dados de doenças raras, mantendo **TODOS OS DADOS EXISTENTES** e adicionando funcionalidades enterprise.

## 🏗️ Arquitetura Proposta

### **Framework Principal: NestJS + TypeScript**
- ✅ **Modular por design** - cada fonte de dados é um módulo independente
- ✅ **TypeScript nativo** - type safety completo
- ✅ **Decorators** - fácil manutenção e documentação automática
- ✅ **Dependency Injection** - testabilidade e flexibilidade
- ✅ **Swagger automático** - documentação API sempre atualizada

### **Estrutura Modular**
```
src/
├── modules/
│   ├── orphanet/          # Módulo Orphanet (dados existentes)
│   ├── hpo/              # Módulo HPO (dados existentes) 
│   ├── gard/             # Módulo GARD
│   ├── drugbank/         # Módulo DrugBank (dados existentes)
│   ├── cplp/             # Módulo países CPLP
│   └── translations/     # Módulo traduções PT/EN
├── shared/
│   ├── database/         # Prisma + configurações
│   ├── interfaces/       # Interfaces comuns
│   ├── utils/           # Utilitários
│   └── validators/      # Validações
├── api/
│   ├── rest/            # API REST
│   ├── graphql/         # API GraphQL
│   └── open-data/       # Exports CSV/RDF/JSON-LD
└── services/
    ├── import/          # Serviços de importação
    ├── sync/            # Sincronização de dados
    ├── backup/          # Sistema de backup
    └── version/         # Controle de versões
```

## 🗄️ **Migração Database: SQLite → PostgreSQL**

### **Vantagens PostgreSQL**
- ✅ **Escalabilidade** - suporte a milhões de registros
- ✅ **JSONB nativo** - dados semi-estruturados eficientes
- ✅ **Full-text search** - busca em português otimizada
- ✅ **Replicação** - backup automático e alta disponibilidade
- ✅ **Extensions** - PostGIS para dados geográficos CPLP

### **Estratégia de Migração**
1. **Manter SQLite** como desenvolvimento/teste
2. **PostgreSQL** para produção
3. **Scripts automáticos** de migração
4. **Backup completo** antes de qualquer mudança

## 🔄 **Sistema de Atualizações Automáticas**

### **Módulo Orphanet**
```typescript
@Module({
  controllers: [OrphanetController],
  providers: [
    OrphanetService,
    OrphanetSyncService,
    OrphanetImportService
  ]
})
export class OrphanetModule {
  // Auto-sync diário
  // Versionamento automático
  // Rollback em caso de erro
}
```

### **Funcionalidades por Módulo**
- ✅ **Auto-sync** - atualização automática das fontes
- ✅ **Versioning** - controle semântico de versões
- ✅ **Rollback** - volta para versão anterior em caso de problema
- ✅ **Validation** - verificação de integridade automática
- ✅ **Notification** - alertas de atualizações

## 📊 **API Unificada**

### **REST API** (compatibilidade máxima)
```typescript
// Exemplos de endpoints
GET /api/v1/diseases                    # Lista doenças
GET /api/v1/diseases/search?q=termo     # Busca doenças
GET /api/v1/diseases/{id}/phenotypes    # Fenótipos da doença
GET /api/v1/hpo/terms                   # Termos HPO
GET /api/v1/drugs/{id}/interactions     # Interações medicamentosas
```

### **GraphQL API** (queries complexas)
```graphql
query DiseaseDetails($orphaNumber: String!) {
  disease(orphaNumber: $orphaNumber) {
    preferredNameEn
    preferredNamePt
    phenotypes {
      hpoTerm {
        name
        namePt
      }
      frequency
    }
    genes {
      symbol
      hgncId
    }
    drugs {
      name
      namePt
      interactions
    }
  }
}
```

## 🌟 **Five Star Open Data**

### **Formatos de Export**
1. **⭐ HTML/RDFa** - dados estruturados na web
2. **⭐⭐ RDF/XML** - padrão semântico
3. **⭐⭐⭐ RDF/Turtle** - formato legível
4. **⭐⭐⭐⭐ RDF + Links** - linked data
5. **⭐⭐⭐⭐⭐ Linked Data** - URIs dereferenciáveis

### **Endpoints Open Data**
```
GET /opendata/diseases.csv           # CSV básico
GET /opendata/diseases.rdf           # RDF/XML
GET /opendata/diseases.ttl           # Turtle
GET /opendata/diseases.jsonld        # JSON-LD
GET /rdf/disease/{orpha-number}      # URI individual
```

## 🔒 **Sistema de Segurança & Backup**

### **Proteções Implementadas**
- ✅ **Commands bloqueados** - sem reset acidental
- ✅ **Backup automático** - antes de cada operação
- ✅ **Rollback inteligente** - recuperação em caso de erro
- ✅ **Logs detalhados** - auditoria completa
- ✅ **Health checks** - monitoramento contínuo

### **Estratégia de Backup**
```typescript
@Injectable()
export class BackupService {
  async createBackup(): Promise<string> {
    // 1. Snapshot database
    // 2. Export data files
    // 3. Compress & timestamp
    // 4. Store in multiple locations
  }
  
  async restoreBackup(backupId: string): Promise<void> {
    // 1. Validate backup integrity
    // 2. Create recovery point
    // 3. Restore data
    // 4. Verify integrity
  }
}
```

## 🌍 **Integração CPLP**

### **Módulo específico CPLP**
- ✅ **9 países** lusófonos catalogados
- ✅ **Epidemiologia regional** - dados por país
- ✅ **Traduções contextuais** - variações PT-BR/PT-EU
- ✅ **Sistema de notificação** - alertas por região
- ✅ **APIs regionais** - endpoints específicos por país

## 🚀 **Implementação**

### **Fase 1: Setup Inicial (2-3 dias)**
1. **Instalar NestJS** e dependências
2. **Migrar schemas** Prisma para módulos
3. **Configurar PostgreSQL** (opcional)
4. **Criar estrutura modular**

### **Fase 2: Migração de Dados (1-2 dias)**
1. **Preservar todos os dados** existentes
2. **Scripts de migração** automática
3. **Testes de integridade**
4. **Backup completo**

### **Fase 3: APIs (2-3 dias)**
1. **REST endpoints** básicos
2. **GraphQL schema**
3. **Open Data exports**
4. **Documentação automática**

### **Fase 4: Automação (1-2 dias)**
1. **Sistema de sync** automático
2. **Controle de versões**
3. **Monitoramento**
4. **Deploy scripts**

## 🎯 **Benefícios Imediatos**

1. **✅ Dados preservados** - zero perda de informação
2. **✅ Modularidade** - fácil manutenção e extensão
3. **✅ Type safety** - menos bugs, mais confiabilidade  
4. **✅ APIs modernas** - REST + GraphQL
5. **✅ Documentação automática** - sempre atualizada
6. **✅ Open Data compliance** - padrões internacionais
7. **✅ Escalabilidade** - suporta crescimento futuro
8. **✅ Manutenibilidade** - código limpo e organizado

## 💡 **Próximos Passos**

Você quer que eu comece implementando esta arquitetura? Posso:

1. **🚀 Instalar e configurar NestJS**
2. **📦 Criar a estrutura modular**  
3. **🔄 Migrar os dados existentes**
4. **🌐 Implementar as APIs**

O que você prefere começar primeiro?
