import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CameraGrid from '../components/CameraGrid';

interface Camera {
  name: string;
  type: string;
  traits: Record<string, any>;
  parentRelations: Array<{
    parent: string;
    displayName: string;
  }>;
}

const Dashboard = () => {
  const { logout } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerConnectionUrl, setPartnerConnectionUrl] = useState<string | null>(null);
  const [requiresPartnerConnection, setRequiresPartnerConnection] = useState(false);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const response = await axios.get('/api/devices', { withCredentials: true });
      setCameras(response.data.cameras);
      
      if (response.data.requiresPartnerConnection) {
        setRequiresPartnerConnection(true);
        setPartnerConnectionUrl(response.data.partnerConnectionUrl);
      }
    } catch (error) {
      setError('Failed to load cameras');
      console.error('Error fetching cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-800">Camera Dashboard</h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading cameras...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!loading && !error && cameras.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">No cameras found in your account</p>
            {requiresPartnerConnection && partnerConnectionUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Link Your Cameras
                </h3>
                <p className="text-blue-800 mb-4">
                  To access your cameras, you need to create a partner connection. 
                  Click the button below to authorize camera access:
                </p>
                <a
                  href={partnerConnectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                >
                  Create Partner Connection
                </a>
                <p className="text-sm text-blue-700 mt-4">
                  After linking, refresh this page to see your cameras.
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && !error && cameras.length > 0 && (
          <CameraGrid cameras={cameras} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;