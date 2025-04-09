import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import GoogleAnalytics from './components/analytics/GoogleAnalytics';

function App() {
  return (
    <Router>
      <GoogleAnalytics />
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App; 