"use client";

import React from 'react';
import ReactDOM from 'react-dom/client';
import { TodoApp } from './index';
import '../app/globals.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <div id="root-container">
      <div id="root"><TodoApp /></div>
    </div>
  </React.StrictMode>
);