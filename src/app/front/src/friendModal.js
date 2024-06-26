import { addNavEventListeners } from "./index.js";
import { initPrivateGame } from "../views/Game.js";

let connectedPlayers = [];
let playersPlaying = [];
let friends = [];



async function getTicELO (userId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/get_elo/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch elo');
        }
        const data = await response.json();
        return data.elo;
    } catch (error) {
        console.error('Error fetching elo:', error);
        return [];
    }
}

async function getEmail(userId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }

    try {
        const responseEmail = await fetch(`https://${serverIP}/api/get_email/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });

        if (responseEmail.ok) {
            const userData = await responseEmail.json();
            const email = userData.email;
            document.getElementById('profile-email').innerText = email;
        } else {
            console.log('Failed to get email:', await responseEmail.text());
        }

    } catch (error) {
        console.log('Error:', error);
    }
}

async function getBio(userId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }

    try {
        const responseBio = await fetch(`https://${serverIP}/api/get_bio/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });

        if (responseBio.ok) {
            const userData = await responseBio.json();
            const bio = userData.bio;
            document.getElementById('profile-bio').innerText = bio;
        } else {
            console.log('Failed to get bio:', await responseBio.text());
        }

    } catch (error) {
        console.log('Error:', error);
    }
}

async function getProfilePic(userId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }

    try {
        const response = await fetch(`https://${serverIP}/api/get_profile_pic/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('profilePic').src = data.profil_pic;
        } else {
            console.log('Failed to get profile pic:', await response.text());
        }

    } catch (error) {
        console.log('Error:', error);
    }
}

export function addToPlayersPlaying(id) {
    if (!playersPlaying.includes(id)) {
        playersPlaying.push(id);
    }
}

export function removeFromPlayersPlaying(id) {
    const index = playersPlaying.indexOf(id);
    if (index !== -1) {
        playersPlaying.splice(index, 1);
    }
}

export function checkPlaying(userId, websocket) {
    if (isPlaying(userId))
        websocket.send(JSON.stringify({ action: "in_game"}));
}

function isPlaying(id) {
    return playersPlaying.includes(String(id));
}

export function removeDisconnectedPlayer(playerName) {
    connectedPlayers = connectedPlayers.filter(player => player.name !== playerName);
    const playerElementToRemove = document.querySelector(`.player-item[data-name="${playerName}"]`);
    if (playerElementToRemove) {
        playerElementToRemove.remove();
    }
}

function updateplayerModal(websocket) {
    const playerList = document.getElementById("player-list");

    if (!playerList || connectedPlayers.length === 0) {
        return;
    };

    const player = connectedPlayers[connectedPlayers.length - 1];

    const listItem = document.createElement("li");
    listItem.classList.add("player-item", "clickable");
    listItem.dataset.name = player.name;
    listItem.dataset.id = player.id;

    const statusIcon = document.createElement("div");
    if (player.online) {
        statusIcon.classList.add("player-status", "online");
    }
    listItem.appendChild(statusIcon);

    const playerName = document.createElement("p");
    playerName.textContent = player.name;
    playerName.classList.add("player-name");
    console.log("add to html", player.name);
    listItem.appendChild(playerName);
    playerList.appendChild(listItem);

    listItem.addEventListener('click', async () => {
        const playerName = listItem.dataset.name;
        const userId = listItem.dataset.id;
        const playerInfoContent = `
        <p>Name: ${playerName}</p><button id="addFriendBtn" data-user-id="${userId}" class="btn btn-primary">Add to friends</button>
        <button id="blockBtn" data-user-id="${userId}" data-bs-dismiss="modal" class="btn btn-danger">Block player</button>
        <a href="/profile" id="profileBtn" data-user-id="${userId}" data-bs-dismiss="modal" class="btn btn-info nav__link">Profile</a>`;
        document.getElementById('playerModalBody').innerHTML = playerInfoContent;
        const addFriendBtn = document.getElementById('addFriendBtn');
        const blockBtn = document.getElementById('blockBtn');
        addFriendBtn.addEventListener('click', async function() {

            if (friends.includes(parseInt(userId))) {
                alert("Already your friend");
            } else {
                console.log(friends);
                await sendFriendRequest(userId, websocket);
            }
        });
        blockBtn.addEventListener('click', async function() {
            await blockRequest(userId, playerName, websocket);
        });
        const profileBtn = document.getElementById('profileBtn');
        profileBtn.addEventListener('click', function() {
            setTimeout(() => {
                printProfile(userId);
            }, 50);
        });
        const playerModal = new bootstrap.Modal(document.getElementById('playerModal'));
        playerModal.show();
        addNavEventListeners();
    });
}

async function sendFriendRequest(id, websocket)
{
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/send_friend_request/${id}/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });
    
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    
        const data = await response.json();
    
        if (data.status === 'success') {
            const message = JSON.stringify({ action: 'friend_request', toUserId: id });
            websocket.send(message);
            alert('Friend request sent successfully!');
        } else {
            alert('Error: ' + data.message + ' status: ' + data.status);
            console.log(data);
        }
    
    } catch (error) {
        alert('Error sending friend request: ' + error.message);
    }
}

export async function updateConnectedPlayer(username, userId, online, websocket) {
    let playerIndex = connectedPlayers.findIndex(player => player.name === username);

    const data = await fetchBlockedList();
    const blockedList = data.blocked;
    for (let i = 0; i < blockedList.length; i++) {
        if (username === blockedList[i].username) {
            removeDisconnectedPlayer(username);
            return;
        }
    }
    if (playerIndex !== -1) {
        connectedPlayers[playerIndex].online = online;
    } else {
        connectedPlayers.push({ name: username, id: userId, online });
    }
    updateplayerModal(websocket);
    getFriends(websocket);

}

let currentInviterUserId = null;

function handlePrvBtnClick() {
    const prvBtn = document.getElementById('btn-start-private');
    const userId = localStorage.getItem("userId");
    initPrivateGame(userId, currentInviterUserId);
    prvBtn.removeEventListener('click', handlePrvBtnClick);
}

export async function showGameInvitationNotification(inviterUserId, websocket) {
    const userId = localStorage.getItem("userId");
    const inviterName = await fetchUsernameFromId(inviterUserId);
    console.log(inviterName);
    const message = `Do you want to join ${inviterName} for a 1vs1 ?`;
    showToastWithButtons(message, 
        'Yes !', 
        function() {
            const yesMessage = JSON.stringify({ action: 'accept_invite', userId: inviterUserId });
            websocket.send(yesMessage);
            currentInviterUserId = inviterUserId;
            closeToast();
            setTimeout(() => {
                const prvBtn = document.getElementById('btn-start-private');
                prvBtn.disabled = false;
                prvBtn.addEventListener('click', handlePrvBtnClick);
            }, 200);
        },
        'No...',
        function() {
            const noMessage = JSON.stringify({ action: 'refuse_invite', userId: inviterUserId });
            websocket.send(noMessage);
            closeToast();
        }
    );
}

function showToastWithButtons(message, acceptLabel, acceptCallback, refuseLabel, refuseCallback) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Notification</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
        <div class="toast-footer">
            <a href="/game" id="accept-game-button" class="nav__link btn btn-success active" data-link>${acceptLabel}</a>
            <button class="btn btn-danger" id="refuse-game-button">${refuseLabel}</button>
        </div>
    `;
    toastContainer.appendChild(toast);

    const acceptGameButton = toast.querySelector('#accept-game-button');
    acceptGameButton.addEventListener('click', acceptCallback);

    const refuseGameButton = toast.querySelector('#refuse-game-button');
    refuseGameButton.addEventListener('click', refuseCallback);

    const bootstrapToast = new bootstrap.Toast(toast);
    bootstrapToast.show();
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
    addNavEventListeners();
}

function closeToast() {
    const toastContainer = document.getElementById('toast-container');
    const toast = toastContainer.querySelector('.toast');
    const bootstrapToast = bootstrap.Toast.getInstance(toast);
    bootstrapToast.hide();
    toast.remove();
}

export async function showToast(message, websocket, username) {
    const data = await fetchBlockedList();
    const blockedList = data.blocked;
    for (let i = 0; i < blockedList.length; i++) {
        if (username === blockedList[i].username) {
            return;
        }
    }
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Notification</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    toastContainer.appendChild(toast);

    const bootstrapToast = new bootstrap.Toast(toast);
    bootstrapToast.show();
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
    updateFriendRequestsModal(websocket);
}

async function fetchFriendRequests() {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/friend_requests/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch friend requests');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        return [];
    }
}

