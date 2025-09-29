import React, { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';

const CodeExporter: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const checkPassword = () => {
    if (password === 'Better !@#$') {
      setIsAuthenticated(true);
      setShowPasswordModal(false);
      setPassword('');
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      alert('Incorrect password. Access denied.');
      setPassword('');
    }
  };

  const requirePassword = (action: () => void) => {
    setPendingAction(() => action);
    setShowPasswordModal(true);
  };

  const getAllProjectFiles = () => {
    return {
      'package.json': `{
  "name": "product-management-offline-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  }
}`,
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Product Management Checklist App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
      'tsconfig.json': `{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}`,
      'tsconfig.app.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}`,
      'tsconfig.node.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}`,
      'README.md': `# Product Management Offline App

A complete offline product management application built with React, TypeScript, and Tailwind CSS.

## Features

- ✅ Complete offline functionality
- ✅ Local storage for data persistence
- ✅ Product creation and management
- ✅ Task tracking with categories
- ✅ Progress visualization
- ✅ Image upload support
- ✅ Export/import functionality
- ✅ Responsive design

## Installation

1. Extract the files to a folder
2. Run: \`npm install\`
3. Run: \`npm run dev\`
4. Open: http://localhost:5173

## Usage

- Create products in the "New" tab
- Manage existing products in the "Existing" tab
- Draft new products in the "Draft" tab
- All data is saved locally in your browser

## Build for Production

Run: \`npm run build\`

The built files will be in the \`dist\` folder.
`,
      '.gitignore': `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`
    };
  };

  const downloadAsZip = async () => {
    const files = getAllProjectFiles();
    
    // Create a simple text-based "zip" file with all the code
    let zipContent = `# PRODUCT MANAGEMENT OFFLINE APP - COMPLETE SOURCE CODE
# Extract each file to its respective path in your project folder
# 
# INSTALLATION INSTRUCTIONS:
# 1. Create a new folder for your project
# 2. Copy each file below to its respective path
# 3. Run: npm install
# 4. Run: npm run dev
#
# ========================================

`;

    Object.entries(files).forEach(([filename, content]) => {
      zipContent += `
# ========================================
# FILE: ${filename}
# ========================================

${content}

`;
    });

    // Add all the React component files
    const componentFiles = {
      'src/main.tsx': `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      'src/vite-env.d.ts': `/// <reference types="vite/client" />`
    };

    Object.entries(componentFiles).forEach(([filename, content]) => {
      zipContent += `
# ========================================
# FILE: ${filename}
# ========================================

${content}

`;
    });

    // Create and download the file
    const blob = new Blob([zipContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-management-offline-app-complete.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsJSON = () => {
    const files = getAllProjectFiles();
    const exportData = {
      projectName: 'Product Management Offline App',
      version: '1.0.0',
      description: 'Complete offline product management application',
      files: files,
      instructions: [
        '1. Create a new folder for your project',
        '2. Create each file with its respective content',
        '3. Run: npm install',
        '4. Run: npm run dev',
        '5. Open: http://localhost:5173'
      ]
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-management-app-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyInstallInstructions = () => {
    const instructions = `# Product Management Offline App - Quick Setup

## Method 1: Clone from this working version
1. Download all files from this project
2. Create new folder: product-management-app
3. Copy all files to the new folder
4. Open terminal in that folder
5. Run: npm install
6. Run: npm run dev

## Method 2: Create from scratch
1. Create new React + TypeScript project: npm create vite@latest my-app -- --template react-ts
2. Install dependencies: npm install lucide-react
3. Install Tailwind: npm install -D tailwindcss postcss autoprefixer
4. Setup Tailwind: npx tailwindcss init -p
5. Replace all files with the exported code

## Key Features:
- ✅ Works completely offline
- ✅ No database required
- ✅ Saves data in browser localStorage
- ✅ Full product management system
- ✅ Task tracking and progress
- ✅ Image upload support
- ✅ Export/import functionality

Your app will run at: http://localhost:5173`;

    navigator.clipboard.writeText(instructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Your Offline App</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => requirePassword(downloadAsZip)}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Complete Code
        </button>
        
        <button
          onClick={() => requirePassword(downloadAsJSON)}
          className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download as JSON
        </button>
        
        <button
          onClick={() => requirePassword(copyInstallInstructions)}
          className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Setup Guide'}
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">What you'll get:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ Complete React + TypeScript source code</li>
          <li>✅ All component files and configurations</li>
          <li>✅ Package.json with all dependencies</li>
          <li>✅ Tailwind CSS setup</li>
          <li>✅ Vite build configuration</li>
          <li>✅ Installation and setup instructions</li>
          <li>✅ Works 100% offline with localStorage</li>
        </ul>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Access Code Required</h3>
            <p className="text-gray-600 mb-4">Enter the access code to export the source code:</p>
            <input
              type="password"
              placeholder="Enter access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={checkPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Access Code
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPendingAction(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Access Code Required</h3>
            <p className="text-gray-600 mb-4">Enter the access code to export the source code:</p>
            <input
              type="password"
              placeholder="Enter access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={checkPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Access Code
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPendingAction(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeExporter;