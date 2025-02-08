// eslint-disable-next-line no-unused-vars
const openInviteUserModal = () => {
    $('#inviteUserForm').trigger("reset");
    $('#inviteUserEmail').removeClass('is-valid is-invalid');
    const uploadModal = new bootstrap.Modal('#inviteUserModal', {});
    uploadModal.show();
};

// eslint-disable-next-line no-unused-vars
const confirmInviteUser = () => {
    var validEmail = $('#inviteUserEmail')[0].checkValidity();
    $('#inviteUserEmail').removeClass('is-valid is-invalid')
        .addClass(validEmail ? 'is-valid' : 'is-invalid');

    if (validEmail) {
        $('#inviteUserModal').modal('hide');
        var formData = $('#inviteUserForm').serialize();
        $.ajax({
            type: "POST",
            url: "/api/users/sendInvite",
            data: formData,
            success: () => {
                appendInfo('Invitation sent');
                // eslint-disable-next-line no-undef
                openUsersAdmin();
            }
        });
    }
};