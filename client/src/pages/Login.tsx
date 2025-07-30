import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { isAuthenticated, login } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Google Home Camera Viewer
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Sign in with your Google account to view your cameras
        </p>
        <button
          onClick={login}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-medium"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;