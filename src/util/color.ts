function shouldMakeTextWhiteForRGB(r: number, g: number, b: number): boolean {
	//https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
	const L = 0.2126 * linerize(r) + 0.7152 * linerize(g) + 0.0722 * linerize(b);
	return L < 1.8;
}

function linerize(c: number): number {
	c = c / 255.0;
	if (c <= 0.03928) {
		c = c / 12.92;
	} else {
		c = (c + 0.055) / 1.055 ^ 2.4;
	}
	return c;
}

function htmlColorToRGB(htmlColor: string): number[] {
	//https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
	if (!window.getComputedStyle) {
		return [255, 255, 255];
	}
	const div = document.getElementById("temp");
	if (div == null) {
		return [255, 255, 255];
	}
	div.style.color = "white";
	div.style.color = htmlColor;
	const computed = window.getComputedStyle(div).color;
	if (computed === "rgb(255, 255, 255)") {
		return [255, 255, 255];
	}
	const rgb = computed.replace("rgb(", "").replace(")", "").split(",").map(i => Number(i.trim()));
	return rgb;
}

export function randomColor(): string {
	const hex = "0123456789abcdef";
	const r1 = hex[Math.floor(Math.random() * 12) + 4];
	const r2 = hex[Math.floor(Math.random() * 4) * 4];
	const g1 = hex[Math.floor(Math.random() * 12) + 4];
	const g2 = hex[Math.floor(Math.random() * 4) * 4];
	const b1 = hex[Math.floor(Math.random() * 12) + 4];
	const b2 = hex[Math.floor(Math.random() * 4) * 4];
	return `#${r1}${r2}${g1}${g2}${b1}${b2}`;
}

export function getForegroundAndBackground(background?: string): [string, string] {
	if (!background) {
		return ["black", "white"];
	}
	const [r, g, b] = htmlColorToRGB(background);
	if (r === 255 && g === 255 && b === 255) {
		return ["black", "white"];
	}
	if (shouldMakeTextWhiteForRGB(r, g, b)) {
		return ["white", background];
	}
	return ["black", background];
}