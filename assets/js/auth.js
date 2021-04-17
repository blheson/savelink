let userSignIn = false;
const CLIENT_ID = encodeURIComponent('311625677077-bsm1ji3mugd0m9nvmhee7es2gr08ere3.apps.googleusercontent.com');
const RESPONSE_TYPE = encodeURIComponent('id_token');
const REDIRECT_URL = encodeURIComponent(chrome.identity.getRedirectURL());

const STATE = encodeURIComponent('sdiyuieyciyegfv8iyqe');
const SCOPE = encodeURIComponent('openid');
const PROMPT = encodeURIComponent('consent');
const auth = {
    isUserSignedIn: () => {
        return userSignIn;
    },
    createOauth2Uri: () => {
        let url = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URL}&state=${STATE}&scope=${SCOPE}&prompt=${PROMPT}`
        // &nonce=${nonce}
        // `
        return url;
    },
    parseUrl: function (url) {
        let split_url = url.split('/#');
        query = split_url.pop();

        let token = (new URLSearchParams(query)).get('id_token');
        return this.parseJwt(token);
    }
    ,
    parseJwt: (token) => {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    },
    sendSignInRequest: (sendResponse) => {
        chrome.storage.sync.get('user', function (result) {
            if (result.user != undefined) {
                sendResponse({ 'error': false, 'message': result.user })

                return true;
            } else {


                chrome.identity.getProfileUserInfo((response) => {
                    if (response.id.length > 1) { //also check if empty
                        if (chrome.runtime.lastError) {
                            sendResponse({ 'error': true, 'message': 'there was an error in the response' });
                            return;
                        }
                        userSignIn = true;
                        sendResponse({ 'error': false, 'message': response.id });

                    } else {

                        chrome.identity.launchWebAuthFlow({
                            url: auth.createOauth2Uri(),
                            interactive: true
                        }, function (redirect_url) {

                            if (chrome.runtime.lastError) {
                                sendResponse({ 'error': true, 'message': chrome.runtime.lastError.message });
                                return true;
                            }

                            if (typeof redirect_url === 'undefined') {
                                sendResponse({ 'error': true, 'message': 'Sign in not successfull' });
                                return true;
                            }

                            let userInfo = auth.parseUrl(redirect_url)
 
                            if(typeof userInfo != 'object'){
                                sendResponse({ 'error': true, 'message': 'User info not available' });
                                return true;
                            }
                            chrome.storage.sync.set({ user: userInfo.sub });

                            if (userInfo.aud === CLIENT_ID || userInfo.iss == ('accounts.google.com' || 'https://accounts.google.com')) {
                                userSignIn = true;
                                sendResponse({ 'error': false, 'message': userInfo.sub });
                            } else {
                                sendResponse({ 'error': true, 'message': 'bad request' });
                            }
                            return;
                        });

                    }
                    return true;//not
                });
            }
        });

        return true;//not
    }
}
