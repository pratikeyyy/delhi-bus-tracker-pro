// Map Component
class MapComponent {
  constructor() {
    this.container = document.getElementById('map-section');
  }

  render() {
    this.container.innerHTML = `
      <div class="map-card position-relative">
        <div class="map-overlay">
          <div style="font-weight:700;color:var(--blue)">Live Vehicle • <span id="overlayBus">12A</span></div>
          <div class="small-muted" id="overlayRoute">Route: Station → Market → College</div>
          <div style="margin-top:8px;font-size:13px">ETA: <strong id="overlayETA">3 min</strong> • Speed: <span id="overlaySpeed">18 km/h</span> • Stops left: <span id="overlayStops">4</span></div>
        </div>
      </div>
    `;
  }

  updateOverlay(busId, busInfo) {
    const overlayBus = document.getElementById('overlayBus');
    const overlayRoute = document.getElementById('overlayRoute');
    const overlayETA = document.getElementById('overlayETA');
    const overlaySpeed = document.getElementById('overlaySpeed');
    const overlayStops = document.getElementById('overlayStops');

    if (overlayBus) overlayBus.textContent = busId;
    if (overlayRoute) overlayRoute.textContent = "Route: " + busInfo.route;
    if (overlayETA) overlayETA.textContent = busInfo.eta;
    if (overlaySpeed) overlaySpeed.textContent = busInfo.speed;
    if (overlayStops) overlayStops.textContent = Math.max(1, Math.round(Math.random()*5));
  }
}

window.MapComponent = MapComponent;
