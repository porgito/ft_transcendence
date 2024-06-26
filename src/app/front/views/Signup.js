import AbstractView from "./AbstractView.js";

const INVALID_USERNAME_MSG = "Invalid username, email or password. Please try again";
const DUPLICATE_USERNAME_MSG = "This username is already taken. Please try a different one.";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Signup");
        // Bind the registerUser method to the class instance
        this.registerUser = this.registerUser.bind(this);
        setTimeout(() => {
            this.initialize();
        }, 100);
    }

    async initialize() {

        const form = document.getElementById("signup-form");
        if (form) {
            form.addEventListener('submit', this.registerUser);
        } else {
            console.error("Form element not found");
        }
    }

    async getHtml() {
        return `
            <div class="background-section">
                <div class="container">
                    <div class="row">
                        <div class="col-md-6 offset-md-3">
                            <h2 class="text-center mt-5">Sign Up</h2>
                            <div class="card my-5">
                                <div class="card-body">
                                    <form id="signup-form">
                                        <div class="form-group">
                                            <label for="username">Username</label>
                                            <input type="text" class="form-control" name="username" placeholder="Enter username">
                                        </div>
                                        <div class="form-group">
                                            <label for="email">Email address</label>
                                            <input type="email" class="form-control" name="email" aria-describedby="emailHelp" placeholder="Enter email">
                                        </div>
                                        <div class="form-group">
                                            <label for="password">Password</label>
                                            <input type="password" class="form-control" name="password" placeholder="Password">
                                        </div>
                                        <div class="form-group">
                                            <label for="confirmPassword">Confirm Password</label>
                                            <input type="password" class="form-control" name="confirmPassword" placeholder="Confirm Password">
                                        </div>
                                        <button type="submit" class="btn btn-primary">Sign Up</button>
                                        <p class="mt-3">
                                            Already have an account? <a href="/login" class="nav__link" data-link>Login here</a>
                                        </p>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }



    async registerUser(event) {
        const serverIP = window.location.hostname;
        const form = event.target;
        console.log('Form Element:', form);

        const formData = new FormData(form);
        event.preventDefault();

        const searchParams = new URLSearchParams(formData);
        console.log(searchParams.get("username"));
        const password = searchParams.get("password");
        const confirmPassword = searchParams.get("confirmPassword");
        if (password != confirmPassword){
            alert("Passwords do not match !");
            return;
        }

        try {
            const response = await fetch(`https://${serverIP}/api/register/`, {
                method: 'POST',
                body: searchParams,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (!response.ok) {

                if (response.status === 400) {

                    alert(INVALID_USERNAME_MSG);
                } else if (response.status === 500) {

                    alert(DUPLICATE_USERNAME_MSG);
                } else {
                    alert('Registration failed!!!');
                }
            } else {

                alert('Registration successful!');
                window.location.href = '/login';
            }

        } catch (error) {
            console.log(error);
        }
    }
}