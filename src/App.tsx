import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Projects } from './components/Projects';
import { Team } from './components/Team';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[--color-background]">
      <Header />
      <main>
        <Hero />
        <About />
        <Projects />
        <Team />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
