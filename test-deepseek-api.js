#!/usr/bin/env node

/**
 * Script para testar a integração com a API do DeepSeek
 * Uso: node test-deepseek-api.js
 */

import { generateQuestions, checkAPIHealth, testAPIConnection } from './src/services/deepseekApi.js'

async function runTests() {
  console.log('🧪 TESTE DIAGNÓSTICO DA API DEEPSEEK')
  console.log('=' .repeat(50))
  
  // Teste 1: Verificação detalhada
  console.log('\n1️⃣ Executando verificação detalhada...')
  const detailedResults = await testAPIConnection()
  
  // Teste 2: Health check
  console.log('\n2️⃣ Executando health check...')
  const healthResults = await checkAPIHealth()
  
  // Teste 3: Tentativa de geração de questão
  console.log('\n3️⃣ Tentando gerar uma questão de teste...')
  const mockSection = {
    id: 1,
    titulo: "Teste de Conectividade",
    artigo: "Art. 293", 
    conteudo: {
      tipificacao: "Falsificar, fabricando-os ou alterando-os",
      pena: "reclusão, de dois a oito anos, e multa",
      pontos_chave: ["Teste de conectividade com API"]
    }
  }
  
  try {
    const questions = await generateQuestions(mockSection, 1)
    console.log('✅ Questão gerada com sucesso:')
    console.log('Questão:', questions[0]?.question_text)
    console.log('Fonte:', questions[0]?.created_by_ai)
  } catch (error) {
    console.log('❌ Falha na geração de questões:', error.message)
  }
  
  // Resumo final
  console.log('\n📊 RESUMO DOS RESULTADOS')
  console.log('=' .repeat(50))
  
  const apiKeyStatus = process.env.VITE_DEEPSEEK_API_KEY ? '✅ Configurada' : '❌ Não encontrada'
  console.log(`API Key: ${apiKeyStatus}`)
  
  const connectivityStatus = healthResults.status === 'healthy' ? '✅ OK' : '❌ Falha'
  console.log(`Conectividade: ${connectivityStatus}`)
  
  if (healthResults.status !== 'healthy') {
    console.log(`❗ Problema: ${healthResults.message}`)
    if (healthResults.recommendation) {
      console.log(`💡 Solução: ${healthResults.recommendation}`)
    }
  }
  
  console.log('\n🔧 PRÓXIMOS PASSOS:')
  if (!process.env.VITE_DEEPSEEK_API_KEY) {
    console.log('1. Criar arquivo .env na raiz do projeto')
    console.log('2. Adicionar: VITE_DEEPSEEK_API_KEY=sua_chave_aqui')
    console.log('3. Reiniciar o servidor de desenvolvimento')
  } else {
    console.log('1. Verificar se a chave da API está correta')
    console.log('2. Verificar conectividade com internet')
    console.log('3. Verificar se não há firewall bloqueando api.deepseek.com')
  }
}

// Executar testes
runTests().catch(console.error)