# 🤖 Sistema de Chat IA Contextual

Sistema de chat integrado que permite aos usuários tirarem dúvidas contextuais sobre questões após respondê-las.

## 📋 Funcionalidades

### ✨ **Experiência do Usuário**
- **Botão flutuante**: Aparece automaticamente após responder questão
- **Contexto automático**: IA já conhece questão, resposta e explicação
- **Sugestões inteligentes**: Baseadas no desempenho (acertou/errou)
- **Chat persistente**: Mantém conversa durante a questão atual
- **Reset automático**: Limpa chat ao mudar de questão

### 🧠 **Inteligência da IA**
- **Professor especialista**: Configurado como especialista em Direito Penal
- **Respostas contextuais**: Leva em conta toda informação da questão
- **Sugestões adaptativas**: Diferentes sugestões para acertos/erros
- **Limite de tokens**: Respostas concisas (max 300 palavras)
- **Tratamento de erros**: Fallbacks amigáveis para problemas técnicos

## 🚀 **Como Usar**

### Para Usuários
1. **Responda uma questão** → Botão "🤖 Peça ajuda à IA" aparece
2. **Clique no botão** → Modal com sugestões contextuais abre
3. **Escolha sugestão ou digite** → IA responde baseada no contexto
4. **Continue conversando** → Contexto se mantém na mesma questão
5. **Próxima questão** → Chat reseta automaticamente

### Para Desenvolvedores

#### Componente Principal
```jsx
import AIQuestionHelper from '../components/AIQuestionHelper'

<AIQuestionHelper 
  question={currentQuestion}
  userAnswer={userAnswer}
  isCorrect={userAnswer === currentQuestion?.correct_answer}
  show={hasAnswered}
/>
```

#### Hook Utilitário (Opcional)
```jsx
import { useAIChat } from '../hooks/useAIChat'

const { 
  isOpen, 
  setIsOpen, 
  sendMessage, 
  chatHistory, 
  getSuggestions 
} = useAIChat(question)
```

#### Serviço de Chat
```jsx
import aiChatService from '../services/aiChatService'

// Enviar mensagem com contexto
const response = await aiChatService.askQuestion(
  message, 
  question, 
  userAnswer, 
  isCorrect, 
  chatHistory
)

// Obter sugestões
const suggestions = aiChatService.getSmartSuggestions(question, isCorrect)
```

## 🎨 **Interface**

### Estados Visuais
- **Botão flutuante**: Canto inferior direito, com ícone 🤖
- **Modal responsivo**: Desktop (600px) e mobile (tela cheia)
- **Animações suaves**: Slide-in, hover effects, loading indicators
- **Cores temáticas**: Azul para IA, cinza para usuário

### Sugestões Contextuais

#### ❌ **Quando usuário erra:**
- "❓ Por que minha resposta está errada?"
- "🎯 Como não errar questões similares?"
- "⚠️ Qual é a pegadinha desta questão?"
- "💭 Me ajude a memorizar isso"

#### ✅ **Quando usuário acerta:**
- "🤔 Quais são as exceções a esta regra?"
- "⚖️ Como isso se relaciona com outros crimes?"
- "📈 Me dê casos mais complexos"
- "🏆 Que nível de dificuldade eu deveria estudar?"

## ⚙️ **Configuração**

### Variáveis de Ambiente
```env
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxx
```

### API Usage
- **Modelo**: deepseek-chat
- **Max tokens**: 600
- **Temperature**: 0.7
- **Timeout**: 30s

## 🔧 **Arquitetura Técnica**

### Componentes
- `AIQuestionHelper.jsx` - Componente principal
- `aiChatService.js` - Serviço de comunicação
- `useAIChat.js` - Hook de estado (opcional)

### Estado Local
- **Sem banco de dados**: Tudo em memória/estado React
- **Reset automático**: Limpa ao mudar questão
- **Sessão única**: Conversa válida apenas na questão atual

### Tratamento de Erros
- **Rate limiting**: Mensagem amigável para muitas requisições
- **Server errors**: Fallback para problemas técnicos
- **Network issues**: Retry com timeout
- **API não configurada**: Componente não renderiza

## 📊 **Logs e Debug**

### Console Logs
```javascript
🤖 Enviando pergunta para a IA...
✅ Resposta da IA recebida
❌ Erro no chat com IA: [detalhes]
```

### Estados de Loading
- Typing indicator com animação de pontos
- Botão de envio com spinner
- Disable de inputs durante loading

## 🔮 **Futuras Melhorias**

### Curto Prazo
- [ ] Comandos especiais (/dica, /exemplo, /memorizar)
- [ ] Histórico da sessão completa (localStorage)
- [ ] Modo voz (speech-to-text/text-to-speech)

### Médio Prazo
- [ ] Analytics de uso do chat
- [ ] Feedback de qualidade das respostas
- [ ] Integração com sistema de conquistas

### Longo Prazo
- [ ] IA com memória entre sessões
- [ ] Personalização do assistente
- [ ] Integração com calendário de estudos

## 🐛 **Troubleshooting**

### Problemas Comuns
1. **Botão não aparece**: Verificar se `show={hasAnswered}` está correto
2. **IA não responde**: Verificar `VITE_DEEPSEEK_API_KEY` no .env
3. **Modal não abre**: Verificar z-index conflicts
4. **Sugestões vazias**: Verificar se `question` tem dados válidos

### Debug Tips
```javascript
// Verificar disponibilidade
console.log('AI disponível:', aiChatService.isAvailable())

// Verificar contexto
console.log('Contexto:', aiChatService.buildContextPrompt(question, userAnswer, isCorrect))
```

---
**Implementado em**: Janeiro 2025  
**Versão**: 1.0  
**Status**: ✅ Ativo