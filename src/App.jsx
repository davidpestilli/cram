import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PageTransition from './components/PageTransition'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'
import NetworkErrorHandler from './components/NetworkErrorHandler'

// Lazy load components for better performance
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'))
const Subjects = lazy(() => import('./pages/Subjects'))
const Sections = lazy(() => import('./pages/Sections'))
const StudySession = lazy(() => import('./pages/StudySession'))
const QuestionSelection = lazy(() => import('./pages/QuestionSelection'))
const Shop = lazy(() => import('./pages/Shop'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Profile = lazy(() => import('./pages/Profile'))
const Achievements = lazy(() => import('./pages/Achievements'))

function App() {
  return (
    <ErrorBoundary>
      <NetworkErrorHandler>
        <AuthProvider>
          <Router>
            <PageTransition>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              }>
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
              </Suspense>
            </PageTransition>
          </Router>
        </AuthProvider>
      </NetworkErrorHandler>
    </ErrorBoundary>
  )
}

export default App