const openListDOSZone = (page, filter, genre) => {
    $('#emptyGamesListDiv').removeClass('d-none').addClass('d-none');
    $('#gamesListPanel').removeClass('d-none').addClass('d-none');
    $('#usersAdminPanel').removeClass('d-none').addClass('d-none');
    $('#dosZonePanel').removeClass('d-none').addClass('d-none');
    $('#dosZoneTbody').empty();
    $.getJSON(`/api/dosZoneGames/genres`, function(result) {
        var sortedGenres = result.sort((a, b) => {
            if (a < b) {
                return -1;
            }
        });

        $("#filterDosZoneGenre").empty();
        $("#filterDosZoneGenre").append(`<option value="">Filter by genre</option>`);
        sortedGenres.forEach(genre => {
            $("#filterDosZoneGenre").append(`<option value="${genre}">${genre}</option>`);
        });
        $(`#filterDosZoneGenre option[value="${genre}"]`).attr("selected", "selected");
    });
    $.getJSON(`/api/dosZoneGames`, {
        page: page,
        filter: encodeURIComponent(filter),
        genre: encodeURIComponent(genre)
    }, function(result) {
        try {
            $('#filterDosZoneGames').val(filter);
            $('#dosZonePageNavigation').empty();

            $('#dosZoneSearch').attr("onclick", `openListDOSZone(${result.currentPage}, $('#filterDosZoneGames').val(), $('#filterDosZoneGenre').find(":selected").val())`);

            var navigation = `<ul class="pagination justify-content-center mb-1">
                                <li class="page-item ${result.currentPage > 1 ? '' : 'disabled'}">
                                    <a class="page-link" href="#" onclick="openListDOSZone(${result.currentPage - 1}, '${filter}', '${genre}')" aria-label="Previous">
                                        <span>&laquo;</span>
                                    </a>
                                </li>`;
            if (result.startPage > 1) {
                navigation += ` <li class="page-item">
                                    <a class="page-link" href="#" onclick="openListDOSZone(1, '${filter}', '${genre}')">1</a>
                                </li>`;
                if (result.startPage > 2) {
                    navigation += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                }
            }
            
            for (let i = result.startPage; i <= result.endPage; i++) {
                navigation += ` <li class="page-item ${result.currentPage === i ? 'active' : ''}">
                                    <a class="page-link" href="#" onclick="openListDOSZone(${i}, '${filter}', '${genre}')">${i}</a>
                                </li>`;
            }

            if (result.endPage < result.totalPages) {
                if (result.endPage < result.totalPages -1) {
                    navigation += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                }
                navigation += ` <li class="page-item">
                                    <a class="page-link" href="#" onclick="openListDOSZone(${result.totalPages}, '${filter}', '${genre}')">${result.totalPages}</a>
                                </li>`;
            }
            if (result.currentPage < result.totalPages) {
                navigation += `<li class="page-item">
                        <a class="page-link" href="#" onclick="openListDOSZone(${result.currentPage + 1}, '${filter}', '${genre}')">&raquo;</a>
                    </li>`;
            }
            else {
                navigation += `<li class="page-item disabled">
                        <a class="page-link" href="#">&raquo;</a>
                    </li>`;
            }
            navigation += `</ul>`;
            $('#dosZonePageNavigation').append(navigation);
            var wrapper = '';
            for (let i = 0; i < result.items.length; i++) {
                const game = result.items[i];
                wrapper += `<tr><td>${game.title}</td><td>${game.release}</td><td>${game.genre}</td>
                    <td>
                        <button type="button" class="btn bi-plus-square" aria-label="Add" onclick="downloadAndAdd('${game.id}')"></button>
                    </td>
                </tr>`;
            }
            $('#dosZoneTbody').append(wrapper);
            $('#dosZonePanel').removeClass('d-none');
            window.history.replaceState("", "", `/settings.html?action=import&page=${page}&filter=${encodeURIComponent(filter)}&genre=${encodeURIComponent(genre)}`);
        }
        catch (error) {
            appendAlert(`An error has occurred while reading the games list: ${error}`);
        }
    }).fail(function(jqXHR, status, error) {
        appendAlert(`An error has occurred while getting the games list: ${error}`);
    });
};

// eslint-disable-next-line no-unused-vars
function prepareImportFromDosZone() {
    $("#filterDosZoneGames").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#dosZoneSearch").click();
        }
    });

    $("#filterDosZoneGenre").on("change", event => {
        openListDOSZone(1, $("#filterDosZoneGames").val(), event.target.value);
    });

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'import' && urlParams.has('page')) {
        if (urlParams.has('filter')) {
            if (urlParams.has('genre')) {
                openListDOSZone(urlParams.get('page'), urlParams.get('filter'), urlParams.get('genre'));
            }
            else {
                openListDOSZone(urlParams.get('page'), urlParams.get('filter'), '');
            }
        }
        else {
            if (urlParams.has('genre')) {
                openListDOSZone(urlParams.get('page'), $('#filterDosZoneGames').val(), urlParams.get('genre'));
            }
            else {
                openListDOSZone(urlParams.get('page'), $('#filterDosZoneGames').val(), '');
            }
        }
    }
}

// eslint-disable-next-line no-unused-vars
function downloadAndAdd(gameId) {
    $.getJSON(`/api/dosZoneGames/find?id=${gameId}`, function(result) {
        const workingModal = new bootstrap.Modal('#waitingModal', {});
        $('#waitingModalTitle').text('Downloading game');
        workingModal.show();
        fetch(result.url).then(response => {
            if (!response.ok) {
                throw Error(response.status);
            } else {
                return response.blob();
            }
        }).then(blob => {
            workingModal.hide();
            const bundleFile = new Blob([blob]);
            const file = new File([bundleFile], "bundle.jsdos", { type:"application/octet-stream", lastModified:new Date().getTime() });
            const container = new DataTransfer();
            container.items.add(file);
            // eslint-disable-next-line no-undef
            openCreateModal(true);
            $("#createFile")[0].files = container.files;
            $('#createName').val(result.title);
            $('#createButtonFind').click();
        }).catch(error => {
            appendAlert(`An error has occurred while importing the game: ${error}`);
            workingModal.hide();
        });
    });
}