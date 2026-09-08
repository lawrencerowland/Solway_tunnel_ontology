import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import '../src/styles/globals.css';
import Home from './pages/Home.jsx';
import Projects from './pages/Projects.jsx';
import Sandbox from './pages/Sandbox.jsx';
import AITools from './pages/AITools.jsx';
import Brief from './pages/Brief.jsx';
import Storyboard from './pages/Storyboard.jsx';
import Insights from './pages/Insights.jsx';
import Glossary from './pages/Glossary.jsx';
import SolwayTunnel from './pages/projects/SolwayTunnel.jsx';
import FibrationDemoNotes from './pages/FibrationDemoNotes.jsx';
import { siteLinks, websiteBasename } from './siteLinks.js';

function Navbar() {
  return (
    <nav className="flex flex-wrap justify-around gap-x-8 p-4 border-b mb-4">
      <a className="hover:text-accent-600 hover:underline decoration-2" href={siteLinks.home}>Solway</a>
      <a className="hover:text-accent-600 hover:underline decoration-2" href={siteLinks.game}>The handover game</a>
      <a className="hover:text-accent-600 hover:underline decoration-2" href={siteLinks.essay}>The work that must exist</a>
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/projects/solway-tunnel/">Ontology explorer</Link>
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/glossary">Glossary</Link>
      <a className="hover:text-accent-600 hover:underline decoration-2" href={siteLinks.apps}>All Solway apps</a>
      <a className="hover:text-accent-600 hover:underline decoration-2" href={siteLinks.forays}>All forays</a>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter basename={websiteBasename}>
      <Navbar />
      <div className="container mx-auto px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/index.html" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/index.html" element={<Projects />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/brief" element={<Brief />} />
          <Route path="/storyboard" element={<Storyboard />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/glossary/index.html" element={<Glossary />} />
          <Route path="/fibration-demo-notes" element={<FibrationDemoNotes />} />
          <Route path="/projects/solway-tunnel" element={<SolwayTunnel />} />
          <Route path="/projects/solway-tunnel/index.html" element={<SolwayTunnel />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
