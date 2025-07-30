import { useState, useRef } from 'react';
import CameraView, { CameraViewHandle } from './CameraView';
import MultiCameraControls from './MultiCameraControls';
import { CameraControlProvider, useCameraControl } from '../contexts/CameraControlContext';

interface Camera {
  name: string;
  type: string;
  traits: Record<string, any>;
  parentRelations: Array<{
    parent: string;
    displayName: string;
  }>;
}

interface CameraGridProps {
  cameras: Camera[];
}

// Inner component that uses the context
const CameraGridInner: React.FC<CameraGridProps> = ({ cameras }) => {
  const { selectedCameras } = useCameraControl();
  const [gridSize, setGridSize] = useState(2);
  const [streamingCameras, setStreamingCameras] = useState<Set<string>>(new Set());
  const [loadingCameras, setLoadingCameras] = useState<Set<string>>(new Set());
  const cameraRefs = useRef<Map<string, CameraViewHandle>>(new Map());

  const getGridClass = () => {
    switch (gridSize) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1 md:grid-cols-2';
    }
  };

  const handleStartStreaming = async () => {
    const selectedArray = Array.from(selectedCameras);
    setLoadingCameras(new Set(selectedArray));

    try {
      await Promise.all(
        selectedArray.map(async (cameraName) => {
          const cameraRef = cameraRefs.current.get(cameraName);
          if (cameraRef) {
            await cameraRef.startStream();
            setStreamingCameras(prev => new Set([...prev, cameraName]));
          }
        })
      );
    } catch (error) {
      // Some streams failed to start
    } finally {
      setLoadingCameras(new Set());
    }
  };

  const handleStopStreaming = async () => {
    const selectedArray = Array.from(selectedCameras);
    
    await Promise.all(
      selectedArray.map(async (cameraName) => {
        const cameraRef = cameraRefs.current.get(cameraName);
        if (cameraRef) {
          await cameraRef.stopStream();
          setStreamingCameras(prev => {
            const newSet = new Set(prev);
            newSet.delete(cameraName);
            return newSet;
          });
        }
      })
    );
  };

  const isAnyStreaming = streamingCameras.size > 0;
  const isAnyLoading = loadingCameras.size > 0;

  return (
    <div>
      <MultiCameraControls
        cameras={cameras}
        onStartStreaming={handleStartStreaming}
        onStopStreaming={handleStopStreaming}
        isAnyStreaming={isAnyStreaming}
        isAnyLoading={isAnyLoading}
      />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">
          {cameras.length} Camera{cameras.length !== 1 ? 's' : ''} Found
        </h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="grid-size" className="text-sm text-gray-600">
            Grid Size:
          </label>
          <select
            id="grid-size"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 Column</option>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
            <option value={4}>4 Columns</option>
          </select>
        </div>
      </div>

      <div className={`grid ${getGridClass()} gap-4`}>
        {cameras.map((camera) => (
          <CameraView 
            key={camera.name} 
            camera={camera}
            ref={(ref) => {
              if (ref) {
                cameraRefs.current.set(camera.name, ref);
              } else {
                cameraRefs.current.delete(camera.name);
              }
            }}
            onStreamingChange={(streaming) => {
              if (streaming) {
                setStreamingCameras(prev => new Set([...prev, camera.name]));
              } else {
                setStreamingCameras(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(camera.name);
                  return newSet;
                });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Main component with provider
const CameraGrid: React.FC<CameraGridProps> = ({ cameras }) => {
  return (
    <CameraControlProvider cameras={cameras}>
      <CameraGridInner cameras={cameras} />
    </CameraControlProvider>
  );
};

export default CameraGrid;