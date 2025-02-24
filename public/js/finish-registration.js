// eslint-disable-next-line no-unused-vars
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
            form.classList.add('was-validated');
        }, false);
    });
};

// eslint-disable-next-line no-unused-vars
const initFinishRegistrationForm = () => {
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('email') && urlParams.has('token')) {
        $('#finishRegistrationEmail').val(urlParams.get('email'));
        $('#finishRegistrationEmailHidden').val(urlParams.get('email'));
        $('#finishRegistrationToken').val(urlParams.get('token'));
    }
    else {
        appendAlert('Error on registration info');
        $('#finishRegistrationDiv').addClass('d-none');
    }
};

$('#finishRegistrationButton').on('click', () => {
    var validUsername = $('#finishRegistrationUsername')[0].checkValidity();
    $('#finishRegistrationUsername').removeClass('is-valid is-invalid')
        .addClass(validUsername ? 'is-valid' : 'is-invalid');
    
    var validPassword = $('#finishRegistrationPassword')[0].checkValidity();
    $('#finishRegistrationPassword').removeClass('is-valid is-invalid')
        .addClass(validPassword ? 'is-valid' : 'is-invalid');
    var validPassword2 = $('#finishRegistrationPassword2')[0].checkValidity();
    $('#finishRegistrationPassword2').removeClass('is-valid is-invalid')
        .addClass(validPassword2 ? 'is-valid' : 'is-invalid');

    var passMatches = false;
    if (validPassword2) {
        passMatches = ($('#finishRegistrationPassword').val() === $('#finishRegistrationPassword2').val());
        if (!passMatches) {
            $('#finishRegistrationPassword2').removeClass('is-valid is-invalid').addClass('is-invalid');
            $('#finishRegistrationPassword2').next().text('Passwords do not match');
        }
    }
    else {
        $('#finishRegistrationPassword2').next().text('Please add a password confirmation');
    }
    if (validUsername && validPassword && validPassword2 && passMatches) {
        $.ajax({
            type: "POST",
            url: "/api/users/confirmRegistration",
            data: $('#finishRegistrationForm').serialize(),
            success: (result, statusMessage, response) => {
                document.cookie = `wdowsg-auth-token=${response.responseJSON.data.token}; Path=/;`;
                sessionStorage.setItem('userName', response.responseJSON.data.username);
                sessionStorage.setItem('email', response.responseJSON.data.email);
                sessionStorage.setItem('isAdmin', response.responseJSON.data.isAdmin);
                sessionStorage.setItem('message', response.responseJSON.message);
                window.location.replace('/home');
            }
        });
    }
});