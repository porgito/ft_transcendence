

import Dashboard from "./views/Dashboard.js";
import landing from "./views/landing.js";
import login from "./views/login.js";
import signup from "./views/signup.js";
import NotFound from "./views/NotFound.js";
import about from "./views/about.js";

const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const getParams = match => {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);

    return Object.fromEntries(keys.map((key, i) => {
        return [key, values[i]];
    }));
};

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const routes = [
        { path: "/", view: landing },
        { path: "/login", view: login },
        { path: "/signup", view: signup },
        { path: "/dashboard", view: Dashboard },
        { path: "/about", view: about}
    ];

    // Test each route for potential match
    const potentialMatches = routes.map(route => {
        return {
            route: route,
            result: location.pathname.match(pathToRegex(route.path))
        };
    });
    console.log(potentialMatches);
    let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);

    if (!match) {
        match = {
            route: { path: location.pathname, view: NotFound },
            result: [location.pathname]
        };
    }

    console.log(match);
    console.log(location.pathname);
    const view = new match.route.view(getParams(match));

    document.querySelector("#app").innerHTML = await view.getHtml();
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });

    router();
});