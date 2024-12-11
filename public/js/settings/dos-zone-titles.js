const openListDOSZone = (page, filter) => {
    $('#emptyGamesListDiv').removeClass('d-none').addClass('d-none');
    $('#gamesListPanel').removeClass('d-none').addClass('d-none');
    $('#usersAdminPanel').removeClass('d-none').addClass('d-none');
    $('#dosZonePanel').removeClass('d-none').addClass('d-none');
    $('#dosZoneTbody').empty();
    const contentDiv = document.getElementById('dosZonePanel');
    $.getJSON(`/api/dosZoneGames?page=${page}&filter=${encodeURIComponent(filter)}`, function(result) {
        try {
            $('#filterDosZoneGames').val(filter);
            $('#dosZonePageNavigation').empty();

            $('#dosZoneSearch').attr("onclick",`openListDOSZone(${result.currentPage}, $('#filterDosZoneGames').val())`);

            var navigation = `<ul class="pagination justify-content-center" style="margin-bottom: unset">
                                <li class="page-item ${result.currentPage > 1 ? '' : 'disabled'}">
                                    <a class="page-link" href="#" onclick="openListDOSZone(${result.currentPage - 1}, '${filter}')" aria-label="Previous">
                                        <span>&laquo;</span>
                                    </a>
                                </li>`;
            if (result.startPage > 1) {
                navigation += ` <li class="page-item">
                                    <a class="page-link" href="#" onclick="openListDOSZone(1, '${filter}')">1</a>
                                </li>`;
                if (result.startPage > 2) {
                    navigation += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                }
            }
            
            for (let i = result.startPage; i <= result.endPage; i++) {
                navigation += ` <li class="page-item ${result.currentPage === i ? 'active' : ''}">
                                    <a class="page-link" href="#" onclick="openListDOSZone(${i}, '${filter}')">${i}</a>
                                </li>`;
            }

            if (result.endPage < result.totalPages) {
                if (result.endPage < result.totalPages -1) {
                    navigation += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                }
                navigation += ` <li class="page-item">
                                    <a class="page-link" href="#" onclick="openListDOSZone(${result.totalPages}, '${filter}')">${result.totalPages}</a>
                                </li>`;
            }
            if (result.currentPage < result.totalPages) {
                navigation += `<li class="page-item">
                        <a class="page-link" href="#" onclick="openListDOSZone(${result.currentPage + 1}, '${filter}')">&raquo;</a>
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
            window.history.replaceState("", "", `/settings.html?action=import&page=${page}&filter=${encodeURIComponent(filter)}`);
        }
        catch (error) {
            appendAlert(`An error has occurred while reading the games list: ${error}`);
        }
    }).fail(function(jqXHR, status, error) {
        appendAlert(`An error has occurred while getting the games list: ${error}`);
    });
}

function prepareImportFromDosZone() {
    $("#filterDosZoneGames").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#dosZoneSearch").click();
        }
    });

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'import' && urlParams.has('page')) {
        if (urlParams.has('filter')) {
            openListDOSZone(urlParams.get('page'), urlParams.get('filter'));
        }
        else {
            openListDOSZone(urlParams.get('page'), $('#filterDosZoneGames').val());
        }
    }
}

function downloadAndAdd(gameId) {
    $.getJSON(`/api/getDosZoneGame?id=${gameId}`, function(result) {
        const workingModal = new bootstrap.Modal('#waitingModal', {});
        workingModal.show();
        fetch(result.url).then(response => {
            if (!response.ok) {
                throw Error(response.status);
            } else {
                return response.blob();
            }
        })
        .then(blob => {
            workingModal.hide();
            const bundleFile = new Blob([blob]);
            const file = new File([bundleFile], "bundle.jsdos", { type:"application/octet-stream", lastModified:new Date().getTime() });
            const container = new DataTransfer();
            container.items.add(file);
        
            openCreateModal(true);
            $("#createFile")[0].files = container.files;
            $('#createName').val(result.title);
            $('#createButtonFind').click();
        })
        .catch(error => {
            appendAlert(`An error has occurred while importing the game: ${error}`);
            workingModal.hide();
        });
    });
}