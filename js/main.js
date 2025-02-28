$(document).ready(function() {
    // Initialize an empty array to store city data
    let citiesData = [];

    // Fetch the city coordinates from the CSV file
    $.ajax({
        url: 'city_coordinates.csv',
        dataType: 'text',
        success: function(data) {
            const rows = data.split("\n");

            // Loop through each row of the CSV and store city data (lat, lon, city)
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].split(",");
                const lat = row[0];   
                const lon = row[1];   
                const city = row[2];  
                
                // If valid city, lat, and lon are found, add to citiesData and populate the dropdown
                if (city && lat && lon) {
                    citiesData.push({ city, lat, lon });
                    $('#cityDropdown').append(new Option(city, city));
                }
            }
        },
        error: function() {
            // Display error message if the city data fails to load
            $('#selectedCity').text('Error loading city data.');
        }
    });

    // Event listener for city selection change
    $('#cityDropdown').change(function() {
        const selectedCity = $(this).val();

        // If a city is selected
        if (selectedCity) {
            // Find the corresponding city info from citiesData
            const cityInfo = citiesData.find(city => city.city === selectedCity);

            // If city info is found, display city and weather forecast
            if (cityInfo) {
                $('#selectedCity').html(`<h2>${selectedCity}</h2>`);

                // Build the API URL for fetching weather data based on city coordinates
                const apiUrl = `http://www.7timer.info/bin/astro.php?lon=${cityInfo.lon}&lat=${cityInfo.lat}&ac=0&unit=metric&output=xml&tzshift=0`;
                 // Use CORS Proxy to bypass CORS issue
                 const corsProxy = "https://cors-anywhere.herokuapp.com/";
                 const proxiedUrl = corsProxy + apiUrl; // Combine proxy URL with the original API URL
 

                // Fetch weather data from the API
                $.ajax({
                    url: proxiedUrl,
                    dataType: 'xml',
                    success: function(response) {
                        let weatherInfo = `<h3>24-Hour Weather Forecast</h3>`;
                        let forecastData = $(response).find('dataseries data');

                        // Loop through the forecast data (for the next 24 hours)
                        for (let i = 0; i < 8; i++) {
                            let data = $(forecastData[i]);
                            let timepoint = data.attr('timepoint'); // Forecasted hour
                            let temp = data.find('temp2m').text(); // Temperature
                            let windSpeed = parseFloat(data.find('wind10m_speed').text()); // Wind speed
                            let humidity = data.find('rh2m').text(); // Humidity
                            let cloudCover = parseInt(data.find('cloudcover').text()); // Cloud cover percentage
                            let liftedIndex = parseInt(data.find('lifted_index').text()); // Lifted index (for thunderstorms)
                            let precipitationType = data.find('prec_type').text(); // Precipitation type
                            let precipitationAmount = parseInt(data.find('prec_amount').text()) || 0; // Precipitation amount

                            // Initialize weather condition and image
                            let condition = "Unknown";
                            let imageSrc = "clear.png";

                            // Determine weather condition based on cloud cover
                            if (cloudCover <= 2) {
                                condition = "Clear";
                                imageSrc = "clear.png";
                            } else if (cloudCover >= 3 && cloudCover <= 5) {
                                condition = "Partly Cloudy";
                                imageSrc = "pcloudy.png";
                            } else if (cloudCover >= 6 && cloudCover <= 7) {
                                condition = "Cloudy";
                                imageSrc = "cloudy.png";
                            } else {
                                condition = "Very Cloudy";
                                imageSrc = "mcloudy.png";
                            }

                            // Fog condition: High humidity and low clouds
                            if (humidity > 90 && cloudCover < 6) {
                                condition = "Foggy";
                                imageSrc = "fog.png";
                            }

                            // Rain condition: Precipitation amount and cloud cover
                            if (precipitationType === "rain") {
                                if (precipitationAmount >= 4) {
                                    condition = "Rain";
                                    imageSrc = "rain.png";
                                } else if (cloudCover > 8) {
                                    condition = "Light Rain";
                                    imageSrc = "lightrain.png";
                                } else if (cloudCover > 6) {
                                    condition = "Occasional Showers";
                                    imageSrc = "oshower.png";
                                } else {
                                    condition = "Isolated Showers";
                                    imageSrc = "ishower.png";
                                }
                            } else if (precipitationType === "snow") {
                                condition = "Snow";
                                imageSrc = "snow.png";
                            } else if (precipitationType === "rainsnow") {
                                condition = "Mixed Rain & Snow";
                                imageSrc = "rainsnow.png";
                            }

                            // Thunderstorm condition: Based on lifted index and precipitation
                            if (liftedIndex < -5) {
                                if (precipitationAmount >= 4) {
                                    condition = "Thunderstorm";
                                    imageSrc = "tstorm.png";
                                } else {
                                    condition = "Thunderstorm Possible";
                                    imageSrc = "tsrain.png";
                                }
                            }

                            // Windy condition: High wind speed
                            if (windSpeed > 10.8) {
                                condition = "Windy";
                                imageSrc = "windy.png";
                            }

                            // Append the weather data for this forecast hour to the weather info
                            weatherInfo += `
                                <div class="weather-item">
                                    <div>
                                        <img src="images/${imageSrc}" alt="${condition}">
                                        <p><strong>${condition}</strong></p>
                                    </div>
                                    <p class="time-label">${timepoint}</p>
                                    <p>
                                        🌡 <strong>Temp:</strong> ${temp}°C<br>
                                        💨 <strong>Wind:</strong> ${windSpeed} m/s<br>
                                        💧 <strong>Humidity:</strong> ${humidity}%<br>
                                        ☁ <strong>Cloud Cover:</strong> ${cloudCover}%<br>
                                        ⛈ <strong>Lifted Index:</strong> ${liftedIndex}
                                    </p>
                                </div>
                            `;
                        }

                        // Append the weather information to the page
                        $('#selectedCity').append(weatherInfo);
                    },
                    error: function() {
                        // Display error message if weather data fails to load
                        $('#selectedCity').append('<br>Error fetching weather data.');
                    }
                });
            }
        } else {
            // If no city is selected, clear the display
            $('#selectedCity').text('');
        }
    });
});

// Dark mode functionality
$(document).ready(function() {
    // Check if dark mode was enabled before
    if (localStorage.getItem("dark-mode") === "enabled") {
        $("body").addClass("dark-mode");
        $("#darkModeToggle").text("☀ Light Mode");
    }

    // Toggle dark mode on button click
    $("#darkModeToggle").click(function() {
        $("body").toggleClass("dark-mode");

        // Save the dark mode status to localStorage
        if ($("body").hasClass("dark-mode")) {
            localStorage.setItem("dark-mode", "enabled");
            $("#darkModeToggle").text("☀ Light Mode");
        } else {
            localStorage.setItem("dark-mode", "disabled");
            $("#darkModeToggle").text("🌙 Dark Mode");
        }
    });
});
