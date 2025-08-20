#!/bin/bash

# Setup script for ASP Cranes Quotation Print System
echo "🚀 Setting up ASP Cranes Quotation Print System..."

# Check if database is running
echo "📊 Checking database connection..."
docker exec asp-cranes-structured-db-1 psql -U postgres -d asp_crm -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed. Please ensure the database is running:"
    echo "   docker-compose up -d db"
    exit 1
fi

# Create default template if it doesn't exist
echo "📋 Setting up default quotation template..."

# Use curl to call the API endpoint
API_URL="http://localhost:3001/api/templates/quotation/create-default"

echo "🔗 Making API call to create default template..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  --silent --show-error

if [ $? -eq 0 ]; then
    echo "✅ Default template setup completed"
else
    echo "⚠️  API call failed. You may need to start the backend server:"
    echo "   cd crm-app/backend && npm start"
    echo ""
    echo "   Or create the template manually via the admin interface."
fi

echo ""
echo "🎉 Setup completed! You can now:"
echo "   1. Navigate to any quotation detail page"
echo "   2. Use the Print & Export Options section"
echo "   3. Generate professional quotation previews and PDFs"
echo ""
echo "📚 Features included:"
echo "   • Modern template-based quotation generation"
echo "   • Professional PDF output with company branding"
echo "   • Email integration for sending quotations"
echo "   • Print-optimized layouts"
echo "   • Template management system"
