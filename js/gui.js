// Constants
const sessionStorageKey = "trilatsessions"; // Key used for storing to local device storage
const mapboxApiKey = "pk.eyJ1IjoiamtjdGVjaCIsImEiOiJjbTh4NzVhOHAwMGliMm1xeDV4NzZhaXNlIn0.V-oEi7Yaj6k4jmSA6LmAcQ";

const overlay = document.getElementById("overlay");

// Variables
let map = L.map('map').setView([52.9423, 4.7529], 13);
let currentPositionMarker; // Current position
let trilaterationPoints = []; // Stores points for calculating later

// Settings
let updateLiveLocationEnabled = false; // Toggles live updating current pos
let liveFollow = false; // Follow live marker with view

//////////////////////
// MAP DESIGN
//////////////////////

// Init map
function initmap()
{
	L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxApiKey}`, {
		attribution: '&copy; OpenStreetMap contributors',
		maxZoom: 20
	}).addTo(map);
}

// Add controls
function addMapControls()
{
	// Menu
	const ControlMenu = L.Control.extend({
    	onAdd: function () {
			const collapsed = window.innerWidth <= 768 ? "collapsed" : "";
			let div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-buttonmenu ' + collapsed);
			div.innerHTML = `
				<h2>Menu</h2>
				<button onclick="updateLiveLocationEnabled = !updateLiveLocationEnabled;updateLocation()">Toggle live location</button>
				<button onclick="openPopup('popup-radius')">Add Current Location</button>
				<button onclick="openPopup('popup-manual')">Add Manual Location</button>
				<button onclick="openPopup('popup-save')">Save Session</button>
				<button onclick="openPopup('popup-load')">Load Session</button>
				<button onclick="calculateTrilateration()">Perform trilateration</button>
			`;
			return div;
		}
	});

	// Toggler
	const MenuToggleButton = L.Control.extend({
		onAdd: function () {
			const btn = L.DomUtil.create('div', 'leaflet-control leaflet-btn menu-toggle');
			btn.innerHTML = `
			<span class="bar"></span>
			<span class="bar"></span>
			<span class="bar"></span>
			`;
			btn.title = "Toggle Menu";

			if (window.innerWidth >= 768)
				btn.classList.toggle('open');

			L.DomEvent.on(btn, 'click', function (e) {
				L.DomEvent.stopPropagation(e);
				L.DomEvent.preventDefault(e);

				const menu = document.querySelector('.leaflet-control.leaflet-buttonmenu');
				if (menu) {
					menu.classList.toggle('collapsed');
					btn.classList.toggle('open');
				}
			});

			return btn;
		}
	});

	// Add buttons
	const toggleButton = new MenuToggleButton({ position: 'topright' }).addTo(map);
	const menu = new ControlMenu({ position: 'topright' }).addTo(map);
}

//////////////////////
// MAP UTILS
//////////////////////

function addTrilaterationPoint(lat, lng, radius)
{
	let marker = L.marker([lat, lng], { draggable: true }).addTo(map);
	let circle = L.circle([lat, lng], { radius: radius }).addTo(map);
	marker.bindPopup(`<b>Lat:</b> ${lat}<br><b>Lng:</b> ${lng}<br><b>Radius:</b> ${radius}m<br><button onclick='removeMarker(${lat}, ${lng})'>Delete</button>`);
	trilaterationPoints.push({ lat, lng, radius, marker, circle });
}

function removeMarker(lat, lng) {
	map.eachLayer(layer => {
		if (layer instanceof L.Marker || layer instanceof L.Circle) {
			if (layer.getLatLng().lat === lat && layer.getLatLng().lng === lng) {
				map.removeLayer(layer);
			}
		}
	});
	trilaterationPoints = trilaterationPoints.filter(p => p.lat !== lat || p.lng !== lng);
}

//////////////////////
// POPUP HANDLERS
//////////////////////

// Open and close
function openPopup(id) { overlay.style.display = 'block'; document.getElementById(id).style.display = 'block'; }
function closePopup(id) { overlay.style.display = 'none'; document.getElementById(id).style.display = 'none'; }
function closeallpopups()
{
	overlay.style.display = 'none';
	const popups = document.getElementsByClassName("popup-container");
	for (let i = 0; i < popups.length; i++) {
		popups[i].style.display = 'none';
	}
}

overlay.addEventListener("click", closeallpopups);

// Manual input for data
function addManualPoint()
{
	let lat = parseFloat(document.getElementById('manualLat').value);
	let lng = parseFloat(document.getElementById('manualLng').value);
	let radius = parseFloat(document.getElementById('manualRadius').value);
	addTrilaterationPoint(lat, lng, radius);
	closePopup('popup-manual');
}

// Input radius for "current location"
function confirmRadius() {
	let radius = document.getElementById('radiusInput').value;
	navigator.geolocation.getCurrentPosition(position => {
		const { latitude, longitude } = position.coords;
		addTrilaterationPoint(latitude, longitude, radius);
		closePopup('popup-radius');
	});
}

//////////////////////
// DATA HANDLERS
//////////////////////

// Populate list of sessions to choose from
function loadSessionList() {
	let sessions = JSON.parse(localStorage.getItem(sessionStorageKey) || '{}');
	let sessionList = document.getElementById('sessionList');
	sessionList.innerHTML = '';
	Object.keys(sessions).forEach(name => {
		let option = document.createElement('option');
		option.value = name;
		option.innerText = name;
		sessionList.appendChild(option);
	});
}

// Load back in session from storage
function restoreSession() {
	let selectedSession = document.getElementById('sessionList').value;
	let sessions = JSON.parse(localStorage.getItem(sessionStorageKey) || '{}');
	if (sessions[selectedSession]) {
		trilaterationPoints = sessions[selectedSession];
		map.eachLayer(layer => {
			if (layer instanceof L.Marker || layer instanceof L.Circle) {
				map.removeLayer(layer);
			}
		});
		trilaterationPoints.forEach(point => {
			addTrilaterationPoint(point.lat, point.lng, point.radius);
		});
		closePopup('popup-load');
	}
}

// Save session data to storage
function saveSession() {
	let name = document.getElementById('sessionName').value;
	if (name) {
		let sessions = JSON.parse(localStorage.getItem(sessionStorageKey) || '{}');
		sessions[name] = trilaterationPoints.map(p => ({ lat: p.lat, lng: p.lng, radius: p.radius }));
		localStorage.setItem(sessionStorageKey, JSON.stringify(sessions));
		loadSessionList();
		closePopup('popup-save');
	}
}

function calculateTrilateration() {
	if (trilaterationPoints.length < 3) {
		alert("At least 3 points are needed for trilateration.");
		return;
	}
	// TODO: TRILAT AND MARKER
	// L.marker([avgLat, avgLng], { color: 'green' }).addTo(map);
}

function updateLocation() {
	if (!updateLiveLocationEnabled)
		return;
	navigator.geolocation.getCurrentPosition(position => {
		const { latitude, longitude } = position.coords;
		if (!currentPositionMarker) {
			currentPositionMarker = L.marker([latitude, longitude], { color: 'red' }).addTo(map);
		} else {
			currentPositionMarker.setLatLng([latitude, longitude]);
		}
		if (liveFollow)
		{
			map.setView([latitude, longitude]);
		}
	});
}


function initGUI()
{
	// Init map
	initmap();
	addMapControls();

	// Populate session list
	loadSessionList();

	// Live location
	setInterval(updateLocation, 10000);
	updateLocation();
}