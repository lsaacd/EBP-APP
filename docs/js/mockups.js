/* Homepage previews use the original supplied App Store artwork. */
(() => {
 const home=document.getElementById('home-view');if(!home)return;
 const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
 const image=(file,alt,cls)=>{const img=make('img',cls);img.src=`mockups/${file}`;img.alt=alt;img.width=1290;img.height=2796;img.loading='lazy';img.decoding='async';return img;};
 const reading=make('section','app-reading-showcase');reading.setAttribute('aria-labelledby','app-preview-title');
 const copy=make('div','app-preview-copy'),eyebrow=make('p','eyebrow','EL HIMNARIO, TAMBIÉN EN TU IPHONE'),title=make('h2','','Una lectura a tu manera.');title.id='app-preview-title';
 copy.append(eyebrow,title,make('p','app-preview-intro','La misma alabanza que te acompaña aquí, siempre contigo. Lee con calma, elige el tamaño del texto y cambia entre claro y oscuro según el momento.'));
 const benefits=make('ul','app-preview-benefits');['637 himnos y 124 estribillos para explorar.','Lectura clara con texto ajustable.','Grabaciones disponibles y marcadores personales.'].forEach(t=>benefits.append(make('li','',t)));copy.append(benefits);
 const actions=make('div','app-preview-actions'),download=make('a','primary','Descargar para iPhone ↗'),browse=make('a','preview-browse','Seguir leyendo en la web →');download.href='https://apps.apple.com/app/id6794435414';download.target='_blank';download.rel='noopener noreferrer';browse.href='#himnos';actions.append(download,browse);copy.append(actions,make('p','app-preview-note','En computadora, también puedes escanear el código QR del costado.'));
 const preview=make('figure','reading-mockup');preview.append(image('reading-light.png','Vista de lectura de la app en modo claro, con controles de texto y audio.','mockup-light'),image('reading-dark.png','Vista de lectura de la app en modo oscuro, con fondo negro y texto claro.','mockup-dark'));
 reading.append(copy,preview);
 const features=make('section','app-feature-section');features.setAttribute('aria-labelledby','app-features-title');const heading=make('div','app-feature-heading'),featureTitle=make('h2','','Todo lo que necesitas para alabar.');featureTitle.id='app-features-title';heading.append(make('p','eyebrow','DESCUBRE LA APP'),featureTitle,make('p','','Encuentra, escucha y guarda las alabanzas que te acompañan.'));features.append(heading);
 const gallery=make('div','app-feature-gallery');
 [['search.png','Búsqueda al instante','Vista de la búsqueda en la app, con filtros por categoría y resultado del himno 311.','Encuentra por número, título o categoría.'],['audio.png','Escucha cada melodía','Reproductor de audio de la app, con controles de reproducción.','Reproduce las grabaciones disponibles.'],['favorites.png','Tus alabanzas, a mano','Marcadores de la app con una lista de himnos favoritos.','Guarda tus himnos para volver a ellos.']].forEach(([file,label,alt,description])=>{const card=make('figure','app-feature-card'),art=make('div','feature-art');art.append(image(file,alt,''));const caption=make('figcaption','');caption.append(make('h3','',label),make('p','',description));card.append(art,caption);gallery.append(card);});features.append(gallery);
 const links=home.querySelector('.home-links');links.before(reading,features);
})();
