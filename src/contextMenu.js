export function createContextMenu(e, items) {
    // Remove existing context menus
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu glass-effect';

    items.forEach(item => {
        if (item.separator) {
            const sep = document.createElement('div');
            sep.className = 'context-menu-separator';
            menu.appendChild(sep);
        } else {
            const div = document.createElement('div');
            div.className = 'context-menu-item';
            div.innerHTML = `
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            `;
            div.onclick = () => {
                item.action();
                menu.remove();
            };
            menu.appendChild(div);
        }
    });

    document.body.appendChild(menu);

    // Position
    const menuWidth = 200;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x -= menuWidth;

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const closeMenu = (event) => {
        if (!menu.contains(event.target)) {
            menu.remove();
            document.removeEventListener('mousedown', closeMenu);
        }
    };

    setTimeout(() => {
        document.addEventListener('mousedown', closeMenu);
    }, 10);
}
