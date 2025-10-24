# Setup Final Template - Commands to Run

Run these commands on your Ubuntu server to setup the "Final Template" matching the Jamestown Project design.

## Step 1: Pull latest changes

```bash
cd ~/asp-cranes-structured
git pull origin master
```

## Step 2: Insert the Final Template

```bash
docker exec -i asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm < crm-app/database/migrations/add_final_template.sql
```

## Step 3: Verify the template was created

```bash
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "SELECT id, name, description FROM enhanced_templates WHERE id = 'tpl_final_001';"
```

You should see:
```
      id       |      name      |                        description
---------------+----------------+--------------------------------------------------------
 tpl_final_001 | Final Template | Professional quotation template with yellow branding...
```

## Step 4: Restart the backend to load updated code

```bash
docker restart asp-cranes-structured-backend-1
```

## Step 5: Check backend logs

```bash
docker logs -f asp-cranes-structured-backend-1
```

Wait for: `✅ Server running on port 3001`

Press Ctrl+C to exit logs.

## Step 6: Test the template

1. Go to your CRM application (http://103.224.243.242)
2. Navigate to Quotations → Templates
3. You should see "Final Template" in the list
4. Create or edit a quotation and select "Final Template"
5. Preview the quotation - it should now have:
   - Clean header with company name
   - Company address and contact info
   - Client info on left, Prepared by on right
   - "Pricing" section header
   - Table with **YELLOW headers** (#FFC107)
   - Professional totals section
   - Terms & Conditions with bullet points

## What Was Fixed

### 1. **Proper Element Types**
   - Changed from unsupported types (`section`, `company`) to supported types (`custom_text`, `company_info`)
   - Now renders actual content instead of debug info

### 2. **Yellow Table Headers**
   - Updated `EnhancedTemplateBuilder.mjs` to read `tableHeaderBg` from style
   - Template now uses `#FFC107` (yellow) for table headers
   - Matches your Jamestown Project design exactly

### 3. **Clean Layout**
   - Two-column layout: Client info (left) + Prepared by (right)
   - Proper spacing and typography
   - Professional appearance matching working template

## Template Features

### ✅ Visual Design
- Yellow table headers matching your image
- Clean, professional layout
- Proper spacing and typography
- Black text on white background

### ✅ Editable Content
All text can be edited:
- Company name and info
- Client information labels  
- Pricing header
- Terms & Conditions
- All table labels

### ✅ Bullet Point Terms
- Automatic bullet formatting
- Each line becomes a bullet
- Clean, readable style

## Updating Default Terms

Set default terms in Company Settings API or database:

```bash
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "
UPDATE company_settings 
SET default_terms_conditions = '• Any extension or modification to the rental period must be communicated and agreed upon in writing.
• Rental fees are based on the agreed-upon crane specified in the quotation. Payment for the rental fees is due in full prior to or upon delivery of the equipment. Late payments may incur late fees or result in the suspension of equipment rental.'
WHERE is_active = true;
"
```

## Troubleshooting

### Template showing debug info instead of content?
The backend code has been updated. Make sure you:
1. Pulled latest code: `git pull origin master`
2. Restarted backend: `docker restart asp-cranes-structured-backend-1`

### Yellow headers not showing?
Check the template elements have the style properties:
```bash
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "
SELECT elements::json->>6 FROM enhanced_templates WHERE id = 'tpl_final_001';
"
```
Should show `tableHeaderBg: #FFC107`

### Backend not responding?
```bash
# Check logs
docker logs asp-cranes-structured-backend-1 --tail 50

# Restart
docker restart asp-cranes-structured-backend-1
```

## Next Steps

1. **Test the template** by creating a quotation
2. **Customize company info** in Settings
3. **Edit template elements** if needed via Template Builder
4. **Set as default** if this should be your primary template

The template now matches your Jamestown Project design with yellow branding! 🎉
