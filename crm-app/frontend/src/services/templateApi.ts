import axios from 'axios';

export async function getTemplates() {
  try {
    const token = localStorage.getItem('jwt-token');
    const headers: any = {};
    
    // Add auth header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await axios.get('/api/templates/enhanced/list', { headers });
    return res.data.data;
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    throw new Error('Failed to fetch templates: ' + (error as any).response?.status || 'Unknown error');
  }
}

export async function saveTemplate(template: any) {
  try {
    const token = localStorage.getItem('jwt-token');
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    // Add auth header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await axios.post('/api/templates/enhanced/create', template, { headers });
    return res.data.data;
  } catch (error) {
    console.error('Failed to save template:', error);
    throw new Error('Failed to save template: ' + (error as any).response?.status || 'Unknown error');
  }
}
