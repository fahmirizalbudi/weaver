export interface WeatherData {
	current: {
		temperature: number;
		apparentTemperature: number;
		humidity: number;
		windSpeed: number;
		windDirection: number;
		weatherCode: number;
		isDay: boolean;
		pressure: number;
		cloudCover: number;
		precipitation: number;
	};
	daily: Array<{
		date: string;
		maxTemp: number;
		minTemp: number;
		weatherCode: number;
		uvIndex: number;
		precipitationProb: number;
	}>;
	hourly: Array<{
		time: string;
		temperature: number;
		weatherCode: number;
		precipitationProb: number;
	}>;
}

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
