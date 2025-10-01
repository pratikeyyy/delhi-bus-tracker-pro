// Bus Details Component
class BusDetailsComponent {
  constructor() {
    this.container = document.getElementById('bus-details-section');
  }

  render() {
    this.container.innerHTML = `
      <div class="mt-3 bus-card">
        <div class="mb-2 d-flex align-items-center justify-content-between">
          <div>
            <label class="form-label mb-0">Select Bus</label>
            <select id="busSelect" class="form-select select-bus" aria-label="Select Bus">
              <option value="12A" selected>Bus 12A • Station → College</option>
              <option value="5B">Bus 5B • Depot → Market</option>
              <option value="9C">Bus 9C • East → Station</option>
              <option value="AUTO33">Auto 33 • Shared Route</option>
            </select>
          </div>
          <div class="text-end small-muted">
            <div><strong>Mode:</strong> Live</div>
            <div><span class="badge badge-status status-on">128 vehicles</span></div>
          </div>
        </div>

        <div class="row gx-3">
          <div class="col-md-6 mb-2">
            <div class="small-muted">Vehicle ID</div>
            <div id="vId" style="font-weight:700">12A</div>
          </div>
          <div class="col-md-6 mb-2">
            <div class="small-muted">Running Since</div>
            <div id="vTime" style="font-weight:700">06:10 AM</div>
          </div>
          <div class="col-md-6 mb-2">
            <div class="small-muted">Origin → Destination</div>
            <div id="vRoute" style="font-weight:700">Station → College</div>
          </div>
          <div class="col-md-6 mb-2">
            <div class="small-muted">Current Status</div>
            <div id="vStatus"><span class="badge-status status-on">On Route</span></div>
          </div>
          <div class="col-md-6 mb-2">
            <div class="small-muted">Current Speed</div>
            <div id="vSpeed" style="font-weight:700">18 km/h</div>
          </div>
          <div class="col-md-6 mb-2">
            <div class="small-muted">Distance to Stop</div>
            <div id="vDist" style="font-weight:700">0.6 km</div>
          </div>
          <div class="col-12 mt-2">
            <div class="small-muted">Driver Info</div>
            <div id="vDriver" style="font-weight:700">Ramesh • Phone: 98xxxxxx45</div>
          </div>
        </div>
      </div>
    `;
  }

  updateDetails(busInfo) {
    const elements = {
      vId: document.getElementById('vId'),
      vTime: document.getElementById('vTime'),
      vRoute: document.getElementById('vRoute'),
      vStatus: document.getElementById('vStatus'),
      vSpeed: document.getElementById('vSpeed'),
      vDist: document.getElementById('vDist'),
      vDriver: document.getElementById('vDriver')
    };

    if (elements.vId) elements.vId.textContent = busInfo.id;
    if (elements.vTime) elements.vTime.textContent = busInfo.time;
    if (elements.vRoute) elements.vRoute.textContent = busInfo.route;
    if (elements.vStatus) {
      elements.vStatus.innerHTML = busInfo.status === "Delayed" ? 
        '<span class="status-del">Delayed</span>' : 
        '<span class="badge-status status-on">' + busInfo.status + '</span>';
    }
    if (elements.vSpeed) elements.vSpeed.textContent = busInfo.speed;
    if (elements.vDist) elements.vDist.textContent = busInfo.dist;
    if (elements.vDriver) elements.vDriver.textContent = busInfo.driver;
  }

  getBusSelect() {
    return document.getElementById('busSelect');
  }
}

window.BusDetailsComponent = BusDetailsComponent;
