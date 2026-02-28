/**
 * Represents comprehensive weather data including current, daily, and hourly forecasts.
 */
export interface WeatherData {
	/** Current weather conditions. */
	current: {
		/** Current temperature in Celsius. */
		temperature: number;
		/** Feels-like temperature in Celsius. */
		apparentTemperature: number;
		/** Relative humidity percentage. */
		humidity: number;
		/** Wind speed in km/h. */
		windSpeed: number;
		/** Wind direction in degrees. */
		windDirection: number;
		/** WMO weather interpretation code. */
		weatherCode: number;
		/** Whether it is currently daytime. */
		isDay: boolean;
		/** Sea-level air pressure. */
		pressure: number;
		/** Cloud cover percentage. */
		cloudCover: number;
		/** Precipitation amount. */
		precipitation: number;
	};
	/** Daily forecast for the upcoming days. */
	daily: Array<{
		/** Date string in YYYY-MM-DD format. */
		date: string;
		/** Maximum daily temperature. */
		maxTemp: number;
		/** Minimum daily temperature. */
		minTemp: number;
		/** Daily WMO weather interpretation code. */
		weatherCode: number;
		/** Maximum daily UV index. */
		uvIndex: number;
		/** Maximum daily probability of precipitation. */
		precipitationProb: number;
	}>;
	/** Hourly forecast for the next 24 hours. */
	hourly: Array<{
		/** ISO 8601 time string. */
		time: string;
		/** Hourly temperature in Celsius. */
		temperature: number;
		/** Hourly WMO weather interpretation code. */
		weatherCode: number;
		/** Hourly probability of precipitation. */
		precipitationProb: number;
	}>;
}

/**
 * Fetches weather data for specific geographical coordinates.
 * @param lat - Latitude coordinate.
 * @param lon - Longitude coordinate.
 * @returns A promise resolving to the weather data.
 * @throws Error if the API request fails.
 */
export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
	const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=auto`;

	const response = await fetch(url);
	if (!response.ok) throw new Error('Failed to fetch weather data');
	const data = await response.json();

	return {
		current: {
			temperature: data.current.temperature_2m,
			apparentTemperature: data.current.apparent_temperature,
			humidity: data.current.relative_humidity_2m,
			windSpeed: data.current.wind_speed_10m,
			windDirection: data.current.wind_direction_10m,
			weatherCode: data.current.weather_code,
			isDay: data.current.is_day === 1,
			pressure: data.current.pressure_msl,
			cloudCover: data.current.cloud_cover,
			precipitation: data.current.precipitation
		},
		daily: data.daily.time.map((time: string, i: number) => ({
			date: time,
			maxTemp: data.daily.temperature_2m_max[i],
			minTemp: data.daily.temperature_2m_min[i],
			weatherCode: data.daily.weather_code[i],
			uvIndex: data.daily.uv_index_max[i],
			precipitationProb: data.daily.precipitation_probability_max[i]
		})),
		hourly: data.hourly.time.slice(0, 24).map((time: string, i: number) => ({
			time,
			temperature: data.hourly.temperature_2m[i],
			weatherCode: data.hourly.weather_code[i],
			precipitationProb: data.hourly.precipitation_probability[i]
		}))
	};
}

/**
 * Returns a human-readable description for a WMO weather code.
 * @param code - WMO weather interpretation code.
 * @returns A descriptive string.
 */
export function getWeatherDescription(code: number): string {
	const codes: Record<number, string> = {
		0: 'Clear sky',
		1: 'Mainly clear',
		2: 'Partly cloudy',
		3: 'Overcast',
		45: 'Fog',
		48: 'Depositing rime fog',
		51: 'Light drizzle',
		53: 'Moderate drizzle',
		55: 'Dense drizzle',
		61: 'Slight rain',
		63: 'Moderate rain',
		65: 'Heavy rain',
		71: 'Slight snow fall',
		73: 'Moderate snow fall',
		75: 'Heavy snow fall',
		80: 'Slight rain showers',
		81: 'Moderate rain showers',
		82: 'Violent rain showers',
		95: 'Thunderstorm'
	};
	return codes[code] || 'Unknown';
}
