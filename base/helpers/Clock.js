/**
 * Gir antall millisekunder siden instansiering.
 */
export class Clock {
	constructor() {
		this.start = (new Date()).getTime();
	}

	getElapsed() {
		return ((new Date()).getTime()) - this.start;
	}
}
