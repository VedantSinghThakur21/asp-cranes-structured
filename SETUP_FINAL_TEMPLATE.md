# Setup Final Template - Commands to Run

Run these commands on your Ubuntu server to setup the "Final Template" matching the Jamestown Project design.

## Step 1: Insert the Final Template

```bash
cd ~/asp-cranes-structured
docker exec -i asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm < crm-app/database/migrations/add_final_template.sql
```

## Step 2: Verify the template was created

```bash
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "SELECT id, name, description FROM enhanced_templates WHERE id = 'tpl_final_001';"
```

You should see:
```
      id       |      name      |                        description
---------------+----------------+--------------------------------------------------------
 tpl_final_001 | Final Template | Professional quotation template with yellow branding...
```

## Step 3: Restart the backend to load updated routes

```bash
docker restart asp-cranes-structured-backend-1
```

## Step 4: Check backend logs

```bash
docker logs -f asp-cranes-structured-backend-1
```

Wait for: `✅ Server running on port 3001`

## Step 5: Test the template

1. Go to your CRM application
2. Navigate to Templates or Template Builder
3. You should see "Final Template" in the list
4. Select it and create a quotation
5. The quotation PDF should now have:
   - Yellow header branding (#FFC107)
   - Client Name, Email, Quote Number on the left
   - Prepared By and Date on the right
   - Pricing table with yellow headers
   - Editable Terms & Conditions with bullet points

## Features of the Final Template

### Editable Content
All text in the template can be edited through the template builder:
- Company name and address
- Client information labels
- Pricing section header
- Terms & Conditions title and content
- All other text elements

### Yellow Branding
- Header background: Yellow (#FFC107)
- Table headers: Yellow (#FFC107)
- Clean, professional look matching your design

### Bullet Point Terms
Terms automatically format as bullet points:
- Each line becomes a bullet point
- Proper spacing and indentation
- Clean, readable format

## Updating Default Terms

You can set default terms in Company Settings:

```bash
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "
UPDATE company_settings 
SET default_terms_conditions = '• Any extension or modification to the rental period must be communicated and agreed upon in writing.
• Rental fees are based on the agreed-upon crane specified in the quotation. Payment for the rental fees is due in full prior to or upon delivery of the equipment. Late payments may incur late fees or result in the suspension of equipment rental.'
WHERE is_active = true;
"
```

## Troubleshooting

### Template not showing up?
```bash
# Check if template exists
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "SELECT * FROM enhanced_templates WHERE name = 'Final Template';"
```

### Backend not responding?
```bash
# Check backend logs
docker logs asp-cranes-structured-backend-1 --tail 50

# Restart backend
docker restart asp-cranes-structured-backend-1
```

### Terms not showing?
```bash
# Verify column exists
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "\d company_settings"

# Should show default_terms_conditions column
```

## Next Steps

1. **Customize company info** in Settings → Company Settings
2. **Edit template** in Template Builder to match exact requirements
3. **Set default terms** in Company Settings
4. **Create quotations** using the Final Template
5. **Generate PDFs** with the new yellow-branded design

The template is fully functional and ready to use!
