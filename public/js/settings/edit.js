/* global setMultiValues, setGenresValues */
// eslint-disable-next-line no-unused-vars
const openEditModal = (gameId) => {
    $.getJSON(`/api/games/find?gameId=${gameId}`, function(game) {
        try {
            $("#editId").val(game.id);
            $("#editIgdbId").val(game.igdb_id);
            $("#editName").val(game.name);
            $("#editCoverFile").fileinput('destroy');
            $("#editCoverFile").fileinput({
                showUpload: false,
                showRemove: false,
                initialPreviewAsData: true,
                initialPreviewConfig: [{ url: `/api/covers/delete/${game.path}` }],
                initialPreview: [ `/library/${game.path}/metadata/cover` ],
                uploadUrl: `/api/covers/add`,
                overwriteInitial: true,
                append: true,
                uploadExtraData: {
                    gameId: game.id,
                    gamePath: game.path
                },
                maxFileCount: 1,
                allowedFileTypes: [ 'image' ],
                allowedFileExtensions: ["jpg", "gif", "png", "jpeg"],
                previewZoomButtonClasses: {
                    toggleheader: 'd-none',
                    borderless: 'd-none'
                },
                showClose: false
            });
            $("#editDescription").text(game.description);

            setMultiValues('editDevelopers', game.developers);
            setMultiValues('editPublishers', game.publishers);
            setGenresValues('editGenres', game.genres);

            $("#editYear").val(game.year);
            $("#editTrailerUrl").val(game.trailer);
            const editModal = new bootstrap.Modal('#editModal', {});

            // Setup collapsible eye icon
            $('#buttonEyeEditCover').on('click', () => {
                var classes = $('#eyeEditCover')[0].classList;
                var open = classes.contains("bi-eye");
                if (open) {
                    classes.remove("bi-eye");
                    classes.add("bi-eye-slash");
                }
                else {
                    classes.add("bi-eye");
                    classes.remove("bi-eye-slash");
                }
            });

            editModal.show();
        } catch (error) {
            appendAlert(`An error has occurred while reading the game information: ${error}`);
        }
    }).fail(function(jqXHR, status, error) {
        appendAlert(`An error has occurred while getting the game information: ${error}`);
    });
};

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
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