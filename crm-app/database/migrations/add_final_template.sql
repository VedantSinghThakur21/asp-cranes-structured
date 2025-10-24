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
      "content": {
        "title": "{{company.name}}",
        "subtitle": "Project"
      },
      "visible": true,
      "style": {
        "fontSize": "36px",
        "color": "#1a1a1a",
        "fontWeight": "bold",
        "textAlign": "left",
        "marginBottom": "5px",
        "fontFamily": "Arial, sans-serif",
        "background": "#fff",
        "padding": "20px 0"
      }
    },
    {
      "id": "company-info-1",
      "type": "company_info",
      "content": {
        "fields": [
          "{{company.address}}",
          "{{company.email}} | {{company.phone}}"
        ]
      },
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
      "id": "client-info-prepared-section",
      "type": "custom_text",
      "content": {
        "text": "<div style=\"display: flex; justify-content: space-between; margin-bottom: 30px;\"><div style=\"flex: 1;\"><div style=\"margin-bottom: 4px;\"><strong>Client Name:</strong> {{customer.name}}</div><div style=\"margin-bottom: 4px;\"><strong>Client Email:</strong> {{customer.email}}</div><div><strong>Quote Number:</strong> {{quotation.quotation_number}}</div></div><div style=\"flex: 1; text-align: right;\"><div style=\"margin-bottom: 4px;\"><strong>Prepared By:</strong> {{prepared_by}}</div><div><strong>Date Prepared:</strong> {{quotation.created_at}}</div></div></div>"
      },
      "visible": true,
      "style": {
        "fontSize": "11px",
        "color": "#1a1a1a",
        "fontFamily": "Arial, sans-serif",
        "marginBottom": "20px"
      }
    },
    {
      "id": "pricing-header",
      "type": "custom_text",
      "content": {
        "text": "<h2 style=\"font-size: 18px; font-weight: bold; margin: 20px 0 15px 0; color: #1a1a1a;\">Pricing</h2>"
      },
      "visible": true,
      "style": {
        "fontFamily": "Arial, sans-serif"
      }
    },
    {
      "id": "equipment-table-1",
      "type": "items_table",
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
      "id": "totals-1",
      "type": "totals",
      "content": "Cost Summary",
      "visible": true,
      "style": {
        "fontSize": "12px",
        "marginTop": "20px",
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
  '{"pageSize": "A4", "margins": {"top": 20, "right": 20, "bottom": 20, "left": 20}}',
  '{"primaryColor": "#FFC107", "secondaryColor": "#1a1a1a", "accentColor": "#FFC107", "logoUrl": null}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  theme = EXCLUDED.theme,
  elements = EXCLUDED.elements,
  settings = EXCLUDED.settings,
  branding = EXCLUDED.branding,
  updated_at = NOW();
