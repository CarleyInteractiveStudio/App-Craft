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
                content: [
                    {
                        id: 101,
                        parentId: 3, // Parent is the window object itself
                        name: 'Texto de Bienvenida',
                        type: 'text',
                        active: true,
                        transform: {
                            position: { x: 0, y: 0, z: 0 },
                            rotation: { x: 0, y: 0, z: 0 },
                            scale: { x: 1, y: 1, z: 1 }
                        },
                        text: '¡Bienvenido a App Craft!',
                        fontSize: 24,
                        color: '#FFFFFF',
                        background: {
                            type: 'solid',
                            color: '#555555',
                            gradient: [],
                            opacity: 0
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
