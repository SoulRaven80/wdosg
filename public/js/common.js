const appendAlert = (message) => {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    const wrapper = document.createElement('div');
    $(wrapper).addClass("alert alert-danger d-flex align-items-center alert-dismissible fade show");
    $(wrapper).attr("role", "alert");
    wrapper.innerHTML = `<svg class="bi flex-shrink-0 me-2" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    alertPlaceholder.append(wrapper);
};

const appendInfo = (message) => {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    const wrapper = document.createElement('div');
    $(wrapper).addClass("alert alert-info d-flex align-items-center alert-dismissible fade show");
    $(wrapper).attr("role", "alert");
    wrapper.innerHTML = `<svg class="bi flex-shrink-0 me-2" role="img" aria-label="Info:"><use xlink:href="#info-fill"/></svg>
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    alertPlaceholder.append(wrapper);
};

// eslint-disable-next-line no-unused-vars
const initHeader = () => {
    setUserName();
    if (sessionStorage.getItem('isAdmin') === 'true') {
        $('#settingsDiv').removeClass('d-none');
    }
    includeHTMLPage('/change-password.html', () => {
        $("#changePasswordModalSave").on("click", confirmChangePassword);
    });
    if (document.location.pathname.startsWith('/library/')) {
        var divElem = document.createElement("div");
        divElem.setAttribute('id', 'alertPlaceholder');
        var iframeElem = document.getElementsByTagName('iframe')[0];
        iframeElem.parentNode.insertBefore(divElem, iframeElem);
    }
    if (sessionStorage.getItem('message')) {
        appendInfo(sessionStorage.getItem('message'));
        sessionStorage.setItem('message', '');
    }
    $("#openChangePasswordButton").on("click", openChangePassword);
    $("#logoutButton").on("click", logout);
};

const includeHTMLPage = function(file, cb) {
    var elmnt, xhttp;
    elmnt = document.createElement("div");

    if (file) {
        xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    elmnt.innerHTML = this.responseText;
                    document.body.appendChild(elmnt);
                    if (cb) cb();
                }
                if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
            }
        };
        xhttp.open("GET", file, true);
        xhttp.send();
        return;
    }
};

const setUserName = () => {
    $('#userName').text(sessionStorage.getItem('userName'));
};

const logout = () => {
    sessionStorage.setItem('userName', '');
    sessionStorage.setItem('email', '');
    sessionStorage.setItem('isAdmin', '');
    sessionStorage.setItem('gamesList', '');
    document.cookie = 'wdowsg-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.replace('/login.html');
};

const openChangePassword = () => {
    $('#changePasswordForm').trigger("reset");
    $('#currentPassword').removeClass('is-valid is-invalid');
    $('#newPassword').removeClass('is-valid is-invalid');
    $('#newPassword2').removeClass('is-valid is-invalid');
    $('#changePasswordEmail').val(sessionStorage.getItem('email'));
    const confirmDeleteModal = new bootstrap.Modal('#changePasswordModal', {});
    confirmDeleteModal.show();
};

const confirmChangePassword = () => {
    var validCurrentPassword = $('#currentPassword')[0].checkValidity();
    $('#currentPassword').removeClass('is-valid is-invalid')
        .addClass(validCurrentPassword ? 'is-valid' : 'is-invalid');

    var validNewPassword = $('#newPassword')[0].checkValidity();
    $('#newPassword').removeClass('is-valid is-invalid')
        .addClass(validNewPassword ? 'is-valid' : 'is-invalid');
    var validNewPassword2 = $('#newPassword2')[0].checkValidity();
    $('#newPassword2').removeClass('is-valid is-invalid')
        .addClass(validNewPassword2 ? 'is-valid' : 'is-invalid');

    var passMatches = false;
    if (validNewPassword2) {
        passMatches = ($('#newPassword').val() === $('#newPassword2').val());
        if (!passMatches) {
            $('#newPassword2').removeClass('is-valid is-invalid').addClass('is-invalid');
            $('#newPassword2').next().text('Passwords do not match');
        }
    }
    else {
        $('#newPassword2').next().text('Please confirm the new password');
    }
    if (validCurrentPassword && validNewPassword && passMatches) {
        $('#changePasswordModalSave').addClass('d-none');
        $('#changePasswordModalSpinner').removeClass('d-none');
        $.ajax({
            type: "POST",
            url: "/api/password/change",
            data: $('#changePasswordForm').serialize(), 
            success: () => {
                appendInfo('Password Updated');
            },
            error: (error) => {
                appendAlert(error.message);
            },
            complete: () => {
                $('#changePasswordModalSave').removeClass('d-none');
                $('#changePasswordModalSpinner').addClass('d-none');
                $('#changePasswordModal').modal('hide');
            }
        });
    }
};

// eslint-disable-next-line no-unused-vars
const fileTypes = {
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'pdf': 'pdf',
    'txt': 'text'
};

$.ajaxSetup({
    error: function(xhr, status, err) {
        if (xhr.status == 401) {
            window.location.replace('/login.html');
        }
        if (xhr.status == 500 || xhr.status == 404 || xhr.status == 422) {
            appendErrorToPlaceholder(xhr, err);
        }
    }
});

function appendErrorToPlaceholder(xhr, err) {
    if (xhr.responseJSON && xhr.responseJSON.message) {
        appendAlert(xhr.responseJSON.message);
    }
    else if (xhr.responseText) {
        appendAlert(xhr.responseText);
    }
    else {
        appendAlert(err);
    }
}