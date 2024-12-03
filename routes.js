// routes.js
import ConfiguracionesPage from './src/pages/configuraciones';
import Puntajes from './src/pages/puntajes';
import UserProfile from './src/pages/perfil';
import index from './src/pages/index';
import VerSalas from './src/pages/ver-salas';

const routes = {
  '/': index,
  '/configuraciones': ConfiguracionesPage,
  '/puntajes': Puntajes,
  '/perfil': UserProfile,
  '/ver-salas': VerSalas
};

export default routes;
