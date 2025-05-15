function showCustomAlert(message) {
    console.log("showCustomAlert");
    const notification = document.createElement('div');
    notification.classList.add('custom-alert');

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    notification.appendChild(messageElement);

    const closeButton = document.createElement('button');
    closeButton.classList.add('btn');
    closeButton.classList.add('btn-info');
    closeButton.textContent = 'OK';
    closeButton.addEventListener('click', () => {
        notification.remove();
    });
    notification.appendChild(closeButton);

    document.body.appendChild(notification);
}