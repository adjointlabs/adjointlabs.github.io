import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { CodeShowcase } from './components/CodeShowcase';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[--color-background]">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <CodeShowcase />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
