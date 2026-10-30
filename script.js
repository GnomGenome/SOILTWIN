
const DATA_URL = "data/layers.json";
const RASTER_DIR = "rasters/";

const map = L.map("map", {
    zoomControl: true,
    scrollWheelZoom: true
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);

let currentOverlay = null;
let layers = [];
let selectedLayer = null;

const select = document.getElementById("taxon-select");
const opacitySlider = document.getElementById("opacity");
const opacityValue = document.getElementById("opacity-value");
const status = document.getElementById("map-status");

function setStatus(message) {
    status.textContent = message;
}

function updateLegend(layer) {
    document.getElementById("legend-min").textContent = layer.min;
    document.getElementById("legend-max").textContent = layer.max;
}

function showLayer(layer) {
    if (currentOverlay) {
        map.removeLayer(currentOverlay);
    }

    selectedLayer = layer;

    currentOverlay = L.imageOverlay(
        RASTER_DIR + layer.file,
        layer.bounds,
        {
            opacity: Number(opacitySlider.value) / 100,
            interactive: false
        }
    );

    currentOverlay.addTo(map);

    updateLegend(layer);

    map.fitBounds(layer.bounds);

    setStatus(
        `${layer.title}: ${layer.valid_cells.toLocaleString("ru-RU")} ячеек`
    );
}

async function initialize() {
    try {
        const response = await fetch(DATA_URL);

        if (!response.ok) {
            throw new Error("Не удалось загрузить layers.json");
        }

        const data = await response.json();
        layers = data.layers;

        if (!layers || layers.length === 0) {
            throw new Error("В layers.json нет растровых слоёв");
        }

        document.getElementById("layer-count").textContent =
            layers.length;

        select.innerHTML = "";

        layers.forEach((layer, index) => {
            const option = document.createElement("option");

            option.value = index;
            option.textContent = layer.title;

            select.appendChild(option);
        });

        select.addEventListener("change", () => {
            const layer = layers[Number(select.value)];
            showLayer(layer);
        });

        opacitySlider.addEventListener("input", () => {
            const value = Number(opacitySlider.value);

            opacityValue.textContent = `${value}%`;

            if (currentOverlay) {
                currentOverlay.setOpacity(value / 100);
            }
        });

        document.getElementById("reset-view").addEventListener(
            "click",
            () => {
                if (selectedLayer) {
                    map.fitBounds(selectedLayer.bounds);
                }
            }
        );

        showLayer(layers[0]);

        setStatus("Карта готова к работе");

    } catch (error) {
        console.error(error);
        setStatus(`Ошибка: ${error.message}`);
        select.innerHTML = "<option>Данные недоступны</option>";
    }
}

initialize();
