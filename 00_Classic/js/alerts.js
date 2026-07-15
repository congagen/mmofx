function showCustomAlert(message) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';

    const card = document.createElement('div');
    card.className = 'custom-alert';

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    card.appendChild(messageElement);

    const closeButton = document.createElement('button');
    closeButton.className = 'btn custom-alert-ok';
    closeButton.textContent = 'OK';
    const close = function () { overlay.remove(); };
    closeButton.addEventListener('click', close);
    card.appendChild(closeButton);

    overlay.appendChild(card);
    // Click the dimmed backdrop (outside the card) to dismiss as well.
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
    });

    document.body.appendChild(overlay);
}
