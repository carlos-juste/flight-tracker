#!/bin/bash

echo "=========================================="
echo "Flight Tracker - Inicio Rápido"
echo "=========================================="
echo ""

echo "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js no está instalado"
    echo "Por favor instala Node.js 16+ antes de continuar"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Node.js versión: $NODE_VERSION"

echo "Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "Error: npm no está instalado"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo ""
    echo "Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error al instalar dependencias"
        exit 1
    fi
fi

echo ""
echo "Inicializando base de datos con datos de prueba..."
node scripts/seedDatabase.js

echo ""
echo "=========================================="
echo "Iniciando Flight Tracker..."
echo "=========================================="
echo ""
echo "La aplicación estará disponible en:"
echo "  http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener la aplicación"
echo ""

if command -v nodemon &> /dev/null; then
    nodemon backend/server.js
else
    echo "nodemon no está instalado, usando node..."
    node backend/server.js
fi
