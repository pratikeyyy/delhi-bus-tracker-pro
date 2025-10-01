// Main Application Controller
class BusTrackerApp {
  constructor() {
    this.components = {};
    this.currentBus = '12A';
    this.init();
  }

  init() {
    // Initialize all components
    this.components.header = new HeaderComponent();
    this.components.map = new MapComponent();
    this.components.busDetails = new BusDetailsComponent();
    this.components.passenger = new PassengerComponent();
    this.components.status = new StatusComponent();

    // Render all components
    this.renderAll();

    // Set up event listeners
    this.setupEventListeners();

    // Initialize with default bus
    this.updateView(this.currentBus);
  }

  renderAll() {
    this.components.header.render();
    this.components.map.render();
    this.components.busDetails.render();
    this.components.passenger.render();
    this.components.status.render();
  }

  setupEventListeners() {
    // Bus selection change
    const busSelect = this.components.busDetails.getBusSelect();
    if (busSelect) {
      busSelect.addEventListener('change', (e) => {
        this.currentBus = e.target.value;
        this.updateView(this.currentBus);
      });
    }

    // Calculate fare button
    const calcBtn = this.components.passenger.getCalculateButton();
    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        this.calculateFare();
      });
    }
  }

  updateView(busId) {
    const busInfo = window.busData[busId];
    if (!busInfo) return;

    // Update all components with new bus data
    this.components.map.updateOverlay(busId, busInfo);
    this.components.busDetails.updateDetails(busInfo);
    this.components.passenger.updatePassengerInfo(busInfo);
  }

  calculateFare() {
    const fromInput = this.components.passenger.getFromInput();
    const toInput = this.components.passenger.getToInput();
    
    const from = fromInput.value.trim() || "MG Road";
    const to = toInput.value.trim() || "College";
    const currentBusInfo = window.busData[this.currentBus];
    
    fromInput.value = from;
    toInput.value = to;
    
    // Update passenger info with current selection
    this.components.passenger.updatePassengerInfo(currentBusInfo);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.busTrackerApp = new BusTrackerApp();
});
