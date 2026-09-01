import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { DotsHighlighter } from '../components/DotsHighlighter';
import { DotsDiagram } from '../components/DotsDiagram';

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
          
          <p className="text-xl text-[--color-text-secondary] mb-12 leading-relaxed">
            A DSL for compositional, recursive diagrams.
          </p>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-16">
            <p className="text-[--color-text-secondary] mb-6 leading-relaxed">
              DOTS is a graph description language derived from{' '}
              <a 
                href="https://graphviz.org/doc/info/lang.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[--color-accent] hover:underline"
              >
                DOT
              </a>{' '}
              (the language used by{' '}
              <a 
                href="https://graphviz.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[--color-accent] hover:underline"
              >
                Graphviz
              </a>
              ). It extends DOT with support for typed graphs and edges, recursive nesting, and mandatory named ports—features designed for representing compositional, recursive diagram structures.
            </p>
            <p className="text-[--color-text-secondary] leading-relaxed">
              DOTS is used by our tools to represent code architecture, data flow, and other structured relationships in a way that can be programmatically manipulated and rendered.
            </p>
          </div>

          {/* Live Demo Button */}
          <div className="mb-16">
            <Link
              to="/dots/playground"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[--color-accent] text-white font-medium rounded-lg hover:bg-[--color-accent-hover] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try Live Demo
            </Link>
          </div>

          {/* Language Specification */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-[--color-text-primary] mb-8 pb-4 border-b border-[--color-border]">
              Language Specification
            </h2>

            <div className="prose prose-lg max-w-none">
              {/* Example */}
              <section className="mb-12">
                <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                  Example
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <DotsHighlighter code={`example {
    Alice :: Person {
        port right out
    }
    Bob :: Person {
        port left in
    }
    Alice.out -> Bob.in :: knows
}`} />
                  </div>
                  <div className="bg-[--color-surface] border border-[--color-border] rounded-lg overflow-hidden h-full">
                    {/* Rendered with the real graph-editor. The canvas background
                        is set to the card's surface color so it blends in. */}
                    <DotsDiagram
                      bgVar="--color-surface"
                      className="w-full h-full"
                      code={`example {
  Alice :: Person {
    port right out
  }
  Bob :: Person {
    port left in
  }
  Alice.out -> Bob.in :: knows
}`}
                    />
                  </div>
                </div>
              </section>

              {/* Grammar */}
              <section className="mb-12">
                <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                  Grammar
                </h3>
                <pre className="bg-[--color-surface] border border-[--color-border] rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm font-mono text-[--color-text-primary]">{`file       : ( stmt [ ';' ] )*
graph      : ID [ type_ann ] [ attr_list ] [ block ]
block      : '{' ( stmt [ ';' ] )* '}'
stmt       : graph | edge_stmt | assignment | port_stmt

port_stmt  : 'port' [ placement ] ID [ type_ann ] [ attr_list ]
placement  : 'left' | 'right' | 'top' | 'bottom'
           | 'topleft' | 'topright' | 'bottomleft' | 'bottomright'

edge_stmt  : edge_end ( edgeop edge_end [ type_ann ] )+ [ attr_list ]
edgeop     : '->' | '--'
edge_end   : ID ( '.' ID )*
type_ann   : '::' ID

attr_list  : ( '[' [ a_list ] ']' )+
a_list     : ID '=' ID ( ',' ID '=' ID )*
assignment : ID '=' ID`}</code>
                </pre>
              </section>

            {/* ID Forms */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                ID Forms
              </h3>
              <ul className="space-y-2 text-[--color-text-secondary]">
                <li><strong className="text-[--color-text-primary]">Bare name:</strong> <code className="bg-[--color-surface] px-1 rounded">[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*</code> (no leading digit).</li>
                <li><strong className="text-[--color-text-primary]">Numeral:</strong> <code className="bg-[--color-surface] px-1 rounded">[-]?(.[0-9]+ | [0-9]+(.[0-9]*)?)</code>.</li>
                <li><strong className="text-[--color-text-primary]">Quoted string:</strong> <code className="bg-[--color-surface] px-1 rounded">"..."</code> supports <code className="bg-[--color-surface] px-1 rounded">\"</code> escaping and <code className="bg-[--color-surface] px-1 rounded">\</code>-continued newlines; concatenate with <code className="bg-[--color-surface] px-1 rounded">+</code>.</li>
                <li><strong className="text-[--color-text-primary]">HTML string:</strong> <code className="bg-[--color-surface] px-1 rounded">&lt;...&gt;</code>. Angle brackets must be balanced; content must be valid XML.</li>
              </ul>
            </section>

            {/* Keywords */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                Keywords
              </h3>
              <p className="text-[--color-text-secondary]">
                Case-insensitive: <code className="bg-[--color-surface] px-1 rounded">port</code> is the only keyword. DOT's keywords (<code className="bg-[--color-surface] px-1 rounded">graph</code>, <code className="bg-[--color-surface] px-1 rounded">digraph</code>, <code className="bg-[--color-surface] px-1 rounded">node</code>, <code className="bg-[--color-surface] px-1 rounded">subgraph</code>, <code className="bg-[--color-surface] px-1 rounded">strict</code>) are not reserved; they are ordinary IDs and may name graphs and ports.
              </p>
            </section>

            {/* Comments */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                Comments
              </h3>
              <ul className="space-y-2 text-[--color-text-secondary]">
                <li><code className="bg-[--color-surface] px-1 rounded">// ...</code> — Line comment.</li>
                <li><code className="bg-[--color-surface] px-1 rounded">/* ... */</code> — Block comment.</li>
                <li><code className="bg-[--color-surface] px-1 rounded">#</code> — Lines starting with this character are discarded (preprocessor remnants).</li>
              </ul>
            </section>

            {/* Semantics */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                Semantics
              </h3>
              
              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Attributes</h4>
              <p className="text-[--color-text-secondary] mb-4">
                An attribute list is local to the single object it is written on. There are no default-attribute statements, no sibling-level cascade, and no inheritance into or out of nested graphs. Shared appearance across many objects is expressed through their <code className="bg-[--color-surface] px-1 rounded">:: Type</code>, not by attribute propagation.
              </p>
              <p className="text-[--color-text-secondary] mb-4">
                A graph may carry its own inline <code className="bg-[--color-surface] px-1 rounded">attr_list</code> immediately after its type — <code className="bg-[--color-surface] px-1 rounded">Team :: Org [rankdir=LR] {'{ }'}</code>. A bare <code className="bg-[--color-surface] px-1 rounded">key = value</code> statement inside a graph body sets that attribute on the enclosing graph — at the file's top level, on the implicit root.
              </p>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Types</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A graph, edge, or port may be annotated with <code className="bg-[--color-surface] px-1 rounded">:: TypeName</code>. Omitting the annotation is equivalent to <code className="bg-[--color-surface] px-1 rounded">:: any</code>. A graph carries its type just before its brace body: <code className="bg-[--color-surface] px-1 rounded">Name :: Type {'{ }'}</code>.
              </p>
              <p className="text-[--color-text-secondary] mb-4">
                Edge type is written after the target endpoint per hop. In a chain, a hop with no annotation is typed as <code className="bg-[--color-surface] px-1 rounded">any</code>:
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`A.p -> B.q :: knows -> C.r :: likes`} />
              </div>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Ports</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A port is a named anchor on a graph's boundary — the graph's interface, visible from outside. Ports are mandatory on both ends of every edge, so an unqualified graph reference is not a valid edge endpoint.
              </p>
              <p className="text-[--color-text-secondary] mb-4">
                A port may optionally be declared inside a graph's body, which allows it to carry a type and/or attributes. The optional placement marker (<code className="bg-[--color-surface] px-1 rounded">left</code>, <code className="bg-[--color-surface] px-1 rounded">right</code>, <code className="bg-[--color-surface] px-1 rounded">top</code>, <code className="bg-[--color-surface] px-1 rounded">bottom</code>, or corners) is advisory. Declaration is never required — a port referenced in an edge but never declared is implicitly created, untyped (<code className="bg-[--color-surface] px-1 rounded">:: any</code>) and unplaced. This rule is uniform: it holds for every graph at every nesting level, so a misspelled port name silently creates a fresh port rather than raising an error.
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`Bob :: Engineer {
    port request                       // declared, untyped, unplaced
    port right response :: Message     // typed and placed on the right side
    port topleft config [label="configuration"]
}`} />
              </div>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Ports as Scope Junctions</h4>
              <p className="text-[--color-text-secondary] mb-4">
                Because ports belong to every graph at any nesting level (the file's top level — the implicit root — included), a port is also a scope junction: an edge may attach to it both from inside the graph's body and from any ancestor scope, and the anchor joins them. An edge in the graph's own body names it by its bare port name; an edge in an ancestor scope qualifies it with a path to the graph.
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`outer {
    A :: T
    mid :: Sub {
        port q                 // a boundary anchor on mid
        B :: T
        B.out -> q             // inside: the bare name is mid's boundary port
    }
    A.out -> mid.q             // outside: a qualified path reaches the same anchor
}`} />
              </div>
              <p className="text-[--color-text-secondary] mb-4">
                The language ascribes no direction or flow to a junction; any such meaning is left to the schema. The graph itself, unqualified, is never an edge endpoint.
              </p>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Structure &amp; Atomic Graphs</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A graph's contents divide into <em>interface</em> (its ports) and <em>structure</em> (its member graphs and internal edges). A graph with no structure is <strong className="text-[--color-text-primary]">atomic</strong> — what DOT calls a node: it has no body, or its body holds nothing but port declarations and assignments. Ports and attributes do not affect atomicity; adding a member or an edge makes a graph non-atomic.
              </p>
              <p className="text-[--color-text-secondary] mb-4">
                An atomic graph is drawn as a node (a collapsed box). A non-atomic graph is drawn expanded — its structure visible — by default; <code className="bg-[--color-surface] px-1 rounded">expanded=false</code> collapses it to a node until opened. The <code className="bg-[--color-surface] px-1 rounded">expanded</code> attribute is meaningful only on non-atomic graphs.
              </p>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Nested Graphs</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A graph body may directly contain member graphs and edges among them, recursively, at any depth. The file itself is the body of an implicit, unnamed root graph; every <em>declared</em> graph requires a name, which enables path-based referencing of its contents:
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`Alice :: Person {
    team :: Team {
        Bob :: Engineer
        Carol :: Designer
        Bob.helpees -> Carol.helpers :: collaborates
    }
    projects :: Portfolio {
        P1 :: Project
        P2 :: Project
        P1.remaining_budget -> P2.budget
    }
}`} />
              </div>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Path Resolution</h4>
              <p className="text-[--color-text-secondary] mb-4">
                An <code className="bg-[--color-surface] px-1 rounded">edge_end</code> is either a bare name or a dotted path. A bare name (a single ID, no <code className="bg-[--color-surface] px-1 rounded">.</code>) refers to a boundary port of the graph whose body directly contains the edge — for an edge at the file's top level, the implicit root. A dotted path is a sequence of at least two IDs: every segment except the last names a member graph along the containment path, and the final segment is always a port on the graph the preceding segments reach.
              </p>
              <p className="text-[--color-text-secondary] mb-4">
                For example, <code className="bg-[--color-surface] px-1 rounded">Alice.team.Bob.out</code> resolves as member <code className="bg-[--color-surface] px-1 rounded">Alice</code> → member <code className="bg-[--color-surface] px-1 rounded">team</code> → member <code className="bg-[--color-surface] px-1 rounded">Bob</code> → port <code className="bg-[--color-surface] px-1 rounded">out</code> on Bob, while <code className="bg-[--color-surface] px-1 rounded">Alice.team.q</code> resolves to port <code className="bg-[--color-surface] px-1 rounded">q</code> on <code className="bg-[--color-surface] px-1 rounded">team</code>.
              </p>
              <p className="text-[--color-text-secondary]">
                Edges in an outer graph may target ports anywhere in the nesting, recursively: <code className="bg-[--color-surface] px-1 rounded">Alice.team.Bob.out {`->`} Dave.in :: reports</code>. Only the terminal port is created implicitly when absent; a non-terminal segment that names no member graph is a resolution error — member graphs are never created by reference. Position disambiguates names: the terminal segment is always a port and non-terminal segments are always members, so a graph may hold a port and a member of the same name without ambiguity.
              </p>
            </section>

            {/* Encoding */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                Encoding
              </h3>
              <p className="text-[--color-text-secondary]">
                UTF-8 by default; Latin-1 via <code className="bg-[--color-surface] px-1 rounded">charset</code> attribute. HTML entities (<code className="bg-[--color-surface] px-1 rounded">&amp;amp;</code>, <code className="bg-[--color-surface] px-1 rounded">&amp;lt;</code>, <code className="bg-[--color-surface] px-1 rounded">&amp;gt;</code>, named entities like <code className="bg-[--color-surface] px-1 rounded">&amp;beta;</code>) are valid inside HTML strings.
              </p>
            </section>

            {/* Supported Attributes */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                Supported Attributes
              </h3>
              <p className="text-[--color-text-secondary] mb-6">
                The visualizer currently recognizes the following attributes. Other attributes may be written but are ignored.
              </p>
              
              <h4 className="text-lg font-semibold text-[--color-text-primary] mb-3">Reserved Attributes</h4>
              <p className="text-[--color-text-secondary] mb-4">
                The language reserves the following attributes. Any other attribute may be written but need not be supported by any renderer.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-[--color-border] rounded-lg">
                  <thead className="bg-[--color-surface]">
                    <tr>
                      <th className="text-left px-4 py-2 border-b border-[--color-border] text-[--color-text-primary]">Attribute</th>
                      <th className="text-left px-4 py-2 border-b border-[--color-border] text-[--color-text-primary]">Example</th>
                      <th className="text-left px-4 py-2 border-b border-[--color-border] text-[--color-text-primary]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-[--color-text-secondary]">
                    <tr>
                      <td className="px-4 py-2 border-b border-[--color-border]"><code className="bg-[--color-surface] px-1 rounded">pos</code></td>
                      <td className="px-4 py-2 border-b border-[--color-border]"><code className="bg-[--color-surface] px-1 rounded">pos="100,200"</code></td>
                      <td className="px-4 py-2 border-b border-[--color-border]">Position coordinates (x,y)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border-b border-[--color-border]"><code className="bg-[--color-surface] px-1 rounded">label</code></td>
                      <td className="px-4 py-2 border-b border-[--color-border]"><code className="bg-[--color-surface] px-1 rounded">label="Display Name"</code></td>
                      <td className="px-4 py-2 border-b border-[--color-border]">Display label, if different from the graph/port name</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code className="bg-[--color-surface] px-1 rounded">expanded</code></td>
                      <td className="px-4 py-2"><code className="bg-[--color-surface] px-1 rounded">expanded=true</code></td>
                      <td className="px-4 py-2">Whether a non-atomic graph is drawn expanded (structure visible) or collapsed to a node; ignored on atomic graphs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Deviations from DOT */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                Deviations from DOT
              </h3>
              <p className="text-[--color-text-secondary] mb-4">
                For users familiar with{' '}
                <a 
                  href="https://graphviz.org/doc/info/lang.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[--color-accent] hover:underline"
                >
                  Graphviz DOT
                </a>, here are the key differences:
              </p>
              <ul className="space-y-3 text-[--color-text-secondary]">
                <li><strong className="text-[--color-text-primary]">No declaration keywords:</strong> <code className="bg-[--color-surface] px-1 rounded">graph</code>, <code className="bg-[--color-surface] px-1 rounded">digraph</code>, <code className="bg-[--color-surface] px-1 rounded">node</code>, <code className="bg-[--color-surface] px-1 rounded">subgraph</code>, and <code className="bg-[--color-surface] px-1 rounded">strict</code> do not exist. A graph is declared by its name alone — <code className="bg-[--color-surface] px-1 rounded">Bob :: Engineer {'{ … }'}</code> — and DOT's node statement is reread as this form with an empty body. The only keyword is <code className="bg-[--color-surface] px-1 rounded">port</code>.</li>
                <li><strong className="text-[--color-text-primary]">Directedness is per edge:</strong> Edges may be individually directed (<code className="bg-[--color-surface] px-1 rounded">{`->`}</code>) or undirected (<code className="bg-[--color-surface] px-1 rounded">--</code>) within the same graph; multi-edges are always permitted.</li>
                <li><strong className="text-[--color-text-primary]">One structural primitive:</strong> There is no node primitive — it is graph all the way down, with the same syntax and semantics at every nesting level. What DOT calls a node is an <em>atomic</em> graph: one whose body holds no structure.</li>
                <li><strong className="text-[--color-text-primary]">The file is the root graph:</strong> A DOTS file is the body of an implicit, unnamed root graph — a statement list with no surrounding declaration or braces. The root is the only anonymous graph; every declared graph requires a name for path-based referencing.</li>
                <li><strong className="text-[--color-text-primary]">Type annotations:</strong> Graphs, edges, and ports may be typed with <code className="bg-[--color-surface] px-1 rounded">:: TypeName</code>; omitted annotations implicitly default to <code className="bg-[--color-surface] px-1 rounded">:: any</code>.</li>
                <li><strong className="text-[--color-text-primary]">. is the universal path delimiter:</strong> Serves as both nesting separator and port accessor; the final segment is always the port: <code className="bg-[--color-surface] px-1 rounded">Alice.team.Bob.out</code>.</li>
                <li><strong className="text-[--color-text-primary]">Ports require a name; compass directions removed:</strong> Edges attach to a named port only — DOT's compass point syntax does not exist in DOTS.</li>
                <li><strong className="text-[--color-text-primary]">Ports are a graph's interface:</strong> Any graph body, at any nesting level (the file's top level included), may declare ports. Declaration is never required — a port referenced in an edge but never declared is implicitly created, untyped and unplaced; this holds uniformly for every graph. The optional placement marker (<code className="bg-[--color-surface] px-1 rounded">left</code>, <code className="bg-[--color-surface] px-1 rounded">right</code>, etc.) is advisory only.</li>
                <li><strong className="text-[--color-text-primary]">Ports are mandatory on both ends:</strong> Every endpoint names a port — a bare name (the enclosing graph's own boundary port) or a qualified path (<code className="bg-[--color-surface] px-1 rounded">Alice.out</code>). <code className="bg-[--color-surface] px-1 rounded">Alice.out {`->`} Bob.in</code> connects the members Alice and Bob; <code className="bg-[--color-surface] px-1 rounded">Alice {`->`} Bob</code> does not — bare names are boundary ports on the enclosing graph itself.</li>
                <li><strong className="text-[--color-text-primary]">Ports are scope junctions:</strong> A port may be an edge endpoint from either side of its graph's boundary — by bare name inside the graph's body, or by a qualified path (<code className="bg-[--color-surface] px-1 rounded">mid.q</code>) from an ancestor scope. The graph itself, unqualified, is never an endpoint.</li>
              </ul>
            </section>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
