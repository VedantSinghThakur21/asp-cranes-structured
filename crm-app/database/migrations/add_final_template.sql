-- Create Final Template matching the Jamestown Project design
INSERT INTO enhanced_templates (
  id, 
  name, 
  description, 
  theme, 
  category, 
  is_default, 
  is_active, 
  created_by, 
  elements, 
  settings, 
  branding
) VALUES (
  'tpl_final_001',
  'Final Template',
  'Professional quotation template with yellow branding matching Jamestown Project design',
  'MODERN',
  'Quotation',
  false,
  true,
  'system',
  '[
    {
      "id": "header-1",
      "type": "header",
      "content": "{{company.name}}",
      "visible": true,
      "style": {
        "fontSize": "32px",
        "color": "#1a1a1a",
        "fontWeight": "bold",
        "textAlign": "left",
        "marginBottom": "5px",
        "fontFamily": "Arial, sans-serif"
      }
    },
    {
      "id": "project-label",
      "type": "section",
      "content": "Project",
      "visible": true,
      "style": {
        "fontSize": "20px",
        "color": "#1a1a1a",
        "fontWeight": "normal",
        "textAlign": "left",
        "marginBottom": "15px",
        "fontFamily": "Arial, sans-serif"
      }
    },
    {
      "id": "company-info-1",
      "type": "company",
      "content": "{{company.address}}\\n{{company.email}} | {{company.phone}}",
      "visible": true,
      "style": {
        "fontSize": "10px",
        "textAlign": "left",
        "color": "#666",
        "marginBottom": "30px",
        "fontFamily": "Arial, sans-serif"
      }
    },
    {
      "id": "client-info-section",
      "type": "section",
      "content": "Client Name: {{customer.name}}\\nClient Email: {{customer.email}}\\nQuote Number: {{quotation.quotation_number}}",
      "visible": true,
      "style": {
        "fontSize": "11px",
        "textAlign": "left",
        "color": "#1a1a1a",
        "marginBottom": "10px",
        "lineHeight": "1.6",
        "fontFamily": "Arial, sans-serif"
      }
    },
    {
      "id": "prepared-info-section",
      "type": "section",
      "content": "Prepared By: {{prepared_by}}\\nDate Prepared: {{quotation.created_at}}",
      "visible": true,
      "style": {
        "fontSize": "11px",
        "textAlign": "right",
        "color": "#1a1a1a",
        "marginBottom": "30px",
        "lineHeight": "1.6",
        "fontFamily": "Arial, sans-serif"
      }
    },
    {
      "id": "pricing-header",
      "type": "section",
      "content": "Pricing",
      "visible": true,
      "style": {
        "fontSize": "18px",
        "fontWeight": "bold",
        "color": "#1a1a1a",
        "marginBottom": "15px",
        "marginTop": "20px",
        "fontFamily": "Arial, sans-serif"
      }
    },
    {
      "id": "equipment-table-1",
      "type": "equipment_table",
      "content": "Equipment Details",
      "visible": true,
      "style": {
        "fontSize": "11px",
        "marginBottom": "20px",
        "tableHeaderBg": "#FFC107",
        "tableHeaderColor": "#1a1a1a",
        "tableBorderColor": "#333",
        "fontFamily": "Arial, sans-serif"
      }
    },
    {
      "id": "totals-section",
      "type": "totals_table",
      "content": "Totals",
      "visible": true,
      "style": {
        "fontSize": "11px",
        "marginBottom": "30px",
        "textAlign": "right",
        "fontFamily": "Arial, sans-serif"
      }
    },
    {
      "id": "terms-1",
      "type": "terms",
      "content": {
        "title": "Terms & Conditions",
        "text": "• Any extension or modification to the rental period must be communicated and agreed upon in writing.\\n• Rental fees are based on the agreed-upon crane specified in the quotation. Payment for the rental fees is due in full prior to or upon delivery of the equipment. Late payments may incur late fees or result in the suspension of equipment rental.",
        "showTitle": true
      },
      "visible": true,
      "style": {
        "fontSize": "10px",
        "marginTop": "30px",
        "lineHeight": "1.8",
        "color": "#333",
        "fontFamily": "Arial, sans-serif"
      }
    }
  ]',
  '{"pageSize": "A4", "margins": {"top": 20, "right": 20, "bottom": 20, "left": 20}, "headerHeight": 100, "footerHeight": 50}',
  '{"primaryColor": "#FFC107", "secondaryColor": "#1a1a1a", "accentColor": "#FFC107", "logoUrl": null, "showLogo": true}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  theme = EXCLUDED.theme,
  elements = EXCLUDED.elements,
  settings = EXCLUDED.settings,
  branding = EXCLUDED.branding,
  updated_at = NOW();
