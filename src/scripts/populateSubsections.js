/**
 * Script para popular as tabelas de subseções no Supabase
 * 
 * Execute este script uma vez para criar as subseções baseadas no JSON estruturado
 */

import { supabase } from '../lib/supabase.js'

// Dados das subseções baseados no JSON estruturado
const subsectionsData = [
  // SEÇÃO 1: Falsificação de Papéis Públicos - Conceitos Básicos (Art. 293)
  {
    section_id: 1,
    subsections: [
      {
        id: 'tipificacao',
        titulo: 'Tipificação do Crime',
        conteudo: 'Falsificar, fabricando-os ou alterando-os',
        tipo: 'conceito_base',
        peso: 2,
        ordem: 1
      },
      {
        id: 'objeto_tributario',
        titulo: 'Selos e Papéis Tributários',
        conteudo: 'selo destinado a controle tributário, papel selado ou qualquer papel de emissão legal destinado à arrecadação de tributo',
        tipo: 'objeto_crime',
        peso: 1,
        ordem: 2
      },
      {
        id: 'objeto_credito',
        titulo: 'Papel de Crédito Público',
        conteudo: 'papel de crédito público que não seja moeda de curso legal',
        tipo: 'objeto_crime',
        peso: 1,
        ordem: 3
      },
      {
        id: 'objeto_vale_postal',
        titulo: 'Vale Postal',
        conteudo: 'vale postal',
        tipo: 'objeto_crime',
        peso: 1,
        ordem: 4
      },
      {
        id: 'objeto_cautela',
        titulo: 'Cautelas e Cadernetas',
        conteudo: 'cautela de penhor, caderneta de depósito de caixa econômica ou de outro estabelecimento mantido por entidade de direito público',
        tipo: 'objeto_crime',
        peso: 1,
        ordem: 5
      },
      {
        id: 'objeto_documentos_rendas',
        titulo: 'Documentos de Rendas Públicas',
        conteudo: 'talão, recibo, guia, alvará ou qualquer outro documento relativo a arrecadação de rendas públicas ou a depósito ou caução por que o poder público seja responsável',
        tipo: 'objeto_crime',
        peso: 1,
        ordem: 6
      },
      {
        id: 'objeto_transporte',
        titulo: 'Documentos de Transporte Público',
        conteudo: 'bilhete, passe ou conhecimento de empresa de transporte administrada pela União, por Estado ou por Município',
        tipo: 'objeto_crime',
        peso: 1,
        ordem: 7
      },
      {
        id: 'pena',
        titulo: 'Penalidade',
        conteudo: 'reclusão, de dois a oito anos, e multa',
        tipo: 'consequencia',
        peso: 1,
        ordem: 8
      },
      {
        id: 'modalidades',
        titulo: 'Modalidades de Conduta',
        conteudo: 'fabricação (criar do nada) e alteração (modificar existente)',
        tipo: 'conceito_base',
        peso: 2,
        ordem: 9
      }
    ]
  },
  
  // SEÇÃO 2: Falsificação de Papéis Públicos - Condutas Equiparadas (Art. 293, §1º ao §5º)
  {
    section_id: 2,
    subsections: [
      {
        id: 'paragrafo_1_uso',
        titulo: 'Uso de Papéis Falsificados',
        conteudo: 'usa, guarda, possui ou detém qualquer dos papéis falsificados',
        tipo: 'conduta_equiparada',
        peso: 2,
        ordem: 1
      },
      {
        id: 'paragrafo_1_circulacao',
        titulo: 'Circulação de Selos Falsificados',
        conteudo: 'importa, exporta, adquire, vende, troca, cede, empresta, guarda, fornece ou restitui à circulação selo falsificado destinado a controle tributário',
        tipo: 'conduta_equiparada',
        peso: 2,
        ordem: 2
      },
      {
        id: 'paragrafo_1_produtos',
        titulo: 'Produtos com Selos Falsificados',
        conteudo: 'importa, exporta, adquire, vende, expõe à venda, mantém em depósito, guarda, troca, cede, empresta, fornece, porta ou utiliza produto com selo falsificado ou sem selo obrigatório',
        tipo: 'conduta_equiparada',
        peso: 2,
        ordem: 3
      },
      {
        id: 'paragrafo_2_supressao',
        titulo: 'Supressão de Sinais de Inutilização',
        conteudo: 'suprimir carimbo ou sinal indicativo de inutilização para tornar papéis novamente utilizáveis',
        tipo: 'conduta_especifica',
        peso: 1,
        ordem: 4
      },
      {
        id: 'paragrafo_3_uso_alterado',
        titulo: 'Uso de Papel Alterado',
        conteudo: 'usar papel alterado conforme §2º',
        tipo: 'conduta_especifica',
        peso: 1,
        ordem: 5
      },
      {
        id: 'paragrafo_4_boa_fe',
        titulo: 'Uso Após Conhecimento da Falsidade',
        conteudo: 'usar ou restituir à circulação papel falsificado, mesmo recebido de boa-fé, após conhecer a falsidade',
        tipo: 'conduta_especifica',
        peso: 1,
        ordem: 6
      },
      {
        id: 'penas_equiparadas',
        titulo: 'Penalidades das Condutas Equiparadas',
        conteudo: '§1º: mesma pena do caput | §2º e §3º: reclusão, de um a quatro anos, e multa | §4º: detenção, de seis meses a dois anos, ou multa',
        tipo: 'consequencia',
        peso: 1,
        ordem: 7
      }
    ]
  },
  
  // SEÇÃO 3: Petrechos de Falsificação e Funcionário Público (Art. 294-295)
  {
    section_id: 3,
    subsections: [
      {
        id: 'petrechos_conduta',
        titulo: 'Conduta com Petrechos',
        conteudo: 'fabricar, adquirir, fornecer, possuir ou guardar objeto especialmente destinado à falsificação',
        tipo: 'crime_preparatorio',
        peso: 2,
        ordem: 1
      },
      {
        id: 'petrechos_pena',
        titulo: 'Pena por Petrechos',
        conteudo: 'reclusão, de um a três anos, e multa',
        tipo: 'consequencia',
        peso: 1,
        ordem: 2
      },
      {
        id: 'petrechos_natureza',
        titulo: 'Natureza do Crime de Petrechos',
        conteudo: 'crime de perigo abstrato - pune preparação para falsificação',
        tipo: 'conceito_base',
        peso: 1,
        ordem: 3
      },
      {
        id: 'funcionario_agravante',
        titulo: 'Agravante para Funcionário Público',
        conteudo: 'funcionário público que comete qualquer crime do capítulo prevalecendo-se do cargo - aumenta-se a pena de sexta parte',
        tipo: 'agravante',
        peso: 2,
        ordem: 4
      }
    ]
  },
  
  // SEÇÃO 4: Falsificação de Selos e Sinais Públicos (Art. 296)
  {
    section_id: 4,
    subsections: [
      {
        id: 'selos_tipificacao',
        titulo: 'Tipificação - Selos Públicos',
        conteudo: 'falsificar, fabricando-os ou alterando-os',
        tipo: 'conceito_base',
        peso: 2,
        ordem: 1
      },
      {
        id: 'selos_oficiais',
        titulo: 'Selos Oficiais de Entes Públicos',
        conteudo: 'selo público destinado a autenticar atos oficiais da União, de Estado ou de Município',
        tipo: 'objeto_crime',
        peso: 1,
        ordem: 2
      },
      {
        id: 'selos_entidades',
        titulo: 'Selos de Entidades e Autoridades',
        conteudo: 'selo ou sinal atribuído por lei a entidade de direito público, ou a autoridade, ou sinal público de tabelião',
        tipo: 'objeto_crime',
        peso: 1,
        ordem: 3
      },
      {
        id: 'selos_pena_basica',
        titulo: 'Pena Básica para Selos',
        conteudo: 'reclusão, de dois a seis anos, e multa',
        tipo: 'consequencia',
        peso: 1,
        ordem: 4
      },
      {
        id: 'selos_uso_falsificado',
        titulo: 'Uso de Selo Falsificado',
        conteudo: 'fazer uso do selo ou sinal falsificado',
        tipo: 'conduta_equiparada',
        peso: 1,
        ordem: 5
      },
      {
        id: 'selos_uso_verdadeiro_indevido',
        titulo: 'Uso Indevido de Selo Verdadeiro',
        conteudo: 'fazer uso, sem autorização, do selo ou sinal verdadeiro em prejuízo de outrem ou em proveito próprio ou alheio',
        tipo: 'conduta_equiparada',
        peso: 1,
        ordem: 6
      }
    ]
  }
]

