const openAddUserModal = () => {
    $('#addUserForm').trigger("reset");
    $('#addUserEmail').removeClass('is-valid is-invalid');
    $('#addUsername').removeClass('is-valid is-invalid');
    $('#addUserPassword').removeClass('is-valid is-invalid');
    $('#addUserPassword2').removeClass('is-valid is-invalid');
    const uploadModal = new bootstrap.Modal('#addUserModal', {});
    uploadModal.show();
}

const confirmAddUser = () => {
    var validEmail = $('#addUserEmail')[0].checkValidity();
    $('#addUserEmail').removeClass('is-valid is-invalid')
        .addClass(validEmail ? 'is-valid' : 'is-invalid');

    var validUsername = $('#addUsername')[0].checkValidity();
    $('#addUsername').removeClass('is-valid is-invalid')
        .addClass(validUsername ? 'is-valid' : 'is-invalid');
    
    var validPassword = $('#addUserPassword')[0].checkValidity();
    $('#addUserPassword').removeClass('is-valid is-invalid')
        .addClass(validPassword ? 'is-valid' : 'is-invalid');
    var validPassword2 = $('#addUserPassword2')[0].checkValidity();
    $('#addUserPassword2').removeClass('is-valid is-invalid')
        .addClass(validPassword2 ? 'is-valid' : 'is-invalid');

    var passMatches = false;
    if (validPassword2) {
        passMatches = ($('#addUserPassword').val() === $('#addUserPassword2').val());
        if (!passMatches) {
            $('#addUserPassword2').removeClass('is-valid is-invalid').addClass('is-invalid');
            $('#addUserPassword2').next().text('Passwords do not match');
        }
    }
    else {
        $('#addUserPassword2').next().text('Please add a password confirmation');
    }
    if (validEmail && validPassword && validPassword && passMatches) {
        $('#addUserModal').modal('hide');
        $.ajax({
            type: "POST",
            url: "/api/addUser",
            data: $('#addUserForm').serialize(), 
            success: (result, statusMessage, response) => {
                appendInfo('User created');
            },
            error: (error) => {
                appendAlert(error.responseJSON.message);
            }
        });
    }
}