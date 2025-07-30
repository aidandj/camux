import React from 'react';
import { useCameraControl } from '../contexts/CameraControlContext';

interface Camera {
  name: string;
  type: string;
  traits: Record<string, any>;
  parentRelations: Array<{
    parent: string;
    displayName: string;
  }>;
}

interface MultiCameraControlsProps {
  cameras: Camera[];
  onStartStreaming: () => void;
  onStopStreaming: () => void;
  isAnyStreaming: boolean;
  isAnyLoading: boolean;
}

const MultiCameraControls: React.FC<MultiCameraControlsProps> = ({ 
  cameras, 
  onStartStreaming, 
  onStopStreaming,
  isAnyStreaming,
  isAnyLoading
}) => {
  const {
    selectedCameras,
    videoEnabled,
    audioEnabled,
    toggleCameraSelection,
    selectAllCameras,
    deselectAllCameras,
    toggleVideo,
    toggleAudio,
  } = useCameraControl();

  const selectedCount = selectedCameras.size;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Multi-Camera Control</h2>
        
        {/* Camera Selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              Selected Cameras ({selectedCount}/{cameras.length})
            </h3>
            <div className="space-x-2">
              <button
                onClick={selectAllCameras}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
              >
                Select All
              </button>
              <button
                onClick={deselectAllCameras}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded">
            {cameras.map((camera) => {
              const deviceId = camera.name.split('/').pop()!;
              const displayName = camera.parentRelations[0]?.displayName || deviceId;
              const isSelected = selectedCameras.has(camera.name);
              
              return (
                <label
                  key={camera.name}
                  className={`flex items-center p-2 rounded cursor-pointer transition ${
                    isSelected 
                      ? 'bg-blue-100 text-blue-900' 
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCameraSelection(camera.name)}
                    className="mr-2"
                  />
                  <span className="text-sm truncate">{displayName}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          {!isAnyStreaming ? (
            <button
              onClick={onStartStreaming}
              disabled={selectedCount === 0 || isAnyLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnyLoading ? 'Starting...' : `Start ${selectedCount} Camera${selectedCount !== 1 ? 's' : ''}`}
            </button>
          ) : (
            <>
              <button
                onClick={onStopStreaming}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
              >
                Stop All Streams
              </button>
              <button
                onClick={toggleVideo}
                className={`px-4 py-2 text-white rounded-md transition duration-200 ${
                  videoEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
                title={videoEnabled ? 'Disable video for all' : 'Enable video for all'}
              >
                {videoEnabled ? 'Video On' : 'Video Off'}
              </button>
              <button
                onClick={toggleAudio}
                className={`px-4 py-2 text-white rounded-md transition duration-200 ${
                  audioEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
                title={audioEnabled ? 'Disable audio for all' : 'Enable audio for all'}
              >
                {audioEnabled ? 'Audio On' : 'Audio Off'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiCameraControls;