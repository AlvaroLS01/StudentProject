# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Prerequisites

This project requires [Node.js](https://nodejs.org/) with `npm` and the Firebase CLI. Install the Firebase tools globally if you don't have them:

```bash
npm install -g firebase-tools
```

## Environment Variables

Copy the sample environment file and add your own values:

```bash
cp .env.example .env
# edit .env and set REACT_APP_SHEET_SECRET, EMAIL_USER and EMAIL_PASS
# define REACT_APP_PASSWORD_RESET_API and REACT_APP_CHANGE_PASSWORD_API if
# the Node server runs on a different URL
# set REACT_APP_EMAIL_API if /send-assignment-email is hosted elsewhere
# supply your Google Maps key in REACT_APP_GOOGLE_MAPS_API_KEY
# and the same key in node-server/.env as GOOGLE_MAPS_API_KEY
```

The root `.env.example` lists the variables for the React app. The Node server has
its own `.env-example` under `node-server/` where you should also define
`GOOGLE_MAPS_API_KEY` for server-side geocoding.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Google Sheets Sync

The app includes a custom hook `useSyncClassToSheet` that sends class data to a Google Apps Script when a class document is marked as `aceptada` in Firestore. The hook posts using `mode: no-cors` so the request works without extra CORS headers. Configure the webhook secret in `.env`:

```
REACT_APP_SHEET_SECRET=yourSecret
```

Deploy the script in `apps-script/Code.gs` as a web app and set the same secret and spreadsheet ID in the script properties. Import and use the hook with the union and assignment IDs of the class:

```jsx
import { useSyncClassToSheet } from './hooks/useSyncClassToSheet';

function Example() {
  useSyncClassToSheet('union123', 'assignment456');
  return null;
}
```

### Script properties

In the Apps Script editor open **File → Project properties → Script Properties** and add:

```
SECRET=yourSecret
SPREADSHEET_ID=yourSpreadsheetId
SHEET_NAME=SheetName    # optional
```

Use the same secret in `.env` and deploy the web app. When a class document transitions to `aceptada`, the hook will post its details to the script and a new row will be appended to the Google Sheet.

## Welcome Email

The welcome message is sent through the standalone server inside the `node-server` folder. After a user signs up, the React app sends a request to this server so the email is delivered automatically.

### Using `node-server`

1. Start the server:
   ```bash
   cd node-server
   npm install
   cp .env-example .env       # fill EMAIL_USER and EMAIL_PASS
   npm start
   ```
   By default it listens on port `3001`.

2. Once the Firebase user account has been created, call the `/send-email` endpoint:
   ```javascript
   await fetch('http://localhost:3001/send-email', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: user.email, name: user.displayName })
   });
   ```
The server uses Nodemailer with the credentials from `.env` to send the welcome email.

It also exposes endpoints for password resets:
`/request-password-reset` and `/reset-password`. The client URLs are configured
via `REACT_APP_PASSWORD_RESET_API` and `REACT_APP_CHANGE_PASSWORD_API` in `.env`.
There is a third endpoint `/send-assignment-email` used to avisar a profesores y alumnos cuando se forma una clase. Configure `REACT_APP_EMAIL_API` with its URL if necessary.

Adicionalmente el servidor permite escribir datos en Google Sheets mediante los
endpoints `/sheet/user` y `/sheet/class`. Debes indicar `SPREADSHEET_ID` y la
ruta al archivo de credenciales en `GOOGLE_SHEETS_CREDENTIALS` dentro de
`node-server/.env`.

## Running React with the Node server

To work locally with both the frontend and the `node-server` you can run each one in its own terminal:

1. **Start the API server**
   ```bash
   cd node-server
   npm start
   ```

2. **Start the React app** from the project root:
   ```bash
   npm start
   ```

The client reads the `REACT_APP_WELCOME_API` variable from `.env` (default `http://localhost:3001/send-email`) and sends a request after a user signs up. With CORS enabled on the server both applications work together without extra configuration.


