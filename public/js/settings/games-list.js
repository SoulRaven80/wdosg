$("#gamesListLink").on("click", function(e) {
    window.history.replaceState("", "", `/settings.html`);
    $('#emptyGamesListDiv').removeClass('d-none').addClass('d-none');
    $('#gamesListPanel').removeClass('d-none').addClass('d-none');
    $('#gamesListTbody').empty();
    $('#usersAdminPanel').removeClass('d-none').addClass('d-none');
    $('#dosZonePanel').removeClass('d-none').addClass('d-none');

    $.getJSON("/api/games/shallowInfo", function(data) {
        try {
            if (data.length == 0) {
                $('#emptyGamesListDiv').removeClass('d-none');
                return;
            }
            var wrapper = '';
            var sortedData = data.sort((a, b) => {
                if (a.name.toLowerCase() < b.name.toLowerCase()) {
                  return -1;
                }
            });
            for (let i = 0; i < sortedData.length; i++) {
                const game = sortedData[i];
                var wrapper = document.createElement('tr');
                wrapper.innerHTML = [
                    `  <th scope="row">${i+1}</th>`,
                    `  <td>${game.name}</td>`,
                    '  <td>',
                    '    <div class="d-flex justify-content-end">',
                    `      <button type="button" class="btn bi-pencil" aria-label="Game info" alt="Game info" title="Game info" onclick="openEditModal('${game.id}')"></button>`,
                    `      <button type="button" class="btn bi-paperclip" aria-label="Attachments" alt="Attachments" title="Attachments" onclick="openAttachModal('${game.id}', '${game.path}', '${game.name}')"></button>`,
                    `      <button type="button" class="btn bi-gear" aria-label="Dosbox config" alt="Dosbox config" title="Dosbox config" onclick="openDosboxConfigModal('${game.id}', '${game.path}')"></button>`,
                    `      <button type="button" class="btn bi-trash" aria-label="Delete" alt="Delete" title="Delete" onclick="openDeleteGameConfirmation('${game.id}')"></button>`,
                    '    </div>',
                    '  </td>',
                ].join('');
                $('#gamesListTbody').append(wrapper);
            }
            $('#gamesListPanel').removeClass('d-none');
        }
        catch (error) {
            appendAlert('An error has occurred while reading the games information');
        }
    }).fail(function(jqXHR, status, error) {
        appendAlert(`An error has occurred while getting the game list information: ${error}`);
    });
});
