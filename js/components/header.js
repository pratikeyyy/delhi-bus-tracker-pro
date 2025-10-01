// Header Component
class HeaderComponent {
  constructor() {
    this.container = document.getElementById('header-section');
  }

  render() {
    this.container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 class="mb-0" style="color:var(--blue);">Real-Time Public Transport Tracker</h4>
          <div class="small-muted">Select a bus on the left map to view details and calculate fare & ETA.</div>
        </div>
        <div class="text-end small-muted">
          <!-- Additional header content can go here -->
        </div>
      </div>
    `;
  }
}

// Initialize header component
window.HeaderComponent = HeaderComponent;
