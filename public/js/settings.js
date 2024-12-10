function setGenresValues(elementId, prop) {
    var selectize = document.getElementById(elementId).selectize;
    if (typeof prop === "string") {
        selectize.setValue(selectize.search(prop).items[0]);
    }
    else if (prop.length > 0) {
        selectize.setValue(prop.map(function (i) { return i.id }));
    }
}

function setMultiValues(elementId, prop) {
    var selectize = document.getElementById(elementId).selectize;
    if (typeof prop === "string") {
        selectize.setValue(selectize.search(prop).items[0]);
    }
    else if (prop.length > 0) {
        let uniques = uniq(prop);
        uniques.forEach(function(i) {
            selectize.addOption(i);
        });
        selectize.setValue(uniques.map(function (i) { return i.id }));
    }
}

function setCreateMultiValues(elementId, prop) {
    var selectize = document.getElementById(elementId).selectize;
    if (typeof prop === "string") {
        selectize.setValue(selectize.search(prop).items[0]);
    }
    else if (prop.length > 0) {
        let uniques = uniq(prop.map(function (i) { 
            return i.company;
        }));
        uniques.forEach(function(i) {
            selectize.addOption(i);
        });
        selectize.setValue([...uniques.map(function (i) { 
            return i.id;
        })]);
    }
}

function uniq(array) {
    var unique = [];
    array.forEach(elem => {
        var found = unique.filter(i => {
            return i.id == elem.id;
        });
        if (found.length == 0) {
            unique.push(elem);
        }
    });
    return unique;
}
 
const afterLoadingPage = () => {
    // Load alert after update / create
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('action')) {
        if (urlParams.get('action') === 'updated') {
            // game was updated
            appendInfo('Game updated');
        }
        else if (urlParams.get('action') === 'created') {
            // game was created
            appendInfo('Game created');
        }
    }

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

    createManuallyDevelopersSelectizes();
    createManuallyPublishersSelectizes();

    createDevelopersSelectizes();
    createPublishersSelectizes();

    editDevelopersSelectizes();
    editPublishersSelectizes();

    $.getJSON(`/api/genres`, function(result) {
        createManuallyGenresSelectizes(result);
        createGenresSelectizes(result);
        editGenresSelectizes(result);
    });

    prepareCreateSave();
    prepareCreateManuallySave();
};
