// Optional copyText renders a read-only, auto-selected field (for share links
// and other long unbreakable strings that would overflow the card as plain text).
function showCustomAlert(message, copyText) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';

    const card = document.createElement('div');
    card.className = 'custom-alert';

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    card.appendChild(messageElement);

    if (copyText) {
        const field = document.createElement('input');
        field.type = 'text';
        field.readOnly = true;
        field.value = copyText;
        field.className = 'custom-alert-copy';
        field.addEventListener('focus', function () { field.select(); });
        card.appendChild(field);
        // Auto-select so Cmd/Ctrl+C works immediately if the clipboard copy was blocked.
        setTimeout(function () { field.focus(); field.select(); }, 0);
    }

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
