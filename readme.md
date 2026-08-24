Hello Sir/ Ma'am,


**  Here is the .env file for the Client Side,


VITE_API_URL=http://localhost:3000/api



**  Here is the .env file for the Server Side,


NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/mini-hrms

JWT_SECRET=TopSecret
ACCESS_TOKEN_EXPIRES_IN=15m

SEED_ORGANIZATION_NAME=DM WebSoft
SEED_ADMIN_NAME=System Administrator
SEED_ADMIN_EMAIL=admin@gmail.com
SEED_ADMIN_PASSWORD=admin@123


Also before running the project run seed.js file using "npm run seed" command in the server side for the default login credential initialization.

default admin email : "admin@gmail.com"
default admin passwor : "admin@123"