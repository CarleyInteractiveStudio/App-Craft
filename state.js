// Represents the file system structure
const fileSystem = [
    {
        id: 1,
        name: 'Assets',
        type: 'folder',
        expanded: true, // Keep the assets folder expanded by default
        children: [
            {
                id: 2,
                name: 'Main.acs',
                type: 'script',
                children: []
            },
            {
                id: 3,
                name: 'Ventana Principal',
                type: 'window',
                content: [ // The hierarchy is now owned by the window
                    {
                        id: 1,
                        name: 'Panel Inicial',
                        type: 'panel',
                        active: true,
                        transform: {
                            position: { x: 0, y: 0, z: 0 },
                            rotation: { x: 0, y: 0, z: 0 },
                            scale: { x: 1, y: 1, z: 1 }
                        },
                        children: []
                    }
                ],
                nextHierarchyId: 2 // Each window manages its own IDs
            }
        ]
    }
];

// --- State Management ---
let nextFileId = 4; // Start after the default files
let selectedObject = null;
let activeWindowId = 3; // The "Ventana Principal" is active by default
