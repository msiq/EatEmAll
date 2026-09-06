# Playbook: Local Development & Server Setup

## 1. Prerequisites
* Node.js v18+ (tested on Node.js v20.20)
* Modern web browser (Chrome, Edge, Firefox, Safari)

## 2. Running the Server
```bash
# In project root:
node Server.js
```
The server will start listening on port `4444`:
`Game server listening on port: 4444`

## 3. Opening the Client
Navigate to [http://localhost:4444](http://localhost:4444) in your web browser.
Enter a player name and click **Play Now**.

## 4. Controls
* **Mouse / Pointer**: Directs player cell movement.
* **Proximity to Pointer**: Distance from cell to cursor controls speed.
* **HUD Toggle**: Top-left panel toggles live FPS and TPS metrics.
