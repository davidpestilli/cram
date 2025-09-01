import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PageTransition from './components/PageTransition'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProfileSetup from './pages/ProfileSetup'
import Subjects from './pages/Subjects'
import Sections from './pages/Sections'
import StudySession from './pages/StudySession'
import QuestionSelection from './pages/QuestionSelection'
import Shop from './pages/Shop'
import Inventory from './pages/Inventory'
import Profile from './pages/Profile'
import Achievements from './pages/Achievements'

function App() {
  return (
    <AuthProvider>
      <Router>
        <PageTransition>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/profile-setup" 
              element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subjects" 
              element={
                <ProtectedRoute>
                  <Subjects />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subjects/:subjectId/sections" 
              element={
                <ProtectedRoute>
                  <Sections />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subjects/:subjectId/sections/:sectionId/select" 
              element={
                <ProtectedRoute>
                  <QuestionSelection />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subjects/:subjectId/sections/:sectionId/study" 
              element={
                <ProtectedRoute>
                  <StudySession />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shop" 
              element={
                <ProtectedRoute>
                  <Shop />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/achievements" 
              element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PageTransition>
      </Router>
    </AuthProvider>
  )
}

export default App