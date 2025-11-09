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
                type: 'script'
            },
            {
                id: 3,
                name: 'Ventana Principal',
                type: 'window',
                // The content is now a flat list of objects.
                // The window itself is the root object.
                content: [
                    {
                        id: 101, // Unique ID for the panel
                        parentId: 3, // Parent is the window object itself
                        name: 'Panel Inicial',
                        type: 'panel',
                        active: true,
                        transform: {
                            position: { x: 0, y: 0, z: 0 },
                            rotation: { x: 0, y: 0, z: 0 },
                            scale: { x: 1, y: 1, z: 1 }
                        },
                        size: {
                            width: 400,
                            height: 300
                        }
                    }
                ],
                nextHierarchyId: 102 // Next available ID
            }
        ]
    }
];

// --- State Management ---
let nextFileId = 4; // Start after the default files
let selectedObjectId = null; // We will now track selection by ID
let activeWindowId = 3; // The "Ventana Principal" is active by default
