export function formatPower(watts: number): string {
  if (Math.abs(watts) >= 1000) {
    return `${(watts / 1000).toFixed(1)} kW`;
  }
  return `${watts} W`;
}

export function formatEnergy(kwh: number): string {
  return `${kwh.toFixed(1)} kWh`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatVoltage(volts: number): string {
  return `${volts.toFixed(1)} V`;
}

export function formatTemperature(celsius: number): string {
  return `${celsius.toFixed(1)}°C`;
}
