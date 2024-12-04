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
 
$("#gamesListLink").on("click", function(e) {
    const contentDiv = document.getElementById('content_div');
    contentDiv.innerHTML = '';

    $.getJSON("/api/gamesShallowInfo", function(data) {
        try {
            if (data.length == 0) {
                contentDiv.append("Empty games library");
                return;
            }
            var wrapper = [
                '<table class="table">',
                '  <thead>',
                '    <tr>',
                '      <th scope="col">#</th>',
                '      <th scope="col">Name</th>',
                '      <th scope="col">Actions</th>',
                '    </tr>',
                '  </thead>',
                '  <tbody>'
            ].join('');
            var sortedData = data.sort((a, b) => {
                if (a.name < b.name) {
                  return -1;
                }
            });
            for (let i = 0; i < sortedData.length; i++) {
                const game = sortedData[i];
                wrapper += [
                    '<tr>',
                    `  <th scope="row">${i+1}</th>`,
                    `  <td>${game.name}</td>`,
                    '  <td>',
                    `    <button type="button" class="btn bi-pencil" aria-label="Edit" onclick="openEditModal('${game.id}')"></button>`,
                    `    <button type="button" class="btn bi-trash" aria-label="Delete" onclick="openDeleteConfirmation('${game.id}')"></button>`,
                    '  </td>',
                    '</tr>',
                ].join('');
            }
            wrapper += [
                '  </tbody>',
                '</table>'
            ].join('');
            contentDiv.innerHTML = wrapper;
        }
        catch (error) {
            appendAlert('An error has occurred while reading the games information');
        }
    }).fail(function(jqXHR, status, error) {
        appendAlert('An error has occurred while getting the game list information');
    });
});

const afterLoadingPage = () => {
    // Load alert after update / create
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('action')) {
        if (urlParams.get('action') === 'updated') {
            // game was updated
            appendInfo('Game updated');
        }
        else {
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

    $("#createManuallyForm").get(0).addEventListener('submit', event => {
        onCreateManuallySubmit();
    });

    $("#createForm").get(0).addEventListener('submit', event => {
        onCreateSubmit();
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
};
