<script lang="ts">
	import { onMount } from 'svelte';
	import { getWeatherData, type WeatherData, getWeatherDescription } from '$lib/weather';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';
	import { 
		Wind, 
		Droplets, 
		MapPin, 
		ChevronDown,
		Search,
		X
	} from 'lucide-svelte';
	import { browser } from '$app/environment';
	import {
		Chart,
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		Filler,
		LineController
	} from 'chart.js';

	if (browser) {
		Chart.register(
			Title,
			Tooltip,
			Legend,
			LineElement,
			LinearScale,
			PointElement,
			CategoryScale,
			Filler,
			LineController
		);
	}

	let weather = $state<WeatherData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let location = $state({ lat: 40.71, lon: -74.00, name: 'Brooklyn, New York, USA' });
	
	let showSearch = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<any[]>([]);
	let searching = $state(false);

	let canvas: HTMLCanvasElement | null = $state(null);
	let chart: Chart | null = null;

	async function fetchWeather() {
		loading = true;
		error = null;
		try {
			weather = await getWeatherData(location.lat, location.lon);
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function performSearch() {
		if (searchQuery.length < 2) return;
		searching = true;
		try {
			const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`);
			const data = await res.json();
			searchResults = data.results || [];
		} catch (e) {
			console.error("Search failed", e);
		} finally {
			searching = false;
		}
	}

	function selectLocation(result: any) {
		location = { 
			lat: result.latitude, 
			lon: result.longitude, 
			name: `${result.name}, ${result.country_code?.toUpperCase() || result.country}` 
		};
		showSearch = false;
		searchQuery = '';
		searchResults = [];
		fetchWeather();
	}

	onMount(() => {
		fetchWeather();
		return () => {
			if (chart) chart.destroy();
		};
	});

	$effect(() => {
		if (browser && canvas && weather) {
			if (chart) chart.destroy();

			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			chart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: weather.hourly.slice(0, 9).map(h => new Date(h.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })),
					datasets: [{
						data: weather.hourly.slice(0, 9).map(h => h.temperature),
						borderColor: 'rgba(255, 255, 255, 0.15)',
						backgroundColor: 'transparent',
						tension: 0.4,
						pointRadius: (ctx) => (ctx.dataIndex === 1 ? 4 : 2),
						pointBackgroundColor: (ctx) => (ctx.dataIndex === 1 ? '#ffcc00' : 'rgba(255, 255, 255, 0.2)'),
						pointBorderColor: 'transparent',
						borderWidth: 2
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
						tooltip: { enabled: false }
					},
					layout: {
						padding: { top: 40, bottom: 20 }
					},
					scales: {
						x: {
							grid: { display: false },
							ticks: { 
								color: '#444', 
								font: { size: 11 },
								callback: function(val, index) {
									return this.getLabelForValue(val as number);
								}
							}
						},
						y: { display: false }
					}
				},
				plugins: [{
					id: 'labels',
					afterDraw: (chart) => {
						const { ctx, data, scales: { x, y } } = chart;
						data.datasets[0].data.forEach((datapoint, index) => {
							const meta = chart.getDatasetMeta(0);
							const point = meta.data[index];
							ctx.fillStyle = index === 1 ? '#fff' : '#666';
							ctx.font = '300 14px Inter';
							ctx.textAlign = 'center';
							ctx.fillText(Math.round(datapoint as number) + '°', point.x, point.y - 20);
							
							if (index === 1) {
								ctx.fillStyle = 'rgba(255,255,255,0.05)';
								ctx.beginPath();
								ctx.roundRect(point.x - 25, chart.height - 30, 50, 22, 4);
								ctx.fill();
							}
						});
					}
				}]
			});
		}
	});

	const formatDate = () => {
		return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
	};

	const formatDay = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { weekday: 'long' });
	};
</script>

<div class="app-fullscreen">
	{#if showSearch}
		<div class="search-overlay glass-card">
			<div class="search-box">
				<Search size={20} color="#666" />
				<input 
					type="text" 
					placeholder="Search city or country..." 
					bind:value={searchQuery} 
					oninput={performSearch}
				/>
				<button onclick={() => showSearch = false} class="close-btn"><X size={20}/></button>
			</div>
			<div class="results">
				{#each searchResults as res}
					<button class="result-row" onclick={() => selectLocation(res)}>
						<MapPin size={16} />
						<div class="res-info">
							<span class="res-name">{res.name}</span>
							<span class="res-meta">{res.admin1 || ''}, {res.country}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if loading && !weather}
		<div class="center">
			<div class="spinner"></div>
		</div>
	{:else if weather}
		<header class="top-nav">
			<button class="location" onclick={() => showSearch = true}>
				<MapPin size={14} />
				<span>{location.name}</span>
				<ChevronDown size={14} />
			</button>
			<div class="date">
				({formatDate()})
			</div>
		</header>

		<div class="main-layout" class:dimmed={showSearch}>
			<div class="hero">
				<div class="temp-display">
					<div class="big-temp">
						{Math.round(weather.current.temperature)}<span class="degree">°</span>
					</div>
					<div class="condition">
						{getWeatherDescription(weather.current.weatherCode)}
					</div>
					<div class="quick-stats">
						<div class="stat">
							<Wind size={14} color="#666" />
							<div class="stat-label">Wind</div>
							<div class="stat-value">{weather.current.windSpeed}km/h</div>
						</div>
						<div class="stat">
							<Droplets size={14} color="#666" />
							<div class="stat-label">Humidity</div>
							<div class="stat-value">{weather.current.humidity}%</div>
						</div>
					</div>
				</div>

				<div class="hero-illustration">
					<div class="main-weather-icon">
						<WeatherIcon code={weather.current.weatherCode} isDay={weather.current.isDay} size={180} />
					</div>
				</div>
			</div>

			<aside class="sidebar glass-card">
				<div class="sidebar-list">
					{#each weather.daily.slice(0, 6) as day, i}
						<div class="sidebar-item" class:active={i === 0}>
							<div class="day-icon">
								<WeatherIcon code={day.weatherCode} size={20} />
							</div>
							<div class="day-info">
								<div class="day-name">{formatDay(day.date)}</div>
								<div class="day-desc">{getWeatherDescription(day.weatherCode)}</div>
							</div>
							<div class="day-temp">{Math.round(day.maxTemp)}°</div>
						</div>
					{/each}
				</div>
			</aside>
		</div>

		<footer class="bottom-section" class:dimmed={showSearch}>
			<div class="hourly-chart">
				<canvas bind:this={canvas}></canvas>
			</div>
		</footer>
	{/if}
</div>

<style>
	.center {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 2px solid rgba(255,255,255,0.1);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.top-nav {
		display: flex;
		justify-content: center;
		gap: 20px;
		align-items: center;
		color: var(--text-muted);
		font-size: 12px;
		margin-bottom: 40px;
	}

	.location {
		display: flex;
		align-items: center;
		gap: 5px;
		background: none;
		border: none;
		color: #fff;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
	}

	.main-layout {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		height: 340px;
		transition: opacity 0.3s;
	}

	.dimmed {
		opacity: 0.1;
		pointer-events: none;
	}

	.hero {
		flex: 1;
		display: flex;
		justify-content: space-between;
		padding-right: 80px;
		align-items: center;
	}

	.big-temp {
		font-size: 180px;
		font-weight: 200;
		line-height: 0.9;
		margin-bottom: 20px;
		position: relative;
		display: inline-block;
		letter-spacing: -5px;
	}

	.degree {
		font-size: 60px;
		vertical-align: top;
		position: absolute;
		top: 20px;
		right: -50px;
	}

	.condition {
		font-size: 48px;
		font-weight: 300;
		margin-bottom: 60px;
		color: #fff;
	}

	.quick-stats {
		display: flex;
		gap: 60px;
	}

	.stat-label {
		font-size: 12px;
		color: #555;
		text-transform: uppercase;
		margin-top: 8px;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 400;
	}

	.hero-illustration {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sidebar {
		width: 320px;
		padding: 30px 0;
	}

	.sidebar-item {
		display: flex;
		align-items: center;
		padding: 18px 30px;
		gap: 20px;
		transition: all 0.3s;
		opacity: 0.6;
	}

	.sidebar-item.active {
		opacity: 1;
		position: relative;
	}

	.sidebar-item.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 4px;
		height: 24px;
		background-color: var(--accent);
		border-radius: 0 4px 4px 0;
	}

	.day-name {
		font-size: 16px;
		font-weight: 500;
	}

	.day-desc {
		font-size: 12px;
		color: var(--text-muted);
	}

	.day-temp {
		margin-left: auto;
		font-weight: 400;
		font-size: 16px;
	}

	.bottom-section {
		position: absolute;
		bottom: 40px;
		left: 60px;
		right: 60px;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		height: 120px;
	}

	.hourly-chart {
		flex: 1;
		height: 100%;
	}

	.main-weather-icon {
		filter: drop-shadow(0 0 30px rgba(255, 204, 0, 0.2));
	}

	.search-overlay {
		position: fixed;
		top: 40px;
		left: 50%;
		transform: translateX(-50%);
		width: 500px;
		z-index: 1000;
		padding: 20px;
		box-shadow: 0 50px 100px rgba(0,0,0,0.9);
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 15px;
		border-bottom: 1px solid var(--glass-border);
		padding-bottom: 15px;
	}

	.search-box input {
		background: none;
		border: none;
		color: #fff;
		font-size: 18px;
		width: 100%;
		outline: none;
		font-weight: 300;
	}

	.close-btn {
		background: none;
		border: none;
		color: #555;
		cursor: pointer;
	}

	.results {
		margin-top: 20px;
		max-height: 300px;
		overflow-y: auto;
	}

	.result-row {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 15px;
		padding: 12px;
		background: none;
		border: none;
		color: #fff;
		text-align: left;
		cursor: pointer;
		border-radius: 12px;
		transition: background 0.2s;
	}

	.result-row:hover {
		background: rgba(255,255,255,0.05);
	}

	.res-info {
		display: flex;
		flex-direction: column;
	}

	.res-name {
		font-size: 14px;
		font-weight: 500;
	}

	.res-meta {
		font-size: 11px;
		color: #555;
	}
</style>
