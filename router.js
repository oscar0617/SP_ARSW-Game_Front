// router.js
import routes from './routes';

const router = () => {
  const path = window.location.pathname;
  const route = routes[path] || routes['/']; // Fallback a la ruta principal si no se encuentra

  document.getElementById('app').innerHTML = route(); // Renderiza el componente correspondiente
};

// Agrega un event listener para los cambios en el historial
window.onpopstate = router;

// Función para navegar entre rutas
export const navigate = (path) => {
  window.history.pushState({}, path, window.location.origin + path);
  router();
};
