# Nightshift — Highway Racer

A small single-player browser racing game for Docker practice. Steer past traffic, survive as the speed increases, and beat your personal best.

## Requirements

- Docker Desktop running with Linux containers (Windows: use the WSL 2 backend).
- A modern browser: Chrome, Edge, Firefox, or Safari.
- Internet for the first Docker build to download the Nginx base image.

No Python, Node.js, database, or package installation is needed to run this game.

## Run in Docker

1. Extract this ZIP. Open a terminal in the extracted `racing-game` folder containing the Dockerfile.
2. Check Docker:

```bash
docker version
```

Both Client and Server information should appear.

3. Build the image:

```bash
docker build -t racing-game:v1 .
```

4. Start the container:

```bash
docker run -d --name racing-game -p 127.0.0.1:8090:80 racing-game:v1
```

5. Open http://localhost:8090 in your browser. Click **Start engine**.

The browser runs the JavaScript game; the Docker container runs Nginx, which serves HTML, CSS, and JavaScript. Host port 8090 maps to container port 80. The local binding exposes the game only on this computer.

## Controls

| Action | Control |
| --- | --- |
| Steer | Hold Left/Right arrows, or A/D |
| Touch steering | Hold LEFT/RIGHT buttons beneath the road |
| Pause/resume | P, Space, or the pause button |
| Restart after a crash | Race again |

The game pauses when you switch tabs or move to another window. Best score is stored in this browser's local storage and survives container restarts. There is no shared online leaderboard.

## Inspect and stop

```bash
docker ps
docker logs racing-game
docker inspect --format="{{.State.Health.Status}}" racing-game
docker stop racing-game
docker start racing-game
```

Health status can take a few seconds to become `healthy`. The endpoint http://localhost:8090/health returns `healthy`.

## Rebuild after editing

For example, change the game title in index.html or the player-car color in game.js.

```bash
docker build -t racing-game:v2 .
docker stop racing-game
docker rm racing-game
docker run -d --name racing-game -p 127.0.0.1:8090:80 racing-game:v2
```

Refresh the browser to see the change. These files are copied into the image at build time; editing your local files does not alter an existing container.

## Troubleshooting

- **Cannot connect to Docker:** start Docker Desktop and wait for its engine to be ready. Use Linux containers.
- **Port already in use or forbidden:** choose another host port, for example `-p 127.0.0.1:8091:80`, and open http://localhost:8091.
- **Container name already in use:** inspect it with `docker ps -a`. To recreate this project's container, stop it, then run `docker rm racing-game`.
- **Old version in browser:** hard refresh with Ctrl+F5 after rebuilding and recreating the container.

## Files

- index.html: game screen and controls.
- style.css: responsive desktop and phone layout.
- game.js: steering, traffic, scoring, collision detection, pause and restart.
- Dockerfile: packages the game with Nginx and a health check.
- nginx.conf: serves game files on port 80 and exposes /health.
- .dockerignore: includes only required files in the build context.

## Next DevOps milestones

After this Docker version runs successfully, add GitHub Actions for CI, publish the image to GCP Artifact Registry, then deploy it on GKE with Kubernetes Deployment and Service manifests. Those configurations are not included in this Docker-only starter.

## Validation

See VALIDATION.md for checks completed when this package was created.
