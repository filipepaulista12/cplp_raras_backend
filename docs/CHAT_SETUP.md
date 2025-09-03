# 🚀 Como Ativar o Chat GPT Integrado

## 📋 Pré-requisitos

Para que o chat funcione completamente, você precisa configurar a API key do OpenAI.

## 🔑 Obtenção da API Key

1. **Acesse**: [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Faça login** ou crie uma conta
3. **Clique em "Create new secret key"**
4. **Copie a chave** (ela será exibida apenas uma vez)

## ⚙️ Configuração no Projeto

1. **Abra o arquivo** `.env.local` na raiz do projeto
2. **Substitua** `your-openai-api-key-here` pela sua chave real:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. **Salve o arquivo**
4. **Reinicie o servidor** de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🧪 Teste o Chat

1. Acesse: http://localhost:3000/recursos-digitais/gpt-educativo
2. Digite uma pergunta no chat integrado
3. O GPT deve responder com informações sobre doenças raras

## 💡 Exemplos de Perguntas

- "O que é a síndrome de Prader-Willi?"
- "Quais são os principais sintomas da fibrose cística?"
- "Como é feito o diagnóstico de doenças raras no Brasil?"
- "Quais protocolos existem para mucopolissacaridoses?"

## ⚠️ Limitações

- **Sem API Key**: O chat não funcionará completamente
- **Custos**: A API do OpenAI tem custos por uso
- **Rate Limits**: Pode haver limites de requisições por minuto

## 🔧 Alternativas

Se não quiser usar a API paga, você pode:

1. **Manter o link externo** para o ChatGPT
2. **Usar uma API gratuita** (como Hugging Face)
3. **Implementar um sistema offline** com respostas pré-programadas

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se a API key está correta
2. Confirme que o arquivo `.env.local` foi salvo
3. Reinicie o servidor de desenvolvimento
4. Verifique o console do navegador para erros
