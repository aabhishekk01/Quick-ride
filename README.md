# Quick-Ride

A simple ride-sharing web application.

## Features

*   User registration and login.
*   Request a ride to a destination.
*   View available cars.

## Technologies Used

*   **Frontend:** HTML, CSS, JavaScript
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose

## Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/aabhishekk01/quick-ride.git
    cd quick-ride
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    npm start
    ```

4.  **Open the application in your browser at [http://localhost:3000](http://localhost:3000).**

## Development

To run the application in development mode with live-reloading for both the frontend and backend, use the following command:

```bash
npm run dev
```

This will concurrently start the Node.js server with `nodemon` and a `live-server` for the `Public` directory.

## API Endpoints

*   `POST /api/rides`: Request a ride.
    *   **Body:** `{ "destination": "Your Destination" }`
*   `POST /api/register`: Register a new user.
    *   **Body:** `{ "name": "Your Name", "email": "your@email.com", "password": "yourpassword" }`
*   `POST /api/login`: User login.
    *   **Body:** `{ "email": "your@email.com", "password": "yourpassword" }`
*   `GET /api/images`: Get a list of car images.
*   `GET /health`: Health check.