export async function fetchUsernameFromId(userId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/get_username_from_id/${userId}/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch friend requests');
        }

        const data = await response.json();
        return data.username;
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        return [];
    }
}

async function fetchProfilePicFromId(userId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/get_profilepic_from_id/${userId}/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch friend requests');
        }

        const data = await response.json();
        return data.profilepic;
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        return [];
    }
}

async function fetchGamesPlayedFromId(userId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/get_games_played_from_id/${userId}/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch games played');
        }

        const data = await response.json();
        return data.gamesplayed;
    } catch (error) {
        console.error('Error fetching games played:', error);
        return [];
    }
}

async function respondFriendRequest(userId, bool, websocket)
{
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/respond_friend_request/${userId}/`, {
            method: 'POST',
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json',

            },
            body: JSON.stringify({ action: bool ? 'accept' : 'reject' })
        });

        if (response.ok) {
            const result = await response.json();
            if (bool) {
                const uid = userId;
                console.log(`Friend request accepted for user ${userId}`);
                const message = JSON.stringify({ action: 'update_friends', toUserId: uid });
                websocket.send(message);
            }
            updateFriendRequestsModal(websocket);
            getFriends(websocket);
        } else {
            console.error('Failed to handle friend request:', response.statusText);
        }
    } catch (error) {
        console.error('An error occurred while handling friend request:', error);
    }
}

export async function updateFriendRequestsModal(websocket) {
    const friendRequestsContainer = document.getElementById('friendRequestsModalBody');

    const friendRequests = await fetchFriendRequests();
    const data = await fetchBlockedList();
    const blockedList = data.blocked;
    friendRequestsContainer.innerHTML = '';

    if (friendRequests.length === 0) {
        friendRequestsContainer.innerHTML = '<p>No friend requests</p>';
    } else {
        const ul = document.createElement('ul');
        for (const request of friendRequests) {
            const username = await fetchUsernameFromId(request.from_user);
            let isBlocked = false;
            for (const blockedUser of blockedList) {
                if (username === blockedUser.username) {
                    isBlocked = true;
                    break;
                }
            }
            if (isBlocked) {
                continue;
            }
            const li = document.createElement('li');
            li.classList.add('friend-request');
            li.textContent = `${username} sent you a friend request`;
    
            const friendId = request.from_user.toString();
            const acceptButton = document.createElement('button');
            acceptButton.classList.add('btn', 'btn-success', 'btn-sm', 'tickcross');
            acceptButton.innerHTML = '<i class="fas fa-check"></i>';
            acceptButton.addEventListener('click', () => respondFriendRequest(friendId, true, websocket));
    
            const rejectButton = document.createElement('button');
            rejectButton.classList.add('btn', 'btn-danger', 'btn-sm', 'tickcross');
            rejectButton.innerHTML = '<i class="fas fa-times"></i>';
            rejectButton.addEventListener('click', () => respondFriendRequest(friendId, false, websocket));
    
            li.appendChild(acceptButton);
            li.appendChild(rejectButton);
            ul.appendChild(li);
        }
        friendRequestsContainer.appendChild(ul);
    }
}

export async function getMessageHistory(otherUserId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/get_message_history/${otherUserId}/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            const messages = data.messages;
            displayMessageHistory(messages);
        } else {
            console.error('Failed to fetch message history:', response.statusText);
        }
    } catch (error) {
        console.error('An error occurred while fetching message history:', error);
    }
}

function displayMessageHistory(messages) {
    messages.forEach(message => {
        displayMessage(message.content);
    });
}

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    const messageContainer = document.querySelector('.prv-chat-messages');
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

async function sendMessage(messageInput, friendId, websocket) {
    let message = messageInput.value.trim();
    const username = localStorage.getItem('username');  
    if (message !== '') {
        message = `${username}: ${message}`;
        const serverIP = window.location.hostname;
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Token not found');
            return;
        }
        try {
            const response = await fetch(`https://${serverIP}/api/send_message/${friendId}/`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Token ' + token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            if (response.ok) {
                console.log('Message sent successfully');
                const messageData = await response.json();
            } else {
                console.error('Failed to send message:', response.statusText);
            }
        } catch (error) {
            console.error('An error occurred while sending message:', error);
        }
        websocket.send(JSON.stringify({ action: 'send_message', message: message }));
        messageInput.value = '';
    }
}

