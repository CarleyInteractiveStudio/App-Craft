// Represents the file system structure
const fileSystem = [
    {
        id: 1,
        name: 'Assets',
        type: 'folder',
        children: [
            {
                id: 2,
                name: 'Main.acs',
                type: 'script',
                children: []
            }
        ]
    }
];

// Represents the hierarchy of objects in the scene
const hierarchy = [
    {
        id: 1,
        name: 'Panel Principal',
        type: 'panel',
        active: true,
        transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        },
        children: []
    }
];

// State Management
let nextFileId = 3;
let nextHierarchyId = 3;
let selectedObject = null;
