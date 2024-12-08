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

const initInfoMessages = () => {
    // Load alert after update / create
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        appendAlert(urlParams.get('error'));
    }
}

$('#loginButton').on('click', event => {
    var validEmail = $('#loginEmail')[0].checkValidity();
    $('#loginEmail').removeClass('is-valid is-invalid')
        .addClass(validEmail ? 'is-valid' : 'is-invalid');
    var validPassword = $('#loginPassword')[0].checkValidity();
    $('#loginPassword').removeClass('is-valid is-invalid')
        .addClass(validPassword ? 'is-valid' : 'is-invalid');
    if (validEmail && validPassword) {
        $.ajax({
            type: "POST",
            url: "/api/login",
            data: $('#loginForm').serialize(), 
            success: (result, statusMessage, response) => {
                document.cookie = `auth-token=${response.responseJSON.data.token}; Path=/;`;
                sessionStorage.setItem('userName', response.responseJSON.data.username);
                sessionStorage.setItem('email', response.responseJSON.data.email);
                sessionStorage.setItem('isAdmin', response.responseJSON.data.isAdmin);
                window.location.replace('/home');
            },
            error: (error) => {
                appendAlert(error.responseJSON.message);
            }
        });
    }
});