let chatWindow = null;
let websocketC = null;

function startPrivateChat(friendId, friendName) {
    const username = localStorage.getItem('username');   
    if (chatWindow) {
        document.getElementById('player-bar').removeChild(chatWindow);
        chatWindow = null;
        websocketC.close();
    }
    chatWindow = document.createElement('div');
    chatWindow.classList.add('prv-chat-window');
    chatWindow.innerHTML = `
        <div class="prv-chat-header">
            <h4>Chat with ${friendName}</h4>
            <button class="close-btn btn btn-danger">Close</button>
        </div>
        <div class="prv-chat-messages">
        </div>
        <div class="input-group mb-3" style="position: absolute; bottom: 0; left: 0; width: calc(100% - 20px);">
            <input type="text" class="form-control" id="prvMessageInput" placeholder="Type your message...">
            <button class="btn btn-primary send-btn" type="button" id="prvMessageBtn">Send</button>
        </div>
    `;
    document.getElementById('player-bar').appendChild(chatWindow);
    getMessageHistory(friendId);
    const serverIP = window.location.hostname;
    const userId = localStorage.getItem('userId');
    websocketC = new WebSocket(`wss://${serverIP}/api/ws/prv/`);
    websocketC.onopen = function(event) {
        console.log('WebSocketC connection opened');
        const data = { action: 'join', user_id: userId, other_user_id: friendId,  };
        websocketC.send(JSON.stringify(data));
    };
    websocketC.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.action === "chat_message")
            displayMessage(data.message);
    };
    websocketC.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
    websocketC.onclose = function(event) {
        console.log('WebSocket connection closed');
    };
    const closeBtn = chatWindow.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        chatWindow.parentNode.removeChild(chatWindow);
        chatWindow = null;
        websocketC.close();
    });
    const sendMessageBtn = chatWindow.querySelector('#prvMessageBtn');
    const messageInput = chatWindow.querySelector('#prvMessageInput');
    sendMessageBtn.addEventListener('click', () => {
        sendMessage(messageInput, friendId, websocketC);
    });
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendMessage(messageInput, friendId, websocketC);
        }
    });
}

