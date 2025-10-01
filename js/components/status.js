// Status Component
class StatusComponent {
  constructor() {
    this.container = document.getElementById('status-section');
  }

  render() {
    this.container.innerHTML = `
      <div class="bus-card">
        <h6 style="color:var(--blue);font-weight:700">Vehicle Status (Live)</h6>
        <div class="small-muted">Real-time list of vehicles & status</div>
        <div class="table-responsive mt-2">
          <table class="table table-sm table-status mb-0">
            <thead>
              <tr><th>Vehicle</th><th>Route</th><th>ETA</th><th>Status</th></tr>
            </thead>
            <tbody id="statusTable">
              <tr>
                <td>12A</td>
                <td>Station → College</td>
                <td>3 min</td>
                <td><span class="badge-status status-on">On Route</span></td>
              </tr>
              <tr>
                <td>Auto 33</td>
                <td>Market → College</td>
                <td>2 min</td>
                <td><span class="badge-status status-on">Shared</span></td>
              </tr>
              <tr>
                <td>5B</td>
                <td>Depot → Market</td>
                <td>10 min</td>
                <td><span class="status-del">Delayed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

window.StatusComponent = StatusComponent;
