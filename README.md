# GivSelf Web

Next.js dashboard for the GivSelf home energy management system.

![Analytics](https://givself.github.io/images/analytics.png)

<p align="center">
  <img src="https://givself.github.io/images/dashboard-mobile.png" alt="Mobile Dashboard" width="200">
  <img src="https://givself.github.io/images/analytics-mobile.png" alt="Mobile Analytics" width="200">
</p>

## Features

- **Live Dashboard** — Animated power flow, status banner, SOC gauge, power bars, boost controls
- **Analytics** — Stacked bar charts from GivEnergy Cloud API with solar forecast overlay
- **Schedules** — Battery mode selector, 10 charge/discharge slots, SOC limits
- **Settings** — Inverter connection, cloud API, solar forecasting, data import
- **Setup Wizard** — First-run quickstart for new deployments
- **Dark/Light Theme** — Toggle with CSS custom properties
- **Mobile Responsive** — Bottom tab bar navigation on small screens

## Deployment

### Docker (recommended)

```bash
docker pull ghcr.io/givself/web:latest
```

See the [deploy repo](https://github.com/GivSelf/deploy) for the full docker-compose.yml.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HOSTNAME` | No | `localhost` | Listen address. Set to `0.0.0.0` for Docker/LAN access |
| `API_URL` | **Yes** (Docker) | `http://localhost:3002` | Internal URL to the GivSelf server. In Docker, use the service name (e.g. `http://server:3032`) |
| `WS_URL` | No | — | External WebSocket URL for browser connections. Set to `ws://your-server-ip:port` if server is exposed |

The web container proxies all `/api/*` requests to the server internally via `API_URL`, so only the web port needs to be exposed to users.

### Minimal Docker Compose

```yaml
web:
  image: ghcr.io/givself/web:latest
  ports:
    - "3033:3000"
  environment:
    HOSTNAME: "0.0.0.0"
    API_URL: "http://server:3032"
```

## Local Development

```bash
npm install
npm run dev

# Access at http://localhost:3000
# Expects server running at http://localhost:3002
```

## Documentation

See [givself.github.io](https://givself.github.io) for full documentation.

## License

MIT
