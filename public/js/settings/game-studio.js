/* global emulators */
const openGameStudio = () => {
    $('#bundleStudioForm').trigger("reset");
    $('#createBundleStepOneFile').removeClass('is-valid is-invalid');
    $('#radioExecutables').empty();
    $('#panelExecutables').addClass("d-none");
    const uploadModal = new bootstrap.Modal('#createBundleStepOneModal', {});
    uploadModal.show();
}

const enableToolTips = () => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

var zipFile;

const toggleEye = (button, eye) => {
    $(button).on('click', () => {
        var classes = $(eye)[0].classList;
        var open = classes.contains("bi-eye");
        if (open) {
            classes.remove("bi-eye");
            classes.add("bi-eye-slash");
        }
        else {
            classes.add("bi-eye");
            classes.remove("bi-eye-slash");
        }
    });
}

const setCollapsibleEvents = () => {
    toggleEye('#buttonEyeDosbox', '#eyeDosbox');
    toggleEye('#buttonEyeCpu', '#eyeCpu');
    toggleEye('#buttonEyeSdl', '#eyeSdl');
    toggleEye('#buttonEyeMixer', '#eyeMixer');
}

const configureModalNavigation = () => {
    $('#createBundleLoadButton').on('click', () => {
        var inputFile = $('#createBundleStepOneFile');
        inputFile.removeClass('is-valid is-invalid');
        if (inputFile.val() != '') {
            inputFile.addClass('is-valid');
            getExecutableFiles(inputFile[0].files);
        }
        else {
            inputFile.addClass('is-invalid');
        }
    });
}

const prepareGameStudio = () => {
    enableToolTips();
    setCollapsibleEvents();
    configureModalNavigation();
}

function getExecutableFiles(files) {
    if (files.length === 0) {
        return;
    }
    $("#createBundleLoadButton").addClass("d-none");
    $("#createBundleStepOneModalSpinner").removeClass("d-none");
    
    const file = files[0];
    const reader = new FileReader();
    reader.addEventListener("load", async() => {
        zipFile = new Uint8Array(reader.result);
        try {
            const executables = await getZipExecutables(zipFile);
            for (let i = 0; i < executables.length; i++) {
                const exec = executables[i];
                const wrapper = document.createElement('div');
                wrapper.innerHTML = [
                    '<div class="form-check">',
                    `   <input class="form-check-input" id="exec${i}" type="radio" name="executable" value="${exec}">`,
                    `   <label class="form-check-label" for="exec${i}">${exec}</label>`,
                    '</div>'
                ].join('');
                $('#radioExecutables').append(wrapper);
            }
            $('#exec0').attr('checked', 'checked');
            $("#createBundleLoadButton").removeClass("d-none");
            $("#createBundleStepOneModalSpinner").addClass("d-none");
            $('#panelExecutables').removeClass("d-none");
            $('#createBundleStepOneModalNext').prop("disabled", false);
        } catch (e) {
            appendAlert(`An error has occurred while reading the zip file: ${e}`);
            $("#createBundleLoadButton").removeClass("d-none");
            $("#createBundleStepOneModalSpinner").addClass("d-none");
            $('#createBundleStepOneModal').modal('hide');
            $('#panelExecutables').addClass("d-none");
        }
    });
    reader.readAsArrayBuffer(file);
}

function ensureNoRootFolder(entries) {
    var starts = entries.filter(str => str.filename.startsWith(entries[0].filename));
    if (entries.length == starts.length) {
        throw Error('Zip files should not contain a root directory');
    }
}

async function getZipExecutables(data) {
    const executables = [];
    // eslint-disable-next-line no-undef
    const zipReader = new zip.ZipReader(new zip.Uint8ArrayReader(data), {
        Workers: false,
    });
    try {
        const entries = await zipReader.getEntries();
        ensureNoRootFolder(entries);
        for (const entry of entries) {
            const filename = entry.filename;
            if (filename.toLocaleLowerCase().endsWith(".com") ||
                filename.toLocaleLowerCase().endsWith(".exe") ||
                filename.toLocaleLowerCase().endsWith(".bat")) {
                executables.push(filename);
            }
        }
        return executables;
    } finally {
        zipReader.close();
    }
}

