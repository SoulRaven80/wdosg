const openCreateManuallyModal = () => {
    $('#createManuallyModal').trigger("reset");
    $('#createManuallyFile')[0].files = $('#createFile')[0].files;

    $('#createModal').modal("hide");
    const uploadModal = new bootstrap.Modal('#createManuallyModal', {});
    uploadModal.show();
}

function onCreateManuallySubmit() {
    $('#createManuallyModalSave').addClass('d-none');
    $('#createManuallyModalSpinner').removeClass('d-none');
    $('#createManuallyModalClose').prop("disabled", true);
}

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
                url: `/api/searchCompanies?search=${encodeURIComponent(query)}`,
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
                url: `/api/searchCompanies?search=${encodeURIComponent(query)}`,
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
