var zipBlob;
var dosboxConfig;
const openDosboxConfigModal = (gameId, gamePath) => {
    const workingModal = new bootstrap.Modal('#waitingModal', {});
    $('#waitingModalTitle').text('Retrieving game');
    workingModal.show();
    $.ajax({
        url: `/library/${gamePath}/bundle.jsdos`,
        type: 'GET',
        xhrFields: { responseType: 'blob' },
        success: async (result, statusMessage, response) => {
            try {
                zipBlob = result;
                dosboxConfig = await getZipDosboxConfig(result);
                const config = parseDosboxConfig(dosboxConfig);
                $("#dosboxConfigForm input[name='machine']").each(function() {
                    this.checked = (this.value == config.dosbox.machine);
                });
                $("#dosboxConfigForm input[name='core']").each(function() {
                    this.checked = (this.value == config.cpu.core);
                });
                $("#dosboxConfigForm input[name='cputype']").each(function() {
                    this.checked = (this.value == config.cpu.cputype);
                });
                $("#dosboxConfigForm input[name='cycles']").each(function() {
                    this.checked = (this.value == config.cpu.cycles);
                });
                $("#dosboxConfigForm input[name='autolock']").prop('checked', (config.sdl.autolock.toLowerCase() === 'true'));
                $("#dosboxConfigForm input[name='rate']").val(config.mixer.rate);
                $("#dosboxConfigForm input[name='nosound']").prop('checked', (config.mixer.nosound.toLowerCase() === 'true'));
                $("#dosboxConfigForm input[name='executable']").val(config.autoexec);
                $("#dosboxConfigForm input[name='gamePath']").val(gamePath);

                const uploadModal = new bootstrap.Modal('#dosboxConfigModal', {});
                uploadModal.show();
            } catch (error) {
                appendAlert(`An error has occurred while reading the game information: ${error}`);
            }
        },
        error: (error) => {
            appendAlert(`An error has occurred while reading the game information: ${error.responseText}`);
        },
        complete: (xhr, status) => {
            workingModal.hide();
        }
    });
}

async function getZipDosboxConfig(data) {
    const zipReader = new zip.ZipReader(new zip.BlobReader(data), { Workers: false });
    try {
        const entries = await zipReader.getEntries();
        const config = entries.find(e => e.filename === ".jsdos/dosbox.conf");
        return await config.getData(new zip.TextWriter(), { useWebWorkers: false });
    } finally {
        await zipReader.close();
    }
}

// commented some for now until more params gets supported
function parseDosboxConfig(data) {
    const config = {};
    config.sdl = getConfigSection(data, '[sdl]');
    config.dosbox = getConfigSection(data, '[dosbox]');
    config.cpu = getConfigSection(data, '[cpu]');
    config.mixer = getConfigSection(data, '[mixer]');
    // config.render = getConfigSection(data, '[render]');
    // config.midi = getConfigSection(data, '[midi]');
    config.sblaster = getConfigSection(data, '[sblaster]');
    // config.gus = getConfigSection(data, '[gus]');
    // config.speaker = getConfigSection(data, '[speaker]');
    // config.serial = getConfigSection(data, '[serial]');
    // config.dos = getConfigSection(data, '[dos]');
    // config.ipx = getConfigSection(data, '[ipx]');
    var execs = data.substring(data.indexOf('echo on\n\n')+9);
    config.autoexec = execs.substring(0, execs.indexOf('\n'));
    return config;
}

function getConfigSection(text, key) {
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => !line.trim().startsWith('#'));
    const filteredText = filteredLines.join('\n');
    const start = filteredText.indexOf(key);
    const end = filteredText.indexOf('[', start + 1);
    const sectionText = filteredText.substring(start, end).trim();
    const sectionLines = sectionText.split('\n').filter(line => line.includes('='));
    const ret = {};
    sectionLines.forEach(line => {
        const [key, value] = line.split('=').map(part => part.trim());
        ret[key] = value;
    });
    return ret;
}

async function saveDosboxConfig() {
    const dosBundle = await emulators.dosBundle();
    populateConfigFromForm(dosBundle.config);
    const url = URL.createObjectURL(zipBlob);
    dosBundle.extract(url);
    const archive = await dosBundle.toUint8Array(true);
    URL.revokeObjectURL(url);
    const bundleFile = new Blob([archive]);

    let formData = new FormData(); 
    formData.append("file", bundleFile);
    formData.append("gamePath", $("#dosboxConfigForm input[name='gamePath']").val());
    $.ajax({
        type: "POST",
        url: "/api/bundles/create",
        data: formData,
        processData: false,
        contentType: false,
        success: (result, statusMessage, response) => {
            appendInfo('Game updated successfully');
        },
        error: (error) => {
            if (error.responseJSON && error.responseJSON.message) {
                appendAlert(error.responseJSON.message);
            }
            else {
                appendAlert(error.message);
            }
        },
        complete: (xhr, status) => {
            $('#dosboxConfigModal').modal('hide');
        }
    });
}

function populateConfigFromForm(config) {
    var formValues = $("#dosboxConfigForm").serializeArray().reduce(function(obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    // add checkboxes
    $("#dosboxConfigForm input:checkbox").each(function() {
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