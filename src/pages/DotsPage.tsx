import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function DotsPage() {
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
            DOTS
          </h1>
          
          <p className="text-xl text-[--color-text-secondary] mb-8 leading-relaxed">
            A DSL for compositional, recursive diagrams.
          </p>
          
          <div className="prose prose-lg text-[--color-text-secondary] space-y-6">
            <p>
              DOTS is a domain-specific language designed for creating and manipulating 
              compositional diagrams with recursive structure. It provides a mathematical 
              foundation for working with visual representations of complex systems.
            </p>
            
            <h2 className="text-2xl font-semibold text-[--color-text-primary] mt-12 mb-4">
              Features
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Compositional diagram construction</li>
              <li>Recursive diagram definitions</li>
              <li>Type-safe diagram operations</li>
              <li>Export to multiple formats</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
