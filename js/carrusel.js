

class Carrusel {

    #busqueda;
    #actual;
    #maximo;
    #fotografias = [];
    // Sufijo para imágenes de 640px
    #SIZE_SUFFIX = 'z';

    constructor(busqueda) {
        this.#busqueda = busqueda;
        this.#actual = 0;
        this.#maximo = 4;
        this.#getFotografias();
    }

    #getFotografias() {

        const flickrAPI = "https://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";

        $.getJSON(flickrAPI,
            {
                tags: this.#busqueda,
                tagmode: "any",
                format: "json"
            })
            .done((data) => {
                // Aquí this no es la clase Carrusel
                this.#procesarJSONFotografias(data);
            })

    }

    #procesarJSONFotografias(data) {

        $.each(data.items, (i, item) => {

            // La URL devuelta por 'item.media.m' tiene el sufijo '_m.jpg' (240px)
            const originalLink = item.media.m;

            // Reemplazamos el sufijo '_m' por el sufijo de 640px ('_z') para cumplir con la Tarea 5.
            // Esto transforma, por ejemplo, '.../12345_m.jpg' a '.../12345_z.jpg'.
            const imagen640Url = originalLink.replace('_m.jpg', `_${this.#SIZE_SUFFIX}.jpg`);

            // Extraemos y estructuramos la información necesaria
            const fotoInfo = {
                titulo: item.title,
                url: imagen640Url,
                autor: item.author,
                enlace: item.link
            };

            this.#fotografias.push(fotoInfo);

            if (i === 4) {
                return false;
            }


        });

        this.#mostrarFotografia();

        console.log(`Procesamiento completado. ${this.#fotografias.length} fotos de 640px almacenadas.`);
        console.log("Objeto de fotografías procesadas:", this.#fotografias);
    }

    #mostrarFotografia() {
        const primeraFoto = this.#fotografias[0];
        const titulo = $("<h2>")
            .text(`Imágenes del circuito de Termas de Río Hondo`);

        const imagen = $("<img>")
            .attr("src", primeraFoto.url)
            .attr("alt", primeraFoto.titulo)
            .attr("title", `Autor: ${primeraFoto.autor}`);

        // Creamos el <article> contenedor
        const article = $("<article>")
            .append(titulo)
            .append(imagen);

        // 3. Añadimos el nuevo <article> al cuerpo del documento (o a un contenedor específico)

        // NOTA: Se asume que existe un contenedor principal en el HTML con el ID #carrusel-container.
        // Si no existe, se puede cambiar a $('body').append(articulo);
        $('body main').append(article);

        setInterval(() => {
            this.#cambiarFotografia();
        }, 3000);

    }

    #cambiarFotografia() {
        this.#actual++;
        if (this.#actual > this.#maximo) {
            this.#actual = 0;
        }

        const siguienteFoto = this.#fotografias[this.#actual];

        $('body main article').find("img").attr({
            "src": siguienteFoto.url,
            "alt": siguienteFoto.titulo,
            "title": `Autor: ${siguienteFoto.autor}`
        });

        console.log(`Foto cambiada. Índice actual: ${this.#actual}`);
    }

}