async function blockRequest(id, playerName, websocket)
{
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/block_user/${id}/`, {
            method: 'POST',
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json',
            }
        });
    
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.status === 'success') {
            alert('User blocked successfully!');
            if (chatWindow) {
                document.getElementById('player-bar').removeChild(chatWindow);
                chatWindow = null;
                websocketC.close();
            }
            await removeFriend(id, websocket);
            await respondFriendRequest(id, false, websocket);
            updateBlockedModal(websocket);
            updateConnectedPlayer(playerName, id, true, websocket);
            websocket.send(JSON.stringify({ action: "update_friends", toUserId: id}));
        } else {
            alert('Error: ' + data.message + ' status: ' + data.status);
            console.log(data);
        }
    
    } catch (error) {
        alert('Error with block request: ' + error.message);
    }
}

async function fetchBlockedList() {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/get_blocked/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch friend requests');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        return [];
    }
}

export async function updateBlockedModal(websocket) {
    const blockedContainer = document.getElementById('blockedModalBody');

    const data = await fetchBlockedList();
    const blockedList = data.blocked;

    blockedContainer.innerHTML = '';

    if (blockedList.length === 0) {
        blockedContainer.innerHTML = '<p>No blocked users</p>';
    } else {
        const ul = document.createElement('ul');
        blockedList.forEach(async (blocked) => {
            const li = document.createElement('li');
            li.classList.add('blocked-user');
            const username = blocked.username;
            li.textContent = `${username}`;
            const unblockButton = document.createElement('button');
            unblockButton.classList.add('btn', 'btn-danger', 'btn-sm');
            unblockButton.innerText = "Unblock";
            unblockButton.addEventListener('click', async () => removeBlockedUser(blocked.id, blocked.username, websocket));
            li.appendChild(unblockButton);
            ul.appendChild(li);
        });
        blockedContainer.appendChild(ul);
    }
}

async function removeBlockedUser(blockedId, blockedUsername, websocketp) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/remove_blocked/${blockedId}/`, {
            method: 'POST',
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            alert('Blocked user removed successfully');
            await updateBlockedModal(websocketp);
            await updateFriendRequestsModal(websocketp);
            websocketp.send(JSON.stringify({ action: "ping", to_user: blockedUsername }));
        } else {
            console.error('Failed to remove blocked user:', response.statusText);
        }
    } catch (error) {
        console.error('An error occurred while removing friend:', error);
    }
}

