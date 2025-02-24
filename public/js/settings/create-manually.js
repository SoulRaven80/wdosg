// eslint-disable-next-line no-unused-vars
const openCreateManuallyModal = () => {
    $('#createManuallyModal').trigger("reset");
    $('#createManuallyFile')[0].files = $('#createFile')[0].files;
    $('#createManuallyFile').removeClass('is-valid is-invalid');
    $('#createManuallyName').removeClass('is-valid is-invalid');

    $("#createManuallyCoverFile").fileinput('destroy');
    $("#createManuallyCoverFile").fileinput({
        showUpload: false,
        showRemove: false,
        initialPreviewAsData: true,
        initialPreviewConfig: [{ url: `/api/covers/delete/TMP` }],
        uploadUrl: `/api/covers/add`,
        overwriteInitial: true,
        append: true,
        uploadExtraData: {
            gameId: 'TMP',
            gamePath: 'TMP',
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
    $('#createModal').modal("hide");
    const uploadModal = new bootstrap.Modal('#createManuallyModal', {});

    // Setup collapsible eye icon
    $('#buttonEyeCreateManuallyCover').on('click', () => {
        var classes = $('#eyeCreateManuallyCover')[0].classList;
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

    // Cleanup unused cover
    document.getElementById('createManuallyModal').addEventListener('hidden.bs.modal', () => {
        $.ajax({
            type: "POST",
            url: "/api/covers/delete/TMP",
            processData: false,
            contentType: false,
        });
    });

    uploadModal.show();
};

// eslint-disable-next-line no-unused-vars
function prepareCreateManuallySave() {
    $('#createManuallyModalSave').on('click', () => {
        var validCreateFile = $('#createManuallyFile')[0].checkValidity();
        $('#createManuallyFile').removeClass('is-valid is-invalid')
            .addClass(validCreateFile ? 'is-valid' : 'is-invalid');
        var validCreateName = $('#createManuallyName')[0].checkValidity();
        $('#createManuallyName').removeClass('is-valid is-invalid')
            .addClass(validCreateName ? 'is-valid' : 'is-invalid');
        if (validCreateFile && validCreateName) {
            $('#createManuallyModalSave').addClass('d-none');
            $('#createManuallyModalSpinner').removeClass('d-none');
            $('#createManuallyModalClose').prop("disabled", true);

            $.ajax({
                type: "POST",
                url: "/api/gameEntry/create",
                data: new FormData( $('#createManuallyForm')[0] ),
                processData: false,
                contentType: false,
                success: () => {
                    appendInfo('Game created');
                },
                error: (error) => {
                    if (error.responseJSON && error.responseJSON.message) {
                        appendAlert(error.responseJSON.message);
                    }
                    else {
                        appendAlert(error.message);
                    }
                },
                complete: () => {
                    $('#createManuallyModal').modal('hide');
                    $('#createManuallyModalSave').removeClass('d-none');
                    $('#createManuallyModalSpinner').addClass('d-none');
                    $('#createManuallyModalClose').prop("disabled", false);
                }
            });
        }
    });
}

// eslint-disable-next-line no-unused-vars
function createManuallyDevelopersSelectizes() {
    $("#createManuallyDevelopers").selectize({
        plugins: ["remove_button"],
        create: true,
        persist: false, // check
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
function createManuallyPublishersSelectizes() {
    $("#createManuallyPublishers").selectize({
        plugins: ["remove_button"],
        create: true,
        persist: false, // check
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
function createManuallyGenresSelectizes(result) {
    $("#createManuallyGenres").selectize({
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
