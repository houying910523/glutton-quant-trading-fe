import React from 'react';
import ReactDOM from 'react-dom/client';
import '@arco-design/web-react/dist/css/arco.css';
import App from '@/App';


const root = document.getElementById('root') as HTMLElement
ReactDOM.createRoot(root).render(
  <App />,
);

document.body.setAttribute('arco-theme', 'dark');
