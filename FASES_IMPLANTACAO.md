# CRAM - FASES DE IMPLANTAÇÃO

## 📋 VISÃO GERAL DAS FASES

Este documento detalha as fases de implementação do aplicativo CRAM, organizadas em sprints semanais com objetivos claros e entregáveis específicos.

**Duração total estimada**: 8-10 semanas  
**Metodologia**: Sprints semanais com entregáveis funcionais  
**Deploy**: Continuous deployment no GitHub Pages + Supabase

---

## 🏗️ FASE 1: FUNDAÇÃO (Semanas 1-2)

### **Sprint 1 - Setup e Infraestrutura**
**Objetivo**: Estabelecer base técnica do projeto

**Tarefas:**
- [ ] **Setup do projeto React + Vite**
  - Criar repositório no GitHub
  - Configurar Vite com React 18
  - Instalar e configurar Tailwind CSS
  - Setup básico de roteamento (React Router)
  
- [ ] **Configuração do Supabase**
  - Criar projeto no Supabase
  - Executar queries de criação das tabelas
  - Configurar autenticação (email/password)
  - Testar conectividade frontend ↔ Supabase
  
- [ ] **Sistema de Autenticação**
  - Tela de login/registro
  - Proteção de rotas privadas
  - Context de autenticação
  - Logout funcional

**Entregável**: App básico com login/logout funcionando e banco configurado

---

### **Sprint 2 - Estrutura Base e Navegação**
**Objetivo**: Criar navegação principal e estrutura de dados

**Tarefas:**
- [ ] **Estrutura de Navegação**
  - Header com avatar e stats básicos (XP/Gold)
  - Menu principal (Dashboard, Matérias, Shop, Perfil)
  - Footer responsivo
  
- [ ] **Tela de Matérias**
  - Lista das matérias disponíveis
  - Apenas Direito Penal ativo inicialmente
  - Cards com cores e ícones
  - Navegação para seções
  
- [ ] **Tela de Seções**
  - Lista das 12 seções do Direito Penal
  - Indicadores de progresso básicos
  - Botão "Estudar Seção"
  
- [ ] **Sistema de Criação de Perfil**
  - Formulário inicial: username, gênero, classe
  - Criação automática do user_profile
  - Validações básicas

**Entregável**: Navegação completa Matérias → Seções funcionando

---

## 🧠 FASE 2: CORE DO SISTEMA (Semanas 3-4)

### **Sprint 3 - Integração com IA e Questões**
**Objetivo**: Implementar geração e exibição de questões

**Tarefas:**
- [ ] **Integração DeepSeek API**
  - Configurar chaves de API
  - Criar serviço de comunicação com IA
  - Implementar parsing das respostas
  - Sistema de retry e error handling
  
- [ ] **Sistema de Questões Compartilhadas**
  - Função para gerar questões inéditas via DeepSeek API
  - Salvar questões no pool global (tabela questions)
  - Interface de seleção: questões já respondidas, questões novas existentes, ou gerar novas
  - Sistema de cache inteligente e reutilização de questões
  
- [ ] **Interface de Questões**
  - Tela de quiz (pergunta + Verdadeiro/Falso)
  - Contador de questões (1/10)
  - Timer por questão (opcional)
  - Navegação Entre questões
  
- [ ] **Sistema de Respostas**
  - Captura da resposta do usuário
  - Validação imediata
  - Salvar no banco (user_answers)
  - Feedback visual básico

**Entregável**: Sistema completo de questões funcionando

---

### **Sprint 4 - Feedback e Sistema de Pontuação**
**Objetivo**: Implementar feedback inteligente e XP/Gold

**Tarefas:**
- [ ] **Feedback de Questões**
  - Tela de resultado (correto/incorreto)
  - Explicação da resposta
  - Destaque de trechos modificados (questões falsas)
  - Botão "Próxima Questão"
  
- [ ] **Sistema XP e Gold**
  - Cálculo de XP por questão correta
  - Sistema de streaks (acertos consecutivos)
  - Atualização em tempo real
  - Animações básicas de ganho
  
- [ ] **Finalização de Sessão**
  - Tela de resumo (X/10 acertos)
  - Total de XP e Gold ganho
  - Atualização das estatísticas
  - Opções: "Estudar Novamente" ou "Voltar"
  
