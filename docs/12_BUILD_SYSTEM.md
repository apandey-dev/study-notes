# Build System & Packaging

This document outlines the build configurations, compiling scripts, and target installations.

---

## 1. Build and Run Commands

The application uses **Vite** to compile frontend assets and **Electron Builder** to package the final Windows executable:

- **`npm run dev`**: Starts the Vite dev server for frontend testing.
- **`npm run build`**: Compiles frontend assets into `dist/`.
- **`npm run electron:dev`**: Runs both Vite dev server and Electron shell in parallel. Electron loads the dev server port for hot reloading.
- **`npm run pack`**: Compiles the web build and generates an unpacked directory build (`dist-installer/win-unpacked/`) for testing portable executions.
- **`npm run dist`**: Compiles the web build and packages it into a single-file executable NSIS installer (`dist-installer/StudyNotesSetup.exe`).

---

## 2. Electron Builder Settings

The packaging settings are defined in the `build` block of `package.json`:

```json
"build": {
  "appId": "com.studynotes.app",
  "productName": "Study Notes",
  "executableName": "Study Notes",
  "compression": "maximum",
  "asar": true,
  "directories": {
    "output": "dist-installer"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "public/icon.png"
  }
}
```

### Key Configurations:
- **`asar: true`**: Bundles application files into an encrypted read-only archive format (ASAR). This speeds up file scanning and prevents users from accidentally modifying core files.
- **`compression: "maximum"`**: Minimizes the installer file size.
- **`files`**: Includes only built assets (`dist/**/*`), native runner files (`electron/**/*`), and `package.json`. Excludes all developer sources (`src/**/*`) and config files, reducing the binary size.

---

## 3. OS Integration & File Associations

The application configures native file associations on Windows:

```json
"fileAssociations": [
  {
    "ext": "md",
    "name": "Markdown Document",
    "role": "Editor"
  },
  {
    "ext": "txt",
    "name": "Text Document",
    "role": "Editor"
  }
]
```

### How Startup File Associations Work:
1. In [`main.js`](file:///C:/Users/arpit/Desktop/study-notes/electron/main.js), the startup arguments are parsed:
   `fileToOpenOnStartup = getFilePathFromArgs(process.argv);`
2. If the user double-clicks an associated `.md` file, the path is sent to the renderer process once the window finishes loading:
   `mainWindow.webContents.send('open-file-from-system', fileToOpenOnStartup);`
3. The React process receives the path via `onOpenFileFromSystem` and automatically loads the file content into the editor.
