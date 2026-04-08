import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import StudyPage from './components/StudyPage';
import EditPage from './components/EditPage';
import TranslationPage from './components/TranslationPage';
import './i18n/config';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<StudyPage />} />
          <Route path="/edit" element={<EditPage />} />
          <Route path="/translation/:courseId" element={<TranslationPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
