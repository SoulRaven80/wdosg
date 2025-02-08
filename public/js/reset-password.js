const initValidation = () => {
// Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation');
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated')
        }, false);
    });
}

const initResetPasswordForm = () => {
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('email') && urlParams.has('token')) {
        $('#resetPasswordEmail').val(urlParams.get('email'));
        $('#resetPasswordEmailHidden').val(urlParams.get('email'));
        $('#resetPasswordToken').val(urlParams.get('token'));
    }
    else {
        appendAlert('Error on registration info');
        $('#resetPasswordDiv').addClass('d-none');
    }
}

$('#resetPasswordButton').on('click', event => {
    var validEmail = $('#resetPasswordEmail')[0].checkValidity();
    $('#resetPasswordEmail').removeClass('is-valid is-invalid')
        .addClass(validEmail ? 'is-valid' : 'is-invalid');
    
    var validPassword = $('#resetPasswordPassword')[0].checkValidity();
    $('#resetPasswordPassword').removeClass('is-valid is-invalid')
        .addClass(validPassword ? 'is-valid' : 'is-invalid');
    var validPassword2 = $('#resetPasswordPassword2')[0].checkValidity();
    $('#resetPasswordPassword2').removeClass('is-valid is-invalid')
        .addClass(validPassword2 ? 'is-valid' : 'is-invalid');

    var passMatches = false;
    if (validPassword2) {
        passMatches = ($('#resetPasswordPassword').val() === $('#resetPasswordPassword2').val());
        if (!passMatches) {
            $('#resetPasswordPassword2').removeClass('is-valid is-invalid').addClass('is-invalid');
            $('#resetPasswordPassword2').next().text('Passwords do not match');
        }
    }
    else {
        $('#resetPasswordPassword2').next().text('Please add a password confirmation');
    }
    if (validEmail && validPassword && validPassword2 && passMatches) {
        $.ajax({
            type: "POST",
            url: "/api/password/reset",
            data: $('#resetPasswordForm').serialize(),
            success: (result, statusMessage, response) => {
                window.location.replace('/login.html?info=Password%20updated');
            }
        });
    }
});