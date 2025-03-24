$(document).ready(function() {
    $.getJSON("/api/games", function(data) {
        try {
            if (data.length == 0) {
                appendInfo("Empty games library. Please request an admin to add games through the app Settings");
                return;
            }
            var sortedData = data.sort((a, b) => {
                if (a.name.toLowerCase() < b.name.toLowerCase()) {
                    return -1;
                }
            });
            sessionStorage.setItem('gamesList', JSON.stringify(sortedData));

            buildMainScreen(sortedData);
        }
        catch (error) {
            appendAlert(`An error has occurred while reading the games information: ${error}`);
        }
    }).fail(function(jqXHR, status, error) {
        appendAlert(`An error has occurred while getting the game list information: ${error}`);
    });
});

const hideTooltips = () => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => bootstrap.Tooltip.getInstance(tooltipTriggerEl));
    for (let i = 0; i < tooltipList.length; i++) {
        const ttip = tooltipList[i];
        if (ttip) {
            ttip.hide();
        }
    }
};

const appyFilters = (data) => {
    const nameFilter = $("#filterInputName").val();
    const yearFilter =$("#filterInputYear").val();
    const genreFilter = $("#filterGenre :selected").val();
    // build list filtered by name
    var filteredData = data;
    hideTooltips();
    filteredData = data.filter(function(i) {
        return i.name.toLowerCase().includes(nameFilter.toLowerCase());
    });
    // filter list by year
    filteredData = filteredData.filter(function(i) {
        return i.year.includes(yearFilter);
    });
    // filter list by genre
    if (genreFilter == -1) {
        buildGamesList(filteredData);
    }
    else {
        hideTooltips();
        buildGamesList(filteredData.filter(function(i) {
            return i.genres.map(function(j) { return j.id; }).includes(genreFilter);
        }));
    }
};

const buildMainScreen = (data) => {
    var viewMode = sessionStorage.getItem('viewMode');
    if (!viewMode) {
        viewMode = 'grid';
        sessionStorage.setItem('viewMode', 'grid');
    }
    $("#filter_container").removeClass('d-none');
    $("#listViewButton").addClass(`btn-${viewMode == 'list' ? '' : 'outline-'}secondary`);
    $("#gridViewButton").addClass(`btn-${viewMode == 'grid' ? '' : 'outline-'}secondary`);

    $.getJSON(`/api/genres`, function(result) {
        var sortedGenres = result.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
        });
        sessionStorage.setItem('sortedGenres', JSON.stringify(sortedGenres));
        sortedGenres.forEach(genre => {
            $("#filterGenre").append(`<option value="${genre.id}">${genre.name}</option>`);
        });
    });

    $("#filterGenre").on("change", () => {
        appyFilters(data);
    });

    $("#filterInputYear").on("input", () => {
        appyFilters(data);
    });

    $("#filterInputName").on("input", () => {
        appyFilters(data);
    });

    buildGamesList(data);
};

// eslint-disable-next-line no-unused-vars
const setView = (viewMode) => {
    sessionStorage.setItem('viewMode', viewMode);
    var sortedData = JSON.parse(sessionStorage.getItem('gamesList'));
    $('#listViewButton').removeClass($('#listViewButton').attr('class'));
    $('#listViewButton').addClass(`btn btn-${viewMode == 'list' ? '' : 'outline-'}secondary`);

    $('#gridViewButton').removeClass($('#gridViewButton').attr('class'));
    $('#gridViewButton').addClass(`btn btn-${viewMode == 'grid' ? '' : 'outline-'}secondary`);

    buildGamesList(sortedData);
    appyFilters(sortedData);
};

const buildGamesList = (data) => {
    var viewMode = sessionStorage.getItem('viewMode');
    if (!viewMode) {
        sessionStorage.setItem('viewMode', 'grid');
        viewMode = 'grid';
    }
    if (viewMode == 'grid') {
        buildGamesAsGrid(data);
    }
    else {
        buildGamesAsList(data);
    }
};

const buildGamesAsGrid = (data) => {
    $('#games_table').addClass('d-none');
    $('#games_grid').removeClass('d-none');

    const gamesList = document.getElementById('games_grid');

    gamesList.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
        const game = data[i];
        const wrapper = document.createElement('div');
        wrapper.classList.add("col");
        wrapper.innerHTML = `<div class="card shadow-sm">
              <img role="button" onclick="window.location.href='details.html?game=${game.id}'" src="/library/${game.path}/metadata/cover" class="img-fluid img-content mx-auto rounded m-1" alt="${game.name}">
              <div class="card-body py-3 px-2">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex w-75">
                    <a href="details.html?game=${game.id}" class="link-offset-2 link-offset-2-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover w-100">
                      <span class="small text-body-secondary d-inline-block text-truncate w-100 text-center" data-bs-toggle="tooltip" data-bs-title="${game.name}"><strong>${game.name}</strong></span>
                    </a>
                  </div>
                  <div class="btn-group d-flex w-25">
                    <a class="btn btn-sm btn-outline-secondary" href="/library/${game.path}/index.html">Play!</a>
                  </div>
                </div>
              </div>
            </div>`;
        gamesList.append(wrapper);
    }
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
};

const buildGamesAsList = (data) => {
    $('#games_grid').addClass('d-none');
    $('#games_table').removeClass('d-none');

    const sortedGenres = JSON.parse(sessionStorage.getItem('sortedGenres'));
    var genresMap = {};
    if (sortedGenres) {
        genresMap = new Map(sortedGenres.map((o) => [o.id, o.name]));
    }

    $('#games_table').DataTable({
        retrieve: true,
        searching: true,
        paging: false,
        order: [[0, 'asc']],
        data: data,
        columns: [
            {
                render: function(data, type, row) {
                    return `<a href="details.html?game=${row.id}" class="link-offset-2 link-offset-2-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover w-100">
                    <span class="text-body-secondary d-inline-block text-truncate w-100" data-bs-toggle="tooltip" data-bs-title="${row.name}"><strong>${row.name}</strong></span>
                    </a>`;
                },
                searchable: true
            },
            {
                data: 'year',
                className: 'dt-body-center'
            },
            {
                data: 'genres',
                render: function (data, type, row) {
                    return row.genres.map((o) => ('<span class="badge text-bg-secondary">' + genresMap.get(o.id) + '</span>')).sort((a, b) => {
                        if (a < b) {
                            return -1;
                        }
                    }).join(" ");
                },
                searchable: true
            },
            {
                render: function (data, type, row) {
                    return `<img role="button" onclick="window.location.href='details.html?game=${row.id}'" 
                    src="/library/${row.path}/metadata/cover" class="img-list-content mx-auto rounded m-1" alt="${row.name}">`;
                },
                orderable: false,
                className: 'dt-body-center'
            },
            {
                render: function (data, type, row) {
                    return `<a class="btn btn-sm btn-outline-secondary" href="/library/${row.path}/index.html">Play!</a>`;
                },
                orderable: false,
                className: 'dt-body-center'
            }
        ]
    });

    $("#filterInputName").on("input", event => {
        $('#games_table').dataTable().api().column(0).search(event.target.value).draw();
    });

    $("#filterInputYear").on("input", event => {
        $('#games_table').dataTable().api().column(1).search(event.target.value).draw();
    });

    $("#filterGenre").on("change", event => {
        var column = $('#games_table').dataTable().api().column(2);
        if (event.target.value == -1) {
            column.search('').draw();
        }
        else {
            column.search( $(event.target).find(':selected').text()).draw();
        }
    });
};
