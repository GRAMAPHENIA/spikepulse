#!/bin/bash

# Script para ejecutar tests de Spikepulse
# Uso: ./run.sh [suite_name]

echo "🎮 SPIKEPULSE - EJECUTOR DE TESTS"
echo "================================="

# Verificar si Node.js está disponible
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado o no está en el PATH"
    echo "💡 Para ejecutar tests en el navegador, abre tests/index.html"
    exit 1
fi

# Verificar si el archivo de tests existe
if [ ! -f "runTests.js" ]; then
    echo "❌ Archivo runTests.js no encontrado"
    echo "💡 Asegúrate de ejecutar este script desde el directorio tests/"
    exit 1
fi

# Ejecutar tests
if [ $# -eq 0 ]; then
    echo "🚀 Ejecutando todos los tests..."
    node runTests.js
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    node runTests.js --help
else
    echo "🎯 Ejecutando tests para: $1"
    node runTests.js "$1"
fi

echo ""
echo "✨ Ejecución completada"
echo "💡 Para una interfaz visual, abre tests/index.html en tu navegador"