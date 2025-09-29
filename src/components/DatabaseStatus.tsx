import React from 'react';
import { Wifi, WifiOff, Database, HardDrive } from 'lucide-react';

interface DatabaseStatusProps {
  isOnline: boolean;
  useFirebase: boolean;
  onToggleFirebase: (enabled: boolean) => void;
}

const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ 
  isOnline, 
  useFirebase, 
  onToggleFirebase 
}) => {
  return (
    <div className="flex items-center gap-4 text-sm">
      {/* Online Status */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
        <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Database Status */}
      <div className="flex items-center gap-2">
        {useFirebase && isOnline ? (
          <Database className="w-4 h-4 text-blue-600" />
        ) : (
          <HardDrive className="w-4 h-4 text-gray-600" />
        )}
        <span className={useFirebase && isOnline ? 'text-blue-600' : 'text-gray-600'}>
          {useFirebase && isOnline ? 'Firebase' : 'Local Storage'}
        </span>
      </div>

      {/* Toggle Firebase */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={useFirebase}
          onChange={(e) => onToggleFirebase(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <span className="text-gray-600">Use Firebase</span>
      </label>
    </div>
  );
};

export default DatabaseStatus;