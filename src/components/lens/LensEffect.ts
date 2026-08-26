import {
	LinearFilter,
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	RawShaderMaterial,
	Scene,
	SRGBColorSpace,
	TextureLoader,
	Vector2,
	WebGLRenderer
} from 'three'
import { defaultLensSettings, type LensSettings } from './lens-config'

const vertexShader = /* glsl */ `
	precision highp float;

	attribute vec3 position;
	attribute vec2 uv;

	varying vec2 vUv;

	void main() {
		vUv = uv;
		gl_Position = vec4(position, 1.0);
	}
`

const fragmentShader = /* glsl */ `
	precision highp float;

	uniform sampler2D uTexture;
	uniform vec2 uResolution;
	uniform vec2 uTextureSize;
	uniform vec2 uImageFocus;
	uniform vec2 uPointer;
	uniform float uTime;
	uniform float uLensSize;
	uniform float uLensDistortion;
	uniform float uRgbShiftR;
	uniform float uRgbShiftG;
	uniform float uRgbShiftB;
	uniform float uWaveFrequency;
	uniform float uWaveStrength;
	uniform float uWaveSpeed;
	uniform float uRandomFrequency;
	uniform float uRandomStrength;
	uniform float uRandomSpeed;

	varying vec2 vUv;

	#include <tonemapping_pars_fragment>
	#include <colorspace_pars_fragment>

	vec2 coverUv(vec2 uv, vec2 viewportSize, vec2 textureSize) {
		vec2 viewportRatio = vec2(
			viewportSize.x / viewportSize.y,
			viewportSize.y / viewportSize.x
		);
		vec2 textureRatio = vec2(
			textureSize.x / textureSize.y,
			textureSize.y / textureSize.x
		);
		vec2 scale = vec2(
			min(viewportRatio.x / textureRatio.x, 1.0),
			min(viewportRatio.y / textureRatio.y, 1.0)
		);

		return (uv - 0.5) * scale + uImageFocus;
	}

	float lensScale(float distortion, float radiusSquared) {
		if (distortion >= 0.0) {
			return 1.0 + distortion * radiusSquared;
		}

		return 1.0 / (1.0 - distortion * radiusSquared);
	}

	vec2 lensUv(vec2 uv, float distortion) {
		vec2 centered = uv - 0.5;
		vec2 distorted = centered * lensScale(distortion, dot(centered, centered));

		return uv - ((distorted + 0.5) - uv);
	}

	vec3 random3(vec3 value) {
		float seed = 4096.0 * sin(dot(value, vec3(17.0, 59.4, 15.0)));
		vec3 result;
		result.z = fract(512.0 * seed);
		seed *= 0.125;
		result.x = fract(512.0 * seed);
		seed *= 0.125;
		result.y = fract(512.0 * seed);

		return result - 0.5;
	}

	void main() {
		vec2 backgroundUv = coverUv(vUv, uResolution, uTextureSize);
		float wave = sin(
			backgroundUv.y * uWaveFrequency + uTime * uWaveSpeed
		) * uWaveStrength;
		backgroundUv.y += wave;
		backgroundUv += random3(
			vec3(backgroundUv * uRandomFrequency, uTime * uRandomSpeed)
		).x * uRandomStrength;

		vec4 source = texture2D(uTexture, backgroundUv);
		float luminance = dot(source.rgb, vec3(0.299, 0.587, 0.114));
		vec4 outsideColor = vec4(vec3(luminance * 0.92), 1.0);

		vec2 squarePosition = vUv * 2.0 - 1.0 - uPointer;
		vec2 squareAspect = vec2(
			min(uResolution.y / uResolution.x, 1.0),
			min(uResolution.x / uResolution.y, 1.0)
		);
		squarePosition /= squareAspect;

		float squareDistance = max(abs(squarePosition.x), abs(squarePosition.y));
		float squareMask = 1.0 - smoothstep(uLensSize - 0.002, uLensSize, squareDistance);
		vec2 squareUv = squarePosition / (uLensSize * 2.0) + 0.5;
		vec2 distortedSquareUv = lensUv(squareUv, uLensDistortion);
		vec2 lensOffset = (distortedSquareUv - squareUv) * uLensSize * squareAspect;
		vec2 colorUv = coverUv(vUv + lensOffset, uResolution, uTextureSize);
		vec2 shiftDirection = (squareUv - 0.5) * 2.0;

		float red = texture2D(
			uTexture,
			colorUv + shiftDirection * uRgbShiftR
		).r;
		float green = texture2D(
			uTexture,
			colorUv + shiftDirection * uRgbShiftG
		).g;
		float blue = texture2D(
			uTexture,
			colorUv + shiftDirection * uRgbShiftB
		).b;
		vec4 insideColor = vec4(red, green, blue, 1.0);

		gl_FragColor = mix(outsideColor, insideColor, squareMask);
		#include <tonemapping_fragment>
		gl_FragColor = sRGBTransferOETF(gl_FragColor);
	}
`

