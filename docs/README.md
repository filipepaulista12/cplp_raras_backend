# CPLP-Raras Website

## 🌍 Sobre o Projeto

O **CPLP-Raras** é uma rede de pesquisa colaborativa dedicada ao estudo e enfrentamento das doenças raras nos países da Comunidade dos Países de Língua Portuguesa (CPLP). Este website serve como plataforma central para conectar pesquisadores, especialistas e instituições interessadas em doenças raras.

## 🎯 Missão

Fortalecer a resposta dos países da CPLP às doenças raras por meio do:
- 🗺️ **Mapeamento informacional** de dados, iniciativas e recursos existentes
- 💻 **Desenvolvimento de tecnologias** em saúde digital para apoio clínico
- 🤝 **Promoção da cooperação** científica, educacional e clínica internacional

## 🚀 Início Rápido

### Usando o Manager Script (Recomendado)
```powershell
# Mostrar todas as opções disponíveis
.\manage.ps1 help

# Desenvolvimento
.\manage.ps1 dev

# Deploy para produção
.\manage.ps1 deploy-raras

# Verificar servidor
.\manage.ps1 server-check
```

### Comandos Tradicionais
```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📁 Estrutura do Projeto

```
cplp-raras/
├── src/                    # Código fonte
│   ├── components/         # Componentes React
│   ├── contexts/          # Contextos (idiomas, etc.)
│   └── app/               # Páginas (App Router)
├── scripts/               # Scripts de automação
│   ├── deploy/           # Scripts de deploy
│   └── server/           # Scripts de servidor
├── docs/                  # Documentação
│   ├── deploy/           # Docs de deploy
│   └── reports/          # Relatórios
├── config/               # Configurações
├── logs/                 # Logs e checksums
└── manage.ps1           # Script manager principal
```

> 📖 Para mais detalhes, veja [ESTRUTURA_PROJETO.md](./ESTRUTURA_PROJETO.md)

## 🏗️ Tecnologias Utilizadas

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Ícones**: Heroicons
- **Imagens**: Next.js Image Optimization
- **Deployment**: Apache/SFTP

## 🌈 Design System

### Cores Temáticas
- **Rosa**: `#ec4899` - Cor simbólica das doenças raras
- **Roxo**: `#8b5cf6` - Gradientes complementares
- **Azul**: `#3b82f6` - Institucional
- **Verde**: `#10b981` - Saúde e esperança

### Características Visuais
- ✨ Gradientes modernos inspirados na identidade das doenças raras
- 📱 Design responsivo para todos os dispositivos
- ♿ Acessibilidade e semântica adequadas
- 🎨 Interface profissional para ambiente acadêmico

## 📋 Funcionalidades

### 🏠 Página Principal
- Hero section com background customizado
- Apresentação da missão e objetivos
- Cards dos grupos de trabalho
- FAQ interativo
- Seção de notícias e atualizações

### 📚 Seções Principais
- **Sobre**: Informações do projeto, metodologia e ferramentas
- **Grupos de Trabalho**: 6 GTs especializados (GT1-GT6)
- **Equipe**: Pesquisadores e colaboradores
- **Publicações**: Artigos e materiais científicos
- **Eventos**: Conferências e workshops
- **Contato**: Informações e redes sociais

### 🌐 Integração Social
- **Instagram**: [@rarasporti](https://instagram.com/rarasporti)
- **Facebook**: [CPLP-Raras](https://www.facebook.com/profile.php?id=61578726425301)
- Links integrados em múltiplas seções

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone https://github.com/filipepaulista12/cplp_raras.git

# Entre no diretório
cd cplp_raras

# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver o projeto.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── sobre/             # Páginas sobre o projeto
│   ├── grupos-trabalho/   # Páginas dos GTs
│   ├── equipe/            # Página da equipe
│   ├── publicacoes/       # Publicações científicas
│   ├── eventos/           # Eventos e workshops
│   └── contato/           # Informações de contato
├── components/            # Componentes reutilizáveis
│   ├── Header.tsx         # Navegação principal
│   ├── Hero.tsx           # Seção principal
│   ├── Mission.tsx        # Missão e objetivos
│   ├── WorkingGroups.tsx  # Cards dos GTs
│   ├── FAQ.tsx            # Perguntas frequentes
│   ├── Contact.tsx        # Seção de contato
│   └── Footer.tsx         # Rodapé com links
public/
└── images/                # Imagens e assets
```

## 🏥 Grupos de Trabalho

1. **GT1**: Mapeamento e Caracterização
2. **GT2**: Diagnóstico e Tecnologias
3. **GT3**: Cuidados e Tratamento
4. **GT4**: Registos e Vigilância
5. **GT5**: Investigação e Desenvolvimento
6. **GT6**: Educação e Formação

## 🌍 Países da CPLP

O projeto abrange os 8 países da Comunidade dos Países de Língua Portuguesa:
- 🇧🇷 Brasil
- 🇵🇹 Portugal  
- 🇦🇴 Angola
- 🇲🇿 Moçambique
- 🇬🇼 Guiné-Bissau
- 🇨🇻 Cabo Verde
- 🇸🇹 São Tomé e Príncipe
- 🇹🇱 Timor-Leste

## 📊 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Verificação de código
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Contato

**CPLP-Raras Network**
- 📧 Email: [Informações de contato disponíveis no site]
- 📱 Instagram: [@rarasporti](https://instagram.com/rarasporti)
- 📘 Facebook: [CPLP-Raras](https://www.facebook.com/profile.php?id=61578726425301)

## 🙏 Agradecimentos

Agradecemos a todos os pesquisadores, instituições e colaboradores que tornam possível esta rede de pesquisa em doenças raras nos países da CPLP.

---

<div align="center">
  <strong>Construindo pontes para o futuro da pesquisa em doenças raras 🌉</strong>
</div>