- [ ] **Sistema de Level**
  - Cálculo automático de level baseado em XP
  - Level up com feedback visual
  - Barra de progresso até próximo level

**Entregável**: Sistema de feedback e progressão completo

---

## 🎮 FASE 3: GAMIFICAÇÃO (Semanas 5-6)

### **Sprint 5 - Avatar e Sistema Básico de Items**
**Objetivo**: Implementar avatar e shop básico

**Tarefas:**
- [ ] **Sistema de Avatar**
  - Avatar básico pixel art (2-3 sprites por classe)
  - Visualização no header
  - Diferenciação visual por classe e gênero
  - Sistema de layers (base + equipamentos)
  
- [ ] **Shop Básico**
  - Tela da loja com categorias
  - Lista de items disponíveis
  - Preços e descrições
  - Sistema de compra (validação de gold)
  
- [ ] **Inventário**
  - Tela de inventário do jogador
  - Items possuídos vs não possuídos
  - Sistema de equipar/desequipar
  - Preview do avatar com items
  
- [ ] **Sistema de Bônus**
  - Aplicação de bônus dos items equipados
  - Cálculo de XP modificado
  - Feedback visual dos bônus ativos

**Entregável**: Avatar e shop funcionais

---

### **Sprint 6 - Animações e Polish Visual**
**Objetivo**: Adicionar animações e melhorar UX

**Tarefas:**
- [ ] **Animações de Feedback**
  - Animação de acerto (partículas verdes + som)
  - Animação de erro (shake + partículas vermelhas)
  - Animação de XP ganhando (números voando)
  - Animação de level up (confetti + glow)
  
- [ ] **Animações do Avatar**
  - Idle animation básica (respiração)
  - Celebração ao acertar
  - Animação de equipar items
  - Transições suaves entre estados
  
- [ ] **Polish da Interface**
  - Transições entre telas
  - Loading states
  - Estados vazios (sem questões, sem gold)
  - Responsividade mobile
  
- [ ] **Sistema de Sons** (opcional)
  - Efeitos sonoros básicos
  - Toggle de áudio
  - Som de acerto/erro/level up

**Entregável**: Interface polida com animações

---

## 📊 FASE 4: ANALYTICS E MELHORIAS (Semanas 7-8)

### **Sprint 7 - Dashboard e Estatísticas**
**Objetivo**: Implementar analytics e dashboard

**Tarefas:**
- [ ] **Dashboard Principal**
  - Resumo de stats (level, XP, gold, streak)
  - Gráfico de desempenho por seção
  - Últimas sessões de estudo
  - Conquistas recentes
  
- [ ] **Estatísticas Detalhadas**
  - Percentual de acerto por seção
  - Tempo médio por questão
  - Histórico de sessões
  - Curva de aprendizado
  
- [ ] **Sistema de Achievements**
  - Lista de conquistas possíveis
  - Progresso em tempo real
  - Notificações de conquistas desbloqueadas
  - Badges e títulos
  
- [ ] **Recomendações Inteligentes**
  - Seções que precisam de revisão
  - Sugestões baseadas em performance
  - Streak de dias estudados

**Entregável**: Dashboard completo com analytics

---

### **Sprint 8 - Otimização e Deploy**
**Objetivo**: Otimizar performance e preparar para produção

**Tarefas:**
- [ ] **Otimizações de Performance**
  - Lazy loading de componentes
  - Otimização de imagens
  - Cache de dados do Supabase
  - Redução do bundle size
  
- [ ] **Tratamento de Erros**
  - Error boundaries
  - Feedback de erros de rede
  - Fallbacks para falhas da API
  - Estados de loading aprimorados
  
- [ ] **Deploy e CI/CD**
  - GitHub Actions para build automático
  - Deploy automático no GitHub Pages
  - Configuração de domínio customizado
  - Testes básicos automatizados
  
- [ ] **Documentação de Usuário**
  - Tutorial inicial (onboarding)
  - Tooltip explicativos
  - FAQ básico
  - Ajuda contextual

**Entregável**: App em produção funcionando

---

## 🚀 FASE 5: EXPANSÃO (Semanas 9-10+)

