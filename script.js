document.addEventListener('DOMContentLoaded', () => {
    const createBtn = document.getElementById('create-btn');
    const communityBtn = document.getElementById('community-btn');
    const donateBtn = document.getElementById('donate-btn');
    const inviteBtn = document.getElementById('invite-btn');

    createBtn.addEventListener('click', () => {
        alert('¡El motor de creación se lanzará pronto! Prepárate.');
    });

    communityBtn.addEventListener('click', () => {
        alert('Nuestra comunidad está creciendo. ¡Únete pronto!');
    });

    donateBtn.addEventListener('click', () => {
        alert('Gracias por tu interés en apoyar App Craft. La función de donar estará disponible pronto.');
    });

    inviteBtn.addEventListener('click', () => {
        alert('¡Pronto podrás invitar a tus amigos a construir el futuro de las apps!');
    });
});
