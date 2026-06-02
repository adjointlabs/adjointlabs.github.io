import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Team } from './components/Team';
import { Applet } from './components/Applet';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[--color-background]">
      <Header />
      <main>
        <Hero />
        <About />
        <Team />
        <Applet />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
