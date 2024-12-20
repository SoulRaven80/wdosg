$(document).ready(function() {
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('game')) {
        $.getJSON("/api/game?gameId=" + urlParams.get('game'), function(game) {
            try {
                $("#title").text(game.name);
                $("#description").html((game.description ? game.description : "-"));
                $("#image").attr('src', (game.img ? game.img : '/img/image-not-found.png'));
                $("#image").attr('alt', game.name);
                if (game.trailer.includes("youtube")) {
                    $("#video").attr('src', game.trailer);
                    $("#video").removeClass("d-none");
                }
                else {
                    $("#screenshot").attr('src', (game.trailer ? game.trailer : '/img/image-not-found.png'));
                    $("#screenshot").removeClass("d-none");
                }
                arrayToText(game.developers, "#developers");
                arrayToText(game.publishers, "#publishers");
                arrayToText(game.genres, "#genres");
                $("#year").text(game.year);
                $("#play_button").attr('href', '/library/' + game.path);
            }
            catch (error) {
                appendAlert(`An error has occurred while reading the game information: ${error}`);
            }
            $("#attachmentsDetailFile").fileinput('destroy');
            $.getJSON(`/api/attachments?gameId=${urlParams.get('game')}`, function(attachments) {
                var urls = [];
                var previews = [];
                for (let i = 0; i < attachments.length; i++) {
                    const attachment = attachments[i];
                    urls.push(`/library/${game.path}/attachments/${attachment.name}`);
                    previews.push({
                        caption: attachment.name,
                        filename: attachment.name,
                        type: fileTypes[attachment.name.substring(attachment.name.lastIndexOf('.') +1).toLowerCase()]
                    });
                }
                $("#attachmentsDetailFile").fileinput({
                    showUpload: false,
                    showRemove: false,
                    initialPreviewAsData: true,
                    initialPreviewConfig: previews,
                    initialPreview: urls,
                    initialPreviewDownloadUrl: `/library/${game.path}/attachments/{filename}`,
                    allowedFileExtensions: Object.keys(fileTypes),
                    previewZoomButtonClasses: {
                        toggleheader: 'd-none',
                        borderless: 'd-none'
                    },
                    showClose: false,
                    mainClass: 'd-none',
                    previewZoomButtonClasses: {
                        toggleheader: 'd-none',
                        borderless: 'd-none'
                    }
                });
                if (attachments.length > 0) {
                    $('#attachmentsDetailSection').removeClass('d-none');
                }
            }).fail(function(jqXHR, status, error) {
                appendAlert(`An error has occurred while getting the game attachments: ${error}`);
            });
        }).fail(function(jqXHR, status, error) {
            appendAlert(`An error has occurred while getting the game information: ${error}`);
        });
    }
    else {
        appendAlert('Cannot find the game information');
    }
});

function arrayToText(prop, elementId) {
    if (typeof prop === "string") {
        $(elementId).text(prop);
    }
    else {
        var text = '';
        if (prop.length == 0) {
            text = '-';
        }
        else {
            for (let i = 0; i < prop.length; i++) {
                text += `${prop[i].name}<br>`;
            }
        }
        $(elementId).html(text);
    }
}