import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import StudyPage from './components/StudyPage';
import EditPage from './components/EditPage';
import './i18n/config';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<StudyPage />} />
          <Route path="/edit" element={<EditPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
