#!/bin/bash

echo "🚑 ResQ Kenya - Emergency Response Platform"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

echo "✓ Node.js $(node --version)"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL client not found, but continuing..."
    echo "Make sure MySQL server is running:"
    echo "  macOS:   brew services start mysql"
    echo "  Linux:   sudo service mysql start"
    echo "  Windows: Start MySQL from Services"
fi

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend
npm install --silent
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
ADMIN_EMAIL=admin@resq.ke
ADMIN_PASSWORD=Admin@123
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=resq_ke
EOF
    echo "✓ .env created. Update with your database credentials."
fi

# Frontend setup
echo ""
echo "⚛️  Setting up frontend..."
cd ../frontend
npm install --silent
echo "✓ Dependencies installed"

echo ""
echo "=========================================="
echo "🎉 Setup complete!"
echo ""
echo "Start development servers:"
echo ""
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "Default admin login:"
echo "  Email: admin@resq.ke"
echo "  Password: Admin@123"
echo "=========================================="
