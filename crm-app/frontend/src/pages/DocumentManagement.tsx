import { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Upload,
  Folder,
  File,
  Image,
  Video,
  Archive,
  Grid,
  List,
  Star,
} from 'lucide-react';

export type DocumentType =
  | 'contract'
  | 'proposal'
  | 'invoice'
  | 'report'
  | 'image'
  | 'video'
  | 'other';
export type DocumentStatus = 'draft' | 'review' | 'approved' | 'archived';

export interface Document {
  id: string;
  name: string;
  description: string;
  type: DocumentType;
  status: DocumentStatus;
  size: number;
  mimeType: string;
  url: string;
  folderId?: string;
  folderName?: string;
  tags: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  isStarred: boolean;
  version: number;
  relatedEntityType?: 'lead' | 'deal' | 'customer' | 'quotation';
  relatedEntityId?: string;
  relatedEntityName?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  documentCount: number;
  createdAt: string;
}

const DOCUMENT_TYPES = [
  { value: 'contract', label: 'Contract', icon: <FileText size={16} /> },
  { value: 'proposal', label: 'Proposal', icon: <FileText size={16} /> },
  { value: 'invoice', label: 'Invoice', icon: <FileText size={16} /> },
  { value: 'report', label: 'Report', icon: <FileText size={16} /> },
  { value: 'image', label: 'Image', icon: <Image size={16} /> },
  { value: 'video', label: 'Video', icon: <Video size={16} /> },
  { value: 'other', label: 'Other', icon: <File size={16} /> },
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  archived: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Mock data
  useEffect(() => {
    const mockFolders: DocumentFolder[] = [
      {
        id: '1',
        name: 'Contracts',
        description: 'Customer contracts and agreements',
        documentCount: 15,
        createdAt: '2024-01-15',
      },
      {
        id: '2',
        name: 'Proposals',
        description: 'Project proposals and quotes',
        documentCount: 28,
        createdAt: '2024-02-01',
      },
      {
        id: '3',
        name: 'Equipment Manuals',
        description: 'Crane and equipment documentation',
        documentCount: 45,
        createdAt: '2024-01-20',
      },
      {
        id: '4',
        name: 'Safety Documents',
        description: 'Safety procedures and certifications',
        documentCount: 32,
        createdAt: '2024-01-10',
      },
    ];

    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Tower Crane Rental Agreement - ABC Construction',
        description: 'Rental agreement for 6-month tower crane lease',
        type: 'contract',
        status: 'approved',
        size: 2048000,
        mimeType: 'application/pdf',
        url: '/documents/contract-abc-001.pdf',
        folderId: '1',
        folderName: 'Contracts',
        tags: ['rental', 'tower-crane', 'abc-construction'],
        createdBy: 'user1',
        createdByName: 'Sarah Johnson',
        createdAt: '2024-03-15',
        updatedAt: '2024-03-20',
        isStarred: true,
        version: 2,
        relatedEntityType: 'deal',
        relatedEntityId: 'deal-123',
        relatedEntityName: 'ABC Construction Project',
      },
      {
        id: '2',
        name: 'Heavy Lift Crane Proposal - Industrial Corp',
        description: 'Proposal for specialized heavy lifting services',
        type: 'proposal',
        status: 'review',
        size: 5120000,
        mimeType: 'application/pdf',
        url: '/documents/proposal-industrial-002.pdf',
        folderId: '2',
        folderName: 'Proposals',
        tags: ['heavy-lift', 'industrial', 'proposal'],
        createdBy: 'user2',
        createdByName: 'Mike Chen',
        createdAt: '2024-06-10',
        updatedAt: '2024-06-12',
        isStarred: false,
        version: 1,
        relatedEntityType: 'quotation',
        relatedEntityId: 'quote-456',
        relatedEntityName: 'Industrial Corp Quote',
      },
      {
        id: '3',
        name: 'Crane Operation Manual - Model XL500',
        description: 'Complete operation and maintenance manual',
        type: 'other',
        status: 'approved',
        size: 15360000,
        mimeType: 'application/pdf',
        url: '/documents/manual-xl500.pdf',
        folderId: '3',
        folderName: 'Equipment Manuals',
        tags: ['manual', 'xl500', 'operation'],
        createdBy: 'user3',
        createdByName: 'Equipment Team',
        createdAt: '2024-02-28',
        updatedAt: '2024-02-28',
        isStarred: true,
        version: 1,
      },
      {
        id: '4',
        name: 'Site Safety Inspection Report - Downtown Project',
        description: 'Monthly safety inspection documentation',
        type: 'report',
        status: 'approved',
        size: 1024000,
        mimeType: 'application/pdf',
        url: '/documents/safety-report-downtown.pdf',
        folderId: '4',
        folderName: 'Safety Documents',
        tags: ['safety', 'inspection', 'downtown'],
        createdBy: 'user4',
        createdByName: 'Safety Inspector',
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        isStarred: false,
        version: 1,
      },
      {
        id: '5',
        name: 'Project Photos - Warehouse Construction',
        description: 'Progress photos from warehouse project',
        type: 'image',
        status: 'approved',
        size: 8192000,
        mimeType: 'image/jpeg',
        url: '/documents/warehouse-photos.zip',
        tags: ['photos', 'warehouse', 'progress'],
        createdBy: 'user5',
        createdByName: 'Project Manager',
        createdAt: '2024-06-05',
        updatedAt: '2024-06-05',
        isStarred: false,
        version: 1,
      },
    ];

    setTimeout(() => {
      setFolders(mockFolders);
      setDocuments(mockDocuments);
      setLoading(false);
    }, 500);
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesFolder = !currentFolderId || doc.folderId === currentFolderId;
    const matchesStarred = !showStarredOnly || doc.isStarred;

    return matchesSearch && matchesType && matchesStatus && matchesFolder && matchesStarred;
  });

  const currentFolder = currentFolderId ? folders.find(f => f.id === currentFolderId) : null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (document: Document) => {
    if (document.mimeType.startsWith('image/'))
      return <Image size={16} className="text-blue-500" />;
    if (document.mimeType.startsWith('video/'))
      return <Video size={16} className="text-purple-500" />;
    if (document.mimeType.includes('pdf')) return <FileText size={16} className="text-red-500" />;
    if (document.mimeType.includes('zip') || document.mimeType.includes('archive'))
      return <Archive size={16} className="text-gray-500" />;
    return <File size={16} className="text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">
            {currentFolder
              ? `Browsing: ${currentFolder.name}`
              : 'Organize and manage your documents'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>

          <button className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90">
            <Upload size={18} />
            Upload Document
          </button>
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      {currentFolder && (
        <nav className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="text-brand-blue hover:underline"
          >
            All Documents
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{currentFolder.name}</span>
        </nav>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as DocumentType | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
        >
          <option value="all">All Types</option>
          {DOCUMENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as DocumentStatus | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="archived">Archived</option>
        </select>

        <button
          onClick={() => setShowStarredOnly(!showStarredOnly)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${
            showStarredOnly
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Star size={16} className={showStarredOnly ? 'fill-current' : ''} />
          Starred
        </button>
      </div>

      {/* Folders (when not in a specific folder) */}
      {!currentFolderId && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Folders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-brand-blue text-left"
              >
                <Folder className="text-blue-500" size={24} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{folder.name}</div>
                  <div className="text-sm text-gray-500">{folder.documentCount} documents</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map(document => (
            <div
              key={document.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getFileIcon(document)}
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium border ${STATUS_COLORS[document.status]}`}
                  >
                    {document.status.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setDocuments(docs =>
                      docs.map(d => (d.id === document.id ? { ...d, isStarred: !d.isStarred } : d))
                    );
                  }}
                  className="text-gray-400 hover:text-yellow-500"
                >
                  <Star
                    size={16}
                    className={document.isStarred ? 'fill-current text-yellow-500' : ''}
                  />
                </button>
              </div>

              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{document.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{document.description}</p>

              <div className="space-y-2 text-xs text-gray-500 mb-4">
                <div>Size: {formatFileSize(document.size)}</div>
                <div>Modified: {new Date(document.updatedAt).toLocaleDateString()}</div>
                {document.folderName && <div>Folder: {document.folderName}</div>}
              </div>

              <div className="flex gap-1">
                <button className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                  <Eye size={12} />
                  View
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">
                  <Download size={12} />
                  Download
                </button>
                <button className="flex items-center justify-center gap-1 py-1 px-2 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100">
                  <Edit size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Document</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Modified</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Created By</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map(document => (
                  <tr key={document.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(document)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{document.name}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {document.description}
                          </div>
                        </div>
                        {document.isStarred && (
                          <Star size={14} className="fill-current text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {DOCUMENT_TYPES.find(t => t.value === document.type)?.label}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${STATUS_COLORS[document.status]}`}
                      >
                        {document.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatFileSize(document.size)}</td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(document.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm">{document.createdByName}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600 rounded">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600 rounded">
                          <Download size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600 mb-4">Upload your first document to get started.</p>
          <button className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90">
            Upload Document
          </button>
        </div>
      )}
    </div>
  );
}
