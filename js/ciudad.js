// Archivo: js/ciudad.js
// Clase Ciudad que representa la información de la ciudad Argentina Termas de Río Hondo.
"use strict";
class Ciudad {
  /**
   * Crea una nueva instancia de Ciudad.
   * @param {string} nombre - Nombre de la ciudad.
   * @param {string} pais - País donde se encuentra la ciudad.
   * @param {string} gentilicio - Gentilicio de los habitantes.
   */
  constructor(nombre, pais, gentilicio) {
    this.nombre = nombre;
    this.pais = pais;
    this.gentilicio = gentilicio;

    // Inicialización de propiedades para evitar 'undefined'
    this.datosCarrera = null;
    this.infoCarrera = null;
    this.datosEntrenos = null;
    this.mediasEntrenos = null;
  }

  rellenarAtributos(poblacion, coordenadas) {
    this.poblacion = poblacion;
    this.coordenadas = coordenadas;
  }

  getCiudad() {
    return this.nombre;
  }

  getPais() {
    return this.pais;
  }

  getInfoSecundaria() {
    const mensaje = `<ul><li>Gentilicio: ${this.gentilicio}</li><li>Población: ${this.poblacion.toLocaleString()} habitantes</li></ul>`;
    return mensaje;
  }

  getCoordenadas() {
    return `Coordenadas del punto central: Latitud: ${this.coordenadas.lat}, Longitud: ${this.coordenadas.lon}`
  }

  // --- MÉTODOS REFACTORIZADOS (DRY) ---

  /**
   * Método genérico para obtener datos meteorológicos históricos.
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD).
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD).
   * @param {string} hourlyVars - Variables horarias a solicitar.
   * @param {string} dailyVars - Variables diarias a solicitar.
   * @param {string} dataType - 'carrera' o 'entrenos' para manejar el éxito.
   */
  _fetchMeteoData(startDate, endDate, hourlyVars, dailyVars, dataType) {
    // Corregido: Usamos el endpoint de ARCHIVE para datos históricos
    const url = new URL("https://archive-api.open-meteo.com/v1/archive");

    // Lógica para asegurar que se usa un año histórico (2024) en lugar de 2025
    const fechaRealInicio = startDate.replace('2025', '2024');
    const fechaRealFin = endDate.replace('2025', '2024');

    const params = {
      latitude: this.coordenadas.lat,
      longitude: this.coordenadas.lon,
      start_date: fechaRealInicio,
      end_date: fechaRealFin,
      hourly: hourlyVars,
      timezone: "America/Argentina/Cordoba",
      models: "era5",
    };

    // Solo añadir daily si se ha proporcionado
    if (dailyVars) {
      params.daily = dailyVars;
    }

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    $.ajax({
      url: url.toString(),
      method: 'GET',
      dataType: 'json',
      context: this,
      success: function (data) {
        console.log(`✔️ Datos de ${dataType} recibidos.`, data);
        this._procesarYAñadir(data, dataType); // Nuevo método unificado
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error(`❌ Error al obtener la meteorología de ${dataType}:`, textStatus, errorThrown);
        $('main').append($('<section>').html(`<h2>Error en Datos Históricos (${dataType})</h2><p>Fallo al cargar la meteorología: ${textStatus} ${errorThrown}.</p>`));
      }
    });
  }

  /**
   * Tarea 3 (Parte 1): Obtener los datos meteorológicos del circuito el día de la carrera.
   */
  getMeteorologiaCarrera(fechaCarrera) {
    const hourlyVars = "temperature_2m,apparent_temperature,rain,relative_humidity_2m,wind_speed_10m,wind_direction_10m";
    const dailyVars = "sunrise,sunset";
    this._fetchMeteoData(fechaCarrera, fechaCarrera, hourlyVars, dailyVars, 'carrera');
  }

  /**
   * Tarea 6: Obtener los datos meteorológicos del circuito los días de entrenamientos.
   */
  getMeteorologiaEntrenos(fechaInicio, fechaFin) {
    const hourlyVars = "temperature_2m,rain,wind_speed_10m,relative_humidity_2m";
    // No se piden variables diarias (daily) para entrenamientos
    this._fetchMeteoData(fechaInicio, fechaFin, hourlyVars, null, 'entrenos');
  }

  // --- PROCESAMIENTO Y AÑADIDO UNIFICADO ---

  /**
   * Método unificado para procesar y añadir la información al DOM.
   * @param {Object} data - Objeto JSON de la API.
   * @param {string} dataType - 'carrera' o 'entrenos'.
   */
  _procesarYAñadir(data, dataType) {
    if (dataType === 'carrera') {
      this.datosCarrera = data;
      this._procesarJSONCarrera();
      this._añadirInfoCarrera();
    } else if (dataType === 'entrenos') {
      this.datosEntrenos = data;
      this._procesarJSONEntrenos();
      this._añadirInfoEntrenos();
    }
  }

  // --- MÉTODOS DE PROCESAMIENTO (CON RENOMBRAMIENTO A PRIVADO) ---

  /**
   * Tarea 4: Procesa el objeto JSON de la carrera y almacena la información.
   */
  _procesarJSONCarrera() { // Renombrado a método privado
    if (!this.datosCarrera) return;

    const daily = this.datosCarrera.daily;
    const horaSalidaSol = new Date(daily.sunrise[0]).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const horaPuestaSol = new Date(daily.sunset[0]).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    this.infoCarrera = {
      fecha: new Date(daily.time[0]).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
      salidaSol: horaSalidaSol,
      puestaSol: horaPuestaSol,
    };
  }

