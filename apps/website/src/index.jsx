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

function Navbar() {
  return (
    <nav className="flex flex-wrap justify-around gap-x-8 p-4 border-b mb-4">
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/">Home</Link>
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/projects">Projects</Link>
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/sandbox">Tools Sandbox</Link>
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/ai-tools">AI Tools</Link>
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/brief">Brief for AI agent</Link>
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/storyboard">Storyboard</Link>
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/insights">Insights</Link>
      <Link className="hover:text-accent-600 hover:underline decoration-2" to="/glossary">Glossary</Link>
      <a className="hover:text-accent-600 hover:underline decoration-2" href="../../app-index.html">App Index</a>
    </nav>
  );
}

function App() {
  const baseUrl = import.meta.env.BASE_URL;
  const baseFromPath = window.location.pathname.replace(
    /(projects\/solway-tunnel\/|projects\/|glossary\/|ai-tools\/|brief\/|sandbox\/|storyboard\/|insights\/)$/,
    ''
  );
  const basename = baseUrl === './' ? baseFromPath : baseUrl;

  return (
    <BrowserRouter basename={basename}>
      <Navbar />
      <div className="container mx-auto px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/brief" element={<Brief />} />
          <Route path="/storyboard" element={<Storyboard />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/projects/solway-tunnel" element={<SolwayTunnel />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
