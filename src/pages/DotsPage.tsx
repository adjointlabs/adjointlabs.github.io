import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { DotsHighlighter } from '../components/DotsHighlighter';

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
              ). It extends DOT with support for typed nodes and edges, nested graphs, and mandatory named ports—features designed for representing compositional, recursive diagram structures.
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
                    <DotsHighlighter code={`graph example {
    Alice :: Person {
        port out :: default [dir=out]
    }
    
    Bob :: Person {
        port in :: default [dir=in]
        port out :: default [dir=out]
    }
    
    Carol :: Person {
        port in :: default [dir=in]
    }
    
    Alice.out -> Bob.in :: knows
    Bob.out -> Carol.in :: knows
}`} />
                  </div>
                  <div className="flex items-center justify-center bg-[--color-surface] border border-[--color-border] rounded-lg p-4 min-h-[300px]">
                    {/* Placeholder for diagram image */}
                    <p className="text-[--color-text-muted] text-sm">Diagram image placeholder</p>
                  </div>
                </div>
              </section>

              {/* Grammar */}
              <section className="mb-12">
                <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                  Grammar
                </h3>
                <pre className="bg-[--color-surface] border border-[--color-border] rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm font-mono text-[--color-text-primary]">{`graph      : 'graph' [ ID ] '{' stmt_list '}'
stmt_list  : [ stmt [ ';' ] stmt_list ]
stmt       : node_stmt | edge_stmt | attr_stmt | ID '=' ID | subgraph
attr_stmt  : (graph | node | edge) attr_list
attr_list  : '[' [ a_list ] ']' [ attr_list ]
a_list     : ID '=' ID [ (';' | ',') ] [ a_list ]
edge_stmt  : edge_end edgeRHS [ attr_list ]
edgeRHS    : edgeop edge_end [ '::' ID ] [ edgeRHS ]
edgeop     : '->' | '--'
node_stmt     : ID [ '::' ID ] [ attr_list ] [ node_body ]
node_body     : '{' node_body_list '}'
node_body_list: [ ( port_stmt | subgraph ) [ node_body_list ] ]
port_stmt     : 'port' ID [ '::' ID ] [ attr_list ]
edge_end      : ID '.' id_path
id_path       : ID [ '.' id_path ]
subgraph      : 'subgraph' ID '{' stmt_list '}'`}</code>
                </pre>
              </section>

              {/* Language Header */}
              <section className="mb-12">
                <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                  Language Header
                </h3>
              <p className="text-[--color-text-secondary] mb-4">
                A DOTS file may begin with a language directive that specifies how type annotations should be interpreted:
              </p>
              <DotsHighlighter code={`// language: python

graph my_module {
  func1 :: FunctionDefinition { ... }
}`} />
              <ul className="list-disc list-inside text-[--color-text-secondary] mt-4 space-y-2">
                <li><code className="bg-[--color-surface] px-1 rounded">// language: python</code> — Types map to the Python element catalog (FunctionDefinition, Identifier, etc.).</li>
                <li>No header or <code className="bg-[--color-surface] px-1 rounded">// language: DOTS</code> — Generic mode; all nodes are generic Box, all structures are DiagrammaticStructure.</li>
              </ul>
            </section>

            {/* ID Forms */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                ID Forms
              </h3>
              <ul className="space-y-2 text-[--color-text-secondary]">
                <li><strong className="text-[--color-text-primary]">Bare name:</strong> <code className="bg-[--color-surface] px-1 rounded">[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*</code> (no leading digit).</li>
                <li><strong className="text-[--color-text-primary]">Numeral:</strong> <code className="bg-[--color-surface] px-1 rounded">[-]?(.[0-9]+ | [0-9]+(.[0-9]*)?)</code>.</li>
                <li><strong className="text-[--color-text-primary]">Quoted string:</strong> <code className="bg-[--color-surface] px-1 rounded">"..."</code> supports <code className="bg-[--color-surface] px-1 rounded">\"</code> escaping; concatenate with <code className="bg-[--color-surface] px-1 rounded">+</code>.</li>
                <li><strong className="text-[--color-text-primary]">HTML string:</strong> <code className="bg-[--color-surface] px-1 rounded">&lt;...&gt;</code>. Angle brackets must be balanced; content must be valid XML.</li>
              </ul>
            </section>

            {/* Keywords */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                Keywords
              </h3>
              <p className="text-[--color-text-secondary]">
                Case-insensitive: <code className="bg-[--color-surface] px-1 rounded">graph</code>, <code className="bg-[--color-surface] px-1 rounded">node</code>, <code className="bg-[--color-surface] px-1 rounded">edge</code>, <code className="bg-[--color-surface] px-1 rounded">subgraph</code>, <code className="bg-[--color-surface] px-1 rounded">port</code>.
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
                Set via <code className="bg-[--color-surface] px-1 rounded">attr_stmt</code> (<code className="bg-[--color-surface] px-1 rounded">graph [...]</code>, <code className="bg-[--color-surface] px-1 rounded">node [...]</code>, <code className="bg-[--color-surface] px-1 rounded">edge [...]</code>) or inline on a statement. Default attributes apply to all subsequent objects of that type in the same scope.
              </p>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Types</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A node, edge, or port may be annotated with <code className="bg-[--color-surface] px-1 rounded">:: TypeName</code>. Omitting the annotation is equivalent to <code className="bg-[--color-surface] px-1 rounded">:: default</code>. Edge type is written after the target endpoint per hop:
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`A.p -> B.q :: knows -> C.r :: likes`} />
              </div>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Ports</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A port is the named attachment point on a node where an edge connects. Ports are declared inside node bodies:
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`Bob :: Engineer {
    port in :: default [dir=in]
    port out :: default [dir=out]
    port x :: var [dir=in]
}`} />
              </div>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Nested Graphs</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A node may contain one or more named subgraphs in a brace body, making the structure recursive:
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`Alice :: Person {
    subgraph team {
        Bob :: Engineer
        Carol :: Designer
        Bob.out -> Carol.in :: collaborates
    }
    subgraph projects {
        P1 :: Project
        P2 :: Project
        P1.out -> P2.in :: blocks
    }
}`} />
              </div>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Path Resolution</h4>
              <p className="text-[--color-text-secondary] mb-4">
                An <code className="bg-[--color-surface] px-1 rounded">edge_end</code> is a dotted sequence of at least two IDs. For example, <code className="bg-[--color-surface] px-1 rounded">Alice.team.Bob.out</code> resolves as: node Alice → subgraph team → node Bob → port out.
              </p>
              <p className="text-[--color-text-secondary]">
                Edges in an outer graph may target nodes inside any subgraph recursively: <code className="bg-[--color-surface] px-1 rounded">Alice.team.Bob.out {`->`} Dave.in :: reports</code>
              </p>
            </section>

            {/* Encoding */}
            <section className="mb-12">
              <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                Encoding
              </h3>
              <p className="text-[--color-text-secondary]">
                UTF-8 by default; Latin-1 via <code className="bg-[--color-surface] px-1 rounded">charset</code> attribute. HTML entities are valid inside HTML strings.
              </p>
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
                <li><strong className="text-[--color-text-primary]">Removed graph/digraph distinction:</strong> <code className="bg-[--color-surface] px-1 rounded">graph</code> is the only declaration keyword; edges may be individually directed (<code className="bg-[--color-surface] px-1 rounded">{`->`}</code>) or undirected (<code className="bg-[--color-surface] px-1 rounded">--</code>) within the same graph.</li>
                <li><strong className="text-[--color-text-primary]">Removed strict:</strong> Multi-edges are always permitted.</li>
                <li><strong className="text-[--color-text-primary]">Type annotations:</strong> Nodes and edges may be typed with <code className="bg-[--color-surface] px-1 rounded">:: TypeName</code>; omitted annotations default to <code className="bg-[--color-surface] px-1 rounded">:: default</code>.</li>
                <li><strong className="text-[--color-text-primary]">Nodes may contain subgraphs:</strong> A node declaration may include a brace body holding one or more named subgraphs; nesting is recursive.</li>
                <li><strong className="text-[--color-text-primary]">Subgraphs must be named:</strong> Anonymous subgraphs do not exist; a name is required for path-based referencing.</li>
                <li><strong className="text-[--color-text-primary]">. is the universal path delimiter:</strong> Serves as both nesting separator and port accessor, e.g. <code className="bg-[--color-surface] px-1 rounded">Alice.team.Bob.out</code>.</li>
                <li><strong className="text-[--color-text-primary]">Ports require a name:</strong> Compass directions are removed; edges attach to named ports only.</li>
                <li><strong className="text-[--color-text-primary]">Ports are declared inside nodes:</strong> Ports are first-class entities with types.</li>
                <li><strong className="text-[--color-text-primary]">Ports are mandatory on both ends:</strong> <code className="bg-[--color-surface] px-1 rounded">Alice {`->`} Bob</code> is not valid; both endpoints must qualify a port.</li>
                <li><strong className="text-[--color-text-primary]">Subgraphs cannot be edge endpoints:</strong> Edges must begin and end at a named port on a specific node.</li>
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
