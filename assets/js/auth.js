let userSignIn = false;
const CLIENT_ID = encodeURIComponent('311625677077-bsm1ji3mugd0m9nvmhee7es2gr08ere3.apps.googleusercontent.com');
const RESPONSE_TYPE = encodeURIComponent('id_token');
const REDIRECT_URL = encodeURIComponent(chrome.identity.getRedirectURL());

const STATE = encodeURIComponent('sdiyuieyciyegfv8iyqe');
const SCOPE = encodeURIComponent('openid');
const PROMPT = encodeURIComponent('consent');
function isUserSignedIn() {
    return userSignIn;
}
function createOauth2Uri() {
    let nonce = encodeURIComponent(Math.random().toString(30).substring(5, 19) + Math.random().toString(30).substring(5, 19))
    let url = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URL}&state=${STATE}&scope=${SCOPE}&prompt=${PROMPT}`
    // &nonce=${nonce}
    // `
    return url;
}
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // check if user is logged in on chrome
    if (request.message === 'check_status') {

        return sendSignInRequest(sendResponse);
   
    } 
    // {
    //     console.log('chre.lastError.message');

    // }
return true;

})

function sendSignInRequest(sendResponse) {
    chrome.identity.getProfileUserInfo((response) => {
        if (response) { //also check if empty
            if (chrome.runtime.lastError) {
                sendResponse({ 'error': false, 'message': 'there was an error in the response' });
                return;
            }

            sendResponse({ 'error': false, 'message': response.id });
            return true;
        } else {

            chrome.identity.launchWebAuthFlow({
                url: createOauth2Uri(),
                interactive: true
            }, function (redirect_url) {
                // console.log(redirect_url);
                if (chrome.runtime.lastError)
                    console.log(chrome.runtime.lastError.message);
                let split_url = redirect_url.split('/#');
                query = split_url.pop();

                let token = (new URLSearchParams(query)).get('id_token');

                let userInfo = parseJwt(token);
                if (userInfo.aud === CLIENT_ID) {
                    userSignIn = true;
                    sendResponse({ 'error': false, 'message': userInfo.sub });
                } else {
                    sendResponse({ 'error': true, 'message': 'bad request' });
                }
            });

        }

    });
    return;
}
