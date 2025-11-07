document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.getElementById('main-view');
    const projectView = document.getElementById('project-view');
    const createBtn = document.getElementById('create-btn');
    const communityBtn = document.getElementById('community-btn');
    const donateBtn = document.getElementById('donate-btn');
    const inviteBtn = document.getElementById('invite-btn');

    createBtn.addEventListener('click', () => {
        mainView.style.display = 'none';
        projectView.style.display = 'block';
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
