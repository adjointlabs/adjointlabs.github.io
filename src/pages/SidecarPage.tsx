import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function SidecarPage() {
  return (
    <div className="min-h-screen bg-[--color-background]">
      <Header />
      <main className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-[--color-accent] hover:underline mb-8"
          >
            ← Back to home
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-[--color-text-primary] mb-6">
            Sidecar
          </h1>
          
          <p className="text-xl text-[--color-text-secondary] mb-8 leading-relaxed">
            Round-trip code ↔ architecture visualization.
          </p>
          
          <div className="prose prose-lg text-[--color-text-secondary] space-y-6">
            <p>
              Sidecar enables seamless translation between code and architectural diagrams. 
              Edit your code and see the architecture update in real-time, or modify the 
              diagram and have the changes reflected back in your codebase.
            </p>
            
            <h2 className="text-2xl font-semibold text-[--color-text-primary] mt-12 mb-4">
              Features
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Bi-directional synchronization</li>
              <li>Live architecture visualization</li>
              <li>Support for multiple languages</li>
              <li>IDE integration</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