async function getPlayerStats(userId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/player_stats/${userId}/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return (data);
    } catch (error) {
        console.error('An error occurred while getting player stats:', error);
    }
}

async function getTicStats(userId) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/tic_stats/${userId}/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return (data);
    } catch (error) {
        console.error('An error occurred while getting player stats:', error);
    }
}

export async function printProfile(userId)
{
    const [
        username,
        data,
        tic,
        elo,
        ,
        ,
        ,
    ] = await Promise.all([
        fetchUsernameFromId(userId),
        getPlayerStats(userId),
        getTicStats(userId),
        getTicELO(userId),
        getProfilePic(userId),
        getBio(userId),
        getEmail(userId),
    ]);

    document.getElementById("profile-username").innerText = username;
    const totalMatches = data.total_matches;
    const wonMatches = data.won_matches;
    const lostMatches = data.lost_matches;
    const matches = data.matches;
    const totalTic = tic.total_matches;
    const wonTic = tic.won_matches;
    const drawTic = tic.draw_matches;
    const lostTic = tic.lost_matches;
    const ticMatches = tic.matches;
    const pongGamesPlayed = document.getElementById("pong-gamesPlayed");
    const pongGamesWon = document.getElementById("pong-gamesWon");
    const pongGamesLose = document.getElementById("pong-gamesLost");
    const pongHistory = document.getElementById("pong-history");
    const ticGamesPlayed = document.getElementById("tic-gamesPlayed");
    const ticGamesWon = document.getElementById("tic-gamesWon");
    const ticGamesDraw = document.getElementById("tic-gamesDraw");
    const ticGamesLose = document.getElementById("tic-gamesLost");
    const ticElo = document.getElementById("tic-elo");
    const ticHistory = document.getElementById("tic-history");
    pongGamesPlayed.innerText = totalMatches;
    pongGamesWon.innerText = wonMatches;
    pongGamesLose.innerText = lostMatches;
    ticGamesPlayed.innerText = totalTic;
    ticGamesWon.innerText = wonTic;
    ticGamesDraw.innerText = drawTic;
    ticGamesLose.innerText = lostTic;
    ticElo.innerText = elo;

    const matchPromises = matches.map(async (match) => {
        const opponent = await fetchUsernameFromId(match.opponent);
        const li = document.createElement('li');
        li.textContent = `${new Date(match.played_at).toLocaleDateString()}: ${username} ${match.player_score} - ${match.opponent_score} ${opponent}`;
        li.className = 'list-group-item';
        pongHistory.appendChild(li);
    });

    const ticMatchPromises = ticMatches.map(async (ticMatch) => {
        const opponent = await fetchUsernameFromId(ticMatch.opponent);
        const li = document.createElement('li');
        li.textContent = `${new Date(ticMatch.played_at).toLocaleDateString()}: ${username} - ${opponent}: ${ticMatch.match_status}`;
        li.className = 'list-group-item';
        ticHistory.appendChild(li);
    });

    await Promise.all([...matchPromises, ...ticMatchPromises]);
}

