import { Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import IssueCertificate from './pages/IssueCertificate';
import VerifyCertificate from './pages/VerifyCertificate';
import AdminDashboard from './pages/AdminDashboard';
import PublicVerify from './pages/PublicVerify';
import StudentDashboard from './pages/StudentDashboard';
import NotFound from './pages/NotFound';
import MinterPortal from './pages/MinterPortal';
import ProtectedRoute from './components/ProtectedRoute';
import TestDashboard from './pages/TestDashboard';
import IssueAchievementCertificate from './pages/IssueAchievementCertificate';
import IssueCustomCertificate from './pages/IssueCustomCertificate';

function App() {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/test" element={<TestDashboard />} />
            <Route path="/minter" element={<ProtectedRoute role="MINTER"><MinterPortal /></ProtectedRoute>} />
            <Route path="/issue" element={<IssueCertificate />} />
            <Route path="/issue-achievement" element={<IssueAchievementCertificate />} />
            <Route path="/issue-custom" element={<IssueCustomCertificate />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/public-verify" element={<PublicVerify />} />
            <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Web3Provider>
  );
}

export default App;