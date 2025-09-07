import { useState } from 'react'

const SimpleAITest = () => {
  const [message, setMessage] = useState('Página de teste da IA carregada com sucesso!')
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>🧪 Teste da IA - Página Simples</h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>{message}</p>
      
      <button 
        onClick={() => setMessage('Botão funcionando! ' + new Date().toLocaleTimeString())}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Testar Função
      </button>
      
      <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h3>🔧 Debug Info:</h3>
        <ul>
          <li><strong>URL atual:</strong> {window.location.href}</li>
          <li><strong>Path:</strong> {window.location.pathname}</li>
          <li><strong>Hora:</strong> {new Date().toLocaleString()}</li>
          <li><strong>React Router:</strong> Funcionando</li>
        </ul>
      </div>
    </div>
  )
}

export default SimpleAITest