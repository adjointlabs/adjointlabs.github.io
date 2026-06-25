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

          {/* Live Demo Button - commented out for now
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
          */}

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
        port right send
    }
    
    Bob :: Person {
        port left recv
        port right send
    }
    
    Carol :: Person {
        port left recv
    }
    
    Alice.send -> Bob.recv :: knows
    Bob.send -> Carol.recv :: knows
}`} />
                  </div>
                  <div className="flex items-center justify-center bg-[--color-surface] border border-[--color-border] rounded-lg p-4 min-h-[300px]">
                    {/* Rendered diagram */}
                    <svg viewBox="0 0 400 200" className="w-full max-w-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Arrow marker */}
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-[--color-text-secondary]" />
                        </marker>
                      </defs>
                      
                      {/* Alice node */}
                      <g>
                        <rect x="20" y="70" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="2" className="text-[--color-text-primary]" fill="none" />
                        <text x="60" y="95" textAnchor="middle" className="text-[--color-text-primary] text-sm font-medium" fill="currentColor">Alice</text>
                        <text x="60" y="115" textAnchor="middle" className="text-[--color-text-muted] text-xs" fill="currentColor">Person</text>
                        {/* out port */}
                        <circle cx="100" cy="100" r="4" fill="currentColor" className="text-[--color-accent]" />
                      </g>
                      
                      {/* Bob node */}
                      <g>
                        <rect x="160" y="70" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="2" className="text-[--color-text-primary]" fill="none" />
                        <text x="200" y="95" textAnchor="middle" className="text-[--color-text-primary] text-sm font-medium" fill="currentColor">Bob</text>
                        <text x="200" y="115" textAnchor="middle" className="text-[--color-text-muted] text-xs" fill="currentColor">Person</text>
                        {/* in port */}
                        <circle cx="160" cy="100" r="4" fill="currentColor" className="text-[--color-accent]" />
                        {/* out port */}
                        <circle cx="240" cy="100" r="4" fill="currentColor" className="text-[--color-accent]" />
                      </g>
                      
                      {/* Carol node */}
                      <g>
                        <rect x="300" y="70" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="2" className="text-[--color-text-primary]" fill="none" />
                        <text x="340" y="95" textAnchor="middle" className="text-[--color-text-primary] text-sm font-medium" fill="currentColor">Carol</text>
                        <text x="340" y="115" textAnchor="middle" className="text-[--color-text-muted] text-xs" fill="currentColor">Person</text>
                        {/* in port */}
                        <circle cx="300" cy="100" r="4" fill="currentColor" className="text-[--color-accent]" />
                      </g>
                      
                      {/* Edge: Alice.out -> Bob.in */}
                      <line x1="104" y1="100" x2="152" y2="100" stroke="currentColor" strokeWidth="1.5" className="text-[--color-text-secondary]" markerEnd="url(#arrowhead)" />
                      <text x="128" y="92" textAnchor="middle" className="text-[--color-text-muted] text-xs" fill="currentColor">knows</text>
                      
                      {/* Edge: Bob.out -> Carol.in */}
                      <line x1="244" y1="100" x2="292" y2="100" stroke="currentColor" strokeWidth="1.5" className="text-[--color-text-secondary]" markerEnd="url(#arrowhead)" />
                      <text x="268" y="92" textAnchor="middle" className="text-[--color-text-muted] text-xs" fill="currentColor">knows</text>
                    </svg>
                  </div>
                </div>
              </section>

              {/* Grammar */}
              <section className="mb-12">
                <h3 className="text-2xl font-semibold text-[--color-text-primary] mb-4">
                  Grammar
                </h3>
                <pre className="bg-[--color-surface] border border-[--color-border] rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm font-mono text-[--color-text-primary]">{`graph      : 'graph' [ ID ] [ type_ann ] [ attr_list ] block
block      : '{' ( stmt [ ';' ] )* '}'
stmt       : node_stmt | edge_stmt | assignment | graph

