// Passenger Component
class PassengerComponent {
  constructor() {
    this.container = document.getElementById('passenger-section');
  }

  render() {
    this.container.innerHTML = `
      <div class="bus-card mb-3">
        <h6 style="color:var(--blue);font-weight:700">User / Passenger Profile</h6>
        <div class="small-muted">Enter trip details to get fare & ETA</div>
        <div class="mt-2">
          <label class="form-label small-muted mb-1">From</label>
          <input id="fromInput" class="form-control form-control-sm" placeholder="e.g., MG Road" />
        </div>
        <div class="mt-2">
          <label class="form-label small-muted mb-1">To</label>
          <input id="toInput" class="form-control form-control-sm" placeholder="e.g., College" />
        </div>
        <div class="mt-2 d-flex gap-2">
          <button id="calcBtn" class="btn btn-primary btn-sm">Calculate Fare & ETA</button>
        </div>

        <hr />

        <div>
          <div class="small-muted">Chosen Bus</div>
          <div id="userBus" style="font-weight:700">12A • Station → College</div>
          <div class="small-muted mt-2">Fare Estimate</div>
          <div id="fare" style="font-weight:700">₹ 18</div>
          <div class="small-muted mt-2">Distance</div>
          <div id="distance" style="font-weight:700">0.6 km</div>
          <div class="small-muted mt-2">Estimated Arrival</div>
          <div id="userETA" style="font-weight:700">3 min</div>
        </div>
      </div>
    `;
  }

  updatePassengerInfo(busInfo) {
    const elements = {
      userBus: document.getElementById('userBus'),
      fare: document.getElementById('fare'),
      distance: document.getElementById('distance'),
      userETA: document.getElementById('userETA')
    };

    if (elements.userBus) elements.userBus.textContent = busInfo.id + " • " + busInfo.route;
    if (elements.userETA) elements.userETA.textContent = busInfo.eta;
    if (elements.distance) elements.distance.textContent = busInfo.dist;
    
    if (elements.fare) {
      const numDist = parseFloat(busInfo.dist);
      elements.fare.textContent = "₹ " + (10 + Math.round(numDist * 8));
    }
  }

  getCalculateButton() {
    return document.getElementById('calcBtn');
  }

  getFromInput() {
    return document.getElementById('fromInput');
  }

  getToInput() {
    return document.getElementById('toInput');
  }
}

window.PassengerComponent = PassengerComponent;
