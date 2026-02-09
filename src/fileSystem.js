export async function openProjectFolder() {
    try {
        const directoryHandle = await window.showDirectoryPicker();
        return directoryHandle;
    } catch (error) {
        console.error("Error seleccionando carpeta:", error);
        return null;
    }
}

export async function initProjectStructure(directoryHandle) {
    // Create 'assets' folder if it doesn't exist
    try {
        const assetsHandle = await directoryHandle.getDirectoryHandle('assets', { create: true });

        // Create 'project-settings.json' if it doesn't exist inside assets/
        const settingsFileHandle = await assetsHandle.getFileHandle('project-settings.json', { create: true });

        // Initial settings if empty
        const file = await settingsFileHandle.getFile();
        if (file.size === 0) {
            const writable = await settingsFileHandle.createWritable();
            await writable.write(JSON.stringify({
                projectName: directoryHandle.name,
                version: "1.0.0",
                lastModified: new Date().toISOString()
            }, null, 2));
            await writable.close();
        }

        return true;
    } catch (error) {
        console.error("Error inicializando estructura del proyecto:", error);
        return false;
    }
}

export async function listProjectFiles(directoryHandle) {
    const files = [];
    for await (const entry of directoryHandle.values()) {
        files.push({
            name: entry.name,
            kind: entry.kind
        });
    }
    return files;
}

export async function createFile(directoryHandle, fileName, content = "") {
    try {
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return fileHandle;
    } catch (error) {
        console.error("Error creando archivo:", error);
        return null;
    }
}

export async function deleteFile(directoryHandle, fileName) {
    try {
        await directoryHandle.removeEntry(fileName);
        return true;
    } catch (error) {
        console.error("Error eliminando archivo:", error);
        return false;
    }
}
