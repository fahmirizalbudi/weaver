<script lang="ts">
	import { onMount } from 'svelte';
	import { getWeatherData, type WeatherData, getWeatherDescription } from '$lib/weather';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';
	import WeatherStat from '$lib/components/WeatherStat.svelte';
	import SidebarItem from '$lib/components/SidebarItem.svelte';
	import SearchResult from '$lib/components/SearchResult.svelte';
	import { 
		X
	} from 'lucide-svelte';
	import { browser } from '$app/environment';
	import {
		Chart,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		LineController
	} from 'chart.js';

	if (browser) {
		Chart.register(
			LineElement,
			LinearScale,
			PointElement,
			CategoryScale,
			LineController
		);
	}

	let weather = $state<WeatherData | null>(null);
	let loading = $state(true);
	let location = $state({ lat: 40.71, lon: -74.00, name: 'Brooklyn, New York, USA' });
	
	let showSearch = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<any[]>([]);

	let canvas: HTMLCanvasElement | null = $state(null);
	let chart: Chart | null = null;

	async function fetchWeather() {
		loading = true;
		try {
			weather = await getWeatherData(location.lat, location.lon);
		} catch (e: any) {
			console.error("Fetch failed", e);
		} finally {
			loading = false;
		}
	}

	async function performSearch() {
		if (searchQuery.length < 2) return;
		try {
			const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`);
			const data = await res.json();
			searchResults = data.results || [];
		} catch (e) {
			console.error("Search failed", e);
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
								color: (c) => (c.index === 1 ? '#fff' : '#444'),
								font: { size: 11 },
								callback: function(val, index) {
									if (index === 1) return '';
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
								ctx.fillStyle = 'rgba(255,255,255,0.08)';
								ctx.beginPath();
								ctx.roundRect(point.x - 25, chart.height - 32, 50, 22, 6);
								ctx.fill();
								
								ctx.fillStyle = '#fff';
								ctx.font = '300 11px Inter';
								ctx.fillText(data.labels?.[index] as string || '', point.x, chart.height - 17);
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
					<SearchResult 
						name={res.name} 
						meta={`${res.admin1 || ''}, ${res.country}`} 
						onclick={() => selectLocation(res)} 
					/>
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
				<span>{location.name}</span>
			</button>
			<div class="date">
				{formatDate()}
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
						<WeatherStat label="Wind" value={`${weather.current.windSpeed}km/h`} />
						<WeatherStat label="Humidity" value={`${weather.current.humidity}%`} />
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
						<SidebarItem 
							active={i === 0}
							code={day.weatherCode}
							name={formatDay(day.date)}
							description={getWeatherDescription(day.weatherCode)}
							temp={Math.round(day.maxTemp)}
						/>
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
		min-height: 340px;
		transition: opacity 0.3s;
		gap: 40px;
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

	.hero-illustration {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sidebar {
		width: 320px;
		padding: 30px 0;
		flex-shrink: 0;
	}

	.bottom-section {
		margin-top: auto;
		padding-top: 60px;
		padding-bottom: 40px;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		height: 200px;
		width: 100%;
	}

	.hourly-chart {
		flex: 1;
		height: 100%;
		min-height: 150px;
	}

	.search-overlay {
		position: fixed;
		top: 40px;
		left: 50%;
		transform: translateX(-50%);
		width: 90%;
		max-width: 500px;
		z-index: 1000;
		padding: 20px;
		box-shadow: 0 50px 100px rgba(0,0,0,0.9);
	}

	@media (max-width: 1200px) {
		.hero {
			padding-right: 0;
		}
		
		.big-temp {
			font-size: 140px;
		}
		
		.condition {
			font-size: 36px;
		}
	}

	@media (max-width: 900px) {
		.main-layout {
			flex-direction: column;
			align-items: center;
			height: auto;
		}

		.hero {
			width: 100%;
			flex-direction: column-reverse;
			text-align: center;
			gap: 40px;
		}

		.temp-display {
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		.big-temp {
			font-size: 120px;
			margin-bottom: 10px;
		}

		.degree {
			font-size: 40px;
			right: -35px;
		}

		.condition {
			font-size: 28px;
			margin-bottom: 30px;
		}

		.quick-stats {
			gap: 40px;
		}

		.sidebar {
			width: 100%;
			max-width: 400px;
		}

		.bottom-section {
			margin-top: 40px;
			height: 180px;
		}
	}

	@media (max-width: 480px) {
		.big-temp {
			font-size: 100px;
		}

		.degree {
			font-size: 30px;
			right: -25px;
		}

		.condition {
			font-size: 24px;
		}

		.quick-stats {
			gap: 30px;
		}

		.top-nav {
			flex-direction: column;
			gap: 10px;
		}
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
</style>
