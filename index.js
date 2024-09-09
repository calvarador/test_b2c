const { v4: uuidv4 } = require('uuid'); 
const msal = require('@azure/msal-node');
const axios = require('axios');

const CLIENT_ID = process.env['CLIENT_ID'];
const CLIENT_SECRET  = process.env['CLIENT_SECRET'];

const msalConfig = {
    auth: {
        clientId: CLIENT_ID,
        authority: "https://login.microsoftonline.com/f8d78288-b8a0-4845-9d2c-2477bca7bac0",
        clientSecret: CLIENT_SECRET,
    }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);


async function getAccessToken() {
    const tokenRequest = {
        scopes: ["https://graph.microsoft.com/.default"],
    };

    try {
        const response = await cca.acquireTokenByClientCredential(tokenRequest);
        return response.accessToken;
    } catch (error) {
        console.error("Error obteniendo token de acceso:", error);
    }
}

async function createUser() {
    const token = await getAccessToken();
    const userEmail = 'calvarador17@gmail.com';

    const tenantDomain = 'testb2ccaar.onmicrosoft.com';

    const generatedGuid = uuidv4();
    const userPrincipalName = `${generatedGuid}@${tenantDomain}`;

    const userData = {
        accountEnabled: false,
        displayName: 'Cesar Augusto',
        mailNickname: 'calvarador17',
        userPrincipalName: userPrincipalName,
        identities: [
            {
                signInType: "emailAddress",
                issuer: tenantDomain,
                issuerAssignedId: userEmail
            }
        ],
        passwordProfile: {
            password: 'ContraseñaTemporal123!',
            forceChangePasswordNextSignIn: true
        }
    };

    try {
        const response = await axios.post('https://graph.microsoft.com/v1.0/users', userData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Usuario creado:', response.data);

        await sendPasswordResetLink(userEmail);
    } catch (error) {
        console.error('Error creando usuario:', error.response.data);
    }
}

async function sendPasswordResetLink(userEmail) {
    const passwordResetFlowUrl = `https://testb2ccaar.b2clogin.com/testb2ccaar.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1__reset_password_test&client_id=${CLIENT_ID}&nonce=defaultNonce&redirect_uri=https%3A%2F%2Fjwt.ms&scope=openid&response_type=id_token&prompt=login&login_hint=${encodeURIComponent(userEmail)}`;
    console.log(`Enlace de restablecimiento de contraseña enviado a ${userEmail}: ${passwordResetFlowUrl}`);
}

createUser();