'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const modalContainer = document.querySelector('.modal');
const overlay = document.querySelector('.overlay');
const closeModal = document.querySelector('.close');
const sidebarContainer = document.querySelector('.sidebar');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng];
    this.distance = distance; //in km
    this.duration = duration; //in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January','February','March', 'April', 'May','June', 'July','August','September','October','November',
    'December'];

    // prettier-ignore
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${this.date.getDate()} ${
      months[this.date.getMonth()]
    }`;
  }
}

class Running extends Workout {
  type = 'running';

  // NOTE: Constructors get called soon as page loads
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  // NOTE: Constructors get called soon as page loads
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run = new Running([9, 7], 8, 30, 50);
// const cycling = new Cycling([9, 7], 25, 15, 520);

// console.log(run, cycling);

class App {
  #mapZoomLvl = 13;
  #map;
  #mapEvent;
  #workout = [];

  // NOTE: Constructors get called soon as page loads
  constructor() {
    // get user's current position
    this._getPosition();

    // show local storage data
    this._getLocalStorage();

    // user fills in new workout data
    form.addEventListener('submit', this._newWorkout.bind(this));

    // toggle workout between cycling/running
    inputType.addEventListener('change', this._toggleElevationField);

    // focus on workout marker popup
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    // open dropdown list
    containerWorkouts.addEventListener('click', function (e) {
      const items = containerWorkouts.querySelector('.dropdown-content');
      if (e.target.classList.contains('fa-ellipsis-vertical')) {
        items.classList.remove('hidden');
      }
      console.log(items);
    });

    sidebarContainer.addEventListener('click', this.closeDropdown.bind(this));
  }

  _getPosition() {
    // testing to make sure geolocation exists in our browser
    if (navigator.geolocation)
      // getCurrentPosiiton() takes two callback functions
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          // function that executes after coords retrieval failed
          alert('Could not retrieve location');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(latitude, longitude);
    console.log(`https://www.google.ng/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    //coords is the array of present location (lat and lng)
    this.#map = L.map('map').setView(coords, this.#mapZoomLvl);

    // console.log(this.#map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Leafet method for handling map click events
    this.#map.on('click', this._showForm.bind(this));

    // render markers from local storage after map has been loaded
    this.#workout.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // prettier-ignore
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';

    form.classList.add('hidden');
  }

  // switch between elevation gain (for cycling) and cadence (for running)
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // validation helper methods
    const validInput = (...inputs) =>
      inputs.every(param => Number.isFinite(param));

    const positiveInput = (...inputs) => inputs.every(param => param > 0);

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    // get the lat & lng from click event on the map
    const { lat, lng } = this.#mapEvent.latlng;
    let newWorkout;

    // if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // validate data
      if (
        !validInput(distance, duration, cadence) ||
        !positiveInput(distance, duration, cadence)
      )
        return this.errMessage();

      newWorkout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      // validate data
      if (
        !validInput(distance, duration, elevationGain) ||
        !positiveInput(distance, duration)
      )
        return this.errMessage();

      newWorkout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    // add  objects to workout array
    this.#workout.push(newWorkout);

    // render workout on the map as a marker
    this._renderWorkoutMarker(newWorkout);

    // render workout to a list
    this._renderWorkout(newWorkout);

    // Hide form and clear fields
    this._hideForm();

    // console.log(this.#mapEvent);
    // console.log(newWorkout);

    // set local storage to new workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    // add lat & lng to the marker which appears on the map
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description} 
        <div class="dropdown">
          <span class="options"><i class="fa-solid fa-ellipsis-vertical fa-lg"></i></span>
          <div id="myDropdown" class="dropdown-content hidden">
            <a href="#"><i class="fa-solid fa-pen"></i> Edit workout</a>
            <a href="#"><i class="fa-solid fa-circle-minus"></i> Delete workout</a>
            <a href="#"><i class="fa-solid fa-trash"></i> Clear all workouts</a>
          </div>
        </div>
      </h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        } </span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
            `;

    if (workout.type === 'running')
      html += ` 
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence.toFixed(1)}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
        `;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutList = e.target.closest('.workout');
    // console.log(workoutList);

    if (!workoutList) return;

    // find id from #workout[] that matches the one in the workoutList
    const workout = this.#workout.find(el => el.id === workoutList.dataset.id);
    // console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLvl, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    // console.log(data);

    if (!data) return;

    this.#workout = data;

    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }

  // closing modal
  hideModal() {
    modalContainer.classList.add('hidden');
    overlay.classList.add('hidden');
  }

  // displaying validation error message
  errMessage() {
    modalContainer.classList.remove('hidden');
    overlay.classList.remove('hidden');

    overlay.addEventListener('click', this.hideModal);
    closeModal.addEventListener('click', this.hideModal);
  }

  closeDropdown(e) {
    // console.log(e.target);
    const dropdown = sidebarContainer.querySelector('.dropdown');
    const items = containerWorkouts.querySelector('.dropdown-content');

    if (!dropdown.classList.contains(e.target)) {
      if (!items.classList.contains('hidden')) {
        items.classList.add('hidden');
      }
    }
  }
}

const app = new App();
// console.log(app);
