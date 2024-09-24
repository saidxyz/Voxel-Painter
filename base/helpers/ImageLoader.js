/**
 * Laster et eller flere bilder og kaller på gitt callback-funksjon når alle biler er lastet.
 * Bruker Promise.
 */
export class ImageLoader {
	constructor() {
	}

	load(onLoad, urls) {
		const promises = [];
		const images = [];
		for(let  i = 0; i < urls.length; i++) {
			promises.push(
				//Kaller resolve() etter at hvert enkelt bilde er lastet ned:
				new Promise( (resolve, reject) => {
					images[i] = new Image();
					images[i].src = urls[i];    //HER starter nedlasting.
					images[i].onload = () => {
						resolve();
					};
					images[i].onerror = () => {
						reject();
					};
				})
			);
		}

		Promise.all(promises)
			.then( () => {
				onLoad(images);
			})
			.catch( (error) => {
				console.log('Feil bildenavn...!');
			});
	}
}
