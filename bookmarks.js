document.addEventListener("DOMContentLoaded", function () {
    const returnButton = document.querySelector(".return");
    const bookmarkList = document.querySelector(".bookmarklist");

    function loadBookmarks() {
        const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
        bookmarkList.innerHTML = "";

        if (bookmarks.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.classList.add("empty");
            emptyMessage.textContent = "No bookmarked messages yet.";
            bookmarkList.appendChild(emptyMessage);
            return;
        }

        bookmarks.forEach(function (text, index) {
            const bookmark = document.createElement("div");
            bookmark.classList.add("bookmark");

            const message = document.createElement("div");
            message.textContent = text;

            const removeButton = document.createElement("button");
            removeButton.classList.add("removebookmark");
            removeButton.textContent = "Remove Bookmark";
            removeButton.addEventListener("click", function () {
                removeBookmark(index);
            });

            bookmark.appendChild(message);
            bookmark.appendChild(removeButton);
            bookmarkList.appendChild(bookmark);
        });
    }

    function removeBookmark(index) {
        const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
        bookmarks.splice(index, 1);
        localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        loadBookmarks();
    }

    returnButton.addEventListener("click", function () {
        window.location.href = "chatbot.html";
    });

    loadBookmarks();
});
