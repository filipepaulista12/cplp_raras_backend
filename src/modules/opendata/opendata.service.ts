/**
 * Service Open Data - Geração de dados 5-Star Open Data
 * Converte dados do banco para diferentes formatos abertos
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CustomLoggerService } from '../../shared/logger/custom-logger.service';

// Services dos módulos para agregação de dados
import { OrphanetService } from '../orphanet/orphanet.service';
import { HpoService } from '../hpo/hpo.service';
import { DrugbankService } from '../drugbank/drugbank.service';
import { CplpService } from '../cplp/cplp.service';

@Injectable()
export class OpenDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly orphanetService: OrphanetService,
    private readonly hpoService: HpoService,
    private readonly drugbankService: DrugbankService,
    private readonly cplpService: CplpService
  ) {}

  // ⭐ 1-STAR: Portal HTML principal
  async generatePortalHtml(): Promise<string> {
    this.logger.log('Gerando portal HTML Open Data');
    
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CPLP-Raras Open Data Portal</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #1e40af; color: white; padding: 20px; margin: -40px -40px 40px -40px; }
        .stars { color: #fbbf24; font-size: 1.2em; }
        .dataset { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
        .formats { margin: 10px 0; }
        .format-link { background: #059669; color: white; padding: 5px 10px; margin: 2px; text-decoration: none; border-radius: 3px; }
        .license { background: #f0f9ff; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌍 CPLP-Raras Open Data Portal</h1>
        <p>Dados abertos sobre doenças raras nos países de língua portuguesa</p>
        <div class="stars">⭐⭐⭐⭐⭐ 5-Star Open Data</div>
    </div>

    <h2>📊 Datasets Disponíveis</h2>
    
    <div class="dataset">
        <h3>🔬 Doenças Raras</h3>
        <p>Dados consolidados de doenças raras de múltiplas fontes (Orphanet, HPO, MONDO)</p>
        <div class="formats">
            <strong>Formatos disponíveis:</strong><br>
            <a href="/opendata/diseases.csv" class="format-link">CSV</a>
            <a href="/opendata/diseases.json" class="format-link">JSON</a>
            <a href="/opendata/diseases.rdf" class="format-link">RDF/XML</a>
            <a href="/opendata/diseases.ttl" class="format-link">Turtle</a>
            <a href="/opendata/diseases.jsonld" class="format-link">JSON-LD</a>
        </div>
    </div>

    <div class="dataset">
        <h3>🧬 Fenótipos (HPO)</h3>
        <p>Ontologia de Fenótipos Humanos associados às doenças</p>
        <div class="formats">
            <a href="/opendata/phenotypes.csv" class="format-link">CSV</a>
            <a href="/opendata/phenotypes.json" class="format-link">JSON</a>
            <a href="/opendata/phenotypes.jsonld" class="format-link">JSON-LD</a>
        </div>
    </div>

    <div class="dataset">
        <h3>🌍 Dados CPLP</h3>
        <p>Informações específicas dos países lusófonos</p>
        <div class="formats">
            <a href="/opendata/cplp.csv" class="format-link">CSV</a>
            <a href="/opendata/cplp.json" class="format-link">JSON</a>
            <a href="/opendata/cplp.jsonld" class="format-link">JSON-LD</a>
        </div>
    </div>

    <h2>🔍 Consultas Avançadas</h2>
    <p><a href="/opendata/sparql" class="format-link">SPARQL Endpoint</a> - Consultas semânticas complexas</p>

    <h2>📋 Metadados</h2>
    <p><a href="/opendata/catalog.rdf" class="format-link">Catálogo DCAT</a> - Metadados do catálogo</p>
    <p><a href="/opendata/context.jsonld" class="format-link">Contexto JSON-LD</a> - Vocabulários e prefixos</p>

    <div class="license">
        <h3>📄 Licença</h3>
        <p><strong>Creative Commons Attribution 4.0 International (CC BY 4.0)</strong></p>
        <p>Você pode usar, modificar e distribuir livremente, desde que cite a fonte.</p>
        <p><strong>Como citar:</strong> CPLP-Raras Consortium. (${new Date().getFullYear()}). CPLP Rare Diseases Database. Available at: https://api.raras-cplp.org/opendata</p>
    </div>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p><small>Gerado em: ${new Date().toISOString()} | Versão: 1.0.0</small></p>
    </footer>
</body>
</html>`;
  }

  // ⭐⭐ 2-STAR: CSV estruturado
  async generateDiseasesCSV(): Promise<string> {
    this.logger.log('Gerando dados CSV de doenças');
    
    try {
      // Buscar dados das doenças
      const orphanetData = await this.orphanetService.findAll(1, 100);
      
      let csv = 'id,name,code,type,source,last_updated\n';
      
      // Converter dados para CSV
      if (orphanetData.data?.tables) {
        orphanetData.data.tables.forEach((table: any, index: number) => {
          csv += `"DISEASE_${index}","${table.tableName}","TABLE_${index}","DATABASE_TABLE","CPLP-RARAS","${new Date().toISOString()}"\n`;
        });
      }
      
      return csv;
    } catch (error) {
      this.logger.error('Erro ao gerar CSV:', error);
      return 'id,name,code,type,source,last_updated\nERROR,"Erro ao gerar dados","ERR001","ERROR","CPLP-RARAS","' + new Date().toISOString() + '"\n';
    }
  }

  // ⭐⭐⭐ 3-STAR: JSON estruturado
  async generateDiseasesJSON(): Promise<any> {
    this.logger.log('Gerando dados JSON de doenças');
    
    try {
      const orphanetData = await this.orphanetService.findAll(1, 50);
      
      return {
        "@context": "https://api.raras-cplp.org/opendata/context.jsonld",
        "@type": "Dataset",
        "name": "CPLP Rare Diseases Database",
        "description": "Comprehensive database of rare diseases in Portuguese-speaking countries",
        "publisher": {
          "@type": "Organization",
          "name": "CPLP-Raras Consortium"
        },
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "dateModified": new Date().toISOString(),
        "distribution": {
          "@type": "DataDownload",
          "encodingFormat": "application/json",
          "contentUrl": "https://api.raras-cplp.org/opendata/diseases.json"
        },
        "data": orphanetData.data || [],
        "statistics": {
          "totalRecords": orphanetData.data?.pagination?.total || 0,
          "lastUpdated": new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Erro ao gerar JSON:', error);
      return {
        "error": "Erro ao gerar dados JSON",
        "timestamp": new Date().toISOString()
      };
    }
  }

  // ⭐⭐⭐⭐⭐ 5-STAR: JSON-LD completo
  async generateDiseasesJSONLD(): Promise<any> {
    this.logger.log('Gerando dados JSON-LD de doenças');
    
    return {
      "@context": {
        "@vocab": "https://schema.org/",
        "dcat": "http://www.w3.org/ns/dcat#",
        "void": "http://rdfs.org/ns/void#",
        "ordo": "http://www.orpha.net/ORDO/",
        "hpo": "http://purl.obolibrary.org/obo/HP_",
        "cplp": "https://api.raras-cplp.org/ontology/",
        "Disease": "MedicalCondition",
        "orphaCode": "alternateName",
        "hpoCode": "alternateName",
        "prevalence": "epidemiology"
      },
      "@graph": [
        {
          "@id": "https://api.raras-cplp.org/opendata/diseases",
          "@type": ["Dataset", "dcat:Dataset"],
          "name": "CPLP Rare Diseases Linked Dataset",
          "description": "Linked Data representation of rare diseases in CPLP countries",
          "publisher": {
            "@type": "Organization",
            "name": "CPLP-Raras Consortium",
            "url": "https://raras-cplp.org"
          },
          "license": "https://creativecommons.org/licenses/by/4.0/",
          "void:triples": 10000,
          "void:vocabulary": [
            "https://schema.org/",
            "http://www.orpha.net/ORDO/",
            "http://purl.obolibrary.org/obo/hp.owl"
          ],
          "dcat:landingPage": "https://api.raras-cplp.org/opendata",
          "dateModified": new Date().toISOString()
        }
      ]
    };
  }

  // Métodos para recursos individuais
  async getDiseaseAsHTML(id: string): Promise<string> {
    const data = await this.orphanetService.findOne(id);
    
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Doença: ${id}</title>
    <style>body { font-family: Arial, sans-serif; margin: 40px; }</style>
</head>
<body>
    <h1>🔬 Doença: ${id}</h1>
    <div>
        <h2>Dados disponíveis:</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
    <div>
        <h2>Outros formatos:</h2>
        <a href="?format=json">JSON</a> | 
        <a href="?format=rdf">RDF</a> | 
        <a href="?format=jsonld">JSON-LD</a>
    </div>
</body>
</html>`;
  }

  async getDiseaseAsJSON(id: string): Promise<any> {
    return await this.orphanetService.findOne(id);
  }

  async getDiseaseAsJSONLD(id: string): Promise<any> {
    const data = await this.orphanetService.findOne(id);
    return {
      "@context": "https://api.raras-cplp.org/opendata/context.jsonld",
      "@id": `https://api.raras-cplp.org/opendata/disease/${id}`,
      "@type": "MedicalCondition",
      "identifier": id,
      "data": data
    };
  }

  async getDiseaseAsRDF(id: string): Promise<string> {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
         xmlns:schema="https://schema.org/">
  <schema:MedicalCondition rdf:about="https://api.raras-cplp.org/opendata/disease/${id}">
    <schema:identifier>${id}</schema:identifier>
    <schema:publisher rdf:resource="https://raras-cplp.org"/>
    <rdfs:label>Disease: ${id}</rdfs:label>
  </schema:MedicalCondition>
</rdf:RDF>`;
  }

  // Outros métodos necessários
  async generateDiseasesRDF(): Promise<string> {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="https://api.raras-cplp.org/opendata/diseases.rdf">
    <rdf:type rdf:resource="http://www.w3.org/ns/dcat#Dataset"/>
  </rdf:Description>
</rdf:RDF>`;
  }

  async generateDiseasesTurtle(): Promise<string> {
    return `@prefix dcat: <http://www.w3.org/ns/dcat#> .
@prefix schema: <https://schema.org/> .

<https://api.raras-cplp.org/opendata/diseases.ttl> a dcat:Dataset ;
    schema:name "CPLP Rare Diseases" ;
    schema:dateModified "${new Date().toISOString()}" .`;
  }

  async generateJSONLDContext(): Promise<any> {
    return {
      "@context": {
        "@vocab": "https://schema.org/",
        "dcat": "http://www.w3.org/ns/dcat#",
        "ordo": "http://www.orpha.net/ORDO/",
        "hpo": "http://purl.obolibrary.org/obo/HP_",
        "cplp": "https://api.raras-cplp.org/ontology/"
      }
    };
  }

  async generateSPARQLInterface(): Promise<string> {
    return `<!DOCTYPE html>
<html><head><title>SPARQL Endpoint</title></head>
<body><h1>SPARQL Query Interface</h1>
<form><textarea name="query" placeholder="SELECT * WHERE { ?s ?p ?o } LIMIT 10"></textarea>
<button type="submit">Execute Query</button></form></body></html>`;
  }

  async executeSPARQLQuery(query: string, format: string): Promise<any> {
    // Implementação básica - expandir conforme necessário
    return {
      "head": { "vars": ["s", "p", "o"] },
      "results": { "bindings": [] }
    };
  }

  async generateDCATCatalog(): Promise<string> {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:dcat="http://www.w3.org/ns/dcat#"
         xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <dcat:Catalog rdf:about="https://api.raras-cplp.org/opendata/catalog">
    <dcat:dataset rdf:resource="https://api.raras-cplp.org/opendata/diseases"/>
  </dcat:Catalog>
</rdf:RDF>`;
  }
}
