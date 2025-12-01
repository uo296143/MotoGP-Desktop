
class Noticias {

    constructor() {
        const searchTermValue = 'motogp | "termas de rio hondo"';
        const encodedSearch = encodeURIComponent(searchTermValue);
        this.busqueda = `?locale=ar&language=en&search=${encodedSearch}&api_token=6qTXiv13YnCrGpDCZzYcAjceeU44TECN1eZZ0enK`;
        this.url = 'https://api.thenewsapi.com/v1/news/all';
        this._buscar();
    }

    async _buscar() {
        try {
            const respuesta = await fetch(this.url + this.busqueda);
            if (!respuesta.ok) {
                throw new Error(`Error en la llamada a la API: ${respuesta.status} - ${respuesta.statusText}`);
            }
            const datos = await respuesta.json();
            this._procesarInformacion(datos);
        } catch (error) {
            this.r
        }

    }

    _procesarInformacion(datos) {

        datos.data.forEach((articulo, index) => {
            const image_url = articulo.image_url;
            const title = articulo.title;
            const article_url = articulo.url;
            const entradilla = articulo.snippet;
            const source_domain = articulo.source || 'Fuente desconocida';

            console.log(`Procesando Artículo ${index + 1}: ${title}`);

            const $section = $('<section>');

            // --- 1. TÍTULO (CON ENLACE) ---
            // Creamos un <h3> que contiene el enlace al artículo
            $section.append($('<h3>').html(
                $('<a>')
                    .attr('href', article_url)
                    .attr('target', '_blank')
                    .text(title)
            ));

            // --- 2. IMAGEN (CON ENLACE) ---
            // La imagen debe ser clicable, por lo que la envolvemos en un <a>
            $section.append(
                $('<a>')
                    .attr('href', article_url)
                    .attr('target', '_blank')
                    .append(
                        $('<img>')
                            .attr('src', image_url)
                            .attr('alt', title || 'Imagen de noticia')
                    )
            );

            $section.append(
                $('<p>').html(
                    `Fuente: <strong>${source_domain}</strong>`
                )
            );

            $section.append($('<p>').text(entradilla));

            $section.append(
                $('<p>').append(
                    $('<a>')
                        .attr('href', article_url)
                        .attr('target', '_blank')
                        .text('Leer noticia completa »')
                )
            );

            $('main').append($section);
        });


    }
}

