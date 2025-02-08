const confirmDeleteUser = () => {
    var userName = $("#idToDelete").val();
    $("#idToDelete").val("");
    $.ajax({
        url: `/api/users/delete`,
        data: {username: userName},
        type: 'DELETE',
        success: function(result) {
            $('#confirmDeleteModal').modal("hide");
            $("#usersAdminLink").trigger("click");
            appendInfo('User removed');
        },
        error: (error) => {
            appendAlert(error.message);
        }
    });
}

const openDeleteUserConfirmation = (username) => {
    $("#idToDelete").val(username);
    $("#confirmDeleteButton").attr("onclick","confirmDeleteUser()");
    const confirmDeleteModal = new bootstrap.Modal('#confirmDeleteModal', {});
    confirmDeleteModal.show();
}
