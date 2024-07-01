const GOOGLE_CLIENT_ID = '53794604964-782scvqhcdarhu3ujpihao5v3h9re683.apps.googleusercontent.com';
function handleCredentialResponse(response) {
   const user = parseJwt(response.credential);

   console.log("ID: " + user.sub);
   console.log('Full Name: ' + user.name);
   console.log('Given Name: ' + user.given_name);
   console.log('Family Name: ' + user.family_name);
   console.log("Image URL: " + user.picture);
   console.log("Email: " + user.email);

   //const googleOauthEvent = new CustomEvent('googleOauthLoggedIn', { detail: user });
   const googleOauthEvent = new CustomEvent('googleOauthLoggedIn', { detail: response.credential });
   window.dispatchEvent(googleOauthEvent);
}
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}
function googleOauthCallback(response) {
    // This function will be triggered after user successfully signs in
    console.log("Encoded JWT ID token: " + response.credential);

    // Decode the JWT token if necessary
    const user = parseJwt(response.credential);
    console.log("User ID: " + user.sub); // Google's user ID
    console.log("User Name: " + user.name);
    console.log("User Email: " + user.email);
    console.log("User Picture: " + user.picture);
    
    // Dispatch the event on the window or any other element
    const userEvent = new CustomEvent('googleOauthLoggedIn', { detail: user });
    window.dispatchEvent(userEvent);
}
function createGoogleSignInElements(lang) {
    // Create the container for the Google SignIn
    const googleSignInContainer = document.createElement('div');
    googleSignInContainer.id = 'g_id_onload';
    googleSignInContainer.setAttribute('data-client_id', GOOGLE_CLIENT_ID);
    googleSignInContainer.setAttribute('data-context', 'signin');
    googleSignInContainer.setAttribute('data-ux_mode', 'popup');
    googleSignInContainer.setAttribute('data-callback', 'handleCredentialResponse');
    googleSignInContainer.setAttribute('data-auto_prompt', 'false');

    // Create the button for Google SignIn
    const googleSignInButton = document.createElement('div');
    googleSignInButton.className = 'g_id_signin';
    googleSignInButton.setAttribute('data-type', 'standard');
    googleSignInButton.setAttribute('data-shape', 'rectangular');
    googleSignInButton.setAttribute('data-theme', 'outline');
    googleSignInButton.setAttribute('data-text', 'signup_with');
    googleSignInButton.setAttribute('data-size', 'large');
    googleSignInButton.setAttribute('data-locale', lang);
    googleSignInButton.setAttribute('data-logo_alignment', 'left');
    googleSignInButton.setAttribute('data-width', '300');

    document.body.appendChild(googleSignInContainer)
    return googleSignInButton;
}

