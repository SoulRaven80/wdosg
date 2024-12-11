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
            var wrapper = document.createElement('tr');
            wrapper.innerHTML = [
                `<td>${user.username}</td>`,
                `<td>${user.email}</td>`,
                `<td>${user.role}</td>`,
                `<td><div class="d-flex">`,
                `${user.role == 'admin' ? '' : '<button type="button" class="btn bi-trash ms-auto" aria-label="Delete" alt="Delete" onclick="openDeleteUserConfirmation(\'' + user.username + '\')"></button>'}`,
                `</div></td>`
            ].join('');
            $('#usersTbody').append(wrapper);
        }
        $('#usersAdminPanel').removeClass('d-none');

    }).fail(function(jqXHR, status, error) {
        appendAlert(`An error has occurred while getting the list of users: ${error}`);
    });
}