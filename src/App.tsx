import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DotsPage } from './pages/DotsPage';
import { DotsPlayground } from './pages/DotsPlayground';
import { SidecarPage } from './pages/SidecarPage';
import { SidecarPlayground } from './pages/SidecarPlayground';
import { PythonPlayground } from './pages/PythonPlayground';
import { ScrollToTop } from './components/ScrollToTop';

// One playground URL, two languages: ?lang=python switches the Lean
// proof-graph playground for the bidirectional Python one.
function SidecarPlaygroundRoute() {
  const [params] = useSearchParams();
  return params.get('lang') === 'python' ? <PythonPlayground /> : <SidecarPlayground />;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dots" element={<DotsPage />} />
        <Route path="/dots/playground" element={<DotsPlayground />} />
        <Route path="/sidecar" element={<SidecarPage />} />
        <Route path="/sidecar/playground" element={<SidecarPlaygroundRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
