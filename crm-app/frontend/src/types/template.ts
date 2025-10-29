export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string; // Template content with {{placeholders}}
  styles?: string | object;
  elements?: any[]; // JSON array for modern template builder elements
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy?: string;
  isDefault: boolean;
}
