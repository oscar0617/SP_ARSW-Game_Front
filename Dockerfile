# Usa una imagen ligera de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia package.json y package-lock.json (si existe) para instalar dependencias
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm install

# Copia todo el código de la aplicación
COPY . .

# Expone el puerto que utiliza tu app en modo desarrollo (normalmente 5173 o 3000 con React)
EXPOSE 3000

# Ejecuta la aplicación en modo desarrollo
CMD ["npm", "run", "dev"]