  /**
   * Tarea 7: Procesa el objeto JSON de entrenamientos y calcula las medias por día.
   */
  _procesarJSONEntrenos() { // Renombrado a método privado
    if (!this.datosEntrenos) return;

    const hourly = this.datosEntrenos.hourly;
    const numHoras = hourly.time.length;
    const numDias = 3; // Asumido para el ejercicio (3 días de entrenamientos)
    const horasPorDia = numHoras / numDias;

    this.mediasEntrenos = [];

    const variables = ['temperature_2m', 'rain', 'wind_speed_10m', 'relative_humidity_2m'];

    for (let d = 0; d < numDias; d++) {
      const inicio = d * horasPorDia;
      const fin = inicio + horasPorDia;
      const diaMedias = {
        fecha: new Date(hourly.time[inicio]).toLocaleDateString('es-ES'),
        datos: {}
      };

      variables.forEach(variable => {
        let suma = 0;
        let contador = 0;
        for (let i = inicio; i < fin; i++) {
          if (hourly[variable][i] !== null && hourly[variable][i] !== undefined) {
            suma += hourly[variable][i];
            contador++;
          }
        }
        const media = contador > 0 ? (suma / contador) : 0;
        diaMedias.datos[variable] = media.toFixed(2);
      });
      this.mediasEntrenos.push(diaMedias);
    }
  }

  // --- MÉTODOS PARA AÑADIR INFO (CON RENOMBRAMIENTO A PRIVADO) ---

  // Tarea 5: Añade la información de la carrera al documento (DOM)
  _añadirInfoCarrera() { // Renombrado a método privado
    const hourly = this.datosCarrera.hourly;
    const $section = $('<section>');
    $section.append($('<h2>').text(`📍 Meteorología de la Carrera: ${this.infoCarrera.fecha}`));

    const $dailyData = $('<p>');
    $dailyData.append(`Salida del Sol: ${this.infoCarrera.salidaSol}<br>`);
    $dailyData.append(`Puesta del Sol: ${this.infoCarrera.puestaSol}`);
    $section.append($dailyData);

    const $tabla = $('<table>');
    $tabla.append($('<caption>').text(`Datos horarios del circuito en Termas de Río Hondo`));

    const $thead = $('<thead>').append($('<tr>')
      .append($('<th>').text('Hora'))
      .append($('<th>').text('Temp a 2m del suelo (ºC)'))
      .append($('<th>').text('Sens. Térm. (ºC)'))
      .append($('<th>').text('Lluvia (mm)'))
      .append($('<th>').text('Humedad a 2m del suelo (%)'))
      .append($('<th>').text('Vel. Viento a 10m del suelo (km/h)'))
      .append($('<th>').text('Dir. Viento a 10 m del suelo (º)'))
    );
    $tabla.append($thead);

    const $tbody = $('<tbody>');
    hourly.time.forEach((horaISO, index) => {
      const horaLocal = new Date(horaISO).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      const $fila = $('<tr>')
        .append($('<td>').text(horaLocal))
        .append($('<td>').text(hourly.temperature_2m[index]))
        .append($('<td>').text(hourly.apparent_temperature[index]))
        .append($('<td>').text(hourly.rain[index]))
        .append($('<td>').text(hourly.relative_humidity_2m[index]))
        .append($('<td>').text(hourly.wind_speed_10m[index]))
        .append($('<td>').text(hourly.wind_direction_10m[index]));

      $tbody.append($fila);
    });
    $tabla.append($tbody);
    $('main').append($section.append($tabla));
  }

  _añadirInfoEntrenos() {
    const $article = $('<article>');
    $article.append($('<h2>').text('📈 Medias Meteorológicas de Entrenamientos (3 Días)'));

    this.mediasEntrenos.forEach(dia => {
      $article.append($('<h3>').text(`Día: ${dia.fecha}`));

      const $dl = $('<dl>');

      $dl.append($('<dt>').text('Temperatura media a 2m del suelo:'))
        .append($('<dd>').text(`${dia.datos.temperature_2m} ºC`));
      $dl.append($('<dt>').text('Lluvia media:'))
        .append($('<dd>').text(`${dia.datos.rain} mm`));
      $dl.append($('<dt>').text('Velocidad media del viento a 10 del suelo:'))
        .append($('<dd>').text(`${dia.datos.wind_speed_10m} km/h`));
      $dl.append($('<dt>').text('Humedad relativa media a 2m del suelo:'))
        .append($('<dd>').text(`${dia.datos.relative_humidity_2m} %`));

      $article.append($dl);
    });

    $('main').append($article);
  }

}

document.addEventListener("DOMContentLoaded", () => {
  let termasDeRioHondo = new Ciudad("Termas de Río Hondo", "Argentina", "termense");
  termasDeRioHondo.rellenarAtributos(36137, { lat: -27.4931, lon: -64.8594 });

  // [Corrección de Fallo Anterior]: Se usa jQuery para añadir elementos al DOM de forma más segura y consistente.
  $('main').append($('<p>').text("Ciudad: " + termasDeRioHondo.getCiudad()));
  $('main').append($('<p>').text("País: " + termasDeRioHondo.getPais()));
  $('main').append($('<p>').text(termasDeRioHondo.getCoordenadas()));
  // Usamos html() para inyectar la lista de gentilicio y población
  $('main').append($(termasDeRioHondo.getInfoSecundaria()));

  // --- Llamadas a la API con las fechas actualizadas (Tareas 3 y 6) ---
  const fechaCarrera = '2025-04-13';
  const fechaInicioEntrenos = '2025-04-10';
  const fechaFinEntrenos = '2025-04-12';

  termasDeRioHondo.getMeteorologiaCarrera(fechaCarrera);
  termasDeRioHondo.getMeteorologiaEntrenos(fechaInicioEntrenos, fechaFinEntrenos);
});