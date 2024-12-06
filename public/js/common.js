const appendAlert = (message) => {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    const wrapper = document.createElement('div');
    $(wrapper).addClass("alert alert-danger d-flex align-items-center alert-dismissible fade show");
    $(wrapper).attr("role", "alert");
    wrapper.innerHTML = [
        '   <svg class="bi flex-shrink-0 me-2" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>',
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
    ].join('');
    alertPlaceholder.append(wrapper);
};

const appendInfo = (message) => {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    const wrapper = document.createElement('div');
    $(wrapper).addClass("alert alert-info d-flex align-items-center alert-dismissible fade show");
    $(wrapper).attr("role", "alert");
    wrapper.innerHTML = [
        '   <svg class="bi flex-shrink-0 me-2" role="img" aria-label="Info:"><use xlink:href="#info-fill"/></svg>',
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
    ].join('');
    alertPlaceholder.append(wrapper);
};

const initHeader = () => {
    setUserName();
    if (sessionStorage.getItem('isAdmin')) {
        $('#settingsDiv').removeClass('d-none');
    }
}

const setUserName = () => {
    $('#userName').text(sessionStorage.getItem('userName'));
}

const logout = () => {
    sessionStorage.setItem('userName', '');
    document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.replace('/login.html');
}

// Redirect all 401 ajax call responses into login page
$.ajaxSetup({
    error: function(xhr, status, err) {
        if (xhr.status == 401) {
            window.location.replace('/login.html');
        }
    }
});