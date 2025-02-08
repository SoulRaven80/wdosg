const openAttachModal = (gameId, gamePath, gameName) => {
    $("#attachmentsForm").trigger("reset");
    $('#attachmentsModalSave').removeClass('d-none');
    $('#attachmentsModalSpinner').addClass('d-none');
    $('#gameAttachments').removeClass('is-valid is-invalid');
    $("#gameAttachments").fileinput('destroy');
    $('#attachmentsModalClose').prop("disabled", false);
    $.getJSON(`/api/attachments?gameId=${gameId}`, function(attachments) {
        try {
            $("#attachmentsGameId").val(gameId);
            $("#attachmentsGamePath").val(gamePath);
            $("#attachmentGameName").text(gameName);
            var urls = [];
            var previews = [];

            for (let i = 0; i < attachments.length; i++) {
                const attachment = attachments[i];

                urls.push(`/library/${gamePath}/attachments/${attachment.name}`);
                previews.push({
                    caption: attachment.name,
                    filename: attachment.name,
                    type: fileTypes[attachment.name.substring(attachment.name.lastIndexOf('.') +1).toLowerCase()],
                    url: `/api/attachments/delete/${gameId}`,
                    key: attachment.name
                });
            }
            $("#gameAttachments").fileinput({
                showUpload: false,
                showRemove: false,
                initialPreviewAsData: true,
                initialPreviewConfig: previews,
                initialPreview: urls,
                overwriteInitial: false,
                append: true,
                uploadUrl: `/api/attachments/add`,
                initialPreviewDownloadUrl: `/library/${gamePath}/attachments/{filename}`,
                uploadExtraData: {
                    gameId: gameId,
                    gamePath: gamePath
                },
                allowedFileExtensions: Object.keys(fileTypes),
                previewZoomButtonClasses: {
                    toggleheader: 'd-none',
                    borderless: 'd-none'
                },
                showClose: false
            }).on('filepreupload', () => {
                $('#attachmentsModalClose').prop("disabled", true);
            }).on('fileuploaded', () => {
                $('#attachmentsModalClose').prop("disabled", false);
            });

            const editModal = new bootstrap.Modal('#attachmentsModal', {});
            editModal.show();
        } catch (error) {
            appendAlert(`An error has occurred while reading the game information: ${error}`);
        }
    }).fail(function(jqXHR, status, error) {
        appendAlert(`An error has occurred while getting the game information: ${error}`);
    });
};
