$(document).ready(function() {
    $.getJSON("/api/games", function(data) {
        try {
            if (data.length == 0) {
                appendInfo("Empty games library. Please upload games under Settings");
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

const appyFilters = (nameFilter, genreFilter, data) => {
    // build list filtered by name
    var filteredData = data;
    hideTooltips();
    filteredData = data.filter(function(i) {
        return i.name.toLowerCase().includes(nameFilter.toLowerCase());
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
    $("#main_container").prepend(`<div class="row py-3">
          <div class="col-6">
            <input class="form-control" type="text" placeholder="Filter by name" aria-label="Game name filter" id="filterInputText">
          </div>
          <div class="col-6">
            <select class="form-select" aria-label="Genre filter" id="filterGenre"><option value="-1" selected>Filter by genre</option></select>
          </div>
        </div>`);

    $.getJSON(`/api/genres`, function(result) {
        var sortedGenres = result.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
        });

        sortedGenres.forEach(genre => {
            $("#filterGenre").append(`<option value="${genre.id}">${genre.name}</option>`);
        });
    });
    
    $("#filterGenre").on("change", event => {
        appyFilters($("#filterInputText").val(), event.target.value, data);
    });

    $("#filterInputText").on("input", event => {
        appyFilters(event.target.value, $("#filterGenre :selected").val(), data);
    });
    buildGamesList(data);
};


const buildGamesList = (data) => {
    const gamesList = document.getElementById('games_list');
    gamesList.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
        const game = data[i];
        const wrapper = document.createElement('div');
        wrapper.classList.add("col");
        wrapper.innerHTML = [
            '<div class="card shadow-sm">',
            `  <img src="${game.img ? game.img : '/img/image-not-found.png'}" class="img-fluid img-content mx-auto rounded m-1" alt="${game.name}">`,
            '  <div class="card-body">',
            '    <div class="d-flex justify-content-between align-items-center">',
            '      <div class="d-flex w-75">',
            `        <a href="details.html?game=${game.id}" class="link-offset-2 link-offset-2-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover w-100">`,
            `          <span class="small text-body-secondary d-inline-block text-truncate w-100" data-bs-toggle="tooltip" data-bs-title="${game.name}"><strong>${game.name}</strong></span>`,
            '        </a>',
            '      </div>',
            '      <div class="btn-group d-flex w-25">',
            `        <a class="btn btn-sm btn-outline-secondary" href="/library/${game.path}/index.html">Play!</a>`,
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
        gamesList.append(wrapper);
    }
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
};