node_stmt  : ID [ type_ann ] [ attr_list ] [ node_body ]
node_body  : '{' ( member [ ';' ] )* '}'
member     : port_stmt | graph
port_stmt  : 'port' [ placement ] ID [ type_ann ] [ attr_list ]
placement  : 'left' | 'right' | 'top' | 'bottom'
           | 'topleft' | 'topright' | 'bottomleft' | 'bottomright'

edge_stmt  : edge_end ( edgeop edge_end [ type_ann ] )+ [ attr_list ]
edgeop     : '->' | '--'
edge_end   : ID ( '.' ID )+
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
                Case-insensitive: <code className="bg-[--color-surface] px-1 rounded">graph</code>, <code className="bg-[--color-surface] px-1 rounded">port</code>.
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
                A graph may carry its own inline <code className="bg-[--color-surface] px-1 rounded">attr_list</code> immediately after its type — <code className="bg-[--color-surface] px-1 rounded">graph Team :: Org [rankdir=LR] {'{ }'}</code>. A bare <code className="bg-[--color-surface] px-1 rounded">key = value</code> statement inside a graph body sets that attribute on the enclosing graph.
              </p>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Types</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A graph, node, edge, or port may be annotated with <code className="bg-[--color-surface] px-1 rounded">:: TypeName</code>. Omitting the annotation is equivalent to <code className="bg-[--color-surface] px-1 rounded">:: any</code>. A graph carries its type just before its brace body: <code className="bg-[--color-surface] px-1 rounded">graph Name :: Type {'{ }'}</code>.
              </p>
              <p className="text-[--color-text-secondary] mb-4">
                Edge type is written after the target endpoint per hop. In a chain, a hop with no annotation is typed as <code className="bg-[--color-surface] px-1 rounded">any</code>:
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`A.p -> B.q :: knows -> C.r :: likes`} />
              </div>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Ports</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A port is the named attachment point on a node where an edge connects. Ports are mandatory on both ends of every edge, so an unqualified node reference is not a valid edge endpoint.
              </p>
              <p className="text-[--color-text-secondary] mb-4">
                A port may optionally be declared inside a node body, which allows it to carry a type and/or attributes. The optional placement marker (<code className="bg-[--color-surface] px-1 rounded">left</code>, <code className="bg-[--color-surface] px-1 rounded">right</code>, <code className="bg-[--color-surface] px-1 rounded">top</code>, <code className="bg-[--color-surface] px-1 rounded">bottom</code>, or corners) is advisory. Declaration is never required — a port referenced in an edge but never declared is implicitly created, untyped (<code className="bg-[--color-surface] px-1 rounded">:: any</code>) and unplaced.
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`Bob :: Engineer {
    port request                       // declared, untyped, unplaced
    port right response :: Message     // typed and placed on the right side
    port topleft config [label="configuration"]
}`} />
              </div>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Nested Graphs</h4>
              <p className="text-[--color-text-secondary] mb-4">
                A node may contain one or more named graphs in a brace body. Each nested graph holds its own statement block, making the structure recursive. Nested graphs must be named (only the outermost graph may be anonymous):
              </p>
              <div className="mb-4">
                <DotsHighlighter code={`Alice :: Person {
    graph team :: Team {
        Bob :: Engineer
        Carol :: Designer
        Bob.helpees -> Carol.helpers :: collaborates
    }
    graph projects :: Portfolio {
        P1 :: Project
        P2 :: Project
        P1.remaining_budget -> P2.budget
    }
}`} />
              </div>

              <h4 className="text-xl font-semibold text-[--color-text-primary] mt-6 mb-3">Path Resolution</h4>
              <p className="text-[--color-text-secondary] mb-4">
                An <code className="bg-[--color-surface] px-1 rounded">edge_end</code> is a dotted sequence of at least two IDs. The first ID must name a node in the current scope. Each subsequent ID except the last must name a nested graph or node along the nesting path. The final ID is always the port name.
              </p>
              <p className="text-[--color-text-secondary] mb-4">
                For example, <code className="bg-[--color-surface] px-1 rounded">Alice.team.Bob.out</code> resolves as: node <code className="bg-[--color-surface] px-1 rounded">Alice</code> → graph <code className="bg-[--color-surface] px-1 rounded">team</code> inside Alice → node <code className="bg-[--color-surface] px-1 rounded">Bob</code> inside team → port <code className="bg-[--color-surface] px-1 rounded">out</code> on Bob.
              </p>
              <p className="text-[--color-text-secondary]">
                Edges in an outer graph may target nodes inside any nested graph recursively: <code className="bg-[--color-surface] px-1 rounded">Alice.team.Bob.out {`->`} Dave.in :: reports</code>
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
                      <td className="px-4 py-2 border-b border-[--color-border]">Display label, if different from the graph/node/port name</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code className="bg-[--color-surface] px-1 rounded">expanded</code></td>
                      <td className="px-4 py-2"><code className="bg-[--color-surface] px-1 rounded">expanded=true</code></td>
                      <td className="px-4 py-2">Expansion state for a node that contains nested graphs</td>
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
                <li><strong className="text-[--color-text-primary]">Removed graph/digraph distinction:</strong> <code className="bg-[--color-surface] px-1 rounded">graph</code> is the only declaration keyword; <code className="bg-[--color-surface] px-1 rounded">digraph</code> does not exist. Edges may be individually directed (<code className="bg-[--color-surface] px-1 rounded">{`->`}</code>) or undirected (<code className="bg-[--color-surface] px-1 rounded">--</code>) within the same graph.</li>
                <li><strong className="text-[--color-text-primary]">Removed strict:</strong> Multi-edges are always permitted; the <code className="bg-[--color-surface] px-1 rounded">strict</code> keyword does not exist.</li>
                <li><strong className="text-[--color-text-primary]">No separate subgraph keyword:</strong> There is only <code className="bg-[--color-surface] px-1 rounded">graph</code>. A graph nested inside a node or another graph is declared with <code className="bg-[--color-surface] px-1 rounded">graph</code>, exactly like the top level.</li>
                <li><strong className="text-[--color-text-primary]">Type annotations:</strong> Graphs, nodes, edges, and ports may be typed with <code className="bg-[--color-surface] px-1 rounded">:: TypeName</code>; omitted annotations implicitly default to <code className="bg-[--color-surface] px-1 rounded">:: any</code>.</li>
                <li><strong className="text-[--color-text-primary]">Nodes may contain graphs:</strong> A node declaration may include a brace body holding one or more named nested graphs; nesting is recursive.</li>
                <li><strong className="text-[--color-text-primary]">Nested graphs must be named:</strong> Only the outermost graph may be anonymous; nested graphs require a name for path-based referencing.</li>
                <li><strong className="text-[--color-text-primary]">. is the universal path delimiter:</strong> Serves as both nesting separator and port accessor; the final segment is always the port: <code className="bg-[--color-surface] px-1 rounded">Alice.team.Bob.out</code>.</li>
                <li><strong className="text-[--color-text-primary]">Ports require a name; compass directions removed:</strong> Edges attach to a named port only — DOT's compass point syntax does not exist in DOTS.</li>
                <li><strong className="text-[--color-text-primary]">Ports may optionally be declared:</strong> A port referenced in an edge but never declared is implicitly created, untyped and unplaced. The optional placement marker (<code className="bg-[--color-surface] px-1 rounded">left</code>, <code className="bg-[--color-surface] px-1 rounded">right</code>, etc.) is advisory only.</li>
                <li><strong className="text-[--color-text-primary]">Ports are mandatory on both ends:</strong> <code className="bg-[--color-surface] px-1 rounded">Alice {`->`} Bob</code> is not valid; both endpoints must qualify a port.</li>
                <li><strong className="text-[--color-text-primary]">Graphs cannot be edge endpoints:</strong> Edges must begin and end at a named port on a specific node.</li>
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
