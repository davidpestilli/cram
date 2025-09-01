import { useAuth } from '../../contexts/AuthContext'
import Header from './Header'
import Footer from './Footer'

const Layout = ({ children, showFooter = true }) => {
  const { user } = useAuth()

  // Se não estiver logado, não mostrar layout
  if (!user) {
    return children
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 bg-gradient-primary">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}

export default Layout