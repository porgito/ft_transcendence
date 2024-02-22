const getNav = async () => {
        return `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark" style="z-index: 1;">
            <div class="container-fluid">
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" >
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse d-lg-flex" id="navbarSupportedContent" style="z-index: 1;">
                    <a class="navbar-brand col-lg-3 me-0 pong-title" href="#">PONG</a>
                    <ul class="navbar-nav col-lg-6 justify-content-lg-center">
                        <li class="nav-item">
                            <a href="/home" class="nav__link nav-link active" data-link>Home</a>
                        </li>
                        <li class="nav-item">
                            <a href="/game" class="nav__link nav-link active" data-link>Game</a>
                        </li>
                        <li class="nav-item">
                            <a href="/tournament" class="nav__link nav-link active" data-link>Tournament</a>
                        </li>
                        <li class="nav-item">
                            <a href="/about" class="nav__link nav-link active" data-link>About</a>
                        </li>
                    </ul>
                    <ul class="navbar-nav col-lg-3 justify-content-lg-end">
                        <li class="nav-item dropdown">
                            <a class="dropdown-toggle nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            PP
                            </a>
                            <ul class="dropdown-menu" style>
                            <li><a href="/profile" class="nav__link dropdown-item" data-link>View my profile</a></li>
                            <li><a href="/settings" class="nav__link dropdown-item" data-link>Settings</a></li>
                            <li><a href="/logout" class="nav__link dropdown-item" data-link>Logout</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>    
    </nav>
        `;
};

const getSocial = async () => {
    return `
    <div class="modal fade" id="friendModal" tabindex="-1" aria-labelledby="friendModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="friendModalLabel">Modal title</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="friendModalBody">
                    ...
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
    <div id="friend-bar" class="friend-bar bg-dark">
        <h2>Social</h2>
            <div id="friend-list-container" class="container">
        <ul id="friend-list" class="friend-list"></ul>
        </div>
    </div>
    `;
};

const getChat = async () => {
    return `
    <div class="offcanvas offcanvas-start bg-dark text-light" data-bs-backdrop="false" id="offcanvasChat" style="top: 56px; z-index: 0;">
        <button class="btn btn-dark offcanvas-btn mt-2 position-absolute btn-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasChat">
            <span>Open</span><span>Close</span>
        </button>
        <div class="chat-header">
            <h1 class="active">Chat</h1>
        </div>
        <div class="chat-body">
            <div class="chat-message">
                <p>Message</p>
            </div>
        </div>
    </div>
    `;
};

export { getNav };
export { getSocial };
export { getChat };