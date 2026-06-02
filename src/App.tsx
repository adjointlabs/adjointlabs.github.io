import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DotsPage } from './pages/DotsPage';
import { SidecarPage } from './pages/SidecarPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dots" element={<DotsPage />} />
        <Route path="/sidecar" element={<SidecarPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
