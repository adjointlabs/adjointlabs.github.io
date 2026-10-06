import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DotsPage } from './pages/DotsPage';
import { DotsPlayground } from './pages/DotsPlayground';
import { SidecarPage } from './pages/SidecarPage';
import { SidecarPlayground } from './pages/SidecarPlayground';
import { ScrollToTop } from './components/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dots" element={<DotsPage />} />
        <Route path="/dots/playground" element={<DotsPlayground />} />
        <Route path="/sidecar" element={<SidecarPage />} />
        <Route path="/sidecar/playground" element={<SidecarPlayground />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
