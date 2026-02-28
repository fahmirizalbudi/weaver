<script lang="ts">
	import { 
		Sun, 
		Cloud, 
		CloudRain, 
		CloudLightning, 
		CloudSnow, 
		CloudFog, 
		CloudDrizzle,
		CloudSun,
		Moon,
		CloudMoon
	} from 'lucide-svelte';

	let { code, isDay = true, size = 24 } = $props<{
		code: number;
		isDay?: boolean;
		size?: number;
	}>();

	const iconMap = $derived<Record<number, any>>({
		0: isDay ? Sun : Moon,
		1: isDay ? CloudSun : CloudMoon,
		2: isDay ? CloudSun : CloudMoon,
		3: Cloud,
		45: CloudFog,
		48: CloudFog,
		51: CloudDrizzle,
		53: CloudDrizzle,
		55: CloudDrizzle,
		61: CloudRain,
		63: CloudRain,
		65: CloudRain,
		71: CloudSnow,
		73: CloudSnow,
		75: CloudSnow,
		80: CloudRain,
		81: CloudRain,
		82: CloudRain,
		95: CloudLightning
	});

	const Icon = $derived(iconMap[code] || Cloud);
</script>

<Icon {size} />
