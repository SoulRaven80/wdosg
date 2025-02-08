const openEditModal = (gameId) => {
    $.getJSON(`/api/games/find?gameId=${gameId}`, function(game) {
        try {
            $("#editId").val(game.id);
            $("#editIgdbId").val(game.igdb_id);
            $("#editName").val(game.name);
            $("#editImageUrl").val(game.img);
            $("#editDescription").text(game.description);

            setMultiValues('editDevelopers', game.developers);
            setMultiValues('editPublishers', game.publishers);
            setGenresValues('editGenres', game.genres);

            $("#editYear").val(game.year);
            $("#editTrailerUrl").val(game.trailer);
            const editModal = new bootstrap.Modal('#editModal', {});
            editModal.show();
        } catch (error) {
            appendAlert(`An error has occurred while reading the game information: ${error}`);
        }
    }).fail(function(jqXHR, status, error) {
        appendAlert('An error has occurred while getting the game information');
    });
};

function editDevelopersSelectizes() {
    $("#editDevelopers").selectize({
        plugins: ["remove_button"],
        create: true,
        persist: false,
        placeholder: 'Please select developers',
        closeAfterSelect: true,
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        sortField: 'name',
        load: function (query, callback) {
            if (!query.length) return callback();
            $.ajax({
                url: `/api/companies/search?name=${encodeURIComponent(query)}`,
                type: 'GET',
                dataType: 'json',
                error: function () {
                    callback();
                },
                success: function (res) {
                    callback(res);
                }
            });
        }
    });
}

function editPublishersSelectizes() {
    $("#editPublishers").selectize({
        plugins: ["remove_button"],
        create: true,
        persist: false,
        placeholder: 'Please select publishers',
        closeAfterSelect: true,
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        sortField: 'name',
        load: function (query, callback) {
            if (!query.length) return callback();
            $.ajax({
                url: `/api/companies/search?name=${encodeURIComponent(query)}`,
                type: 'GET',
                dataType: 'json',
                error: function () {
                    callback();
                },
                success: function (res) {
                    callback(res);
                }
            });
        }
    });
}

function editGenresSelectizes(result) {
    $("#editGenres").selectize({
        plugins: ["remove_button"],
        create: true,
        persist: false,
        placeholder: 'Please select genres',
        closeAfterSelect: true,
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        sortField: 'name',
        options: result
    });
}