export async function getFriends(websocket) {
    const serverIP = window.location.hostname;
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/get_friends/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            const friendsList = data.friends;
            const friendsElement = document.getElementById('friend-list');
            friendsElement.innerHTML = "";
            friendsList.forEach(friend => {
                const friendElement = document.createElement('li');
                friendElement.classList.add("clickable");
                friendElement.dataset.id = friend.id;
                friendElement.dataset.name = friend.username;
                friends.push(friend.id);
                const statusIcon = document.createElement("div");
                statusIcon.setAttribute("id", `friend-${friend.id}`);
                statusIcon.classList.add("player-status");
                if (isPlaying(friend.id)) {
                    statusIcon.classList.add("in-game");
                } else if (isFriendOnline(friend.username)) {
                    statusIcon.classList.add("online");
                } else {
                    statusIcon.classList.add("offline");
                }
                friendElement.appendChild(statusIcon);
                const friendName = document.createElement("p");
                friendName.textContent = friend.username;
                friendName.classList.add("player-name");
                friendElement.appendChild(friendName);
                const chatButton = document.createElement('button');
                chatButton.textContent = 'Chat';
                chatButton.classList.add('chat-button', 'btn', 'btn-success', 'btn-sm');
                friendElement.appendChild(chatButton);
                chatButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const friendId = friend.id;
                    const friendName = friend.username;
                    startPrivateChat(friendId, friendName);
                });
                friendsElement.appendChild(friendElement);
                friendElement.addEventListener('click', async () => {
                    const friendName = friend.username;
                    const friendId = friendElement.dataset.id;
                    const friendInfoContent = ` <p>Username: ${friendName}</p>
                                                <button id="removeFriendBtn" class="btn btn-danger" data-bs-dismiss="modal">Remove from friends</button>
                                                <button id="inviteGameBtn"  class="btn btn-success invite-button" data-bs-dismiss="modal">Invite to play 1v1</button>
                                                <a href="/profile" id="friendProfileBtn" data-user-id="${friendId}" data-bs-dismiss="modal" class="btn btn-info nav__link">Profile</a>`;
                    document.getElementById('friendModalBody').innerHTML = friendInfoContent;
                    const removeFriendBtn = document.getElementById('removeFriendBtn');
                    removeFriendBtn.addEventListener('click', async function() {
                        await removeFriend(friend.id, websocket);
                        const message = JSON.stringify({ action: 'update_friends', toUserId: friendId });
                        websocket.send(message);
                    });
                    const inviteGame = document.getElementById('inviteGameBtn');
                    inviteGame.addEventListener('click', async function() {
                        if (location.pathname === '/game') {
                            if (isPlaying(friendId)) {
                                alert(`${friendName} is already in a game`);
                            } else if (isFriendOnline(friendName)) {
                                const message = JSON.stringify({ action: 'invite_play', userId: userId, toUserId: friendId });
                                websocket.send(message);
                            } else {
                                alert(`${friendName} is not online`);
                            }
                        } else {
                            alert("YOU HAVE TO BE ON GAME PAGE TO INVITE SOMEONE");
                        }
                    });
                    const profileBtn = document.getElementById('friendProfileBtn');
                    profileBtn.addEventListener('click', function() {
                        setTimeout(() => {
                            printProfile(friendId);
                        }, 50);
                    });
                    const modal = new bootstrap.Modal(document.getElementById('friendModal'));
                    modal.show();
                    addNavEventListeners();
                });
            });
        } else {
            console.error('Failed to fetch friends:', response.statusText);
        }
    } catch (error) {
        console.error('An error occurred while fetching friends:', error);
    }
}

function isFriendOnline(username) {
    return connectedPlayers.some(player => player.name === username && player.online);
}

async function removeFriend(friendId, websocket) {
    const serverIP = window.location.hostname;
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token not found');
        return;
    }
    try {
        const response = await fetch(`https://${serverIP}/api/remove_friend/${friendId}/`, {
            method: 'POST',
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Friend removed successfully:', data);
            if (chatWindow) {
                document.getElementById('player-bar').removeChild(chatWindow);
                chatWindow = null;
                websocketC.close();
            }
            getFriends(websocket);
        } else {
            console.error('Failed to remove friend:', response.statusText);
        }
    } catch (error) {
        console.error('An error occurred while removing friend:', error);
    }
}