/**
 * Popular tabela content_subsections
 */
async function populateContentSubsections() {
  console.log('🚀 Iniciando população da tabela content_subsections...')
  
  try {
    // Limpar dados existentes (opcional)
    console.log('🧹 Limpando dados existentes...')
    const { error: deleteError } = await supabase
      .from('content_subsections')
      .delete()
      .neq('id', 'never_matches') // Deletar todos
    
    if (deleteError && !deleteError.message.includes('no rows')) {
      console.warn('Aviso ao limpar dados:', deleteError)
    }

    // Preparar dados para inserção
    const allSubsections = []
    
    for (const sectionData of subsectionsData) {
      for (const subsection of sectionData.subsections) {
        allSubsections.push({
          id: subsection.id,
          section_id: sectionData.section_id,
          titulo: subsection.titulo,
          conteudo: subsection.conteudo,
          tipo: subsection.tipo,
          peso: subsection.peso,
          ordem: subsection.ordem,
          is_active: true
        })
      }
    }

    console.log(`📝 Inserindo ${allSubsections.length} subseções...`)
    
    // Inserir dados em lotes
    const batchSize = 10
    for (let i = 0; i < allSubsections.length; i += batchSize) {
      const batch = allSubsections.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('content_subsections')
        .insert(batch)
        .select()

      if (error) {
        console.error(`❌ Erro inserindo lote ${Math.floor(i/batchSize) + 1}:`, error)
        throw error
      }
      
      console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} inserido: ${batch.length} subseções`)
    }

    console.log('✅ Tabela content_subsections populada com sucesso!')
    return allSubsections.length
    
  } catch (error) {
    console.error('❌ Erro populando content_subsections:', error)
    throw error
  }
}

/**
 * Calcular e inserir targets iniciais
 */
async function calculateInitialTargets() {
  console.log('🎯 Calculando targets iniciais...')
  
  try {
    // Para cada seção, calcular distribuição ideal para 10 questões
    const targetPerSection = 10
    const statsToInsert = []
    
    for (const sectionData of subsectionsData) {
      const subsections = sectionData.subsections
      const totalWeight = subsections.reduce((sum, sub) => sum + sub.peso, 0)
      
      console.log(`📊 Seção ${sectionData.section_id}: ${subsections.length} subseções, peso total = ${totalWeight}`)
      
      for (const subsection of subsections) {
        const targetCount = Math.ceil((subsection.peso / totalWeight) * targetPerSection)
        
        statsToInsert.push({
          section_id: sectionData.section_id,
          subsection_id: subsection.id,
          question_count: 0,
          target_count: targetCount,
          last_updated: new Date().toISOString()
        })
        
        console.log(`  • ${subsection.titulo}: target = ${targetCount} questões (peso ${subsection.peso})`)
      }
    }

    // Limpar stats existentes
    console.log('🧹 Limpando estatísticas existentes...')
    const { error: deleteStatsError } = await supabase
      .from('subsection_question_stats')
      .delete()
      .neq('section_id', -1) // Deletar todos
    
    if (deleteStatsError && !deleteStatsError.message.includes('no rows')) {
      console.warn('Aviso ao limpar stats:', deleteStatsError)
    }

    // Inserir estatísticas iniciais
    console.log(`📊 Inserindo ${statsToInsert.length} estatísticas iniciais...`)
    
    const { data: statsData, error: statsError } = await supabase
      .from('subsection_question_stats')
      .insert(statsToInsert)
      .select()

    if (statsError) {
      console.error('❌ Erro inserindo estatísticas:', statsError)
      throw statsError
    }
    
    console.log('✅ Estatísticas iniciais calculadas e inseridas!')
    return statsToInsert.length
    
  } catch (error) {
    console.error('❌ Erro calculando targets:', error)
    throw error
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🎬 Iniciando população das tabelas de subseções...\n')
    
    const subsectionsCount = await populateContentSubsections()
    console.log(`\n✅ ${subsectionsCount} subseções inseridas com sucesso!\n`)
    
    const statsCount = await calculateInitialTargets()
    console.log(`\n✅ ${statsCount} estatísticas inseridas com sucesso!\n`)
    
    console.log('🎉 População das tabelas concluída com sucesso!')
    console.log('\n📋 Resumo:')
    console.log(`  • Subseções criadas: ${subsectionsCount}`)
    console.log(`  • Estatísticas criadas: ${statsCount}`)
    console.log('  • Target padrão: 10 questões por seção')
    console.log('\n🚀 O sistema de distribuição equilibrada está pronto para uso!')
    
  } catch (error) {
    console.error('\n❌ Erro durante a população das tabelas:', error)
    process.exit(1)
  }
}

// Exportar funções para uso externo
export { populateContentSubsections, calculateInitialTargets, main }

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}