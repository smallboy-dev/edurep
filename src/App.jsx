import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AdminDashboard from './pages/AdminDashboard';
import ViewerScreen from './pages/ViewerScreen';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/admin/:sessionId" element={<AdminDashboard />} />
        <Route path="/viewer/:sessionId" element={<ViewerScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
