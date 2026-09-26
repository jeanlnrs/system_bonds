import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import BondDetail from './pages/BondDetail'
import Account from './pages/Account'

export default function App() {
  const { cliente, loading } = useAuth()

  if (loading) {
    return <div className="splash"><span className="spinner" /></div>
  }

  if (!cliente) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="bonos/:id" element={<BondDetail />} />
        <Route path="cuenta" element={<Account />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
