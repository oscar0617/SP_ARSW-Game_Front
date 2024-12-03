// main.js
import { navigate } from './router';

const App = () => {
  const mainContent = document.getElementById('app');

  // Renderiza el contenido inicial
  router();

  // Ejemplo de botón para navegar a otra ruta
  const button = document.createElement('button');
  button.innerText = 'Ir a Configuraciones';
  button.onclick = () => {
    navigate('/configuraciones');
  };

  mainContent.appendChild(button);
};

document.addEventListener('DOMContentLoaded', App);
