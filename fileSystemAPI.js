// This file will contain all the logic for a in-browser-editor and the File System Access API.

let projectHandle = null;

async function openProject() {
    try {
        // Request read-write permissions from the start
        projectHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        if (projectHandle) {
            const fileSystemData = await processDirectory(projectHandle);
            fileSystem.length = 0;
            Array.prototype.push.apply(fileSystem, fileSystemData);

            const firstWindow = findItemByType(fileSystem, 'window');
            activeWindowId = firstWindow ? firstWindow.id : null;
            selectedObjectId = null;

            document.getElementById('welcome-overlay').style.display = 'none';
            render();
        }
    } catch (error) {
        console.error("Error opening directory:", error);
    }
}

async function createProject() {
    try {
        // This is a common way to get a handle to a new, empty directory.
        // We ask for a file to be saved, then get its parent directory.
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: 'project.settings',
            types: [{
                description: 'App Craft Project',
                accept: { 'text/plain': ['.settings'] },
            }],
        });

        // To get the directory, we need a little trick. We can't directly
        // get a directory handle from a save picker. We'll need to work around this.
        // A better approach is to ask the user to select a directory first.

        // Let's adjust the flow to ask for a directory first.
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });

        // Now create the default project structure
        const assetsDir = await dirHandle.getDirectoryHandle('Assets', { create: true });
        const defaultWindowFile = await assetsDir.getFileHandle('Ventana Principal.json', { create: true });

        const writer = await defaultWindowFile.createWritable();
        const defaultWindowContent = {
            id: 1, // Let's start IDs from 1 for the file itself
            name: 'Ventana Principal',
            type: 'window',
            content: [],
            nextHierarchyId: 101
        };
        await writer.write(JSON.stringify(defaultWindowContent, null, 2));
        await writer.close();

        // Now that the project is created, open it
        await openProjectFromHandle(dirHandle);

    } catch (error) {
        console.error("Error creating project:", error);
    }
}


async function openProjectFromHandle(dirHandle) {
    projectHandle = dirHandle;
    const fileSystemData = await processDirectory(projectHandle);
    fileSystem.length = 0;
    Array.prototype.push.apply(fileSystem, fileSystemData);

    const firstWindow = findItemByType(fileSystem, 'window');
    activeWindowId = firstWindow ? firstWindow.id : null;
    selectedObjectId = null;

    document.getElementById('welcome-overlay').style.display = 'none';
    render();
}


async function saveWindowToFile(windowObject) {
    if (!windowObject || !windowObject.fileHandle) {
        console.error("Save failed: Window object or its file handle is missing.");
        return;
    }

    try {
        const writer = await windowObject.fileHandle.createWritable();

        // Prepare a clean object for serialization (without circular refs or handles)
        const dataToSave = {
            id: windowObject.id,
            name: windowObject.name,
            type: 'window',
            content: windowObject.content,
            nextHierarchyId: windowObject.nextHierarchyId
        };

        await writer.write(JSON.stringify(dataToSave, null, 2));
        await writer.close();
        console.log(`Saved: ${windowObject.name}`);
    } catch (error) {
        console.error(`Error saving file ${windowObject.name}:`, error);
    }
}

async function processDirectory(directoryHandle) {
    const contents = [];
    let idCounter = 1;

    for await (const entry of directoryHandle.values()) {
        const item = { id: idCounter++, fileHandle: entry }; // Store the handle
        if (entry.kind === 'file') {
            item.name = entry.name;
            if (entry.name.endsWith('.acs')) {
                item.type = 'script';
            } else if (entry.name.endsWith('.json')) {
                item.type = 'window';
                try {
                    const file = await entry.getFile();
                    const contentText = await file.text();
                    const windowData = JSON.parse(contentText);
                    item.name = windowData.name;
                    item.content = windowData.content;
                    item.nextHierarchyId = windowData.nextHierarchyId;
                } catch (e) {
                    console.error(`Could not parse window file: ${entry.name}`, e);
                    continue; // Skip corrupted files
                }
            } else {
                continue;
            }
        } else if (entry.kind === 'directory') {
            item.name = entry.name;
            item.type = 'folder';
            item.expanded = false;
            item.children = await processDirectory(entry);
        }
        contents.push(item);
    }
    return contents;
}