export interface LensEffect {
	dispose: () => void
	update: (settings: Partial<LensSettings>) => void
}

export async function createLensEffect(
	canvas: HTMLCanvasElement,
	imageUrl: string,
	initialSettings: LensSettings = defaultLensSettings
): Promise<LensEffect> {
	const texture = await new TextureLoader().loadAsync(imageUrl)
	texture.colorSpace = SRGBColorSpace
	texture.minFilter = LinearFilter
	texture.magFilter = LinearFilter

	const textureImage = texture.image as { width: number; height: number }
	const settings = { ...initialSettings }
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
	const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches
	const targetPointer = new Vector2(0.22, 0)
	const renderedPointer = targetPointer.clone()
	const scene = new Scene()
	const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
	const renderer = new WebGLRenderer({
		canvas,
		antialias: false,
		powerPreference: 'high-performance'
	})
	renderer.outputColorSpace = SRGBColorSpace
	const uniforms = {
		uTexture: { value: texture },
		uResolution: { value: new Vector2(1, 1) },
		uTextureSize: { value: new Vector2(textureImage.width, textureImage.height) },
		uImageFocus: { value: new Vector2(0.5, 0.5) },
		uPointer: { value: renderedPointer },
		uTime: { value: 0 },
		uLensSize: { value: settings.lensSize },
		uLensDistortion: { value: settings.lensDistortion },
		uRgbShiftR: { value: settings.rgbShiftR },
		uRgbShiftG: { value: settings.rgbShiftG },
		uRgbShiftB: { value: settings.rgbShiftB },
		uWaveFrequency: { value: settings.waveFrequency },
		uWaveStrength: { value: reducedMotion ? 0 : settings.waveStrength },
		uWaveSpeed: { value: settings.waveSpeed },
		uRandomFrequency: { value: settings.randomFrequency },
		uRandomStrength: { value: reducedMotion ? 0 : settings.randomStrength },
		uRandomSpeed: { value: settings.randomSpeed }
	}
	const geometry = new PlaneGeometry(2, 2)
	const material = new RawShaderMaterial({ vertexShader, fragmentShader, uniforms })
	const mesh = new Mesh(geometry, material)
	let animationFrame = 0
	let hasPointerInput = false
	let isDisposed = false
	const startTime = performance.now()

	scene.add(mesh)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))

	const resize = () => {
		const width = Math.max(window.innerWidth, 1)
		const height = Math.max(window.innerHeight, 1)

		renderer.setSize(width, height, false)
		uniforms.uResolution.value.set(width, height)
		uniforms.uImageFocus.value.set(width < height ? 0.585 : 0.5, 0.5)
	}

	const movePointer = (event: PointerEvent) => {
		hasPointerInput = true
		targetPointer.set(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1
		)
	}

	const render = (now: number) => {
		if (isDisposed) return

		const elapsed = (now - startTime) * 0.001
		if (coarsePointer && !hasPointerInput && !reducedMotion) {
			targetPointer.set(0.22 + Math.sin(elapsed * 0.55) * 0.26, Math.cos(elapsed * 0.42) * 0.16)
		}

		renderedPointer.lerp(targetPointer, reducedMotion ? 1 : settings.pointerEase)
		uniforms.uTime.value = reducedMotion ? 0 : elapsed
		renderer.render(scene, camera)
		animationFrame = window.requestAnimationFrame(render)
	}

	const update = (nextSettings: Partial<LensSettings>) => {
		Object.assign(settings, nextSettings)
		uniforms.uLensSize.value = settings.lensSize
		uniforms.uLensDistortion.value = settings.lensDistortion
		uniforms.uRgbShiftR.value = settings.rgbShiftR
		uniforms.uRgbShiftG.value = settings.rgbShiftG
		uniforms.uRgbShiftB.value = settings.rgbShiftB
		uniforms.uWaveFrequency.value = settings.waveFrequency
		uniforms.uWaveStrength.value = reducedMotion ? 0 : settings.waveStrength
		uniforms.uWaveSpeed.value = settings.waveSpeed
		uniforms.uRandomFrequency.value = settings.randomFrequency
		uniforms.uRandomStrength.value = reducedMotion ? 0 : settings.randomStrength
		uniforms.uRandomSpeed.value = settings.randomSpeed
	}

	const dispose = () => {
		if (isDisposed) return

		isDisposed = true
		window.cancelAnimationFrame(animationFrame)
		window.removeEventListener('resize', resize)
		window.removeEventListener('pointermove', movePointer)
		texture.dispose()
		material.dispose()
		geometry.dispose()
		renderer.dispose()
	}

	resize()
	window.addEventListener('resize', resize)
	window.addEventListener('pointermove', movePointer, { passive: true })
	renderer.render(scene, camera)
	animationFrame = window.requestAnimationFrame(render)

	return { dispose, update }
}
