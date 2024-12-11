# Solar Perspective: Solar System Simulation in Three.js

This project simulates the solar system using Three.js, allowing you to visualize the Sun, planets, and their respective orbits. The system is interactive and allows for camera manipulation and dynamic rendering.

## Features

- **3D Solar System Simulation**: Planets orbit around the Sun, each with its own texture and parameters.
- **Camera Controls**: Camera can be dynamically positioned and adjusted to focus on planets and the Sun.
- **Ring System for Planets**: Some planets (e.g., Saturn) have ring systems that are also rendered.
- **Lighting and Effects**: Realistic lighting effects, including point lights for the Sun and halo effects for planets.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/joeletho/cs375.git
   cd cs375/Final-Project
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Project

### Build the Project

To build the project, use the following command:

```bash
npm run build
```

## Start the Development Server

To start the local server, use the following command:

```bash
npx vite
```

## Start the Simulation

Once the server is running, you can:

- View the solar system in your browser.
- Click on various planets to focus the camera on them.
- Explore the system by rotating and zooming the camera and moving around in 3D.
