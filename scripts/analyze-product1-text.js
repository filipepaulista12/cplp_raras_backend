const fs = require('fs');
const xml2js = require('xml2js');

async function analyzeProduct1TextStructure() {
  console.log('📚 ANÁLISE DETALHADA - SUMMARY INFORMATION');
  console.log('==========================================\n');
  
  try {
    const xmlPath = 'database/orphadata-sources/en_product1.xml';
    
    console.log('🔄 Parseando XML...');
    const xmlData = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const disorders = result.JDBOR.DisorderList[0].Disorder;
    console.log(`📊 Total disorders: ${disorders.length}\n`);
    
    // Analisar SummaryInformationList em detalhes
    console.log('🔬 ANÁLISE SUMMARY INFORMATION:');
    
    for (let i = 0; i < Math.min(2, disorders.length); i++) {
      const disorder = disorders[i];
      const orphaCode = disorder.OrphaCode[0];
      const name = disorder.Name[0]?._ || disorder.Name[0];
      
      console.log(`\n=== DISORDER ${i + 1}: ORPHA:${orphaCode} ===`);
      console.log(`Nome: ${name}`);
      
      const summaryList = disorder.SummaryInformationList;
      if (summaryList && summaryList[0] && summaryList[0].SummaryInformation) {
        const summaryInfo = summaryList[0].SummaryInformation[0];
        console.log(`Summary ID: ${summaryInfo.$?.id}, Lang: ${summaryInfo.$?.lang}`);
        
        const textSections = summaryInfo.TextSectionList?.[0]?.TextSection;
        if (textSections && Array.isArray(textSections)) {
          console.log(`Número de seções de texto: ${textSections.length}\n`);
          
          textSections.forEach((section, idx) => {
            console.log(`--- Seção ${idx + 1} ---`);
            console.log(`ID: ${section.$?.id}, Lang: ${section.$?.lang}`);
            
            if (section.SectionTitle) {
              console.log(`Título: ${section.SectionTitle[0]?._ || section.SectionTitle[0]}`);
            }
            
            if (section.Contents) {
              const content = section.Contents[0]?._ || section.Contents[0];
              console.log(`Conteúdo: ${content ? content.substring(0, 200) + '...' : 'Sem conteúdo'}`);
            }
            
            console.log('');
          });
        }
      } else {
        console.log('❌ Sem SummaryInformation');
      }
    }
    
    // Verificar quantos disorders têm informações textuais
    console.log('\n📊 ESTATÍSTICAS:');
    let withSummary = 0;
    let totalSections = 0;
    
    for (let i = 0; i < Math.min(100, disorders.length); i++) {
      const disorder = disorders[i];
      const summaryList = disorder.SummaryInformationList;
      if (summaryList && summaryList[0] && summaryList[0].SummaryInformation) {
        withSummary++;
        const textSections = summaryList[0].SummaryInformation[0].TextSectionList?.[0]?.TextSection;
        if (textSections) {
          totalSections += textSections.length;
        }
      }
    }
    
    console.log(`Disorders com summary (primeiros 100): ${withSummary}/100`);
    console.log(`Total de seções de texto (primeiros 100): ${totalSections}`);
    console.log(`Média de seções por disorder: ${(totalSections / withSummary).toFixed(1)}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

analyzeProduct1TextStructure();
