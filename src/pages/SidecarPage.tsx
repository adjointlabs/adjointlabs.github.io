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

          <Link
            to="/sidecar/playground"
            className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-md bg-[--color-accent] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Try the playground — Lean proofs as diagrams →
          </Link>

          <div className="prose prose-lg text-[--color-text-secondary] space-y-6">
            <p>
              Sidecar shows source code as an editable node-and-wire diagram. Not a
              drawing <em>of</em> the code, but a projection of it, kept in sync by a
              bidirectional lens. Edit the text and the diagram updates. Edit the
              diagram and, where the edit has a textual meaning, the source changes
              with it. Where it doesn't, Sidecar tells you instead of pretending.
            </p>

            <h2 className="text-2xl font-semibold text-[--color-text-primary] mt-12 mb-4">
              Today: Lean proofs
            </h2>
            <p>
              The first language with a full pipeline is{' '}
              <a href="https://lean-lang.org" className="text-[--color-accent] hover:underline">Lean</a>.
              A structured proof is already a graph, and the diagram draws exactly that:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-[--color-text-primary]">A box is a statement that binds facts</strong>:
                a lemma, a <code className="bg-[--color-surface] px-1 rounded">have</code>, a case branch. Expand it to read its proof;
                collapse it and only its signature remains, the premises it needs and
                the facts it delivers. A collapsed box shows what you're taking on
                trust, though its proof is still there, and still checked.
              </li>
              <li>
                <strong className="text-[--color-text-primary]">A wire is a fact</strong>: one proof of one
                proposition, flowing from the step that establishes it to the steps
                that use it. Premises arrive on the left, conclusions leave on the
                right. Hypotheses from the enclosing scope appear as context ports,
                not lines.
              </li>
              <li>
                <strong className="text-[--color-text-primary]">The flags audit the proof</strong>. A box
                hiding a <code className="bg-[--color-surface] px-1 rounded">sorry</code> anywhere inside wears a badge, everything
                resting on it is washed pale red, unproven premises ring their ports,
                and unused facts dim gray: the classic tells, routed to where your
                eyes are. Built for one posture: a human checking a proof an AI wrote.
              </li>
              <li>
                <strong className="text-[--color-text-primary]">Edits flow back where they can</strong>.
                Rename a hypothesis, rewrite a justification, delete a step, extract
                or inline a <code className="bg-[--color-surface] px-1 rounded">have</code> by grouping, and the <code className="bg-[--color-surface] px-1 rounded">.lean</code>{' '}
                source is edited for you. Draw a wire and it becomes a dashed amber{' '}
                <em>proposal</em>, a claim the text doesn't store, confirmed or
                dropped when the file is re-elaborated.
              </li>
            </ul>
            <p>
              The instant derivation is syntactic: it runs on every keystroke, and
              survives all 4,000+ files of Mathlib without a crash. An optional
              elaboration pass feeds back what the tactics <em>really</em> used,
              silent <code className="bg-[--color-surface] px-1 rounded">omega</code> premises included, so every wire is exact.
            </p>

            <h2 className="text-2xl font-semibold text-[--color-text-primary] mt-12 mb-4">
              Next to it: Python, and the editor itself
            </h2>
            <p>
              In the VS Code extension (where Sidecar is being built), the same
              machinery runs a fully bidirectional Python lens: statements and
              expressions as nested boxes, with a verbatim fallback tier so that
              effectively all real-world Python translates and round-trips. The
              diagrams themselves are plain{' '}
              <Link to="/dots" className="text-[--color-accent] hover:underline">DOTS</Link>{' '}
              text: every derived graph is an ordinary file you can read, diff, and
              edit in the <Link to="/dots/playground" className="text-[--color-accent] hover:underline">DOTS playground</Link>.
            </p>
            <p className="text-base text-[--color-text-muted]">
              Status: Lean runs in the browser playground above and in the extension;
              Python lives in the extension. More languages follow the same recipe:
              a domain that teaches the editor what the boxes mean, and a lens that
              keeps text and diagram honest.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
