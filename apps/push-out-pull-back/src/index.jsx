import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../../src/common/index.css';
import App from './App';
import reportWebVitals from '../../../src/common/reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
