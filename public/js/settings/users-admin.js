const openUsersAdmin = () => {
    window.history.replaceState("", "", `/settings.html`);
    $('#emptyGamesListDiv').removeClass('d-none').addClass('d-none');
    $('#gamesListPanel').removeClass('d-none').addClass('d-none');
    $('#usersAdminPanel').removeClass('d-none').addClass('d-none');
    $('#dosZonePanel').removeClass('d-none').addClass('d-none');
    $('#usersTbody').empty();
    $.getJSON("/api/users", function(data) {
        for (let i = 0; i < data.length; i++) {
            const user = data[i];
            var trElement = document.createElement('tr');
            trElement.appendChild(document.createElement('td')).textContent = user.username;
            trElement.appendChild(document.createElement('td')).textContent = user.email;
            trElement.appendChild(document.createElement('td')).textContent = user.role;
            var divActions = trElement.appendChild(document.createElement('td'))
                .appendChild(document.createElement('div'));
            divActions.classList.add('d-flex');
            if (user.role != 'admin' || user.email != sessionStorage.getItem('email', '')) {
                var button = document.createElement('button');
                button.classList.add('btn');
                button.classList.add('bi-trash');
                button.classList.add('ms-auto');
                button.setAttribute('type', 'button');
                button.setAttribute('aria-label', 'Delete');
                button.setAttribute('alt', 'Delete');
                button.setAttribute('onclick', `openDeleteUserConfirmation('${user.username}')`);
                divActions.appendChild(button);
            }
            // wrapper.innerHTML = [
            $('#usersTbody').append(trElement);
        }
        $('#usersAdminPanel').removeClass('d-none');

    }).fail(function(jqXHR, status, error) {
        appendAlert(`An error has occurred while getting the list of users: ${error}`);
    });
}