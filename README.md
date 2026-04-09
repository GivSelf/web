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

## Quick Start

```bash
# With Docker (recommended)
docker pull ghcr.io/givself/web:latest

# Local development
npm install
npm run dev
```

## Documentation

See [givself.github.io](https://givself.github.io) for full documentation.

## License

MIT
