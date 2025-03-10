maptilersdk.config.apiKey = maptilerApiKey;

const map = new maptilersdk.Map({
    container: 'map',
    style: maptilersdk.MapStyle.BRIGHT,
    center: camp.geometry.coordinates,
    zoom: 10
});

new maptilersdk.Marker()
    .setLngLat(camp.geometry.coordinates)
    .setPopup(
        new maptilersdk.Popup({offset: 25})
            .setHTML(
                `<h3>${camp.title}</h3><p>${camp.location}</p>`
            )
    )
    .addTo(map);