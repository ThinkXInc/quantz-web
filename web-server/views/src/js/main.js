// !!! This is slow. not used.
document.addEventListener('DOMContentLoaded', function() {
    // Assuming Browser.getLangFromUrl() is a valid method that you have elsewhere
    let lang = Browser.getLangFromUrl() || 'en';
    
    console.log(`Current language set to: ${lang}`);
    
    fetch(`/v1/${lang}/user`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    console.error(`Error fetching user: ${errData.code} ${errData.message}`);
                    
                    if (response.status === 401 || response.status === 404) {
                        console.log('Redirecting to login page...');
                        window.location.href = `/${lang}/signup`;
                    }
                    
                    return Promise.reject(errData);
                });
            }
            return response.json();
        })
        .then(data => {
            //const { user, locale } = data;
            //console.log('User data fetched:', user);
            //userPreferences.language = lang;
            //const localeInstance = new Locale(locale);
            //console.log('Locale instance created:', localeInstance);

            const { user, code, message } = data;
            console.log('User data fetched:', user);



            // if (window.location.pathname.includes('/materials')) {
            //let rootViewController = new RootViewController('MainContent', localeInstance, lang);
            //console.log('RootViewController initialized');
            //document.getElementById('SettingsModalView').style.display = 'block';  // DEBUG
        })
        .catch(error => {
            console.error('Unexpected error occurred when init:', error);
        });
});

