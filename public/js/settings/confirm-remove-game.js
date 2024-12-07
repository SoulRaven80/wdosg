const confirmDeleteGame = () => {
    var gameId = $("#idToDelete").val();
    $("#idToDelete").val("");
    $.ajax({
        url: '/api/deleteGame',
        data: { gameId : gameId },
        type: 'DELETE',
        success: function(result) {
            $('#confirmDeleteModal').modal("hide");
            $("#gamesListLink").trigger("click");
            appendInfo('Game removed');
        }
    });
}

const openDeleteGameConfirmation = (gameId) => {
    $("#idToDelete").val(gameId);
    $("#confirmDeleteButton").attr("onclick","confirmDeleteGame()");
    const confirmDeleteModal = new bootstrap.Modal('#confirmDeleteModal', {});
    confirmDeleteModal.show();
}
