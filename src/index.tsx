// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import VerSalasPage from './pages/VerSalas';
import HomePage from './pages/Home';
import ConfiguracionesPage from './pages/configuraciones';
import SalaPage from './pages/sala/[id]';
import GameSettings from './components/GameSettings.js';

import { ThemeProvider } from './components/theme-provider';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import "./index.css";
import Puntajes from './pages/Puntajes';
import GamePage from './pages/game/[id]';

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />
  },
  {
    path: "/salas",
    element: <VerSalasPage />
  },
  {
    path: "/configuraciones",
    element: <ConfiguracionesPage />
  },
  {
    path: "/puntajes",
    element: <Puntajes />
  },
  {
    path: "/sala/:roomId",
    element: <SalaPage />
  },
  {
    path: "/sala/:roomId/settings",
    element: <GameSettings />
  },
  {
    path: "/game/:gameId",
    element: <GamePage />
  }
  
]);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
