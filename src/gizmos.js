/**
 * GizmoManager provides on-canvas UI for interacting with selected
 * HTML elements, such as moving and scaling.
 */
export class GizmoManager {
    constructor(engine) {
        this.engine = engine;
        this.overlay = document.getElementById('gizmo-overlay');
        this.selectedElement = null;
    }

    /**
     * Attaches visual gizmos to the selected element.
     * @param {HTMLElement} element
     */
    attach(element) {
        this.selectedElement = element;
        this.overlay.innerHTML = ''; // Clear current gizmos

        if (!element) return;

        // Position gizmo over the element
        const rect = element.getBoundingClientRect();

        // Add a highlight box around the element
        const box = document.createElement('div');
        box.className = 'gizmo-box';
        box.style.position = 'absolute';
        box.style.left = `${rect.left}px`;
        box.style.top = `${rect.top}px`;
        box.style.width = `${rect.width}px`;
        box.style.height = `${rect.height}px`;
        box.style.border = '2px solid #0078d4';
        box.style.pointerEvents = 'none';

        // Match rotation of the element
        const transform = window.getComputedStyle(element).transform;
        if (transform && transform !== 'none') {
            box.style.transform = transform;
        }

        // Add handles for resizing
        const handleSize = 8;
        const positions = ['tl', 'tr', 'bl', 'br'];
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `gizmo-handle handle-${pos}`;
            handle.style.position = 'absolute';
            handle.style.width = `${handleSize}px`;
            handle.style.height = `${handleSize}px`;
            handle.style.backgroundColor = 'white';
            handle.style.border = '1px solid #0078d4';
            handle.style.cursor = 'nwse-resize';
            handle.style.pointerEvents = 'auto';

            // Set handle position relative to the box
            if (pos.startsWith('t')) handle.style.top = `${-handleSize/2}px`;
            if (pos.startsWith('b')) handle.style.bottom = `${-handleSize/2}px`;
            if (pos.endsWith('l')) handle.style.left = `${-handleSize/2}px`;
            if (pos.endsWith('r')) handle.style.right = `${-handleSize/2}px`;

            box.appendChild(handle);

            // Add drag functionality for handles
            handle.addEventListener('mousedown', (e) => this.startResize(e, pos));
        });

        // Add Rotation Handle
        const rotHandle = document.createElement('div');
        rotHandle.className = 'gizmo-handle handle-rotation';
        rotHandle.style.position = 'absolute';
        rotHandle.style.width = '10px';
        rotHandle.style.height = '10px';
        rotHandle.style.top = '-25px';
        rotHandle.style.left = 'calc(50% - 5px)';
        rotHandle.style.backgroundColor = '#10b981'; // Green for rotation
        rotHandle.style.borderRadius = '50%';
        rotHandle.style.cursor = 'grab';
        rotHandle.style.pointerEvents = 'auto';

        // Line connecting handle to box
        const rotLine = document.createElement('div');
        rotLine.style.position = 'absolute';
        rotLine.style.width = '1px';
        rotLine.style.height = '15px';
        rotLine.style.backgroundColor = '#10b981';
        rotLine.style.top = '-15px';
        rotLine.style.left = '50%';

        box.appendChild(rotLine);
        box.appendChild(rotHandle);

        rotHandle.addEventListener('mousedown', (e) => this.startRotate(e));

        // Add drag functionality for the whole box (move)
        box.style.pointerEvents = 'auto';
        box.style.cursor = 'move';
        box.addEventListener('mousedown', (e) => {
            if (e.target === box) this.startMove(e);
        });

        this.overlay.appendChild(box);
    }

    /**
     * Handles moving the element
     * @param {MouseEvent} e
     */
    startMove(e) {
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;

        // Get initial styles
        const style = window.getComputedStyle(this.selectedElement);
        const initialLeft = parseInt(style.left) || 0;
        const initialTop = parseInt(style.top) || 0;

        // Force position to absolute if it's static
        if (style.position === 'static') {
            this.selectedElement.style.position = 'absolute';
        }

        const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            this.selectedElement.style.left = `${initialLeft + dx}px`;
            this.selectedElement.style.top = `${initialTop + dy}px`;

            // Re-attach to update gizmo position
            this.attach(this.selectedElement);
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            // Refresh inspector to show new values
            this.engine.inspector.loadElement(this.selectedElement);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    /**
     * Handles rotating the element
     * @param {MouseEvent} e
     */
    startRotate(e) {
        e.stopPropagation();
        const rect = this.selectedElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const initialTransform = window.getComputedStyle(this.selectedElement).transform;
        // Basic parsing for existing rotation (matrix)
        let initialRotation = 0;
        if (initialTransform && initialTransform !== 'none') {
            const values = initialTransform.split('(')[1].split(')')[0].split(',');
            const a = values[0];
            const b = values[1];
            initialRotation = Math.round(Math.atan2(b, a) * (180/Math.PI));
        }

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - centerX;
            const deltaY = moveEvent.clientY - centerY;

            // Calculate angle between mouse and center (in degrees)
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

            // Adjust so 0 deg is at the top handle (which is normally -90 in atan2)
            const adjustedAngle = angle + 90;

            this.selectedElement.style.transform = `rotate(${adjustedAngle}deg)`;
            this.attach(this.selectedElement); // Re-attach to rotate the gizmo box too
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            this.engine.inspector.loadElement(this.selectedElement);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    /**
     * Handles resizing the element
     * @param {MouseEvent} e
     * @param {string} handlePos
     */
    startResize(e, handlePos) {
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;

        const rect = this.selectedElement.getBoundingClientRect();
        const initialWidth = rect.width;
        const initialHeight = rect.height;
        const initialLeft = parseInt(window.getComputedStyle(this.selectedElement).left) || rect.left;
        const initialTop = parseInt(window.getComputedStyle(this.selectedElement).top) || rect.top;

        const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            if (handlePos.endsWith('r')) {
                this.selectedElement.style.width = `${initialWidth + dx}px`;
            } else if (handlePos.endsWith('l')) {
                this.selectedElement.style.width = `${initialWidth - dx}px`;
                this.selectedElement.style.left = `${initialLeft + dx}px`;
            }

            if (handlePos.startsWith('b')) {
                this.selectedElement.style.height = `${initialHeight + dy}px`;
            } else if (handlePos.startsWith('t')) {
                this.selectedElement.style.height = `${initialHeight - dy}px`;
                this.selectedElement.style.top = `${initialTop + dy}px`;
            }

            this.attach(this.selectedElement);
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            this.engine.inspector.loadElement(this.selectedElement);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
}