### **Sprint 9-10 - Funcionalidades Avançadas**
**Objetivo**: Implementar funcionalidades premium

**Tarefas:**
- [ ] **Modos de Estudo Avançados**
  - Modo Revisão (apenas questões erradas)
  - Modo Desafio (mix de seções)
  - Modo Simulado (tempo limitado)
  - Modo Colaborativo (questões criadas pela comunidade)
  - Configurações personalizáveis
  
- [ ] **Spaced Repetition**
  - Algoritmo de repetição espaçada
  - Priorização de questões antigas
  - Sistema de dificuldade adaptativa
  - Scheduling inteligente
  
- [ ] **PWA Features**
  - Service worker
  - Cache offline
  - Instalação como app
  - Notificações push (opcional)
  
- [ ] **Preparação para Novas Matérias**
  - Interface para admin adicionar matérias
  - Sistema de versionamento de conteúdo
  - Templates para novos JSONs estruturados

---

## 📈 MÉTRICAS DE SUCESSO

### **KPIs por Sprint**

**Sprint 1-2 (Fundação)**
- ✅ Build funcionando
- ✅ Deploy automático configurado
- ✅ Autenticação funcionando
- ✅ Banco de dados populado

**Sprint 3-4 (Core)**
- ✅ Geração de questões funcionando
- ✅ Usuário consegue responder questões
- ✅ Sistema de pontuação operacional
- ✅ Feedback básico implementado

**Sprint 5-6 (Gamificação)**
- ✅ Avatar visível e customizável
- ✅ Shop funcionando
- ✅ Sistema de bônus ativo
- ✅ Animações básicas implementadas

**Sprint 7-8 (Analytics)**
- ✅ Dashboard informativo
- ✅ Estatísticas precisas
- ✅ App responsivo
- ✅ Performance otimizada

---

## 🛠️ STACK TÉCNICO POR FASE

### **Dependências por Sprint**

**Sprint 1:**
```json
{
  "react": "^18.2.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "@supabase/supabase-js": "^2.38.0",
  "react-router-dom": "^6.20.0"
}
```

**Sprint 3:**
```json
{
  "axios": "^1.6.0", // Para DeepSeek API
  "react-query": "^3.39.3" // Cache e state management
}
```

**Sprint 5:**
```json
{
  "framer-motion": "^10.0.0",
  "react-spring": "^9.7.0"
}
```

**Sprint 6:**
```json
{
  "lottie-react": "^2.4.0",
  "howler": "^2.2.4"
}
```

**Sprint 7:**
```json
{
  "recharts": "^2.8.0", // Para gráficos
  "date-fns": "^2.30.0" // Manipulação de datas
}
```

---

## 🚨 RISCOS E CONTINGÊNCIAS

### **Riscos Identificados**

**Alto Impacto:**
- **DeepSeek API instável**: Preparar fallback com questões pré-geradas
- **Supabase limits**: Monitorar uso e planejar upgrade
- **Performance mobile**: Testes contínuos em dispositivos reais

**Médio Impacto:**
- **Complexidade das animações**: Simplificar se necessário
- **Geração de questões ruins**: Sistema de review manual
- **Feedback users**: Canal para sugestões desde o início

### **Plano de Contingência**
- **Buffer de 2 semanas** no cronograma
- **MVP mínimo**: Questões + XP funcionando
- **Rollback strategy**: Branches de release estáveis

---

## 📊 CHECKLIST DE ENTREGA

### **Critérios de Aceitação Global**
- [ ] **Funcional**: Usuário consegue estudar e ganhar XP
- [ ] **Responsivo**: Funciona em mobile e desktop
- [ ] **Performance**: Carregamento < 3 segundos
- [ ] **Seguro**: Dados isolados por usuário
- [ ] **Escalável**: Preparado para novas matérias

### **Definition of Done por Feature**
- [ ] Código revisado
- [ ] Testes básicos funcionando
- [ ] Responsividade validada
- [ ] Deploy automático funcionando
- [ ] Documentação atualizada

---

**Última atualização**: Janeiro 2025  
**Status**: Pronto para Execução  
**Próximo passo**: Iniciar Sprint 1 - Setup e Infraestrutura