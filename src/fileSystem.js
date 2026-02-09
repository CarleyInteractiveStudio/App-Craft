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
        await directoryHandle.getDirectoryHandle('assets', { create: true });

        // Create 'project-settings.json' if it doesn't exist
        const settingsFileHandle = await directoryHandle.getFileHandle('project-settings.json', { create: true });

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