function populateConfig(config) {
    var formValues = $("#bundleStudioForm").serializeArray().reduce(function(obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    // add checkboxes
    $("#bundleStudioForm input:checkbox").each(function() {
        formValues[this.name] = this.checked;
    });

    config.autoexec.options.script.value = formValues['executable'];
    config.cpu.options.core.value = formValues['core'];
    config.cpu.options.cputype.value = formValues['cputype'];
    config.cpu.options.cycles.value = formValues['cycles'];
    config.dosbox.options.machine.value = formValues['machine'];
    config.mixer.options.rate.value = parseInt(formValues['rate']);
    config.mixer.options.nosound.value = formValues['nosound'];
    config.output.options.autolock.value = formValues['autolock'];
}

async function createArchive() {
    $('#createBundleStepTwoModalSave').prop('disabled', true);
    $('#createBundleStepTwoModalSave').addClass('d-none');
    $('#createBundleStepTwoModalSaveContinue').prop('disabled', true);
    $('#createBundleStepTwoModalSaveContinue').addClass('d-none');
    $('#createBundleStepTwoModalBack').addClass('d-none');
    $('#createBundleStepTwoModalBack').prop('disabled', true);
    $('#createBundleStepTwoModalSpinner').removeClass('d-none');

    const dosBundle = await emulators.dosBundle();
    populateConfig(dosBundle.config);
    const blob = new Blob([zipFile]);
    const url = URL.createObjectURL(blob);
    dosBundle.extract(url);
    const archive = await dosBundle.toUint8Array(true);
    URL.revokeObjectURL(url);

    const bundleFile = new Blob([archive]);
    const bundleUrl = URL.createObjectURL(bundleFile);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = bundleUrl;
    a.download = 'bundle.jsdos';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(bundleUrl);

    $('#createBundleStepTwoModalSave').prop('disabled', false);
    $('#createBundleStepTwoModalSave').removeClass('d-none');
    $('#createBundleStepTwoModalSaveContinue').prop('disabled', false);
    $('#createBundleStepTwoModalSaveContinue').removeClass('d-none');
    $('#createBundleStepTwoModalBack').prop('disabled', false);
    $('#createBundleStepTwoModalBack').removeClass('d-none');
    $('#createBundleStepTwoModalSpinner').addClass('d-none');
}

async function createAndAdd() {
    $('#createBundleStepTwoModalSave').prop('disabled', true);
    $('#createBundleStepTwoModalSave').addClass('d-none');
    $('#createBundleStepTwoModalSaveContinue').prop('disabled', true);
    $('#createBundleStepTwoModalSaveContinue').addClass('d-none');
    $('#createBundleStepTwoModalBack').prop('disabled', true);
    $('#createBundleStepTwoModalBack').addClass('d-none');
    $('#createBundleStepTwoModalSpinner').removeClass('d-none');

    const dosBundle = await emulators.dosBundle();
    populateConfig(dosBundle.config);
    const blob = new Blob([zipFile]);
    const url = URL.createObjectURL(blob);
    dosBundle.extract(url);
    const archive = await dosBundle.toUint8Array(true);
    URL.revokeObjectURL(url);

    const bundleFile = new Blob([archive]);
    const file = new File([bundleFile], "bundle.jsdos", { type:"application/octet-stream", lastModified:new Date().getTime() });
    const container = new DataTransfer();
    container.items.add(file);

    $("#createFile")[0].files = container.files;

    $('#createBundleStepTwoModalSave').prop('disabled', false);
    $('#createBundleStepTwoModalSave').removeClass('d-none');
    $('#createBundleStepTwoModalSaveContinue').prop('disabled', false);
    $('#createBundleStepTwoModalSaveContinue').removeClass('d-none');
    $('#createBundleStepTwoModalBack').prop('disabled', false);
    $('#createBundleStepTwoModalBack').removeClass('d-none');
    $('#createBundleStepTwoModalSpinner').addClass('d-none');
    $("#createBundleStepTwoModal").modal("hide");
    openCreateModal(false);
}