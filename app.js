(() => {
  const tilesetUrl = "https://sgx.geodatenzentrum.de/gdz_basemapde_3d_gebaeude/lod2_4326_null.json";
  const cityCoordinates = new Map([
    ["berlin", { longitude: 13.405, latitude: 52.52 }],
    ["bremen", { longitude: 8.8017, latitude: 53.0793 }],
    ["dresden", { longitude: 13.7373, latitude: 51.0504 }],
    ["düsseldorf", { longitude: 6.7735, latitude: 51.2277 }],
    ["frankfurt am main", { longitude: 8.6821, latitude: 50.1109 }],
    ["hamburg", { longitude: 9.9937, latitude: 53.5511 }],
    ["hannover", { longitude: 9.732, latitude: 52.3759 }],
    ["köln", { longitude: 6.9603, latitude: 50.9375 }],
    ["leipzig", { longitude: 12.3731, latitude: 51.3397 }],
    ["mainz", { longitude: 8.2473, latitude: 49.9929 }],
    ["münchen", { longitude: 11.582, latitude: 48.1351 }],
    ["stuttgart", { longitude: 9.1829, latitude: 48.7758 }]
  ]);

  const container = document.querySelector("#cesium-container");
  const loading = document.querySelector("#city3d-loading");
  const loadingMessage = document.querySelector("#city3d-loading-message");
  const loadError = document.querySelector("#city3d-load-error");
  const loadErrorMessage = document.querySelector("#city3d-load-error-message");
  const retryButton = document.querySelector("#city3d-retry-button");
  const layerToggle = document.querySelector("#city3d-buildings-toggle");
  const activeLayer = document.querySelector("#city3d-active-layer");
  const germanyButton = document.querySelector("#city3d-germany-button");
  const searchForm = document.querySelector("#city3d-search-form");
  const citySearch = document.querySelector("#city3d-city-search");
  const searchError = document.querySelector("#city3d-search-error");
  const mapsTab = document.querySelector("#tab-maps");

  let viewer;
  let buildings;
  let initializationPromise;
  let tilesetPromise;

  function setLoading(message) {
    loadingMessage.textContent = message;
    loading.hidden = false;
    loadError.hidden = true;
  }

  function showLoadError(error, context) {
    console.error(`3D-Stadt: ${context}`, error);
    loading.hidden = true;
    loadErrorMessage.textContent =
      `${context} ${error instanceof Error ? error.message : String(error)} ` +
      "Prüfe die Internetverbindung und mögliche CORS- oder Dienstprobleme.";
    loadError.hidden = false;
    activeLayer.textContent = "Der Layer konnte nicht geladen werden";
  }

  function flyToGermany() {
    const germanyCenter = Cesium.Cartesian3.fromDegrees(10.45, 51.1);
    viewer.camera.flyToBoundingSphere(
      new Cesium.BoundingSphere(germanyCenter, 400_000),
      {
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(0),
          Cesium.Math.toRadians(-60),
          1_500_000
        ),
        duration: 1.2
      }
    );
    loading.hidden = true;
  }

  function flyToCity(city) {
    if (!viewer) {
      return;
    }

    if (layerToggle.checked) {
      setLoading("3D-Gebäude für die Stadt werden geladen …");
    }

    const cityCenter = Cesium.Cartesian3.fromDegrees(city.longitude, city.latitude);
    viewer.camera.flyToBoundingSphere(
      new Cesium.BoundingSphere(cityCenter, 800),
      {
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(0),
          Cesium.Math.toRadians(-55),
          1200
        ),
        duration: 1
      }
    );
  }

  async function loadBuildings() {
    if (buildings) {
      buildings.show = layerToggle.checked;
      activeLayer.textContent = layerToggle.checked
        ? "basemap.de LoD2-Gebäude (sichtbar)"
        : "basemap.de LoD2-Gebäude (ausgeblendet)";
      return;
    }

    if (tilesetPromise) {
      return tilesetPromise;
    }

    setLoading("3D-Gebäudedaten von basemap.de werden geladen …");
    activeLayer.textContent = "basemap.de LoD2-Gebäude (wird geladen)";
    tilesetPromise = Cesium.Cesium3DTileset.fromUrl(tilesetUrl, {
      showOutline: false,
      maximumScreenSpaceError: 8,
      cacheBytes: 256 * 1024 * 1024,
      maximumCacheOverflowBytes: 128 * 1024 * 1024
    })
      .then((tileset) => {
        buildings = tileset;
        buildings.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${surface} === 'wall'", "color('#f2f2f2')"],
              ["${surface} === 'roof'", "color('#ff5c4d')"],
              ["${surface} === 'bridge'", "color('#999999')"]
            ]
          }
        });
        buildings.show = layerToggle.checked;
        buildings.tileVisible.addEventListener(() => {
          loading.hidden = true;
        });
        buildings.allTilesLoaded.addEventListener(() => {
          loading.hidden = true;
          activeLayer.textContent = layerToggle.checked
            ? "basemap.de LoD2-Gebäude (sichtbar)"
            : "basemap.de LoD2-Gebäude (ausgeblendet)";
        });
        viewer.scene.primitives.add(buildings);
        activeLayer.textContent = layerToggle.checked
          ? "basemap.de LoD2-Gebäude (sichtbar)"
          : "basemap.de LoD2-Gebäude (ausgeblendet)";
        loadingMessage.textContent = "3D-Gebäude werden für Deutschland gerendert …";
        if (!layerToggle.checked) {
          loading.hidden = true;
        }
        return buildings;
      })
      .catch((error) => {
        tilesetPromise = undefined;
        throw error;
      });

    return tilesetPromise;
  }

  async function initializeMap() {
    if (viewer) {
      viewer.resize();
      await loadBuildings();
      return;
    }

    if (initializationPromise) {
      return initializationPromise;
    }

    setLoading("3D-Globus wird gestartet …");
    initializationPromise = (async () => {
      if (typeof Cesium === "undefined") {
        throw new Error("CesiumJS konnte nicht geladen werden. Prüfe die Netzwerkverbindung.");
      }

      const imageryProvider = new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
        credit: new Cesium.Credit(
          '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">' +
            "&copy; OpenStreetMap contributors</a>",
          true
        )
      });
      viewer = new Cesium.Viewer(container, {
        animation: false,
        baseLayer: new Cesium.ImageryLayer(imageryProvider),
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider()
      });
      viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1);
      flyToCity(cityCoordinates.get("berlin"));
      await loadBuildings();
    })()
      .finally(() => {
        initializationPromise = undefined;
      });

    return initializationPromise;
  }

  mapsTab.addEventListener("click", () => {
    requestAnimationFrame(() => {
      initializeMap().catch((error) => showLoadError(error, "Die 3D-Karte konnte nicht gestartet werden."));
    });
  });

  layerToggle.addEventListener("change", () => {
    if (buildings) {
      buildings.show = layerToggle.checked;
      activeLayer.textContent = layerToggle.checked
        ? "basemap.de LoD2-Gebäude (sichtbar)"
        : "basemap.de LoD2-Gebäude (ausgeblendet)";
      loading.hidden = true;
    }
  });

  germanyButton.addEventListener("click", () => {
    if (viewer) {
      flyToGermany();
    }
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const city = cityCoordinates.get(citySearch.value.trim().toLocaleLowerCase("de-DE"));
    if (!city) {
      searchError.textContent = "Bitte wähle eine Stadt aus der Vorschlagsliste.";
      searchError.hidden = false;
      return;
    }

    searchError.hidden = true;
    searchError.textContent = "";
    if (viewer) {
      flyToCity(city);
    }
  });

  citySearch.addEventListener("input", () => {
    searchError.hidden = true;
    searchError.textContent = "";
  });

  retryButton.addEventListener("click", () => {
    initializeMap().catch((error) => showLoadError(error, "Die 3D-Karte konnte nicht gestartet werden."));
  });
})();
