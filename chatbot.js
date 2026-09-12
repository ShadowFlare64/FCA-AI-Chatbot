const systemPrompt = `
Pretend you are a pirate captain with a personality similar to Jack Sparrow.

Be witty, eccentric, clever, dramatic, and mischievous.
Use pirate slang and nautical metaphors naturally.
Keep answers useful and accurate.
Do not quote movie lines directly.
`;

document.addEventListener("DOMContentLoaded", function () {
    const chatArea = document.querySelector(".chatarea");
    const messageInput = document.querySelector(".newmessage");
    const messageForm = document.querySelector(".messageform");
    const sendButton = document.querySelector(".send");
    const clearButton = document.querySelector(".clear");
    const voiceButton = document.querySelector(".aivoice");
    const speakButton = document.querySelector(".speak");
    const deleteButton = document.querySelector(".delete");

    let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
    let aiVoiceEnabled = false;
    let recognition = null;

    function saveMessages() {
        localStorage.setItem("chatMessages", JSON.stringify(messages));
    }

    function addMessage(role, text, save = true) {
        const message = document.createElement("div");
        message.classList.add("message");
        message.classList.add(role === "user" ? "user-message" : "ai-message");

        const textArea = document.createElement("div");
        textArea.textContent = text;
        message.appendChild(textArea);

        if (role === "assistant") {
            const actions = document.createElement("div");
            actions.classList.add("message-actions");

            const bookmarkButton = document.createElement("button");
            bookmarkButton.textContent = "Bookmark";
            bookmarkButton.classList.add("bookmark-message");
            bookmarkButton.addEventListener("click", function () {
                bookmarkMessage(text);
            });

            actions.appendChild(bookmarkButton);
            message.appendChild(actions);
        }

        chatArea.appendChild(message);
        chatArea.scrollTop = chatArea.scrollHeight;

        if (save) {
            messages.push({ role: role, content: text });
            saveMessages();
        }
    }

    function loadMessages() {
        if (messages.length === 0) {
            addMessage("assistant", "Hello! How can I help you today?");
            return;
        }

        messages.forEach(function (message) {
            addMessage(message.role, message.content, false);
        });
    }

    function bookmarkMessage(text) {
        const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

        if (!bookmarks.includes(text)) {
            bookmarks.push(text);
            localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
            alert("Message bookmarked!");
        } else {
            alert("This message is already bookmarked.");
        }
    }

    function getApiKey() {
        let apiKey = sessionStorage.getItem("geminiApiKey");

        if (!apiKey) {
            apiKey = prompt("Enter your Gemini API key. It will only be stored for this browser session:");

            if (apiKey) {
                sessionStorage.setItem("geminiApiKey", apiKey.trim());
            }
        }

        return apiKey;
    }

    async function sendMessage() {
        const userText = messageInput.value.trim();

        if (userText === "") {
            return;
        }

        addMessage("user", userText);
        messageInput.value = "";

        const status = document.createElement("div");
        status.classList.add("status");
        status.textContent = "Open Chat AI is thinking...";
        chatArea.appendChild(status);

        sendButton.disabled = true;

        try {
            const apiKey = getApiKey();

            if (!apiKey) {
                throw new Error("No API key was entered.");
            }

            const geminiMessages = messages.slice(-20).map(function (message) {
                return {
                    role: message.role === "assistant" ? "model" : "user",
                    parts: [{ text: message.content }]
                };
            });

            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [
                            {
                                text: systemPrompt
                            }
                        ]
                    },

                    contents: geminiMessages,

                    generationConfig: {
                        temperature: 0.7
                    }
                })          
            });

            if (!response.ok) {
                const errorData = await response.json().catch(function () { return {}; });
                throw new Error(errorData.error?.message || "The Gemini request failed.");
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error("Gemini did not return a response.");
            }

            const aiText = data.candidates[0].content.parts
                .map(function (part) { return part.text || ""; })
                .join("")
                .trim();

            status.remove();
            addMessage("assistant", aiText);

            if (aiVoiceEnabled) {
                speakText(aiText);
            }
        } catch (error) {
            status.remove();
            addMessage("assistant", "Error: " + error.message);
        } finally {
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    function speakText(text) {
        if (!("speechSynthesis" in window)) {
            alert("Text-to-speech is not supported by this browser.");
            return;
        }

        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(speech);
    }

    function startMicrophone() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported by this browser.");
            return;
        }

        if (!recognition) {
            recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.addEventListener("result", function (event) {
                messageInput.value = event.results[0][0].transcript;
                messageInput.focus();
            });

            recognition.addEventListener("error", function () {
                alert("The microphone could not understand the message. Please try again.");
            });
        }

        recognition.start();
    }

    clearButton.addEventListener("click", function () {
        if (confirm("Clear the entire chat?")) {
            messages = [];
            localStorage.removeItem("chatMessages");
            chatArea.innerHTML = "";
            addMessage("assistant", "Ahoy! What can I help ye with today?");
        }
    });

    voiceButton.addEventListener("click", function () {
        aiVoiceEnabled = !aiVoiceEnabled;
        voiceButton.textContent = aiVoiceEnabled ? "AI Voice: On" : "AI Voice: Off";

        if (!aiVoiceEnabled && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    });

    speakButton.addEventListener("click", function () {
        startMicrophone();
    });

    deleteButton.addEventListener("click", function () {
        if (messages.length === 0) {
            return;
        }

        messages.pop();
        saveMessages();

        const displayedMessages = chatArea.querySelectorAll(".message");
        const lastMessage = displayedMessages[displayedMessages.length - 1];

        if (lastMessage) {
            lastMessage.remove();
        }
    });

    sendButton.addEventListener("click", function () {
        sendMessage();
    });

    messageForm.addEventListener("submit", function (event) {
        event.preventDefault();
        sendMessage();
    });

    loadMessages();
});
